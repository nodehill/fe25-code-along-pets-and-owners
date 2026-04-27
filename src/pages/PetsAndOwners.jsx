import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import useFetch from '../utils/useFetch';
import deletePetOwner from '../utils/deletePetOwner';

import HeroImage from "../parts/HeroImage";

PetsAndOwners.route = {
  path: '/pets-and-owners',
  label: 'Pets & owners',
  index: 3
};

export default function PetsAndOwners() {

  // useNavigate returns a function we can use to navigate to a route
  const navigate = useNavigate();

  const [pets, petOwners, loading, update] = useFetch(
    '/api/pets',
    '/api/petOwners'
  );

  if (loading) { return; }

  const petsByOwnerId = Object.groupBy(pets, eachPet => eachPet.ownerId);
  const homelessPets = petsByOwnerId.null ?? [];

  return !loading && <>
    <HeroImage
      src="dog-and-owner.webp"
      alt="A dog and its owner"
      heading="Pets & owners"
    />
    <p>Here we use our own custom hook to load all data.</p>

    <h3>Pets by owner</h3>
    <section className="pet-owners">
      {
        petOwners.map(({ id, name, email }) => {
          const ownedPets = petsByOwnerId[id] ?? [];
          return <div key={id}>
            <h4>{name}</h4>
            <p>{name} has the email <a href={`mailto:${email}`}>{email}</a>.</p>
            <button onClick={() => navigate('/update-owner/' + id)}>Edit {name}</button>
            <button onClick={() => deletePetOwner(id, pets, update)}>Delete {name}</button>
            {ownedPets.length === 0 ? <p>{name} has no pets</p> : <>
              <p>{name} has the pets:</p>
              <ul>
                {ownedPets.map(({ id, name, species }) => {
                  // if the function body is wrapped in {} we must return explicitly
                  return <li key={id}>{name} {species}</li>;
                })}
              </ul>
            </>
            }
          </div>;
        })
      }
    </section>

    <h3>Homeless pets</h3>
    <section className="pets">
      {homelessPets.map(({ id, name, species }) => <div key={id}>
        <h4>{name}</h4>
        <p>{name} is a {species}.</p>
      </div>)}
    </section>

  </>;
}
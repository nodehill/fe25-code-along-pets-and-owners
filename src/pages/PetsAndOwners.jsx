import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import useFetch from '../utils/useFetch';
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

  async function stopOwningAnyPets(petOwnerId) {
    // get the pets belonging to the owner by filtering the pets list
    const ownedPets = pets.filter(({ ownerId }) => ownerId === petOwnerId);
    // loop through the pets and set the ownerId to null
    for (let { id } of ownedPets) {
      await fetch('/api/pets/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: null })
      });
    }
  }

  async function deletePetOwner(id) {

    // make sure the owner doesn't own any pets before deleting they
    // (this is an alternative to using db rules as 
    //  ON DELETE SET NULL on the foreign key)
    await stopOwningAnyPets(id);

    let error, data;
    // use try .. catch to catch errors because bad network,
    // badly formatted json etc
    try {
      let response = await fetch('/api/petOwners/' + id, { method: 'DELETE' });
      data = await response.json();
    }
    catch (catchError) {
      error = catchError;
    }
    // but errors can also come from the rest-api that sends the property
    // error for SQLite errors like key-constraints on delete etc.
    error = error || data.error;
    // if we have an error report to the user and make an early return
    if (error) {
      alert('Could not delete this owner!');
    }
    // update the list of pets and petOwners using the update function from useFetch
    update();
  }

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
            <button onClick={() => deletePetOwner(id)}>Delete {name}</button>
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
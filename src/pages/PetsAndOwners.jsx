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

  const [pets, petOwners, loading] = useFetch(
    '/api/pets',
    '/api/petOwners'
  );

  const [deletedPetOwnerIds, setDeletedPetOwnerIds] = useState([]);

  if (loading) { return; }

  const petsByOwnerId = Object.groupBy(pets, eachPet => eachPet.ownerId);

  const homelessPets = petsByOwnerId.null ?? [];

  async function deletePetOwner(id) {
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
    // if we have an error report to use and make an early return
    if (error) {
      alert('Could not delete this owner!');
      return;
    }
    // otherwise add the id of the deleted petowner to deletedPetOwnerIds list
    setDeletedPetOwnerIds(currentList => [...currentList, id]);
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
        petOwners
          .filter(({ id }) => !deletedPetOwnerIds.includes(id))
          .map(({ id, name, email }) => {
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
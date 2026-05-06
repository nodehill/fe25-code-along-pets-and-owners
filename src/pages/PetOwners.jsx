import { useState, useEffect } from 'react';
import useFetch from '../utils/useFetch';
import buildPetOwnersUrl from '../utils/buildPetOwnersUrl';

PetOwners.route = {
  path: '/pet-owners',
  label: 'Pet owners',
  index: 3.1
};

export default function PetOwners() {
  const [search, setSearch] = useState('');
  const url = buildPetOwnersUrl(search, 1);
  const [petOwners, loading, update] = useFetch(url);

  // fetch again when the value of search changes
  useEffect(() => update(), [search]);

  if (loading) { return; }

  return <>
    <h3>Pet owners</h3>
    <label>
      Search by name:
      <input type="text" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    <section className="pet-owners">
      {
        petOwners.map(({ documentId: id, firstName, lastName, email, pets }) => {
          return <div key={id}>
            <h4>{firstName} {lastName}</h4>
            <p>{firstName} {lastName} has the email <a href={`mailto:${email}`}>{email}</a>.</p>
            <button onClick={() => navigate('/update-owner/' + id)}>Edit {name}</button>
            <button onClick={() => deletePetOwner(id, update)}>Delete {name}</button>
            {pets.length === 0 ? <p>{name} has no pets</p> : <>
              <p>{name} has the pets:</p>
              <ul>
                {pets.map(({ documentId: id, name, species }) => {
                  // if the function body is wrapped in {} we must return explicitly
                  return <li key={id}>{name} ({species})</li>;
                })}
              </ul>
            </>
            }
          </div>;
        })
      }
    </section>
  </>;
}
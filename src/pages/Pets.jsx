import { useState, useEffect } from 'react';
import useFetch from '../utils/useFetch';
import buildPetsUrl from '../utils/buildPetsUrl';

Pets.route = {
  path: '/pets',
  label: 'Pets',
  index: 3.2
};

export default function Pets() {

  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState('');
  const [owner, setOwner] = useState('');

  const url = buildPetsUrl(search, species, owner);
  const [
    pets,
    uniqueSpecies,
    petOwners,
    loading,
    update
  ] = useFetch(
    url,
    '/api/pets/species',
    '/api/pet-owners?pagination[pageSize]=1000&sort=firstName,lastName'
  );

  // fetch again when any of the filters change
  useEffect(() => update(), [search, species, owner]);

  if (loading) { return; }

  const { total } = pets.pagination;

  return <>
    <h3>Pets</h3>
    <label>
      Search by name:
      <input type="text" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    <label>
      Species:
      <select value={species} onChange={event => setSpecies(event.target.value)}>
        <option value="">All species</option>
        {
          uniqueSpecies.map(s => <option key={s} value={s}>{s}</option>)
        }
      </select>
    </label>
    <label>
      Owner:
      <select value={owner} onChange={event => setOwner(event.target.value)}>
        <option value="">All owners</option>
        <option value="0">No owner</option>
        {
          petOwners.map(({ documentId, firstName, lastName }) => <option
            key={documentId}
            value={documentId}>
            {firstName} {lastName}
          </option>)
        }
      </select>
    </label>
    <p><b>Found: {total}</b></p>
    <section className="pets">
      {
        pets.map(({ documentId: id, name, species, owner }) => {
          return <div key={id}>
            <h4>{name}</h4>
            <p>{name} is a {species}.</p>
            {owner
              ? <p>Owner: {owner.firstName} {owner.lastName}</p>
              : <p>{name} has no owner.</p>
            }
          </div>;
        })
      }
    </section>
  </>;
}

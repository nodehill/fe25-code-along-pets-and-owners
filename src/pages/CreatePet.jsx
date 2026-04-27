import { useState } from 'react';
import { useNavigate } from 'react-router';
import useFetch from '../utils/useFetch';

CreatePet.route = {
  path: '/create-pet',
  label: 'Create a pet ',
  index: 6
};

export default function CreatePet() {

  const formInitialState = {
    name: '',
    species: '',

    ownerId: '0' // see explanation in sendForm
  };

  const [formData, setFormData] = useState(formInitialState);
  const [formSent, setFormSent] = useState(false);
  const navigate = useNavigate();


  console.log(formData);

  const [petOwners, loading] = useFetch('/api/petOwners/');
  const [unique_species, loading2] = useFetch('/api/unique_species/');
  const [showSpeciesInput, setShowSpeciesInput] = useState(false);

  if (loading || loading2) return <p>Loading...</p>;

  function updateFormData(event) {
    const { name: key, value } = event.target;
    setFormData({ ...formData, [key]: value });
  }

  async function sendForm(event) {
    event.preventDefault();
    await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData,
        // we are using '0' for ownerId since it works well as a value in the form
        // but the database/REST-api wants null so we transofrm
        (key, value) => key === 'ownerId' && value === '0' ? null : value)
    });
    setFormSent(true);
  }

  function setSpecies(event) {
    if (event.target.value !== "__new__") {
      setShowSpeciesInput(false);
      setFormData({ ...formData, species: event.target.value });
    } else {
      setShowSpeciesInput(true);
      setFormData({ ...formData, species: '' });
    }
  }

  if (formSent) {
    return <>
      <p>The pet  {formData.name} has been created</p>
      <button onClick={() => {
        setFormSent(false);
        setFormData({ ...formInitialState });
      }}>Create another pet </button>
      <button onClick={() => navigate('/pets-and-owners')}>
        See the list of pets and their owners</button>
    </>;

  } else {

    return <>
      <h2>Create a new Pet</h2>
      <form onSubmit={sendForm}>
        <label>
          Name:
          <input required name="name" type="text" placeholder="Name" value={formData.name} onChange={updateFormData} />
        </label>
        <label>
          Species:
          <select name="unique_species" onChange={setSpecies}>
            <option key="" value="">Select species</option>
            {
              unique_species.map(spec => <option key={spec.species} value={spec.species}>{spec.species}</option>)
            }
            <option value="__new__">Other (add new species..)</option>
          </select>
          {
            showSpeciesInput && <input required name="species" type="text" placeholder="Species" value={formData.species} onChange={updateFormData} />
          }
        </label>

        <label>
          Owner:
          <select name="ownerId" value={formData.ownerId} onChange={updateFormData}>
            <option key="0" value="0">No owner</option>
            {
              petOwners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)
            }
          </select>
        </label>

        <button type="submit">Create</button>
      </form>
    </>;

  }

}
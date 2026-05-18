import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import useFetch from '../utils/useFetch';
import uploadFile from '../utils/uploadFile';

CreatePet.route = {
  path: '/create-pet',
  label: 'Create a pet ',
  index: 6
};

export default function CreatePet() {

  const { user } = useOutletContext();

  const formInitialState = {
    name: '',
    species: '',
    owner: '0' // see explanation in sendForm
  };

  const [formData, setFormData] = useState(formInitialState);
  const [imageFile, setImageFile] = useState(null);
  const [formSent, setFormSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [
    petOwners,
    uniqueSpecies,
    loading
  ] = useFetch(
    '/api/pet-owners?pagination[pageSize]=1000&sort=firstName,lastName',
    '/api/pets/species'
  );

  const [showSpeciesInput, setShowSpeciesInput] = useState(false);

  if (loading) { return; }
  function updateFormData(event) {
    const { name: key, value } = event.target;
    setFormData({ ...formData, [key]: value });
  }

  async function sendForm(event) {
    event.preventDefault();
    setError('');

    // If the user picked an image, upload it first and remember the
    // file's numeric id (Strapi's upload plugin still uses the integer
    // id when attaching media to relations, even in v5).
    let imageId = null;
    if (imageFile) {
      try {
        const uploaded = await uploadFile(imageFile, user.jwt);
        imageId = uploaded.id;
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { ...formData, image: imageId } },
        // we are using '0' for ownerId since it works well as a value in the form
        // but the database/REST-api wants null so we transofrm
        (key, value) => key === 'owner' && value === '0' ? null : value)
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
        setImageFile(null);
      }}>Create another pet </button>
      <button onClick={() => navigate('/pets')}>
        See the list of pets</button>
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
          <select name="uniqueSpecies" onChange={setSpecies}>
            <option key="" value="">Select species</option>
            {
              uniqueSpecies.map(species => <option key={species} value={species}>{species}</option>)
            }
            <option value="__new__">Other (add new species..)</option>
          </select>
          {
            showSpeciesInput && <input required name="species" type="text" placeholder="Species" value={formData.species} onChange={updateFormData} />
          }
        </label>

        <label>
          Owner:
          <select name="owner" value={formData.owner} onChange={updateFormData}>
            <option key="0" value="0">No owner</option>
            {
              petOwners.map(({ documentId, firstName, lastName }) => <option
                key={documentId}
                value={documentId}>
                {firstName} {lastName}
              </option>)
            }
          </select>
        </label>

        {/* Image upload requires a logged-in user (Authenticated has
            upload permission; Public does not — see README) */}
        {user
          ? <label>
              Image (optional):
              <input
                type="file"
                accept="image/*"
                onChange={event => setImageFile(event.target.files[0] || null)}
              />
            </label>
          : <p><small>Log in to also upload an image of the pet.</small></p>
        }

        <button type="submit">Create</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </>;

  }

}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import useFetch from '../utils/useFetch'

CreatePet.route = {
  path: '/create-pet',
  label: 'Create a pet ',
  index: 6
}

export default function CreatePet() {

  const formInitialState = {
    name: '',
    species: '',
    ownerId: '' // ≈ inget värde (null, 0?), (constraint: Must add owner?)
  }

  const [formData, setFormData] = useState(formInitialState)
  const [formSent, setFormSent] = useState(false)
  const navigate = useNavigate()


  const [petOwners, loading] = useFetch('/api/petOwners/')

  if (loading) return <p>Loading...</p>

  function updateFormData(event) {
    const { name: key, value } = event.target;
    setFormData({ ...formData, [key]: value })
  }

  async function sendForm(event) {
    event.preventDefault()
    await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    setFormSent(true)
  }

  if (formSent) {

    return <>
      <p>The pet  {formData.name} has been created</p>
      <button onClick={() => {
        setFormSent(false);
        setFormData({ ...formInitialState })
      }}>Create another pet </button>
      <button onClick={() => navigate('/pets-and-owners')}>
        See the list of pets and their owners</button>
    </>

  } else {

    return <>
      <h2>Create a new Pet</h2>
      <form onSubmit={sendForm}>
        <label>
          Name:
          <input name="name" type="text" placeholder="Name" value={formData.name} onChange={updateFormData} />
        </label>
        <label>
          Species:
          <input name="species" type="text" placeholder="Species" value={formData.species} onChange={updateFormData} />
        </label>

        <label>
          Owner:
          <select name="ownerId" value={formData.ownerId} onChange={updateFormData}>
            <option key="0" value="0">Select owner</option>
            {
              petOwners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)
            }
          </select>
        </label>

        <button type="submit">Create</button>
      </form>
    </>

  }

}
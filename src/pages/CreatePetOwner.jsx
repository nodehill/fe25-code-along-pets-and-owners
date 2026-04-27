import { useState } from 'react';
import { useNavigate } from 'react-router';

CreatePetOwner.route = {
  path: '/create-petowner',
  label: 'Create a pet owner',
  index: 5
};

export default function CreatePetOwner() {

  const formInitialState = {
    name: '',
    email: ''
  };

  const [formData, setFormData] = useState(formInitialState);
  const [formSent, setFormSent] = useState(false);
  const navigate = useNavigate();

  function updateFormData(event) {
    //console.log(event)
    const { name: key, value } = event.target;  // event.target.name == "email"
    // const key = event.target.name
    // const value = event.target.value
    // console.log(key, value)
    // [key] - dynamisk tilldelning av t ex "email" eller "name"
    setFormData({ ...formData, [key]: value });
  }


  async function sendForm(event) {
    event.preventDefault();
    // console.log(event)
    await fetch('/api/petOwners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormSent(true);
  }

  if (formSent) {

    return <>
      <p>The pet owner {formData.name} has been created</p>
      <button onClick={() => {
        setFormSent(false);
        setFormData({ ...formInitialState });
      }}>Create another pet owner</button>
      <button onClick={() => navigate('/pets-and-owners')}>
        See the list of pets and their owners</button>
    </>;

  } else {

    return <>
      <h2>Create a new Pet owner</h2>
      <form onSubmit={sendForm}>
        <label>
          Name:
          <input required name="name" type="text" placeholder="Name" value={formData.name} onChange={updateFormData} />
        </label>
        <label>
          Email:
          <input required name="email" type="email" placeholder="Email" value={formData.email} onChange={updateFormData} />
        </label>
        <button type="submit">Create</button>
      </form>
    </>;

  }

}
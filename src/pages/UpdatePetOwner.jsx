import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import useFetch from '../utils/useFetch';

UpdatePetOwner.route = {
  path: '/update-owner/:documentId'
};

export default function UpdatePetOwner() {

  const { documentId } = useParams();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [formSent, setFormSent] = useState(false);
  const navigate = useNavigate();

  const [petOwner, loading] = useFetch('/api/pet-owners/' + documentId);

  useEffect(() => {
    if (!loading && petOwner) {
      const { firstName, lastName, email } = petOwner;
      setFormData({ firstName, lastName, email });
    }
  }, [loading, petOwner]);

  // order of where this appears is important; after all hooks
  if (loading) return <p>Loading...</p>;

  function updateFormData(event) {
    const { name: key, value } = event.target;
    setFormData({ ...formData, [key]: value });
  }


  async function sendForm(event) {
    event.preventDefault();
    await fetch('/api/pet-owners/' + documentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: formData })
    });
    setFormSent(true);
  }

  if (formSent) {

    return <>
      <p>The pet owner {formData.name} has been updated</p>
      <button onClick={() => navigate('/pets-and-owners')}>
        Return to the list of pets and their owners</button>
    </>;

  } else {

    return <>
      <h2>Edit {petOwner.name}</h2>
      <form onSubmit={sendForm}>
        <label>
          First name:
          <input name="firstName" type="text" placeholder="First name" value={formData.firstName} onChange={updateFormData} />
        </label>
        <label>
          Last name:
          <input name="lastName" type="text" placeholder="Last name" value={formData.lastName} onChange={updateFormData} />
        </label>
        <label>
          Email:
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={updateFormData} />
        </label>
        <button type="submit">Update</button>
      </form>
    </>;

  }

}
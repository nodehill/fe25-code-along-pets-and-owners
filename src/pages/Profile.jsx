import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

Profile.route = {
  path: '/profile',
  index: 12
};

export default function Profile() {

  const { user, setUser } = useOutletContext();
  const navigate = useNavigate();

  // not logged in: bounce to login
  if (!user) {
    navigate('/login');
    return;
  }

  const formInitialState = {
    username: user.user.username,
    email: user.user.email,
    password: '' // empty = don't change password
  };

  const [formData, setFormData] = useState(formInitialState);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function updateFormData(event) {
    const { name: key, value } = event.target;
    setFormData({ ...formData, [key]: value });
    setSaved(false);
  }

  async function sendForm(event) {
    event.preventDefault();
    setError('');

    // only send the password field if the user actually typed something
    const body = { ...formData };
    if (!body.password) { delete body.password; }

    const response = await fetch('/api/users/' + user.user.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + user.jwt
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || 'Could not save');
      return;
    }
    // Strapi returns the updated user object directly (not wrapped)
    // merge it into our stored auth so jwt stays intact
    const updated = { ...user, user: data };
    localStorage.user = JSON.stringify(updated);
    setUser(updated);
    setFormData({ ...formData, password: '' });
    setSaved(true);
  }

  return <>
    <h2>My profile</h2>
    <form onSubmit={sendForm}>
      <label>
        Username:
        <input required name="username" type="text" value={formData.username} onChange={updateFormData} />
      </label>
      <label>
        Email:
        <input required name="email" type="email" value={formData.email} onChange={updateFormData} />
      </label>
      <label>
        New password: <small>(lämna tomt för att behålla nuvarande, annars minst 6 tecken)</small>
        <input minLength={6} name="password" type="password" value={formData.password} onChange={updateFormData} />
      </label>
      <button type="submit">Save</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {saved && <p style={{ color: 'green' }}>Profile saved.</p>}
    </form>
  </>;
}

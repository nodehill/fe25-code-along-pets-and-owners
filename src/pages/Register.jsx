import { useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router';

Register.route = {
  path: '/register',
  index: 11
};

export default function Register() {

  const formInitialState = {
    username: '',
    email: '',
    password: ''
  };

  const [formData, setFormData] = useState(formInitialState);
  const [error, setError] = useState('');
  const { setUser } = useOutletContext();
  const navigate = useNavigate();

  function updateFormData(event) {
    const { name: key, value } = event.target;
    setFormData({ ...formData, [key]: value });
  }

  async function sendForm(event) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/auth/local/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || 'Registration failed');
      return;
    }
    // Strapi auto-logs in on successful registration and returns jwt + user
    localStorage.user = JSON.stringify(data);
    setUser(data);
    navigate('/');
  }

  return <>
    <h2>Register</h2>
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
        Password: <small>(minst 6 tecken)</small>
        <input required minLength={6} name="password" type="password" value={formData.password} onChange={updateFormData} />
      </label>
      <button type="submit">Register</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
    <p>Already have an account? <Link to="/login">Log in here</Link></p>
  </>;
}

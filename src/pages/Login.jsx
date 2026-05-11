import { useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router';

Login.route = {
  path: '/login',
  index: 10
};

export default function Login() {

  const formInitialState = {
    identifier: '', // Strapi accepts username OR email here
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
    const response = await fetch('/api/auth/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || 'Login failed');
      return;
    }
    // save the whole Strapi response (contains jwt + user) directly
    localStorage.user = JSON.stringify(data);
    setUser(data);
    navigate('/');
  }

  return <>
    <h2>Log in</h2>
    <form onSubmit={sendForm}>
      <label>
        Username or email:
        <input required name="identifier" type="text" value={formData.identifier} onChange={updateFormData} />
      </label>
      <label>
        Password:
        <input required name="password" type="password" value={formData.password} onChange={updateFormData} />
      </label>
      <button type="submit">Log in</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
    <p>Don't have an account? <Link to="/register">Register here</Link></p>
  </>;
}

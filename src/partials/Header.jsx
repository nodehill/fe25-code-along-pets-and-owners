import routes from '../routes';
import { NavLink } from 'react-router';

export default function Header({ user, setUser }) {

  function logout() {
    // Strapi uses JWT - there is no server-side session to invalidate
    // so logging out is just throwing away our local copy
    delete localStorage.user;
    setUser(null);
  }

  return <header>
    <h1>The Pet Shelter</h1>
    <nav>
      {routes
        .filter(x => x.label)
        .map(({ path, label }) => <NavLink key={path} to={path}>
          {label}
        </NavLink>
        )}
    </nav>
    <div className="auth">
      {user
        ? <>
          Inloggad som <NavLink to="/profile"><b>{user.user.username}</b></NavLink>
          &nbsp;&nbsp;
          <button onClick={logout}>Logga ut</button>
        </>
        : <>
          <NavLink to="/login">Logga in</NavLink>
          &nbsp;|&nbsp;
          <NavLink to="/register">Registrera dig</NavLink>
        </>
      }
    </div>
  </header>;
}

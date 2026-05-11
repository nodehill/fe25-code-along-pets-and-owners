import { useState } from 'react';
import { Outlet } from 'react-router';
import Header from "./partials/Header";
import Footer from "./partials/Footer";

export default function App() {

  // initialize from localStorage so the user stays logged in across reloads
  const [user, setUser] = useState(localStorage.user ? JSON.parse(localStorage.user) : null);

  return <>
    <Header user={user} setUser={setUser} />
    <main><Outlet context={{ user, setUser }} /></main>
    <Footer />
  </>;
}

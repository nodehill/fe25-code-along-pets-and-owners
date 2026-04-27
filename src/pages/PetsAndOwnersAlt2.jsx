import { useLoaderData } from "react-router";
import HeroImage from "../parts/HeroImage";

PetsAndOwnersAlt2.route = {
  path: '/pets-and-owners-alt-2',
  // label: 'Pets & owners Alt 2',
  index: 4,
  loader: async () => {
    return await Promise.all(
      [
        fetch('/api/pets').then(response => response.json()),
        fetch('/api/petOwners').then(response => response.json())
      ]
    );
  }
};

export default function PetsAndOwnersAlt2() {

  const [pets, petOwners] = useLoaderData();

  return <>
    <HeroImage
      src="dog-and-owner.webp"
      alt="A dog and its owner"
      heading="Pets & owners Alt 2"
    />
    <p>Here we use React router loader functions in the routes + useLoaderData to load all our data.</p>
    <h3>Pets</h3>
    <section className="pets">
      {pets.map(({ id, name, species }) => <div key={id}>
        <h4>{name}</h4>
        <p>{name} is a {species}.</p>
      </div>)}
    </section>
    <h3>Pet owners</h3>
    <section className="pet-owners">
      {petOwners.map(({ id, name, email }) => <div key={id}>
        <h4>{name}</h4>
        <p>{name} has the email <a href={`mailto:${email}`}>{email}</a>.</p>
      </div>)}
    </section>
  </>;
}
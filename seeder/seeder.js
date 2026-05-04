// import data used by the seeder
import petOwners from './data/petOwners.json' with {type: 'json'};
import petNames from './data/petNames.json' with {type: 'json'};
import petSpecies from './data/petSpecies.json' with {type: 'json'};

// config/settings
// note: prefer 127.0.0.1 before localhost
// because node.js resolves fetches more reliable to 127.0.0.1
const DELETE_BEFORE_SEEDING = true; // true/false
const NUMBER_OF_PET_OWNERS = 5; // max 200
const NUMBER_OF_PETS = 10; // max 500
const PETS_WITHOUT_OWNERS_PERCENT = 15;
const MAX_PETS_PER_OWNER = 4;
const STRAPI_HOST = "127.0.0.1";
const STRAPI_PORT = 1337;

function randomItemFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Shuffle/randomize the order of all items an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generatePetData() {
  // Build weighted species array 
  let speciesList = '';
  for (let { species, percent } of petSpecies) {
    speciesList += (species + ',').repeat(percent);
  }
  speciesList = speciesList.split(',').slice(0, -1);
  // Shuffle - ensure random order of pet names and species list
  shuffleArray(petNames);
  shuffleArray(speciesList);
  // Build the array of pets
  let pets = [];
  for (let i = 0; i < NUMBER_OF_PETS; i++) {
    pets.push({
      name: petNames.shift().name,
      species: randomItemFromArray(speciesList)
    });
  }
  return pets;
}

async function createPetOwners() {
  // randomize pet owner order/selection
  shuffleArray(petOwners);
  // Write each owner to strapi in a loop
  const ownerIds = [];
  for (let i = 0; i < NUMBER_OF_PET_OWNERS; i++) {
    let response = await fetch(
      `http://${STRAPI_HOST}:${STRAPI_PORT}/api/pet-owners`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: petOwners[i] })
      }
    );
    let answer = await response.json();
    ownerIds.push(answer.data.documentId);
    console.log(`Creating pet owner ${i + 1}/${NUMBER_OF_PET_OWNERS}`);
    console.log('Answer from Strapi', answer);
    console.log('');
  }
  return ownerIds;
}


async function createPets(ownerIds) {
  const pets = generatePetData();
  // Add owners according to settings
  let counter = 1;
  for (let pet of pets) {
    let ownerId;
    // set an owner on the percentage of pets that should have an owner
    if (Math.random() * 100 >= PETS_WITHOUT_OWNERS_PERCENT) {
      // the while loop make sure an owners can't own too many pets
      while (
        !ownerId ||
        pets.filter(pet => pet.owner === ownerId).length >= MAX_PETS_PER_OWNER
      ) {
        ownerId = randomItemFromArray(ownerIds);
      }
      pet.owner = ownerId;
    }
    let response = await fetch(
      `http://${STRAPI_HOST}:${STRAPI_PORT}/api/pets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: pet })
      }
    );
    let answer = await response.json();
    console.log(`Creating pet ${counter++}/${pets.length}`);
    console.log('Answer from Strapi', answer);
    console.log('');
  }
}

async function deleteAllPetsAndOwners() {
  // get all pets currently in the strapi db
  const petResponse = await fetch(
    `http://${STRAPI_HOST}:${STRAPI_PORT}/api/pets?pagination[pageSize]=10000`
  );
  const { data: pets } = await petResponse.json();
  // get all pet owners currently in the strapi db
  const petOwnerResponse = await fetch(
    `http://${STRAPI_HOST}:${STRAPI_PORT}/api/pet-owners?pagination[pageSize]=10000`
  );
  const { data: petOwners } = await petOwnerResponse.json();

  console.log({ petsLength: pets.length, petOwnersLength: petOwners.length });

  // delete all pets 
  let counter = 1;
  for (let { documentId } of pets) {
    await fetch(
      `http://${STRAPI_HOST}:${STRAPI_PORT}/api/pets/${documentId}`,
      { method: 'DELETE' }
    );
    console.log(`Deleting pet ${counter++}/${pets.length}`);
  }
  // delete all petOwners
  counter = 1;
  for (let { documentId } of petOwners) {
    await fetch(
      `http://${STRAPI_HOST}:${STRAPI_PORT}/api/pet-owners/${documentId}`,
      { method: 'DELETE' }
    );
    console.log(`Deleting pet owner ${counter++}/${petOwners.length}`);
  }
  console.log('');
}

// run everything
DELETE_BEFORE_SEEDING && await deleteAllPetsAndOwners();
const ownerIds = await createPetOwners();
createPets(ownerIds);
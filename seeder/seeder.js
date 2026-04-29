// import data used by the seeder
import petOwners from './data/petOwners.json' with {type: 'json'};
import petNames from './data/petNames.json' with {type: 'json'};
import petSpecies from './data/petSpecies.json' with {type: 'json'};

// config/settings
// note: prefer 127.0.0.1 before localhost
// because node.js resolves fetches more reliable to 127.0.0.1
const NUMBER_OF_PETS_OWNERS = 5; // max 200
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

}

console.log(generatePetData().length);
export default async function deletePetOwner(id, pets, update) {

  // make sure the owner doesn't own any pets before deleting they
  // (this is an alternative to using db rules as 
  //  ON DELETE SET NULL on the foreign key)
  await stopOwningAnyPets(id, pets);

  let error, data;
  // use try .. catch to catch errors because bad network,
  // badly formatted json etc
  try {
    let response = await fetch('/api/petOwners/' + id, { method: 'DELETE' });
    data = await response.json();
  }
  catch (catchError) {
    error = catchError;
  }
  // but errors can also come from the rest-api that sends the property
  // error for SQLite errors like key-constraints on delete etc.
  error = error || data.error;
  // if we have an error report to the user and make an early return
  if (error) {
    alert('Could not delete this owner!');
  }
  // update the list of pets and petOwners using the update function from useFetch
  update();
}

async function stopOwningAnyPets(petOwnerId, pets) {
  // get the pets belonging to the owner by filtering the pets list
  const ownedPets = pets.filter(({ ownerId }) => ownerId === petOwnerId);
  // loop through the pets and set the ownerId to null
  for (let { id } of ownedPets) {
    await fetch('/api/pets/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: null })
    });
  }
}
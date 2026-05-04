export default async function deletePetOwner(documentId, update) {
  let error, data;
  // use try .. catch to catch errors because bad network,
  // badly formatted json etc
  try {
    let response = await fetch('/api/pet-owners/' + documentId, { method: 'DELETE' });
    if (response.status !== 204) { throw new Error(`Not a 204 stauts - deletion didn't work`); }
  }
  catch (catchError) {
    error = catchError;
  }
  // if we have an error report to the user and make an early return
  if (error) {
    alert('Could not delete this owner!');
  }
  // update the list of pets and petOwners using the update function from useFetch
  update();
}
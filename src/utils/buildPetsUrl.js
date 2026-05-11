import qs from 'qs';

export default function buildPetsUrl(search = '', species = '', owner = '') {
  const query = {
    pagination: { pageSize: 1000 },
    populate: 'owner',
    sort: ['name']
  };
  const filters = {};
  if (search) {
    filters.name = { $containsi: search };
  }
  if (species) {
    filters.species = { $eq: species };
  }
  // '0' is our sentinel for "No owner" (null in the database)
  // see explanation in CreatePet for the same convention
  if (owner === '0') {
    filters.owner = { $null: true };
  } else if (owner) {
    filters.owner = { documentId: { $eq: owner } };
  }
  if (Object.keys(filters).length) {
    query.filters = filters;
  }
  return '/api/pets?' + qs.stringify(query, { encodeValuesOnly: true });
}

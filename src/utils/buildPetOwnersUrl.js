import qs from 'qs';

export default function buildPetOwnersUrl(search = '', page = 1, pageSize = 10) {
  const query = {
    pagination: { page, pageSize },
    populate: 'pets',
    sort: ['firstName', 'lastName']
  };
  if (search) {
    query.filters = {
      $or: [
        { firstName: { $containsi: search } },
        { lastName: { $containsi: search } }
      ]
    };
  }
  return '/api/pet-owners?' + qs.stringify(query, { encodeValuesOnly: true });
}

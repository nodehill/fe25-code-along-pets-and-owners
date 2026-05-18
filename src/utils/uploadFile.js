// Upload a single file to Strapi's Upload plugin and return the file
// object that Strapi gives us back ({ id, url, mime, formats, ... }).
//
// The endpoint /api/upload uses multipart/form-data, so we use a
// FormData object instead of JSON. The form field MUST be called
// "files" (plural) — that's what Strapi expects.
//
// A JWT is required because only the Authenticated role has permission
// to upload (see README-pet-image-upload.md for the security reasoning).
export default async function uploadFile(file, jwt) {

  const formData = new FormData();
  formData.append('files', file);

  // Note: do NOT set Content-Type manually — the browser sets it
  // (including the multipart boundary) automatically when the body
  // is a FormData. Setting it by hand here will break the request.
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt },
    body: formData
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Could not upload file');
  }

  // Strapi returns an array (since you can upload many at once);
  // we always send one file, so we return the first entry.
  const [uploaded] = await response.json();
  return uploaded;
}

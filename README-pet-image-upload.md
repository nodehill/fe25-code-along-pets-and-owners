# Lägga till bild på en Pet

I appen kan vi nu välja en bild när vi skapar en pet, och bilden visas
sedan i listan på `/pets`. Det här dokumentet går igenom hur uppladdningen
funkar i Strapi v5, vilka säkerhetsval vi gjorde och vilken kod som
faktiskt skrevs.

Branch där ändringarna ligger:
[`fe25-code-examples-18-maj-2026-pet-image-upload`](https://github.com/nodehill/fe25-code-along-pets-and-owners/tree/fe25-code-examples-18-maj-2026-pet-image-upload)

## Översikt

Strapi har ett inbyggt plugin som heter **Upload**. Det sköter två saker:

1. Tar emot uppladdade filer på `POST /api/upload`, sparar dem (default
   på disk i `strapi/public/uploads/`) och lägger till en rad i tabellen
   `files`. Varje fil får ett eget numeriskt `id`, en slumpad URL och
   ett antal auto-genererade miniatyrer för bilder (`thumbnail`, `small`,
   `medium`, `large`).
2. Exponerar en Media-fälttyp i Content-Type Builder så att andra content
   types (som Pet) kan ha en relation till en fil.

Vår Pet kopplas alltså till en fil via ett relationsfält — själva bilden
lever i Upload-plugin-tabellen, Pet har bara en koppling. Det betyder att
vi i frontend skickar **två** anrop när en pet med bild skapas:

1. `POST /api/upload` med bilden → får tillbaka `{ id: 7, url: '/uploads/...', ... }`
2. `POST /api/pets` med pet-datan plus `image: 7` → kopplar filen till
   den nya peten

## Säkerhetsbeslut

Innan koden — några val vi gjorde och varför.

### Bara inloggade får ladda upp

Vi gav `upload`-rättigheten till **Authenticated**-rollen, inte till
**Public**. Annars hade vem som helst på internet kunnat skicka godtyckliga
filer till vår server, fylla disken eller ladda upp olämpligt innehåll.

I praktiken innebär det att fil-input-fältet i `/create-pet` bara visas
om man är inloggad. Resten av create-formuläret funkar fortfarande utan
login — uppladdningen är opt-in.

### Vi gav INTE `update` eller `destroy` på Upload

Det här är subtilt men viktigt: Upload-pluginen taggar inte filer med
vem som laddade upp dem. Det finns alltså inget naturligt "ägar"-koncept
på filer. Om vi gav `destroy` till Authenticated så hade vilken inloggad
användare som helst kunnat radera vilken fil som helst — exakt samma typ
av sårbarhet som vi fixade i [profile-säkerhets-artikeln](./README-fix-profile-editing-security.md).

Resultat: filer kan inte raderas via vårt API över huvud taget från
frontend. Att städa föräldralösa filer är ett separat (admin-)problem.

### Bara bilder, en åt gången

I Content-Type Builder begränsade vi fältet till `allowedTypes: ["images"]`
och `multiple: false`. Strapi avvisar då uppladdningar av andra MIME-typer
direkt — vi behöver inte själva validera det i frontend.

## Steg 1 — Lägg till `image`-fält på Pet

Detta görs enklast i Strapi admin → **Content-Type Builder** → **Pet** →
**Add another field** → **Media** → välj "Single media", döp till `image`,
välj "Images only" och spara. Strapi startar om och lägger till en kolumn
+ join-tabell.

Resultatet syns i filen `strapi/src/api/pet/content-types/pet/schema.json`:

```json
"image": {
  "type": "media",
  "multiple": false,
  "required": false,
  "allowedTypes": ["images"]
}
```

## Steg 2 — Slå på upload-behörigheten

Strapi admin → **Settings** → **Users & Permissions Plugin** → **Roles**
→ **Authenticated** → scrolla ner till sektionen **Media Library**
(notera: i admin heter sektionen "Media Library", men beskrivningen
under namnet visar att det är `plugin::upload`-pluginen) → expandera
och bocka i `upload` (och bara den, inte `destroy` eller `find`) → Save.

Som tidigare är det här bara en databasändring (`up_permissions`), ingen
kodändring.

## Steg 3 — Vite-proxy för `/uploads`

Bilden som Strapi returnerar har en relativ URL som börjar med `/uploads/`.
Vår dev-server (Vite, port 5173) skickar redan vidare `/api`-anrop till
Strapi (port 1337), men vi behöver också skicka vidare `/uploads`-anrop
så `<img src="/uploads/...">` faktiskt hittar bilden.

`vite.config.js`:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:1337',
      changeOrigin: true,
      secure: false
    },
    '/uploads': {
      target: 'http://localhost:1337',
      changeOrigin: true,
      secure: false
    }
  }
}
```

I produktion (där frontend och Strapi typiskt ligger på olika domäner
eller bakom samma reverse-proxy) löser man det via en miljövariabel
som prependas, eller via produktions-proxyn. För dev räcker det här.

## Steg 4 — Frontend: uppladdnings-hjälpare

Eftersom vi vill kunna återanvända samma upload-logik (snart för
pet-owners kanske, eller profilbilder), bröt vi ut den till en egen
liten utility.

`src/utils/uploadFile.js`:

```js
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
```

Två detaljer att lägga märke till:

- Form-fältet **måste heta `files`** (i plural), inte `file` — det är
  vad Strapis upload-controller letar efter i bodyn.
- Vi sätter **inte** `Content-Type`-headern manuellt. När bodyn är en
  `FormData` sätter webbläsaren rätt header själv, inklusive den
  multipart-boundary-sträng som behövs för att servern ska kunna parsa
  formuläret. Sätter man `Content-Type: multipart/form-data` själv blir
  boundary-strängen fel och Strapi avvisar anropet.

## Steg 5 — Frontend: file-input i CreatePet

I `src/pages/CreatePet.jsx` läste vi in användaren via
`useOutletContext()` (samma mönster som `/profile`-sidan), så vi kan
villkorligt visa file-input-fältet.

```jsx
const { user } = useOutletContext();
// ...
const [imageFile, setImageFile] = useState(null);
// ...
{user
  ? <label>
      Image (optional):
      <input
        type="file"
        accept="image/*"
        onChange={event => setImageFile(event.target.files[0] || null)}
      />
    </label>
  : <p><small>Log in to also upload an image of the pet.</small></p>
}
```

I `sendForm`-funktionen kopplar vi sedan ihop allt:

```jsx
async function sendForm(event) {
  event.preventDefault();
  setError('');

  // If the user picked an image, upload it first and remember the
  // file's numeric id (Strapi's upload plugin still uses the integer
  // id when attaching media to relations, even in v5).
  let imageId = null;
  if (imageFile) {
    try {
      const uploaded = await uploadFile(imageFile, user.jwt);
      imageId = uploaded.id;
    } catch (err) {
      setError(err.message);
      return;
    }
  }

  await fetch('/api/pets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { ...formData, image: imageId } },
      (key, value) => key === 'owner' && value === '0' ? null : value)
  });
  setFormSent(true);
}
```

Något som är lätt att missa: när vi kopplar filen till peten skickar vi
**filens numeriska `id`**, inte dess `documentId`. Upload-pluginen är
äldre och hängde inte med på `documentId`-tåget i Strapi v5. Pet har
sitt vanliga `documentId` och används som vanligt; bara fil-relationen
är speciell.

## Steg 6 — Frontend: visa bilden i listan

I `src/utils/buildPetsUrl.js` la vi till `image` i `populate`-listan, så
vi får tillbaka fil-objektet (URL, formats etc.) i samma svar, inte bara
ett id:

```js
populate: ['owner', 'image'],
```

Och i `src/pages/Pets.jsx` plockar vi ut URL:en. Strapi auto-genererar
thumbnail-varianter (`thumbnail`, `small`, `medium`, `large`) för
bilduppladdningar, så vi väljer den minsta som finns och faller tillbaka
till originalet om listan saknas (kan hända för väldigt små bilder):

```jsx
pets.map(({ documentId: id, name, species, owner, image }) => {
  const imageUrl = image
    && (image.formats?.thumbnail?.url || image.url);
  return <div key={id}>
    {imageUrl && <img src={imageUrl} alt={name} />}
    <h4>{name}</h4>
    {/* ... */}
  </div>;
})
```

`imageUrl` blir t.ex. `/uploads/thumbnail_min_katt_a1b2c3.jpg` —
relativ URL som tack vare Vite-proxyn (Steg 3) hittar fram till
Strapi-servern.

## Att testa

1. Starta både Strapi och Vite (`npm run dev` i root, eller `npm run develop`
   i `strapi/` + `npm run dev` i root).
2. Logga in på frontend (t.ex. som `tomagain` / `123456`).
3. Gå till `/create-pet`. Du ska nu se file-input-fältet (eftersom du är
   inloggad). Fyll i ett namn, en species, välj en bildfil, klicka Create.
4. Gå till `/pets`. Den nya peten ska visas i listan med thumbnail.
5. Logga ut, gå tillbaka till `/create-pet`. Nu ska file-input-fältet
   vara borta och du ser texten "Log in to also upload an image".
   Att skapa pet utan bild ska fortfarande funka.

### Verifiera säkerheten

Som inloggad kan du i webbläsarens konsol prova:

```js
// Försök radera en uppladdad fil (ska blockeras — vi gav inte destroy)
const me = JSON.parse(localStorage.user);
const res = await fetch('/api/upload/files/1', {
  method: 'DELETE',
  headers: { Authorization: 'Bearer ' + me.jwt }
});
console.log(res.status); // 403 Forbidden
```

Förväntat: `403`. Eftersom vi medvetet inte gav `destroy` till
Authenticated kan ingen användare radera filer via API:t.

## Sammanfattning

| Ändring | Var | Vad |
|---|---|---|
| Schema | `strapi/src/api/pet/content-types/pet/schema.json` | Lägg till `image` (media, single, images only) |
| Behörighet | Strapi admin (sparas i db) | Slå på `upload` (bara den) för rollen Authenticated |
| Proxy | `vite.config.js` | Skicka vidare `/uploads` till Strapi i dev |
| Upload-helper | `src/utils/uploadFile.js` (ny) | Multipart-upload, returnerar fil-objektet |
| Skapa pet | `src/pages/CreatePet.jsx` | Login-gated file-input, två-stegs-anrop |
| Hämta pets | `src/utils/buildPetsUrl.js` | Populate `image` också |
| Visa pets | `src/pages/Pets.jsx` | Rendera `<img>` med thumbnail när bild finns |

Resultat: inloggade användare kan ladda upp en bild när de skapar en
pet, bilden visas i listan, och vi har inte öppnat upp någon
sårbarhet runt fil-hantering på vägen.

## Bonus — liten buggfix

Härrör inte från det här ämnet, har inget med övrigt att göra: när vi
tidigare tog bort sidan `/pets-and-owners` glömdes några
`navigate('/pets-and-owners')`-anrop kvar i `CreatePet.jsx`,
`CreatePetOwner.jsx` och `UpdatePetOwner.jsx` (knapparna som visas
efter att man skapat/uppdaterat en pet eller pet-owner). De pekade på
en route som inte längre finns. Fixade samtidigt: pekar nu på `/pets`
respektive `/pet-owners`.

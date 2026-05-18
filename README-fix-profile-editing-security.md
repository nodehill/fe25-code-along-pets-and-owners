# Säkerhetsfix för profilredigering

I appen har vi en sida `/profile` där en inloggad användare kan ändra sitt användarnamn, 
sin email och sitt lösenord. (Denna når man genom att klicka på sitt användarnamn i sidhuvudet.) 
Sidan anropar Strapis inbyggda endpoint:

```
PUT /api/users/:id
```

Branch där ändringarna ligger:
[`fe25-code-examples-18-maj-2026-fix-profile-editing-security`](https://github.com/nodehill/fe25-code-along-pets-and-owners/tree/fe25-code-examples-18-maj-2026-fix-profile-editing-security)

## En sak att veta om id:t

I Strapi v5 använder de flesta content types (som `pet` och `pet-owner`)
en hashad `documentId` i sina API-routes — alltså en slumpgenererad
sträng typ `clk2xy9abc...`. Men User-typen från `users-permissions`-pluginen
använder fortfarande det **vanliga, inkrementerande SQL-id:t** (1, 2, 3, ...).

Det betyder att `PUT /api/users/2` bokstavligen är "uppdatera raden där
primärnyckeln är 2 i `up_users`-tabellen". Id:n går alltså att gissa
trivialt (1, 2, 3, ...) — vilket gör säkerhetshålen nedan ännu enklare
att utnyttja om man inte täpper till dem.

## Vad är osäkert med default-beteendet?

Default-beteendet i Strapis `users-permissions`-plugin har två problem:

1. **Vem som helst kan ändra vilken användare som helst.** Endpointen
   kontrollerar inte att `:id` i URL:en är samma som den inloggade
   användarens id. Vem som helst med en giltig JWT kan alltså skicka
   `PUT /api/users/1` och skriva över t.ex. admin-användarens uppgifter.
2. **Vem som helst kan höja sin egen roll.** Endpointen släpper igenom
   vilka fält som helst i bodyn — inklusive `role`, `confirmed`, `blocked`
   och `provider`. En vanlig användare kan alltså skicka `{ role: 1 }` och
   göra sig själv till administratör (privilege escalation), eller sätta
   `blocked: false` på sitt eget blockerade konto.

Den här artikeln visar hur vi täppte till båda hålen.

## Ändring 1 — Strapi-permission (databas)

För att `/profile`-sidan över huvud taget ska kunna anropa
`PUT /api/users/:id` måste rollen **Authenticated** ha behörighet att
göra `update` på User.

Detta är inte en kodändring — det är ett klick i Strapi admin som sparas
i databasen (tabellen `up_permissions`).

Gör så här:

1. Logga in i Strapi admin.
2. **Settings** → **Users & Permissions Plugin** → **Roles** →
   **Authenticated**.
3. Scrolla ner till **Users-permissions** → **User** och bocka i `update`.
4. Klicka **Save**.

Notera att om man bara gör den här ändringen — utan kodfixen nedan — så
har man precis öppnat upp för de två sårbarheterna. Slå inte på behörigheten
utan att också ha kodfixen på plats.

## Ändring 2 — Kodfix (Strapi extension)

För att skydda endpointen lägger vi till en **extension** till
`users-permissions`-pluginen. Filen lägger sig som ett "lager" runt
default-controllern och kör säkerhetskontroller innan default-koden får
köra.

### Filen vi lägger till

`strapi/src/extensions/users-permissions/strapi-server.js`:

```js
'use strict';

/**
 * Security fix for PUT /api/users/:id
 * --------------------------------------------------------------
 * Strapi's users-permissions plugin ships with a route
 *   PUT /api/users/:id
 * which we use from the frontend (the /profile page) to let a
 * logged-in user update their own details.
 *
 * The default implementation in Strapi does TWO things we don't
 * want:
 *
 *   1) It does not check that the :id in the URL is the same as
 *      the id of the logged-in user. This means that anyone with
 *      a valid JWT can update ANY OTHER USER simply by writing a
 *      different id in the URL. For example, user no. 5 could
 *      send PUT /api/users/1 and overwrite the admin user's data.
 *
 *   2) It allows the request body to contain any field — for
 *      example { role: 1 } (privilege escalation: make me an
 *      admin), { confirmed: true } (bypass email verification)
 *      or { blocked: false } (unblock a blocked account).
 *      This is true even when updating yourself — users should
 *      not be able to change their own role or admin flags.
 *
 * This file "extends" the plugin and adds two layers of
 * protection around the update controller:
 *
 *   A) Ownership check: :id must match the logged-in user's id.
 *   B) Field whitelist: only username, email and password can be
 *      updated through this endpoint. Anything else is stripped
 *      from the body before the default controller runs.
 */

// Fields a user is allowed to change about themselves via /profile.
// NOTE: 'role', 'confirmed', 'blocked', 'provider' etc. must NOT
// be listed here — they control permissions and account status
// and are managed by admins (or automatically by Strapi).
const ALLOWED_FIELDS = ['username', 'email', 'password'];

module.exports = (plugin) => {

  // Keep a reference to the original update controller so we can
  // delegate to it after our security checks have passed.
  const originalUpdate = plugin.controllers.user.update;

  plugin.controllers.user.update = async (ctx) => {

    // --- A) Ownership check ------------------------------------------
    // ctx.state.user is set by Strapi when a valid JWT is sent in.
    // If no user is logged in at all, Strapi should already have
    // rejected the request, but we guard against it anyway.
    const loggedInUserId = ctx.state.user?.id;
    if (!loggedInUserId) {
      return ctx.unauthorized('You must be logged in');
    }

    // Compare as strings — :id from the URL is always a string,
    // while ctx.state.user.id is a number. Without String() the
    // comparison would always be false and NO ONE could update
    // themselves.
    if (String(ctx.params.id) !== String(loggedInUserId)) {
      return ctx.forbidden('You can only update your own profile');
    }

    // --- B) Field whitelist ------------------------------------------
    // Rebuild the body so it ONLY contains the fields we allow.
    // Everything else (role, confirmed, blocked, ...) is removed
    // before the default controller ever sees it.
    const cleanBody = {};
    for (const field of ALLOWED_FIELDS) {
      if (ctx.request.body?.[field] !== undefined) {
        cleanBody[field] = ctx.request.body[field];
      }
    }
    ctx.request.body = cleanBody;

    // All good — run the original update controller (which hashes
    // the password, validates the email format, etc.).
    return originalUpdate(ctx);
  };

  return plugin;
};
```

### Hur extension-mönstret fungerar

I Strapi v5 kan man "extendera" ett plugin genom att lägga en fil på:

```
strapi/src/extensions/<plugin-namn>/strapi-server.js
```

Filen exporterar en funktion som får hela plugin-objektet som argument.
Vi får alltså möjlighet att modifiera pluginens controllers, services,
routes och policies utan att röra koden i `node_modules/` (vilket hade
försvunnit vid `npm install`).

I vår fil:

- Vi sparar undan en referens till den ursprungliga
  `plugin.controllers.user.update`-funktionen.
- Vi ersätter `plugin.controllers.user.update` med vår egen funktion.
- Vår funktion gör säkerhetskoll och anropar sedan den ursprungliga.

Resultatet är att default-funktionaliteten (hashning av lösenord, validering
av email-format, kontroll av att username/email inte är upptagna) körs som
vanligt — men bara om våra två säkerhetskoll går igenom.

### Varför fält-vitlistan är så viktig

Många missar steg B). Det är frestande att tänka "om jag bara kollar att
användaren är samma som :id så är allt bra". Men det är fortfarande
katastrof om en användare kan skicka:

```json
{ "username": "tom", "role": 1 }
```

…och själv hamna i admin-rollen. Eller:

```json
{ "username": "tom", "confirmed": true }
```

…och kringgå email-verifiering. Eller:

```json
{ "username": "tom", "blocked": false }
```

…och avblockera sitt eget bannlysta konto.

Med fält-vitlistan plockas alla sådana fält bort innan default-controllern
ens får se dem.

## Starta om Strapi

Extensions laddas vid uppstart. Efter att du lagt till filen — stoppa och
starta `npm run develop` på nytt.

## Testa fixen

I repot ligger Strapi-databasen `strapi/.tmp/data.db` med i versionshanteringen
— så när du klonar branchen får du två färdiga testanvändare med kända id:n
och lösenord:

| id | username | email | lösenord |
|---|---|---|---|
| 1 | `tomagain` | `tom@again.com` | `123456` |
| 2 | `anna` | `anna@gmail.com` | `12345678` |

I exemplen nedan loggar vi in som `tomagain` (id 1) och försöker manipulera
`anna` (id 2).

### Steg 1 — logga in som `tomagain`

Logga in i frontend som `tomagain` / `123456`. Då hamnar JWT:n i
`localStorage.user`.

### Steg 2 — öppna webbläsarens konsol (DevTools → Console)

Klistra in följande för att se att din egen JWT och ditt id är på plats:

```js
const u = JSON.parse(localStorage.user);
console.log('Mitt id:', u.user.id, 'Mitt namn:', u.user.username);
```

### Test A — försök ändra en annan användare (ska blockeras)

Inloggad som `tomagain` (id 1), försök skriva över `anna` (id 2):

```js
const me = JSON.parse(localStorage.user);

const res = await fetch('/api/users/2', { // 2 = anna
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + me.jwt
  },
  body: JSON.stringify({ username: 'pwned' })
});
console.log(res.status, await res.json());
```

Förväntat: status `403` och felmeddelandet
`"You can only update your own profile"`. Vår ägarcheck slog till och
default-controllern fick aldrig köra. `anna` är orörd.

### Test B — försök höja sin egen roll och pilla på interna fält (ska tyst ignoreras)

Inloggad som `tomagain`, försök göra sig själv till administratör och
samtidigt manipulera andra fält som inte ska vara editerbara:

```js
const me = JSON.parse(localStorage.user);

const res = await fetch('/api/users/' + me.user.id, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + me.jwt
  },
  body: JSON.stringify({
    username: me.user.username,    // oförändrat
    role: 1,                       // försök bli admin
    confirmed: false,              // försök bli overifierad
    blocked: false,                // försök avblockera sig
    createdAt: '1970-01-01',       // försök förfalska skapelsedatum
    provider: 'google'             // försök byta auth-provider
  })
});
const data = await res.json();
console.log(res.status, data);
console.log('Min roll efter försöket:', data.role); // undefined / oförändrad
```

Förväntat: status `200` — anropet går igenom (du är ju ägaren av id:t),
men fält-vitlistan har strippat bort `role`, `confirmed`, `blocked`,
`createdAt` och `provider` innan default-controllern fick se dem. Inget
av dessa fält har ändrats i databasen. Logga ut, logga in på nytt och
kolla att du fortfarande har samma roll och status.

Samma princip gäller för alla andra fält som inte står i vår
`ALLOWED_FIELDS`-lista — t.ex. `updatedAt`, `documentId`, eller egna
relationer som någon kanske lägger till på User-typen senare. Eftersom
vi använder en vitlista (inte en svartlista) är default-läget alltid
"blockerat" — vi behöver inte komma ihåg att lägga till nya fält i en
spärrlista varje gång User-modellen växer.

### Test C — det normala fallet (ska fungera)

Bara en sanity-check att vanliga uppdateringar fortfarande funkar:

```js
const me = JSON.parse(localStorage.user);

const res = await fetch('/api/users/' + me.user.id, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + me.jwt
  },
  body: JSON.stringify({ username: me.user.username + '-ändrad' })
});
console.log(res.status, await res.json());
```

Förväntat: status `200` och användarnamnet uppdaterat. Du kan återställa
det via `/profile`-sidan.

## Sammanfattning

| Ändring | Var | Vad |
|---|---|---|
| Behörighet | Strapi admin (sparas i db) | Slå på `update` på User för rollen Authenticated |
| Kod | `strapi/src/extensions/users-permissions/strapi-server.js` | Override av `user.update`-controllern med ägarcheck + fält-vitlista |

Resultat: en inloggad användare kan uppdatera sin egen profil med sina
tre tillåtna fält (username, email, password) — inget annat.

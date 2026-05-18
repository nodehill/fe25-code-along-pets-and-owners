# Komponent-testning med Vitest

Det här är en introduktion till hur man skriver enkla automatiska
tester för React-komponenter i ett Vite-projekt. Vi går från ett
nästan-tomt setup till tre tester med ökande komplexitet — render,
asynkron data, och användar-interaktion.

Branch där ändringarna ligger:
[`fe25-code-examples-18-maj-2026-component-testing`](https://github.com/nodehill/fe25-code-along-pets-and-owners/tree/fe25-code-examples-18-maj-2026-component-testing)

## Vad är allt det här egentligen?

Innan vi börjar — några begrepp som dyker upp överallt i React-testning
men som sällan förklaras tydligt.

### Vitest

**Vitest** är en testkörare — ett program som man säger åt "hitta alla
filer som heter `*.test.js(x)` och kör koden i dem". I varje testfil
skriver man instruktioner som "rendera den här komponenten och kolla
att den visar ordet 'Whiskers'". Vitest kör koden, kollar om alla
assertions (påståenden) stämmer, och rapporterar antingen "passed"
eller "failed".

Vitest är gjord för att samspela med **Vite** — om Vite kan bygga din
app så kan Vitest köra dina tester (samma transformationer, samma
import-stöd, samma config). Det finns alternativ (Jest, Mocha,
node:test...) men Vitest är default-valet i moderna Vite-baserade
projekt.

### jsdom

React behöver ett DOM (`document`, `window`, etc.) för att rendera.
I produktion är det webbläsaren som tillhandahåller det. Men i ett
test vill vi inte starta upp en webbläsare för varje testfall — för
långsamt och för komplicerat. Lösningen är **jsdom**: ett bibliotek
som implementerar webbläsarens DOM-API i ren JavaScript och kör i
Node. Det är ett "fejk-fönster" — bra nog för 99% av komponent-tester,
men inte 100% av en riktig webbläsare. (För det sista behövs verktyg
som Playwright eller Cypress, vilket är något annat.)

### React Testing Library

Vitest kan inte själv rendera React-komponenter — det är bara en
körare. **`@testing-library/react`** är paketet som låter oss
"rendera komponenten in i jsdom" och sedan hitta saker på sidan med
funktioner som `screen.getByText('Whiskers')`. Filosofin är att man
ska testa komponenten **så som en användare skulle uppleva den** —
"finns texten 'Whiskers' på sidan?", inte "har den här komponenten
en `state.name`-property som heter Whiskers?". Det gör testerna
robusta: byter du namn på en intern variabel går testet inte sönder.

### @testing-library/jest-dom

Extra "matchers" (påståenden) till `expect(...)`. Utan paketet skulle
man skriva `expect(el).not.toBeNull()`; med det kan man skriva det
mer läsbara `expect(el).toBeInTheDocument()`. Tillhör samma familj
men distribueras som ett separat paket eftersom det också går att
använda med Jest.

### @testing-library/user-event

Simulerar verklig användar-interaktion — `user.type(input, 'Rex')`
genererar tangentnedtryckningar, fokuseringar och input-events
precis som en riktig användare skulle göra. Alternativet är att
manuellt fyra raw-events med `fireEvent`, vilket är snabbare men
mer benäget att missa saker som onFocus eller debouncing.

### Mocking

"Mocka" betyder att man **ersätter** något — typiskt en funktion
eller modul — med en kontrollerad ersättare under testet. Vi gör det
av tre skäl:

1. **Isolation** — vi vill testa komponenten själv, inte hela kedjan
   ner till en riktig server.
2. **Determinism** — en riktig server kan vara nere eller returnera
   olika data olika dagar. En mock returnerar alltid samma sak.
3. **Hastighet** — en mock svarar omedelbart, ingen nätverks-latens.

I våra Pets-tester mockar vi `fetch` — när komponenten ringer
`fetch('/api/pets?...')` får den vår förfalskade respons istället
för ett riktigt HTTP-anrop till Strapi.

## Installation

Fyra dev-paket räcker:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

| Paket | Vad det gör |
|---|---|
| `vitest` | Testkörare |
| `@testing-library/react` | `render()` + `screen.getBy*` etc. |
| `@testing-library/jest-dom` | Snyggare matchers (`toBeInTheDocument`) |
| `@testing-library/user-event` | Realistisk användar-interaktion |
| `jsdom` | Fake DOM i Node |

Lägg sedan till ett `test`-script i `package.json`:

```json
"scripts": {
  ...
  "test": "vitest"
}
```

`npm run test` startar Vitest i watch-läge (kör om vid filändringar).
För single-run: `npx vitest run`.

## Setup

Två små filer:

`vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom gives us a fake DOM (document, window, ...) so React can
    // render into a virtual page instead of a real browser
    environment: 'jsdom',
    // run this file before any test — used to register extra matchers
    // like .toBeInTheDocument()
    setupFiles: ['./src/test/setup.js']
  }
});
```

`src/test/setup.js`:

```js
import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
```

Två saker händer i setup-filen:

1. **Matchers laddas.** Importen registrerar `.toBeInTheDocument()`,
   `.toHaveValue(...)` m.fl. på `expect`. Bara att importera räcker —
   biblioteket har bieffekter.
2. **Auto-cleanup mellan tester.** När ett test renderar en komponent
   ligger den kvar i jsdom tills någon plockar bort den. Nästa test
   skulle då hitta DUBBLA komponenter på sidan — vilket vi snubblade
   över när vi skrev det här. `cleanup()` plockar bort dem; vi kör
   det automatiskt efter varje test.

## Test 1 — render-test (det absolut enklaste)

Vi börjar med det enklaste möjliga testet: rendera `<Footer />` och
kolla att den visar förväntad text.

`src/partials/Footer.jsx` ser ut så här:

```jsx
export default function Footer() {
  return <footer>&copy; The Pet Shelter 2026</footer>;
}
```

Testet i `src/test/Footer.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../partials/Footer';

describe('Footer', () => {

  it('shows the copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/Pet Shelter/i)).toBeInTheDocument();
  });

});
```

Vad varje del betyder:

- **`describe('Footer', () => { ... })`** grupperar relaterade tester.
  Helt valfritt men hjälper när en fil har många test — namnet visas
  som en rubrik i test-output.
- **`it('shows the copyright text', () => { ... })`** definierar ett
  enskilt testfall. Strängen ska beskriva BETEENDET du vill verifiera,
  inte implementationen — "shows the copyright text" är bra, "renders
  a footer element" är sämre. Alias för `it` är `test`; samma sak.
- **`render(<Footer />)`** mountar komponenten i jsdom. Efter den här
  raden "finns" sidan med Footer på och vi kan börja fråga om den.
- **`screen.getByText(...)`** letar efter ett element som innehåller
  matchande text. Regex `/Pet Shelter/i` betyder "innehåller 'Pet
  Shelter', skiftlägesokänsligt". Vi använder regex istället för en
  exakt sträng så att testet inte spricker om vi t.ex. lägger till
  årtalet senare.
- **`.toBeInTheDocument()`** är assertion:en — det är här Vitest
  faktiskt jämför förväntning mot verklighet. Misslyckas det här
  blir testet "failed".

Mönstret kallas **AAA: Arrange–Act–Assert.** I render-tester är
"Act"-steget typiskt tomt (komponenten har redan renderat sig). Det
syns tydligare i nästa test.

## Test 2 — asynkron data och mockad fetch

`Pets`-sidan är klart mer komplicerad: den hämtar tre olika resurser
från Strapi och renderar pets baserat på svaret. För att testa det
behöver vi:

1. **Mocka fetch** så vi inte gör verkliga nätverksanrop.
2. **Returnera realistisk data** i Strapis format.
3. **Vänta in async rendering** innan vi gör assertions.

Här är hela testet (förenklat med kommentarer borttagna):

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pets from '../pages/Pets';

function strapiResponse(body) {
  return {
    ok: true,
    json: () => Promise.resolve(body)
  };
}

describe('Pets page', () => {

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url.startsWith('/api/pets/species')) {
        return Promise.resolve(strapiResponse({ data: ['Cat', 'Dog'] }));
      }
      if (url.startsWith('/api/pet-owners')) {
        return Promise.resolve(strapiResponse({
          data: [{ documentId: 'o1', firstName: 'Alice', lastName: 'Andersson' }],
          meta: { pagination: { total: 1 } }
        }));
      }
      return Promise.resolve(strapiResponse({
        data: [
          { documentId: 'p1', name: 'Whiskers', species: 'Cat', owner: null, image: null },
          { documentId: 'p2', name: 'Rex', species: 'Dog', owner: null, image: null }
        ],
        meta: { pagination: { total: 2 } }
      }));
    });
  });

  it('shows the pets returned by the API', async () => {
    render(<Pets />);
    expect(await screen.findByText('Whiskers')).toBeInTheDocument();
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText(/Found: 2/)).toBeInTheDocument();
  });

});
```

### Nya koncept

**`beforeEach`** kör en funktion innan varje test i samma `describe`.
Vi använder den för att installera en fräsch fetch-mock — varje test
börjar med samma rena utgångsläge och ser inga "spillningar" från
föregående test.

**`vi.spyOn(globalThis, 'fetch').mockImplementation(...)`** ersätter
`fetch` med en mock-funktion under testet. Vitest återställer den
automatiskt efter testet (tack vare `restoreMocks` som är default).
`mockImplementation` säger "när någon anropar fetch, kör den här
funktionen istället". Vi tittar på URL:en och returnerar olika
fejk-svar.

**`strapiResponse`** är en liten hjälpfunktion som bygger ett objekt
som ser ut som en Response från fetch. Vi behöver inte implementera
hela Response-klassen — bara fälten som vår kod faktiskt läser
(`ok` och `json()`). Det här är "minimal mocking" — fejka bara så
mycket som behövs.

**Strapis svarsform**: `{ data: [...], meta: { pagination: {...} } }`.
`useFetch`-hjälparen i appen tar emot precis det och gör om varje
respons till en array (där `meta` slås ihop med arrayen som
properties — så `pets.pagination.total` fungerar). Mocken måste
matcha formatet, annars blir det undefined-felmeddelanden.

**`async () => { ... }`** — testet är nu en async-funktion. Det
behövs för att vi ska kunna `await`-a på den asynkrona renderingen.

**`screen.findByText('Whiskers')`** istället för `getByText`. Skillnaden:

| Variant | Synkron? | Beteende vid miss |
|---|---|---|
| `getBy*` | Ja | Kastar fel direkt |
| `queryBy*` | Ja | Returnerar `null` |
| `findBy*` | Nej (async) | Försöker om i 1 sek innan den ger upp |

När komponenten precis har renderats är `Whiskers` ännu inte på sidan —
fetch är fortfarande igång. `findByText` väntar och försöker om tills
texten dyker upp (eller timeout efter 1 sekund).

### Tumregler för vilken man väljer

- **`getBy*`**: när du är säker på att elementet finns NU.
- **`queryBy*`**: när du vill verifiera att något INTE finns
  (`expect(screen.queryByText('foo')).toBeNull()`).
- **`findBy*`**: när elementet dyker upp efter en async operation.

## Test 3 — användar-interaktion

Det sista testet handlar om att skriva i sökfältet och verifiera att
komponenten reagerar — i vårt fall genom att göra om fetch-anropet
med ett nytt filter.

```jsx
import userEvent from '@testing-library/user-event';

// ... samma beforeEach som ovan ...

it('refetches the pets list with a name filter when the user types in the search field', async () => {
  const user = userEvent.setup();
  render(<Pets />);

  await screen.findByText('Whiskers');

  await user.type(screen.getByLabelText(/search by name/i), 'Rex');

  expect(globalThis.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/^\/api\/pets\?.*Rex/)
  );
});
```

### Nya koncept

**`userEvent.setup()`** skapar en "user"-instans som man kör
interaktioner via. Den simulerar tangenttryck, klick, fokusering osv.
mycket närmare verkligheten än `fireEvent`. Setup-anropet hör ihop
med moderna versioner (v14+); äldre exempel använder `userEvent.type`
direkt.

**`screen.getByLabelText(/search by name/i)`** hittar input-fältet
som ligger inuti `<label>Search by name: <input /></label>`.
`getByLabelText` är att föredra över `getByPlaceholderText` eller
`getByRole('textbox')` när labeln är tydlig — det matchar bäst hur
en användare hittar fältet ("jag letar efter fältet som heter
'Search by name'").

**`await user.type(field, 'Rex')`** simulerar 'R', 'e', 'x' i tur
och ordning. Varje tangent triggar onChange → setState → re-render →
useEffect → fetch. När awaiten resolvar har alla dessa kedjor körts
färdigt.

**`expect(globalThis.fetch).toHaveBeenCalledWith(...)`** verifierar
att mocken har ANROPATS med ett visst argument. Det är en av de
inbyggda matchers för spy-funktioner.

**`expect.stringMatching(/^\/api\/pets\?.*Rex/)`** är en "asymmetric
matcher" — istället för en exakt sträng beskriver vi mönstret vi
förväntar oss. Vi bryr oss inte om hela querystring:en, bara att den
börjar med `/api/pets?` och innehåller `Rex` någonstans. På så sätt
påverkas inte testet av om `qs.stringify` ändrar ordningen på
parametrarna.

## Att köra testerna

```bash
npm run test
```

startar Vitest i watch-läge — den kör om relevanta tester när du
sparar en fil. Tryck `q` för att avsluta.

```bash
npx vitest run
```

kör alla tester en gång och avslutar. Användbart i CI eller pre-commit
hooks.

```bash
npx vitest run src/test/Footer.test.jsx
```

kör en specifik fil.

## Felsökningstips

- **`screen.debug()`** skriver ut den nuvarande DOM-strukturen till
  konsolen. Klistra in den någonstans i ett testfall när du undrar
  "hur ser sidan egentligen ut?".
- **"Found multiple elements ..."** — du saknar förmodligen cleanup
  mellan tester. Kolla att `afterEach(cleanup)` ligger i setup-filen.
- **"Unable to find an element with the text ..."** — kolla om
  innehållet faktiskt har renderats ännu. Antingen bytt `getBy*`
  till `findBy*`, eller `await`-a något annat först.
- **Tester hänger sig i en oändlig loop** — något async-anrop blir
  aldrig klart. Kontrollera att din fetch-mock returnerar en
  Promise som faktiskt resolvar.

## Vad vi inte tar upp här

- **Routing** (`react-router`). Komponenter som använder
  `useNavigate` eller `<Link>` måste wrappas i `<MemoryRouter>` i
  testet. Vår `Pets` använder ingenting från router i själva
  rendern, så vi slipper det.
- **Outlet context** (`useOutletContext`). Komponenter som tar emot
  data via Outlet (t.ex. `Profile`, `CreatePet` när inloggad) behöver
  ett wrapper-test-helper.
- **End-to-end-tester** med Playwright/Cypress. Helt annan typ av
  test — startar en riktig webbläsare och testar hela appen mot en
  riktig server. Användbart men dyrt; det här dokumentet handlar bara
  om snabba isolerade komponent-tester.

## Sammanfattning

| Fil | Syfte |
|---|---|
| `vitest.config.js` | Säg åt Vitest att använda jsdom + setup-fil |
| `src/test/setup.js` | Registrera matchers + auto-cleanup |
| `src/test/Footer.test.jsx` | Test 1: render-test |
| `src/test/Pets.test.jsx` | Test 2 + 3: async/fetch och interaktion |
| `package.json` | Lägg till `"test": "vitest"`-script |

Kör `npm run test`. Alla tre tester ska passera.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pets from '../pages/Pets';

// A tiny helper that builds the kind of response Strapi would have
// sent back. We don't need to fake EVERY field — only the ones our
// component actually reads.
function strapiResponse(body) {
  return {
    ok: true,
    json: () => Promise.resolve(body)
  };
}

describe('Pets page', () => {

  // `beforeEach` runs before every test in this describe block.
  // We use it to install a fresh fetch mock — that way each test
  // starts from the same clean state and doesn't see leftover calls
  // from a previous test.
  beforeEach(() => {
    // vi.spyOn replaces globalThis.fetch with a mock function for
    // the duration of the test. After the test, Vitest automatically
    // restores the original. The mock returns different responses
    // depending on the URL — that's how we fake "Strapi" without
    // having a real server.
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {

      if (url.startsWith('/api/pets/species')) {
        // useFetch expects { data, meta } — meta is optional
        return Promise.resolve(strapiResponse({ data: ['Cat', 'Dog'] }));
      }

      if (url.startsWith('/api/pet-owners')) {
        return Promise.resolve(strapiResponse({
          data: [
            { documentId: 'o1', firstName: 'Alice', lastName: 'Andersson' }
          ],
          meta: { pagination: { total: 1 } }
        }));
      }

      // anything else (i.e. /api/pets?...) — return two pets
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

    // Fetch is async — when render() returns, the request is still
    // pending and the component is in its loading state (renders
    // nothing). We use `findByText` (instead of `getByText`) because
    // it waits and retries until the text appears or times out.
    expect(await screen.findByText('Whiskers')).toBeInTheDocument();

    // Once we know one pet is on screen, the others should be too —
    // `getByText` is synchronous and is the right choice now.
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText(/Found: 2/)).toBeInTheDocument();
  });

  it('refetches the pets list with a name filter when the user types in the search field', async () => {
    // `userEvent` simulates real user input — much closer to actual
    // browser behaviour than firing raw events.
    const user = userEvent.setup();
    render(<Pets />);

    // wait for the initial render so we know the first round of
    // fetches has completed
    await screen.findByText('Whiskers');

    // type into the search field. `userEvent.type` fires one event
    // per character, exactly like a real user typing.
    await user.type(screen.getByLabelText(/search by name/i), 'Rex');

    // After typing, Pets has re-rendered and useEffect has called
    // update() again — which means fetch should have been called
    // with a NEW URL that includes our search term. We don't care
    // about the exact querystring, just that 'Rex' is somewhere in it.
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/pets\?.*Rex/)
    );
  });

});

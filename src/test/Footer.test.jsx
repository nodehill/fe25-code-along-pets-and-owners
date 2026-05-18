import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../partials/Footer';

// `describe` groups related tests together. It's optional but useful
// when a file has many tests — the description shows up as a heading
// in the test output.
describe('Footer', () => {

  // `it` defines one single test. `test(...)` is an alias that does
  // the same thing. The string should describe the BEHAVIOUR you're
  // verifying, not the implementation.
  it('shows the copyright text', () => {
    // 1) ARRANGE — render the component into the (fake) DOM that
    //    jsdom set up for us. After this call, the component is
    //    "live" on a virtual page and we can query it.
    render(<Footer />);

    // 2) ACT — for a pure render-test there's nothing to do; the
    //    component already rendered itself.

    // 3) ASSERT — find the element and check that it's there.
    //    screen.getByText returns the first element whose text matches.
    //    The regex /Pet Shelter/i means "contains 'Pet Shelter',
    //    case-insensitive" — flexible enough that the test won't
    //    break if we add the year or change wording slightly.
    expect(screen.getByText(/Pet Shelter/i)).toBeInTheDocument();
  });

});

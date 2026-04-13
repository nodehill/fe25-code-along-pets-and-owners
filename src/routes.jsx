import { createElement } from 'react';

// vite can do glob imports
// for example import every jsx file in a folder:
const pages = import.meta.glob('./pages/*.jsx', { eager: true });

const routes = Object.values(pages)
  .map(x => x.default)
  .map(x => ({ ...x.route, element: createElement(x) }))
  .sort((a, b) => a.index - b.index);

export default routes;
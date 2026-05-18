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

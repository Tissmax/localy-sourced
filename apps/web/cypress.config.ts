import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3003',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      // Affiche les violations d'accessibilité dans le terminal
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        table(rows: unknown[]) {
          console.table(rows);
          return null;
        },
      });
    },
  },
  video: false,
});
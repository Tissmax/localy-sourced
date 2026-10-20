import { logViolations } from '../support/a11y';

const pages = ['/', '/login', '/products'];

describe('Accessibilité', () => {
  pages.forEach((path) => {
    it(`${path} n'a pas de violation WCAG A/AA`, () => {
      cy.visit(path);
      cy.injectAxe();
      cy.checkA11y(
        undefined, // tout le document, ou un sélecteur CSS
        {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        },
        logViolations,
      );
    });
  });
});
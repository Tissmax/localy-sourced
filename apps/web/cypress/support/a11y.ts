export function logViolations(violations: any[]) {
  cy.task(
    'log',
    `${violations.length} violation(s) d'accessibilité détectée(s)`,
  );
  cy.task(
    'table',
    violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      occurrences: nodes.length,
    })),
  );
}
// import { describe, expect, it } from 'vitest';

// /**
//  * Vérifie que la gateway joint bien chacun de ses services (products, sales, users).
//  *
//  * Principe : on appelle, via HTTP, une route de la gateway qui est relayée vers
//  * le microservice (NATS). Si le service est injoignable, la gateway répond 5xx
//  * (timeout, "no responders", etc.) et le test échoue en nommant le service fautif.
//  *
//  * À adapter : les routes de TARGETS, le statut attendu et l'authentification.
//  */

// const GATEWAY_URL = process.env.E2E_GATEWAY_URL ?? 'http://localhost:3000';
// const AUTH_TOKEN = process.env.E2E_AUTH_TOKEN; // optionnel
// const REQUEST_TIMEOUT_MS = 10_000;

// interface ServiceTarget {
//   /** Nom du service, utilisé dans les messages d'échec */
//   name: string;
//   /** Route de la gateway qui est relayée vers ce service */
//   path: string;
//   /** Statuts acceptés (200 par défaut) */
//   expectedStatus?: number[];
// }

// const TARGETS: ServiceTarget[] = [
//   { name: 'products', path: '/products' },
//   { name: 'sales', path: '/sales' },
//   { name: 'users', path: '/users' },
// ];

// const call = async (path: string) => {
//   const started = Date.now();
//   const res = await fetch(`${GATEWAY_URL}${path}`, {
//     headers: {
//       Accept: 'application/json',
//       ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
//     },
//     signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
//   });
//   const text = await res.text();
//   return { res, text, durationMs: Date.now() - started };
// };

// describe('Gateway ↔ services', () => {
//   it('la gateway répond', async () => {
//     const res = await fetch(GATEWAY_URL, {
//       signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
//     });
//     // Peu importe le statut (200, 404...) : on vérifie seulement que le serveur répond.
//     expect(res.status, `La gateway ne répond pas sur ${GATEWAY_URL}`).toBeLessThan(
//       500,
//     );
//   });

//   describe.each(TARGETS)('service $name', ({ name, path, expectedStatus }) => {
//     it(`GET ${path} est relayé jusqu'au service`, async () => {
//       const { res, text } = await call(path);

//       expect(
//         res.status,
//         `Le service "${name}" semble injoignable depuis la gateway ` +
//           `(GET ${path} → ${res.status}) : ${text.slice(0, 200)}`,
//       ).toBeLessThan(500);

//       expect(expectedStatus ?? [200]).toContain(res.status);
//     });

//     it('répond du JSON valide', async () => {
//       const { res, text } = await call(path);

//       expect(res.headers.get('content-type') ?? '').toContain('application/json');
//       expect(() => JSON.parse(text)).not.toThrow();
//     });

//     it('répond dans un délai raisonnable', async () => {
//       const { durationMs } = await call(path);

//       expect(
//         durationMs,
//         `Le service "${name}" met ${durationMs} ms à répondre`,
//       ).toBeLessThan(2_000);
//     });
//   });
// });
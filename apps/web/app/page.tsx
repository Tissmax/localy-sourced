import Link from 'next/link';

const features = [
  {
    title: 'Des produits de proximité',
    description:
      'Découvrez des produits issus de producteurs proches de chez vous, avec une origine claire et vérifiable.',
  },
  {
    title: 'Un achat simple',
    description:
      'Parcourez le catalogue, ajoutez vos articles et suivez vos commandes depuis un seul endroit.',
  },
  {
    title: 'Un soutien direct aux producteurs',
    description:
      'Chaque vente rémunère directement ceux qui cultivent, fabriquent et transforment localement.',
  },
];

export default function HomePage() {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-emerald-800 focus:outline-2 focus:outline-emerald-700"
      >
        Aller au contenu principal
      </a>

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Localy Sourced
          </Link>
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-6 text-sm font-medium text-gray-800">
              <li>
                <Link
                  href="/products"
                  className="hover:text-emerald-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Produits
                </Link>
              </li>
              <li>
                <a
                  href="#fonctionnement"
                  className="hover:text-emerald-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Pourquoi nous
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" className="bg-white">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Mangez local, soutenez ceux qui produisent près de chez vous
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700">
            Une place de marché qui met en relation les habitants et les
            producteurs de leur région.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="rounded-md bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Voir les produits
            </Link>
            <a
              href="#fonctionnement"
              className="rounded-md border border-gray-400 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              En savoir plus
            </a>
          </div>
        </section>

        <section
          id="fonctionnement"
          aria-labelledby="titre-fonctionnement"
          className="bg-gray-50 py-16"
        >
          <div className="mx-auto max-w-5xl px-4">
            <h2
              id="titre-fonctionnement"
              className="text-center text-3xl font-bold text-gray-900"
            >
              Pourquoi choisir Localy Sourced
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-3">
              {features.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-700">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-700">
          © {new Date().getFullYear()} Localy Sourced. Tous droits réservés.
        </div>
      </footer>
    </>
  );
}
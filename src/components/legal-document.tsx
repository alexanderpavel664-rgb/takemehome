import { Card } from "@/components/ui/card";
import {
  FILL,
  fillCount,
  PRIVACY,
  TERMS,
  type LegalBlock,
  type LegalDocumentContent,
} from "@/lib/legal";

/**
 * Le rendu commun de /confidentialitate et /termeni.
 *
 * Une page juridique est le seul endroit du site où l'on demande à
 * quelqu'un de lire longtemps. Deux conséquences de mise en page : la
 * mesure est bornée à 66 caractères (au-delà, l'œil perd la ligne en
 * revenant à gauche), et le texte reste sur le papier crème, sans carte —
 * une carte ivoire de trois écrans de haut ne contient plus rien, elle
 * pèse. Seuls les blocs qui SONT des encadrés (l'avertissement de
 * relecture, les paires terme/valeur) prennent l'ivoire.
 */

/**
 * Garde-fou de développement : si un champ « de completat » subsiste dans
 * L'UN OU L'AUTRE des deux documents, pas seulement celui affiché, un
 * bandeau le dit sur les deux pages légales. Jamais rendu en production —
 * les visiteurs ne doivent pas voir ces marqueurs — mais rendu sur les
 * déploiements de prévisualisation Vercel, qui tournent aussi avec
 * NODE_ENV=production. En français : seul un développeur (ou le relecteur
 * d'une prévisualisation) peut le voir.
 */
function FillWarning() {
  const isProduction =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview";
  if (isProduction) {
    return null;
  }

  const remaining = [
    { title: PRIVACY.title, count: fillCount(PRIVACY) },
    { title: TERMS.title, count: fillCount(TERMS) },
  ].filter(({ count }) => count > 0);
  if (remaining.length === 0) {
    return null;
  }

  return (
    <Card role="alert" className="mt-4 border-[1.5px] border-warm-ink p-4">
      <p className="text-base font-semibold text-warm-ink">
        Avertissement de développement, invisible en production
      </p>
      <p className="mt-1 max-w-[66ch] text-base text-warm-ink">
        Des champs « de completat » subsistent :{" "}
        {remaining
          .map(({ title, count }) => `${title} (${count})`)
          .join(", ")}
        . À compléter dans src/lib/legal.ts avant la mise en ligne.
      </p>
    </Card>
  );
}

/** La case vide, impossible à manquer. Voir l'en-tête de lib/legal.ts. */
function Placeholder() {
  return (
    <span className="inline-flex items-center rounded-pill border-[1.5px] border-dashed border-warm-ink px-3 py-0.5 text-sm font-semibold text-warm-ink">
      de completat
    </span>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if ("p" in block) {
    return <p className="mt-3 max-w-[66ch] text-base text-warm-ink">{block.p}</p>;
  }

  if ("list" in block) {
    return (
      // list-outside + pl-5 : la puce sort dans la marge, donc les lignes
      // suivantes d'un point long s'alignent sous le texte, pas sous la puce.
      <ul className="mt-3 max-w-[66ch] list-outside list-disc space-y-1 pl-5 text-base text-warm-ink">
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <Card className="mt-3 max-w-[66ch] p-4">
      <dl className="space-y-2 text-base">
        {block.rows.map(({ term, value }) => (
          // Le terme au-dessus de la valeur, jamais côte à côte : une
          // adresse ou une phrase de durée ne tient pas sur une colonne
          // étroite, et un tableau à deux colonnes se casse sur téléphone.
          <div key={term}>
            <dt className="text-sm text-warm-gray">{term}</dt>
            <dd className="text-warm-ink">
              {value === FILL ? <Placeholder /> : value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function LegalDocument({
  content,
}: {
  content: LegalDocumentContent;
}) {
  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement et la page se tasserait sur son contenu.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">{content.title}</h1>
      <p className="mt-1 text-sm text-warm-gray">{content.updatedLabel}</p>

      <FillWarning />

      <p className="mt-4 max-w-[66ch] text-base text-warm-ink">
        {content.intro}
      </p>

      {content.sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-lg font-semibold text-warm-ink">
            {section.title}
          </h2>
          {section.blocks.map((block, index) => (
            // Les blocs d'une section n'ont pas de clé naturelle (un même
            // paragraphe pourrait se répéter) et la liste est figée à la
            // compilation : l'index est ici la bonne clé, pas un pis-aller.
            <Block key={index} block={block} />
          ))}
        </section>
      ))}
    </main>
  );
}

"use client";

import { useActionState } from "react";
import { STR } from "@/lib/strings";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { deleteAccount } from "./actions";

/**
 * Les deux droits qui s'exercent en un geste : la copie des données
 * (art. 15 et 20 RGPD) et l'effacement (art. 17).
 *
 * Ce ne sont pas des réglages, et l'écran doit le dire : ils vivent sous
 * leur propre titre, en bas de la page de profil, après le formulaire —
 * jamais mêlés aux champs qu'on modifie chaque semaine.
 */

/**
 * Le téléchargement est un simple lien vers une route GET : le fichier
 * arrive par Content-Disposition, sans une ligne de JavaScript. Un
 * onClick + Blob + URL.createObjectURL ferait la même chose en moins fiable
 * et en plus de code.
 */
function ExportSection() {
  return (
    <Card className="mt-4 p-4">
      <h3 className="text-base font-semibold text-warm-ink">
        {STR.profil.exportTitle}
      </h3>
      <p className="mt-1 max-w-[60ch] text-sm text-warm-gray">
        {STR.profil.exportDescription}
      </p>
      {/* download : le navigateur enregistre au lieu d'ouvrir un onglet de
          JSON brut. Le nom réel vient quand même du serveur. */}
      <a
        href="/cont/profil/export"
        download
        className={buttonClasses("outline", "mt-3")}
      >
        {STR.profil.exportAction}
      </a>
    </Card>
  );
}

/**
 * L'effacement demande deux gestes : la question du navigateur, puis le mot
 * tapé à la main. Deux, parce que c'est le seul geste du site que rien ne
 * rattrape — il emporte les animaux et leurs photos. Ni l'un ni l'autre
 * n'est là pour décourager : la personne qui veut partir part, mais elle
 * part en le sachant.
 *
 * Le mot est revalidé côté serveur : l'action est joignable par POST direct.
 */
function DeleteSection() {
  const [state, formAction, pending] = useActionState(deleteAccount, null);

  return (
    // Bordure encre épaissie : le langage des avertissements du site. La
    // palette n'a pas de rouge et n'en veut pas — c'est le mot « definitiv »
    // qui porte l'avertissement, jamais la couleur.
    <Card className="mt-4 border-[1.5px] border-warm-ink p-4">
      <h3 className="text-base font-semibold text-warm-ink">
        {STR.profil.deleteTitle}
      </h3>
      <p className="mt-1 max-w-[60ch] text-sm text-warm-ink">
        {STR.profil.deleteDescription}
      </p>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(STR.profil.deleteConfirmPrompt)) {
            e.preventDefault();
          }
        }}
        className="mt-3 space-y-3"
      >
        <Input
          label={STR.profil.deleteConfirmLabel}
          name="confirmation"
          type="text"
          autoComplete="off"
          // Le clavier mobile s'ouvre en majuscules et sans correction : le
          // mot à recopier en est un, pas un mot de la langue.
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
          error={state?.formError}
        />
        {/* outline et non primary : le bouton plein de cet écran est
            « Salvează », sur le formulaire de profil (La Règle du Bouton
            Unique). Un effacement ne se propose pas, il s'accepte. */}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? STR.profil.deletePending : STR.profil.deleteAction}
        </Button>
      </form>
    </Card>
  );
}

export function AccountData() {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-warm-ink">
        {STR.profil.rightsTitle}
      </h2>
      <p className="mt-1 max-w-[60ch] text-base text-warm-gray">
        {STR.profil.rightsIntro}
      </p>
      <ExportSection />
      <DeleteSection />
    </section>
  );
}

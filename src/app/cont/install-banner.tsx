"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// `beforeinstallprompt` n'est dans la lib DOM d'aucun TypeScript : il n'est
// standardisé nulle part et n'existe que sur les navigateurs Chromium.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "takemehome:install-refuse";

/** Déjà installée : lancée depuis l'écran d'accueil, rien à proposer. */
function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Propriété non standard, propre à Safari iOS.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Les trois faits d'environnement ci-dessous sont lus via
// useSyncExternalStore plutôt que posés depuis un effet : ils ne changent pas
// pendant la vie de la page, l'instantané serveur vaut « rien à afficher »
// (le bandeau n'est donc jamais dans le HTML), et l'hydratation reste propre.
const subscribeNever = () => () => {};
const serverSnapshot = () => false;

/** Ni refus mémorisé, ni application déjà installée. */
const canOffer = () => !localStorage.getItem(DISMISSED_KEY) && !isInstalled();

/** iOS et iPadOS — l'iPad se présente en « Macintosh » depuis iPadOS 13. */
const onIOS = () => {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
};

/**
 * Invitation à installer l'application — uniquement sur /cont, donc
 * uniquement pour les publiantes connectées. Les adoptantes arrivent de
 * Facebook pour voir un animal : leur poser une question d'installation les
 * éloignerait de la seule chose qui compte, et sous iOS le navigateur interne
 * de Facebook ne sait de toute façon pas installer.
 *
 * Un bandeau, jamais une fenêtre modale : il attend son tour dans la page,
 * n'attrape pas le focus et se refuse d'un bouton. Le refus est mémorisé —
 * on ne redemande plus jamais, sur aucune visite.
 *
 * Deux formes selon la plateforme : sur Chromium, `beforeinstallprompt` est
 * retenu puis rejoué au clic ; sur iOS, où cette API n'existe pas, le bandeau
 * se contente d'indiquer le chemin dans le menu de partage de Safari.
 *
 * L'action est en `outline` : le seul bouton plein de /cont est « Ajouter un
 * animal » (La Règle du Bouton Unique) — ce n'est pas à une invitation
 * d'installation de le lui prendre.
 */
export function InstallBanner() {
  const offerable = useSyncExternalStore(
    subscribeNever,
    canOffer,
    serverSnapshot,
  );
  const ios = useSyncExternalStore(subscribeNever, onIOS, serverSnapshot);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  // Refusé ou installé pendant cette visite — posé depuis un gestionnaire
  // d'événement, jamais depuis le corps d'un effet.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!offerable || ios) return;

    const onPrompt = (event: Event) => {
      // Sans preventDefault, Chrome affiche sa propre invite : c'est elle
      // qu'on remplace par le bandeau.
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setSettled(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [offerable, ios]);

  function refuse() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setSettled(true);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    // Accepté comme refusé, le même événement ne peut pas être rejoué.
    setSettled(true);
  }

  // iOS n'a pas d'API d'installation : le bandeau s'y affiche dès le montage.
  // Ailleurs, il attend que le navigateur juge le site installable.
  const show = offerable && !settled && (ios || installEvent !== null);
  if (!show) return null;

  return (
    <Card
      // Le bandeau n'est pas un dialogue : pas d'aria-modal, pas de piège à
      // focus — il s'insère dans le flux, sous son titre, et se lit à son tour.
      className="mt-6 max-w-[66ch] p-4"
    >
      <h2 className="text-lg font-semibold text-warm-ink">
        Installer TakeMeHome
      </h2>
      {ios ? (
        <p className="mt-1 text-base text-warm-gray">
          Dans Safari, ouvrez le menu de partage puis choisissez{" "}
          {/* Libellés du menu iOS tels qu'ils s'affichent sur un téléphone
              réglé en roumain — ce sont les mots à chercher à l'écran, pas
              du texte d'interface à traduire. */}
          <span className="text-warm-ink">
            « Partajează » → « Adaugă pe ecranul principal »
          </span>
          .
        </p>
      ) : (
        <p className="mt-1 text-base text-warm-gray">
          Gardez vos annonces à portée de main : l’application s’ouvre depuis
          l’écran d’accueil, sans passer par le navigateur.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {!ios && (
          <Button variant="outline" onClick={install}>
            Installer
          </Button>
        )}
        <Button variant="ghost" onClick={refuse}>
          Non merci
        </Button>
      </div>
    </Card>
  );
}

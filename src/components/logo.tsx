/**
 * Logo TakeMeHome — la patte vectorisée depuis la maquette (public/paw.svg,
 * terracotta pleine, sans fond) posée à gauche du mot « takemehome », qui
 * reste du texte : Plus Jakarta Sans 600, espacement naturel, encre chaude.
 * L'image est décorative (alt="") ; c'est le lockup qui porte role="img" et
 * aria-label, sans quoi un lecteur d'écran annoncerait « image » et le lien
 * d'accueil serait muet.
 *
 * Géométrie mesurée sur la vectorisation du mot (Plus Jakarta Sans 600,
 * 1000 unités par em) et sur le chemin réel de la patte, plutôt qu'estimée :
 * - hauteur d'x du mot          = 541 u  = 0,541 em
 * - patte = 1,1 × hauteur d'x   = 0,595 em
 * - centre optique du mot (centroïde d'aire, ascendantes comprises)
 *                               = 0,299 em au-dessus de la ligne de base
 * - la masse de la patte est 2,36 % de sa hauteur plus basse que son centre
 *   géométrique : elle est donc remontée d'autant pour paraître centrée.
 *   Les deux corrections se compensent presque — il reste +0,015 em, soit
 *   0,3 px à 20 px : le bas de la patte affleure la ligne de base. C'est la
 *   seule valeur à retoucher si l'œil réclame autre chose sur écran.
 * - écart patte/mot = 0,227 em, repris du lockup validé en maquette.
 *
 * Le favicon (app/icon.png, app/favicon.ico) est rastérisé depuis ce même
 * SVG, sur fond crème — la patte seule, lisible à 16 px.
 */

/** Dimensions natives du SVG, arrondies : fixent le ratio avant chargement (pas de CLS). */
const PAW_INTRINSIC = { width: 1682, height: 1729 };

function Paw({ className }: { className: string }) {
  return (
    // SVG statique : next/image n'optimise pas les SVG, il n'apporterait ici
    // qu'un détour de rendu.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/paw.svg"
      alt=""
      width={PAW_INTRINSIC.width}
      height={PAW_INTRINSIC.height}
      className={className}
    />
  );
}

type LogoProps = {
  /** « lockup » : patte + mot (en-tête) ; « paw » : patte seule. */
  variant?: "lockup" | "paw";
  className?: string;
};

export function Logo({ variant = "lockup", className = "" }: LogoProps) {
  if (variant === "paw") {
    return (
      <span
        role="img"
        aria-label="takemehome"
        className={`inline-flex ${className}`}
      >
        <Paw className="h-7 w-auto" />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label="takemehome"
      className={`inline-flex items-baseline text-xl font-semibold text-warm-ink ${className}`}
    >
      <Paw className="mr-[0.227em] h-[0.595em] w-auto translate-y-[0.015em]" />
      takemehome
    </span>
  );
}

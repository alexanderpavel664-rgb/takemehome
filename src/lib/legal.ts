/**
 * Les deux documents juridiques du site, en roumain : la politique de
 * confidentialité (/confidentialitate) et les conditions d'utilisation
 * (/termeni).
 *
 * POURQUOI ILS NE SONT PAS DANS strings.ts — la règle du fichier unique de
 * chaînes vise les libellés d'interface, qu'on relit par écran. Ceux-ci sont
 * des DOCUMENTS : on les relit d'un bout à l'autre, à voix haute, et c'est
 * un adulte qui le fera, pas un développeur. Les mêler aux libellés de
 * boutons rendrait les deux relectures plus difficiles. Les libellés de
 * navigation qui pointent vers ces pages, eux, restent dans strings.ts.
 *
 * LES CHAMPS « DE COMPLETAT » — chaque `{}` est un champ à compléter,
 * rendu à l'écran par une case « de completat » impossible à manquer (voir
 * LegalDocument). Il vaut mieux un trou qui saute aux yeux qu'une adresse
 * inventée : ces documents engagent juridiquement une personne réelle.
 * Tous les champs sont remplis aujourd'hui ; le mécanisme reste, et un
 * bandeau hors production (voir fillCount et LegalDocument) signale tout
 * `{}` qui réapparaîtrait, avant qu'il ne parte en ligne.
 *
 * TON — le tutoiement du reste du site, pour la raison que donne l'art. 12
 * RGPD : une information « concisă, transparentă, inteligibilă și ușor
 * accesibilă, într-un limbaj clar și simplu ». Le roumain administratif à
 * la troisième personne fait l'inverse.
 *
 * Mais le tutoiement s'arrête là. La North Star « de la om la om » gouverne
 * l'interface, pas les conditions : un texte juridique imagé ou familier
 * perd en crédibilité et, le jour où il faudrait s'en prévaloir, en valeur.
 * On écrit ce qui est, sans commenter, sans rassurer, sans faire de phrases.
 * Pas de « Atât. » en phrase isolée, pas d'antithèse « nu X, ci Y », pas de
 * métaphore, pas de commentaire sur le texte lui-même.
 *
 * PONCTUATION — la linia de pauză est du roumain correct, mais elle se
 * raréfie ici : virgule, deux-points, ou phrase coupée. Quand elle est
 * vraiment nécessaire, le caractère est la demi-cadratin « – » (U+2013),
 * jamais la cadratin « — » : c'est déjà celui des titres de strings.ts
 * (« Profilul meu – TakeMeHome »), et un site n'a droit qu'à un seul.
 * Guillemets : les roumains „…” (U+201E/U+201D), forme 99-99 de
 * l'Îndreptar §268. Jamais de guillemets droits ni de “…”.
 */

/** Marqueur de champ à compléter. Voir l'en-tête du fichier. */
export const FILL = "{}";

export type LegalBlock =
  | { p: string }
  /** Liste à puces — jamais de tableau : ces pages se lisent sur un téléphone. */
  | { list: string[] }
  /** Paire terme/valeur, pour les blocs d'identification et les durées. */
  | { rows: { term: string; value: string }[] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentContent = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** Daté à la main : une date automatique mentirait dès le premier build. */
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
};

/* ——— /confidentialitate ——— */

export const PRIVACY: LegalDocumentContent = {
  title: "Politica de confidențialitate",
  metaTitle: "Politica de confidențialitate",
  metaDescription:
    "Ce date colectează TakeMeHome, de ce, cine le mai vede și ce drepturi ai asupra lor.",
  updatedLabel: "Ultima actualizare: august 2026",
  intro:
    "TakeMeHome pune în legătură persoanele care au animale de dat spre adopție cu persoanele care vor să adopte. Pentru asta prelucrează câteva date despre tine. Pagina de față arată care sunt aceste date, în ce scop sunt prelucrate, cine le mai primește și ce drepturi ai asupra lor.",
  sections: [
    {
      title: "1. Cine răspunde de datele tale",
      blocks: [
        {
          p: "Operatorul de date, adică persoana care răspunde legal de datele de pe site:",
        },
        {
          rows: [
            { term: "Nume", value: "Sebastian Pavel" },
            {
              term: "Adresă",
              value: "15 rue du Breuil Marais, 79000 Bessines, France",
            },
            { term: "Email de contact", value: "contact.takemehome@gmail.com" },
          ],
        },
        {
          p: "Pentru orice întrebare despre datele tale sau pentru exercitarea drepturilor de mai jos, scrie la adresa de email de contact. Primești răspuns în cel mult o lună, conform art. 12 din GDPR.",
        },
      ],
    },
    {
      title: "2. Ce date colectăm și de ce",
      blocks: [
        {
          p: "Fiecare categorie de date de mai jos are un scop și un temei legal.",
        },
        {
          p: "Contul tău. Nume, adresă de email și parolă, păstrată doar sub formă criptată, niciodată în clar. Dacă intri în cont cu Google, primim de la Google numele, adresa de email și fotografia de profil. Parola ta nu ne este transmisă. Temei: executarea contractului dintre tine și platformă, art. 6(1)(b) GDPR. Fără cont nu poți publica un anunț.",
        },
        {
          p: "Profilul tău public. Telefon, email public, județ, oraș și descriere. Sunt afișate pe anunțurile tale numai dacă bifezi expres această opțiune în profil. Temei: consimțământul tău, art. 6(1)(a) GDPR. Îl poți retrage oricând, la fel de ușor cum l-ai dat, debifând căsuța din profil. Butoanele de contact dispar imediat de pe anunțurile tale.",
        },
        {
          p: "Animalele pe care le publici. Nume, specie, sex, vârstă, talie, județ, oraș, descriere, starea de sănătate declarată și fotografii. Textul și fotografiile le scrii tu. Dacă incluzi acolo date despre o altă persoană, cum ar fi un număr de telefon sau o față într-o fotografie, răspunderea îți revine. Temei: executarea contractului, art. 6(1)(b) GDPR.",
        },
        {
          p: "Sesiunile tale. La fiecare autentificare păstrăm adresa IP și tipul de browser (user-agent) al dispozitivului de pe care ai intrat. Temei: interesul legitim de a-ți proteja contul și de a putea recunoaște o autentificare care nu îți aparține, art. 6(1)(f) GDPR.",
        },
        {
          p: "Limitarea traficului. Adresa IP e folosită și pentru a număra câte încercări de autentificare, câte publicări și câte încărcări de fotografii vin de pe aceeași conexiune, ca să oprim atacurile automate. Temei: interesul legitim de a menține site-ul în funcțiune, art. 6(1)(f) GDPR.",
        },
        {
          p: "Semnalările. Oricine poate semnala un anunț fără să aibă cont. În acest caz păstrăm motivul, mesajul scris și adresa IP de pe care a venit semnalarea. Adresa IP e păstrată pentru a identifica semnalările repetate împotriva aceluiași anunț. Nu e afișată public și nu ajunge în jurnale. Dacă ai semnalat un anunț, ai aceleași drepturi asupra acestei adrese IP ca orice altă persoană, chiar dacă nu ai cont pe site. Temei: interesul legitim de a preveni utilizarea abuzivă a mecanismului de semnalare, art. 6(1)(f) GDPR.",
        },
        {
          p: "Erorile tehnice. Când apare o eroare pe server, raportul de eroare e trimis către Sentry: eroarea, pagina pe care a apărut, tipul browserului și limba browserului. Adresa IP și conținutul cookie-urilor sunt eliminate înainte de trimitere. Temei: interesul legitim de a remedia defecțiunile, art. 6(1)(f) GDPR.",
        },
        {
          p: "Nu folosim datele tale ca să îți afișăm reclame, nu le vindem și nu le dăm nimănui în scopuri de marketing. Nu luăm nicio decizie automată despre tine și nu îți facem profil.",
        },
      ],
    },
    {
      title: "3. Cine mai vede datele",
      blocks: [
        {
          p: "Pentru funcționarea site-ului, câteva companii prelucrează date în numele nostru. Sunt persoane împuternicite: prelucrează datele numai conform instrucțiunilor noastre, în baza unui contract.",
        },
        {
          rows: [
            {
              term: "Neon",
              value:
                "baza de date în care stau conturile, anunțurile și semnalările. Servere în Uniunea Europeană. neon.tech/privacy-policy",
            },
            {
              term: "Vercel",
              value:
                "găzduirea site-ului, stocarea fotografiilor (Vercel Blob) și filtrul care oprește atacurile automate. Vercel e o companie din Statele Unite: transferul se face în baza clauzelor contractuale standard aprobate de Comisia Europeană. vercel.com/legal/privacy-policy",
            },
            {
              term: "Google",
              value:
                "doar dacă alegi să intri în cont cu Google. Ne trimite numele, emailul și poza ta de profil. policies.google.com/privacy",
            },
            {
              term: "Sentry",
              value:
                "rapoartele de eroare de pe server. Contul nostru e în regiunea europeană: datele stau la Frankfurt, în Germania. sentry.io/privacy",
            },
          ],
        },
        {
          p: "Nu folosim încă un serviciu de trimitere a emailurilor. Când va fi adăugat unul, pentru confirmarea adresei și resetarea parolei, pagina de față va fi actualizată înainte ca serviciul să fie pus în funcțiune.",
        },
        {
          p: "În afara acestora, datele tale nu sunt transmise nimănui, cu o singură excepție: dacă o autoritate le solicită printr-o cerere legală, suntem obligați să răspundem.",
        },
      ],
    },
    {
      title: "4. Cât păstrăm datele",
      blocks: [
        {
          rows: [
            {
              term: "Contul și anunțurile",
              value:
                "cât timp contul există. Când îl ștergi, dispar imediat, inclusiv fotografiile.",
            },
            {
              term: "Conturi nefolosite",
              value:
                "nu se șterg automat. Contul rămâne deschis, cu datele lui, până când îl ștergi tu. Poți face asta oricând, din pagina profilului.",
            },
            {
              term: "Sesiunile",
              value:
                "7 zile de la ultima folosire, apoi expiră singure. Se șterg imediat când te deconectezi.",
            },
            {
              term: "Contoarele de trafic",
              value:
                "cel mult 15 minute, apoi sunt șterse automat la fiecare fereastră nouă.",
            },
            {
              term: "Semnalările",
              value: "6 luni de la trimitere, apoi sunt șterse automat.",
            },
            {
              term: "Rapoartele de eroare",
              value:
                "cât le păstrează Sentry pentru planul nostru, apoi sunt șterse automat de ei.",
            },
          ],
        },
      ],
    },
    {
      title: "5. Ce se păstrează pe dispozitivul tău",
      blocks: [
        {
          p: "Site-ul nu folosește niciun instrument de analiză a traficului, niciun pixel publicitar și nicio componentă încărcată de pe alt site. Activitatea ta nu e urmărită nici pe site, nici în afara lui. De aceea nu există o bandă de cookie-uri: nu stocăm nimic pentru care ar fi necesar consimțământul tău.",
        },
        {
          p: "Ce se stochează totuși pe dispozitivul tău, și în ce scop:",
        },
        {
          rows: [
            {
              term: "Cookie de sesiune",
              value:
                "te ține autentificat. 7 zile, reînnoite cât timp folosești site-ul. Dispare când te deconectezi. Fără el nu poți rămâne în cont.",
            },
            {
              term: "Cookie de securitate",
              value:
                "doar la autentificarea cu Google, 5 minute. Împiedică pe altcineva să pornească o autentificare în locul tău.",
            },
            {
              term: "takemehome:install-refuse",
              value:
                "o singură valoare în memoria locală a browserului, scrisă doar dacă închizi propunerea de a instala aplicația pe ecranul telefonului. Scopul ei e ca propunerea să nu reapară. O poți șterge din setările browserului.",
            },
            {
              term: "Memoria offline",
              value:
                "site-ul păstrează pe dispozitivul tău fișierele care nu se schimbă, adică fonturi, cod și iconițe, împreună cu fotografiile deja afișate, pentru ca paginile să se deschidă rapid pe o conexiune slabă și pentru a rămâne parțial utilizabile fără semnal. O bază de date locală numită serwist-expiration ține evidența acestor fișiere, deci și adresele fotografiilor deschise. Aceste date rămân pe dispozitivul tău. Paginile, răspunsurile de la server și datele contului tău nu sunt salvate acolo.",
            },
          ],
        },
        {
          p: "Poți șterge toate elementele de mai sus din setările browserului, de la „date despre site”. Ștergerea cookie-ului de sesiune te deconectează.",
        },
      ],
    },
    {
      title: "6. Adresele fotografiilor",
      blocks: [
        {
          p: "Fotografiile animalelor sunt stocate la o adresă publică, greu de ghicit, care conține identificatorul intern al contului tău. Cine cunoaște adresa exactă a unei fotografii o poate deschide fără să aibă cont. Din compararea a două astfel de adrese se poate deduce că cele două animale au fost publicate de același cont. La ștergerea unui animal sau a contului, fotografiile sunt șterse și din acest spațiu de stocare.",
        },
      ],
    },
    {
      title: "7. Drepturile tale",
      blocks: [
        {
          p: "GDPR îți acordă următoarele drepturi asupra datelor tale. Exercitarea lor nu trebuie motivată.",
        },
        {
          list: [
            "Acces: să afli ce date avem despre tine și să primești o copie.",
            "Rectificare: să corectezi ce e greșit. Îți poți edita singur profilul și anunțurile, oricând.",
            "Ștergere: să ceri ștergerea datelor tale. Poți face asta singur, din profil, cu butonul de ștergere a contului.",
            "Portabilitate: să primești datele tale într-un fișier pe care îl poți duce altundeva. Butonul de descărcare din profil îți dă un fișier JSON.",
            "Opoziție: să te opui prelucrărilor bazate pe interesul legitim, adică celor de la punctul 2 care se sprijină pe art. 6(1)(f).",
            "Restricționare: să ceri să oprim temporar prelucrarea, cât timp se lămurește o contestație.",
            "Retragerea consimțământului: să retragi oricând acordul pentru afișarea publică a datelor tale de contact, debifând căsuța din profil. Retragerea nu afectează ce s-a întâmplat înainte de ea.",
          ],
        },
        {
          p: "Ștergerea contului și descărcarea datelor se fac direct din pagina profilului tău. Pentru celelalte drepturi, scrie la contact.takemehome@gmail.com, adresa de email de contact de la punctul 1.",
        },
      ],
    },
    {
      title: "8. Dacă ai o plângere",
      blocks: [
        {
          p: "Dacă apreciezi că datele tale nu sunt prelucrate corect, ne poți scrie mai întâi nouă, la contact.takemehome@gmail.com. Ai însă dreptul să te adresezi direct unei autorități de supraveghere, fără o solicitare prealabilă către noi. Autoritatea din România:",
        },
        {
          rows: [
            {
              term: "Autoritatea",
              value:
                "Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)",
            },
            {
              term: "Adresă",
              value:
                "B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, cod poștal 010336, București",
            },
            { term: "Telefon", value: "+40.318.059.211 / +40.318.059.212" },
            { term: "Email", value: "anspdcp@dataprotection.ro" },
            { term: "Site", value: "www.dataprotection.ro" },
          ],
        },
        {
          p: "Operatorul de date are reședința în Franța, iar site-ul se adresează persoanelor din România. Pentru o astfel de prelucrare transfrontalieră, autoritatea franceză CNIL poate fi autoritatea principală, conform mecanismului „ghișeului unic” din art. 56 GDPR. Poți depune plângerea la oricare dintre cele două autorități: dacă o depui la ANSPDCP, cele două colaborează potrivit regulamentului.",
        },
        {
          rows: [
            {
              term: "Autoritatea franceză",
              value:
                "Commission Nationale de l'Informatique et des Libertés (CNIL)",
            },
            {
              term: "Adresă",
              value:
                "3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, Franța",
            },
            { term: "Telefon", value: "+33 1 53 73 22 22" },
            {
              term: "Site",
              value: "www.cnil.fr, unde plângerea se poate depune online",
            },
          ],
        },
        {
          p: "Ai dreptul și să te adresezi instanțelor de judecată.",
        },
      ],
    },
    {
      title: "9. Copii",
      blocks: [
        {
          p: "În România, vârsta de la care o persoană își poate da singură consimțământul pentru un serviciu online este 16 ani. Sub 16 ani e necesar acordul unui părinte sau al tutorelui pentru crearea unui cont. Un cont despre care aflăm că aparține unei persoane sub 16 ani fără acest acord e șters.",
        },
      ],
    },
    {
      title: "10. Modificări",
      blocks: [
        {
          p: "Dacă modificăm ceva important, cum ar fi adăugarea unui serviciu care primește date sau a unui scop nou de prelucrare, pagina de față e actualizată și data de sus e modificată.",
        },
      ],
    },
  ],
};

/* ——— /termeni ——— */

export const TERMS: LegalDocumentContent = {
  title: "Termeni și condiții",
  metaTitle: "Termeni și condiții",
  metaDescription:
    "Ce face și ce nu face TakeMeHome, regulile de publicare și răspunderea fiecăruia.",
  updatedLabel: "Ultima actualizare: august 2026",
  intro:
    "Prin folosirea TakeMeHome ești de acord cu termenii de mai jos.",
  sections: [
    {
      title: "1. Ce face platforma",
      blocks: [
        {
          p: "TakeMeHome e o platformă pe care persoanele care au în grijă animale fără stăpân, refugii, asociații sau voluntari, își pot publica anunțurile de adopție. Persoanele care vor să adopte pot căuta printre aceste anunțuri și pot lua legătura direct cu cei care le-au publicat.",
        },
      ],
    },
    {
      title: "2. Ce nu face platforma",
      blocks: [
        {
          p: "Platforma nu participă la adopție. Nu verificăm animalele, nu verificăm persoanele care publică anunțuri, nu mediem discuția dintre părți, nu încheiem documente, nu asigurăm transportul și nu percepem nicio sumă pentru adopție.",
        },
        {
          p: "Nu garantăm starea de sănătate a unui animal. Nu garantăm istoricul lui medical: vaccinuri, sterilizare, microcip, tratamente. Nu garantăm comportamentul lui față de oameni, copii sau alte animale. Nu garantăm vârsta, rasa sau talia. Toate informațiile dintr-un anunț sunt declarate de persoana care l-a publicat și nu sunt verificate de noi.",
        },
        {
          p: "Persoanele care publică anunțuri acționează în nume propriu. Nu sunt angajații noștri, nu ne reprezintă și nu acționează pentru noi. Fiecare răspunde singură de conținutul anunțurilor sale și de consecințele unei adopții.",
        },
        {
          p: "Nu răspundem pentru raporturile dintre utilizatori: pentru o informație falsă dintr-un anunț, pentru o problemă de sănătate descoperită după adopție, pentru costuri veterinare, pentru pagube produse de animal sau pentru o înțelegere nerespectată. Cu excepția cazurilor în care legea nu permite excluderea răspunderii, răspunderea noastră pentru folosirea site-ului e limitată la ceea ce prevede legea în mod imperativ.",
        },
      ],
    },
    {
      title: "3. Înainte să adopți",
      blocks: [
        {
          p: "Recomandări, fără valoare contractuală:",
        },
        {
          list: [
            "Vezi animalul în persoană înainte să te hotărăști.",
            "Cere carnetul de sănătate și consultă un medic veterinar.",
            "Nu trimite bani în avans. Un anunț care cere plata unui „transport” înainte ca animalul să fie văzut indică, în cele mai multe cazuri, o tentativă de înșelăciune.",
            "Stabilește întâlnirea într-un loc public sau la adăpost, nu la o adresă necunoscută.",
            "Dacă ceva ți se pare în neregulă, semnalează anunțul. Butonul se află pe fiecare pagină de animal.",
          ],
        },
      ],
    },
    {
      title: "4. Contul tău",
      blocks: [
        {
          list: [
            "Contul e necesar numai pentru publicarea anunțurilor. Căutarea și adopția nu necesită cont.",
            "Crearea unui cont necesită vârsta de cel puțin 16 ani. Sub 16 ani e necesar acordul unui părinte sau al tutorelui.",
            "Datele din cont trebuie să fie reale și să îți aparțină.",
            "Răspunzi de parola ta și de activitatea desfășurată din contul tău.",
            "Îți poți șterge contul oricând, din pagina profilului.",
          ],
        },
      ],
    },
    {
      title: "5. Regulile de publicare",
      blocks: [
        {
          p: "Poți publica un anunț numai dacă:",
        },
        {
          list: [
            "animalul există și se află în grija ta;",
            "animalul e disponibil pentru adopție sau pentru plasament temporar;",
            "informațiile despre el sunt adevărate, în limita a ceea ce cunoști, în special cele privind sănătatea și comportamentul;",
            "fotografiile îți aparțin sau ai dreptul să le folosești;",
            "datele de contact îți aparțin și sunt funcționale.",
          ],
        },
        {
          p: "Marchează animalul ca adoptat după ce adopția a avut loc. Un anunț rămas activ după adopție ocupă locul altui animal.",
        },
      ],
    },
    {
      title: "6. Ce nu e permis",
      blocks: [
        {
          list: [
            "Vânzarea animalelor. Platforma e destinată adopției. Recuperarea costurilor veterinare e permisă, cu condiția să fie menționată explicit în anunț.",
            "Anunțuri false, animale care nu există, fotografii preluate de pe alte site-uri.",
            "Solicitarea de bani în avans, sub orice formă.",
            "Datele de contact ale unei alte persoane, fără acordul acesteia.",
            "Fotografii cu animale rănite sau moarte, publicate în scop de șocare.",
            "Insulte, amenințări, conținut care încalcă legea.",
            "Publicitate pentru orice altceva decât animalul din anunț.",
            "Programe automate care publică anunțuri sau copiază conținutul site-ului.",
          ],
        },
      ],
    },
    {
      title: "7. Semnalarea unui anunț",
      blocks: [
        {
          p: "Oricine poate semnala un anunț, fără cont. Semnalările sunt examinate și, dacă e cazul, anunțul e ascuns din paginile publice. Persoana care l-a publicat continuă să îl vadă în contul ei și e informată că a fost ascuns.",
        },
        {
          p: "Semnalarea unui anunț nu atrage obligația de a-l ascunde. Nu ne asumăm un termen de soluționare.",
        },
      ],
    },
    {
      title: "8. Când suspendăm un cont",
      blocks: [
        {
          p: "Un cont poate fi suspendat dacă:",
        },
        {
          list: [
            "publică anunțuri false sau animale care nu există;",
            "solicită bani în avans sau încearcă să înșele o altă persoană;",
            "vinde animale în loc să le dea spre adopție;",
            "publică datele de contact ale unei alte persoane fără acordul acesteia;",
            "insultă sau amenință alți utilizatori;",
            "încalcă în mod repetat regulile de publicare de mai sus;",
            "folosește platforma în alt scop decât adopția animalelor.",
          ],
        },
        {
          p: "Un cont suspendat nu mai poate publica sau modifica anunțuri, iar anunțurile lui pot fi ascunse. Accesul la cont rămâne posibil, la fel și vizualizarea animalelor, ștergerea lor și ștergerea contului.",
        },
        {
          p: "Dacă apreciezi că suspendarea contului tău e o eroare, scrie la adresa de contact din politica de confidențialitate.",
        },
      ],
    },
    {
      title: "9. Conținutul pe care îl publici",
      blocks: [
        {
          p: "Textele și fotografiile pe care le publici rămân proprietatea ta. Ne acorzi dreptul de a le afișa pe site cât timp anunțul e publicat, în scopul funcționării platformei. La ștergerea anunțului sau a contului, acest drept încetează și fotografiile sunt șterse.",
        },
      ],
    },
    {
      title: "10. Disponibilitatea site-ului",
      blocks: [
        {
          p: "Site-ul e pus la dispoziție în forma în care se află. Nu garantăm disponibilitatea neîntreruptă a serviciului și nu răspundem pentru pierderile cauzate de o întrerupere.",
        },
      ],
    },
    {
      title: "11. Modificări ale acestor termeni",
      blocks: [
        {
          p: "Termenii pot fi modificați. La o modificare importantă, data de sus e actualizată. Folosirea site-ului după modificare constituie acceptarea noii versiuni.",
        },
      ],
    },
    {
      title: "12. Legea aplicabilă și contact",
      blocks: [
        {
          p: "Acestor termeni li se aplică legea română. Litigiile se soluționează de instanțele competente din România.",
        },
        {
          p: "Persoana care răspunde de acest site:",
        },
        {
          rows: [
            { term: "Nume", value: "Sebastian Pavel" },
            {
              term: "Adresă",
              value: "15 rue du Breuil Marais, 79000 Bessines, France",
            },
            { term: "Email de contact", value: "contact.takemehome@gmail.com" },
          ],
        },
      ],
    },
  ],
};

/**
 * Compte les textes d'un document qui contiennent encore le marqueur FILL.
 * Sert au garde-fou hors production de LegalDocument : un « de completat »
 * ne doit jamais être mis en ligne. Le balayage couvre tous les textes, pas
 * seulement les valeurs des paires terme/valeur : un `{}` égaré dans un
 * paragraphe s'afficherait tel quel aux visiteurs.
 */
export function fillCount(content: LegalDocumentContent): number {
  const texts: string[] = [content.intro];
  for (const section of content.sections) {
    for (const block of section.blocks) {
      if ("p" in block) {
        texts.push(block.p);
      } else if ("list" in block) {
        texts.push(...block.list);
      } else {
        for (const row of block.rows) {
          texts.push(row.term, row.value);
        }
      }
    }
  }
  return texts.filter((text) => text.includes(FILL)).length;
}

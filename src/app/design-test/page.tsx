import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AnimalCard } from "@/components/ui/animal-card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/field";
import { AnimalCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ChipDemo } from "./chip-demo";

/**
 * Page temporaire de validation visuelle des composants C1 — à supprimer
 * après validation (avec public/design-test/). Une page produit n'aurait
 * qu'un seul bouton plein ; ici la galerie en montre chaque état.
 */

export const metadata: Metadata = {
  title: "Design test — TakeMeHome",
  robots: { index: false },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm text-warm-gray">{children}</p>;
}

const JUDETE = ["Alba", "București", "Cluj", "Iași", "Timiș"];

export default function DesignTestPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 p-4 pb-16">
      <header className="space-y-2 pt-4">
        <h1 className="text-[32px]/[1.05] font-semibold">
          Design system — validare C1
        </h1>
        <Note>
          Pagină temporară : toate componentele din src/components/ui/, în
          toate stările, pe fondul crem. De șters după validare.
        </Note>
      </header>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">
            {/* Le bouton d'appel signature : icône téléphone + libellé 600/19px. */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="size-5"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Sună acum
          </Button>
          <Button variant="outline">Resetează filtrele</Button>
          <Button variant="ghost">Înapoi la cont</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" disabled>
            Se salvează…
          </Button>
          <Button variant="outline" disabled>
            Resetează filtrele
          </Button>
          <ButtonLink variant="outline" href="/design-test">
            Vezi animalele (link)
          </ButtonLink>
        </div>
        <Note>
          Un singur buton plin pe ecran în produs (Regula Butonului Unic);
          focusul de tastatură este în culoarea cernelii, niciodată teracotă.
        </Note>
      </Section>

      <Section title="Card">
        <Card className="max-w-md p-4">
          <h3 className="text-lg font-semibold">Despre Luna</h3>
          <p className="mt-1 text-warm-ink">
            Blândă și jucăușă, se înțelege bine cu copiii și cu alte animale.
            A fost găsită lângă Timișoara și așteaptă o familie.
          </p>
        </Card>
        <Note>
          Ivoriu pe crem, hairline #EAE1D2, 20 px, nicio umbră în repaus
          (Regula Platului).
        </Note>
      </Section>

      <Section title="Chip">
        <ChipDemo options={["Cluj", "București", "Iași", "Sterilizat", "Vaccinat"]} />
        <div className="flex flex-wrap gap-2">
          <Chip>Neselectat</Chip>
          <Chip selected>Selectat</Chip>
        </div>
        <Note>
          Selectat = fond cerneală caldă, text alb — teracota este interzisă
          aici. Primul rând este interactiv.
        </Note>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Adoptat</Badge>
        </div>
        <Note>
          Rezervat exclusiv statutului „Adoptat” — verde #2F6B4F, singurul
          element care are voie să acopere o fotografie.
        </Note>
      </Section>

      <Section title="Input / Select / Textarea">
        <Card className="max-w-md space-y-4 p-4">
          <Input label="Nume" name="nume" placeholder="Ștefan" />
          <Input
            label="Telefon"
            name="telefon"
            type="tel"
            defaultValue="07xx"
            error="Numărul de telefon nu pare valid — verifică cifrele."
          />
          <Select label="Județ" name="judet" defaultValue="">
            <option value="" disabled>
              Alege județul
            </option>
            {JUDETE.map((judet) => (
              <option key={judet} value={judet}>
                {judet}
              </option>
            ))}
          </Select>
          <Textarea
            label="Descriere"
            name="descriere"
            defaultValue="Blândă și jucăușă, se înțelege bine cu copiii și cu alte animale."
          />
        </Card>
        <Note>
          Text 16 px (fără zoom automat pe iOS), focus cu bordură de cerneală
          îngroșată, eroarea scrisă în cuvinte sub câmp — paleta nu are roșu.
        </Note>
      </Section>

      <Section title="AnimalCard">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimalCard
            href="/design-test"
            name="Luna"
            meta="Câine · Femelă · 2 ani"
            county="Cluj"
            photoUrl="/design-test/proba.png"
            eager
          />
          <AnimalCard
            href="/design-test"
            name="Bella"
            meta="Pisică · Femelă · 1 an"
            county="Iași"
            photoUrl="/design-test/proba.png"
            adopted
            eager
          />
          <AnimalCard
            href="/design-test"
            name="Ștefan"
            meta="Câine · Mascul · 4 ani"
            county="București"
          />
          <AnimalCard
            href="/design-test"
            name="Măriuca"
            meta="Pisică · Femelă · 8 luni"
            county="Brașov"
            adopted
          />
        </div>
        <Note>
          Fotografie 4:3 cu colțuri de 19 px (cu 1 px mai puțin decât cardul),
          nume 600/19 px, metadate în gri cald. Fără fotografie: crem + numele
          în Display 600. Imaginea de probă e un simplu degrade în tonuri de
          blană fauve — fotografiile reale vin din Vercel Blob.
        </Note>
      </Section>

      <Section title="EmptyState">
        <Card>
          <EmptyState
            title="Nicio potrivire"
            description="Niciun animal nu corespunde filtrelor alese. Încearcă să lărgești căutarea."
            action={<Button variant="outline">Resetează filtrele</Button>}
          />
        </Card>
        <Note>
          Afișat aici într-un Card doar pentru delimitare — în pagină stă
          direct pe crem. Cel mult o acțiune, în outline (Regula Ieșirii).
        </Note>
      </Section>

      <Section title="Skeleton">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimalCardSkeleton />
          <AnimalCardSkeleton />
          <AnimalCardSkeleton />
          <AnimalCardSkeleton />
        </div>
        <div className="max-w-md space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Note>
          Pulsație ivoriu ↔ crem, imobilă sub prefers-reduced-motion.
          Dimensiunile cardului-schelet sunt identice cu AnimalCard.
        </Note>
      </Section>
    </main>
  );
}

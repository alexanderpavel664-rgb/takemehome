import type { Metadata } from "next";
import Link from "next/link";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from "@/lib/animal-labels";
import { prisma } from "@/lib/prisma";
import { relativeTimeRo } from "@/lib/relative-time";
import { STR } from "@/lib/strings";
import { getViewer, requireAdmin } from "@/lib/viewer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { setAnimalHidden, setReportStatus, setUserSuspended } from "./actions";
import { ConfirmForm } from "./confirm-form";

/**
 * Un non-ADMIN doit recevoir EXACTEMENT le 404 ordinaire — titre compris.
 * Un `<title>` « Moderare » sur la page d'erreur confirmerait que l'adresse
 * existe, ce que le 404 est justement là pour taire. Objet vide : les
 * métadonnées du layout racine s'appliquent, comme sur n'importe quel 404.
 * getViewer est mémoïsé par requête : ce contrôle ne coûte pas de requête
 * de plus que celui de la page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const viewer = await getViewer();
  if (viewer?.role !== "ADMIN") {
    return {};
  }
  return {
    title: STR.admin.metaTitle,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

// Au-delà, la page devient illisible avant d'être utile ; le compte des
// signalements en attente, lui, reste exact (requête séparée).
const MAX_REPORTS = 100;

export default async function AdminPage() {
  // Porte unique : anonyme comme USER reçoivent notFound(), jamais un 403.
  await requireAdmin();

  const [reports, pending] = await Promise.all([
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      // +1 : dit s'il en reste sans payer un count() de plus.
      take: MAX_REPORTS + 1,
      select: {
        id: true,
        reason: true,
        message: true,
        ip: true,
        status: true,
        createdAt: true,
        // Jointures assumées : elles sont le contenu même de l'écran, et
        // cette requête ne sert QUE /admin — aucune page publique ne lit
        // jamais la table Report.
        animal: {
          select: {
            id: true,
            name: true,
            hidden: true,
            user: { select: { id: true, name: true, suspended: true } },
          },
        },
      },
    }),
    // status n'a pas d'index : la table reste petite (un signalement est
    // rare), et un index de plus se paierait à chaque écriture publique.
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  const truncated = reports.length > MAX_REPORTS;
  const shown = truncated ? reports.slice(0, MAX_REPORTS) : reports;

  return (
    <>
      <SiteHeader />
      {/* w-full : enfant du body en flex-col, mx-auto seul annulerait
          l'étirement et la page se tasserait sur son contenu. */}
      <main className="mx-auto w-full max-w-3xl px-4 py-4 md:px-6">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {STR.admin.title}
        </h1>
        <p className="mt-1 text-base text-warm-gray">
          {STR.admin.pending(pending)}
        </p>

        {shown.length === 0 ? (
          <Card className="mt-4">
            <EmptyState
              title={STR.admin.emptyTitle}
              description={STR.admin.emptyDescription}
            />
          </Card>
        ) : (
          <>
            <ul className="mt-4 space-y-4">
              {shown.map((report) => {
                const { animal } = report;
                return (
                  <li key={report.id}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center rounded-pill border border-warm-border bg-cream-ground px-3 py-1 text-[13px] text-warm-ink">
                          {REPORT_STATUS_LABELS[report.status]}
                        </span>
                        <span className="text-sm text-warm-gray">
                          {relativeTimeRo(report.createdAt)}
                        </span>
                        {animal.hidden && (
                          <span className="text-sm font-semibold text-warm-ink">
                            {STR.admin.hiddenBadge}
                          </span>
                        )}
                        {animal.user.suspended && (
                          <span className="text-sm font-semibold text-warm-ink">
                            {STR.admin.suspendedBadge}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2 text-lg font-semibold text-warm-ink">
                        {animal.name}
                      </h2>
                      <p className="text-base text-warm-ink">
                        {REPORT_REASON_LABELS[report.reason]}
                      </p>
                      {report.message && (
                        <p className="mt-2 max-w-[66ch] text-base whitespace-pre-line text-warm-ink">
                          {report.message}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-warm-gray">
                        {STR.admin.publishedBy(animal.user.name)} ·{" "}
                        {STR.admin.ip} {report.ip ?? STR.admin.unknownIp}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {/* Un ADMIN voit tout : le lien mène à la fiche même
                            masquée, seul moyen de juger sur pièces. */}
                        <Link
                          href={`/animal/${animal.id}`}
                          className="inline-flex min-h-11 items-center px-2 text-sm text-warm-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
                        >
                          {STR.admin.seeAnimal}
                        </Link>
                        <form action={setAnimalHidden}>
                          <input
                            type="hidden"
                            name="animalId"
                            value={animal.id}
                          />
                          <input
                            type="hidden"
                            name="hidden"
                            value={animal.hidden ? "0" : "1"}
                          />
                          <Button variant="ghost" type="submit">
                            {animal.hidden
                              ? STR.admin.unhide
                              : STR.admin.hide}
                          </Button>
                        </form>
                        <SuspendForm
                          userId={animal.user.id}
                          name={animal.user.name}
                          suspended={animal.user.suspended}
                        />
                        {/* Traiter ou rejeter ne se pose que tant que le
                            signalement est en attente. */}
                        {report.status === "PENDING" && (
                          <>
                            <StatusForm
                              reportId={report.id}
                              status="REVIEWED"
                              label={STR.admin.markReviewed}
                            />
                            <StatusForm
                              reportId={report.id}
                              status="DISMISSED"
                              label={STR.admin.dismiss}
                            />
                          </>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
            {truncated && (
              <p className="mt-4 text-sm text-warm-gray">
                {STR.admin.truncated(MAX_REPORTS)}
              </p>
            )}
          </>
        )}

        <p className="mt-10 border-t border-warm-border pt-4 text-sm text-warm-gray">
          {STR.admin.suspendHint}
        </p>
      </main>
    </>
  );
}

function StatusForm({
  reportId,
  status,
  label,
}: {
  reportId: string;
  status: "REVIEWED" | "DISMISSED";
  label: string;
}) {
  return (
    <form action={setReportStatus}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={status} />
      <Button variant="ghost" type="submit">
        {label}
      </Button>
    </form>
  );
}

function SuspendForm({
  userId,
  name,
  suspended,
}: {
  userId: string;
  name: string;
  suspended: boolean;
}) {
  const fields = (
    <>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="suspended" value={suspended ? "0" : "1"} />
      <Button variant="ghost" type="submit">
        {suspended ? STR.admin.unsuspend : STR.admin.suspend}
      </Button>
    </>
  );

  // La réactivation se défait d'un clic ; la suspension, non — elle masque
  // toutes les annonces du compte et la réactivation ne les ramène pas.
  // Seule celle-là pose une question.
  if (suspended) {
    return <form action={setUserSuspended}>{fields}</form>;
  }
  return (
    <ConfirmForm
      action={setUserSuspended}
      confirm={STR.admin.confirmSuspend(name)}
    >
      {fields}
    </ConfirmForm>
  );
}

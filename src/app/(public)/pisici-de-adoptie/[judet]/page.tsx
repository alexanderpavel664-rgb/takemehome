import type { Metadata } from "next";
import { JudetPage, judetMetadata, judetStaticParams } from "../../judet-page";

// Page statique révalidée toutes les dix minutes : voir judet-page.tsx.
export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return judetStaticParams("CAT");
}

export async function generateMetadata(
  props: PageProps<"/pisici-de-adoptie/[judet]">,
): Promise<Metadata> {
  const { judet } = await props.params;
  return judetMetadata("CAT", judet);
}

export default async function PisiciDeAdoptiePage(
  props: PageProps<"/pisici-de-adoptie/[judet]">,
) {
  const { judet } = await props.params;
  return <JudetPage type="CAT" slug={judet} />;
}

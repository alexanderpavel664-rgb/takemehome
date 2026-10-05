import type { Metadata } from "next";
import { JudetPage, judetMetadata, judetStaticParams } from "../../judet-page";

// Page statique révalidée toutes les dix minutes : voir judet-page.tsx.
export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return judetStaticParams("DOG");
}

export async function generateMetadata(
  props: PageProps<"/caini-de-adoptat/[judet]">,
): Promise<Metadata> {
  const { judet } = await props.params;
  return judetMetadata("DOG", judet);
}

export default async function CainiDeAdoptatPage(
  props: PageProps<"/caini-de-adoptat/[judet]">,
) {
  const { judet } = await props.params;
  return <JudetPage type="DOG" slug={judet} />;
}

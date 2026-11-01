import { MAX_PHOTOS } from "@/lib/animal-photo";
import { contactStatus } from "@/lib/contact-status";
import { prisma } from "@/lib/prisma";
import type { Viewer } from "@/lib/viewer";

/**
 * L'annonce du kit, pour qui a le droit de la voir : son propriétaire et les
 * comptes ADMIN (nos propres publications). null sinon, et une annonce d'un
 * autre compte est indistinguable d'une annonce absente. Mêmes conditions que
 * le bouton « Distribuie » de /cont : disponible, visible, joignable.
 */
export async function kitAnimal(viewer: Viewer, id: string) {
  if (viewer.suspended) {
    return null;
  }
  const animal = await prisma.animal.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      name: true,
      type: true,
      count: true,
      sex: true,
      ageGroup: true,
      ageText: true,
      city: true,
      county: true,
      description: true,
      status: true,
      hidden: true,
      user: {
        select: { phone: true, publicEmail: true, contactConsent: true },
      },
      photos: {
        orderBy: { position: "asc" },
        take: MAX_PHOTOS,
        select: { url: true },
      },
    },
  });
  if (
    !animal ||
    (animal.userId !== viewer.id && viewer.role !== "ADMIN") ||
    animal.status !== "AVAILABLE" ||
    animal.hidden ||
    !contactStatus(animal.user).contactable
  ) {
    return null;
  }
  return animal;
}

import { createUploadthing, type FileRouter } from "uploadthing/next";

import { auth } from "~/server/auth";

const f = createUploadthing();

export const ourFileRouter = {
  /**
   * Jedna slika — za mediaUrl polja (VisualClick, Puzzle, SpotDifference-A, itd.)
   * Zaštićeno: samo ADMIN smije uploadati.
   */
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Pristup odbijen — potrebna je ADMIN uloga.");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      // Vraćamo URL serveru; klijent ga dobiva u onClientUploadComplete
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

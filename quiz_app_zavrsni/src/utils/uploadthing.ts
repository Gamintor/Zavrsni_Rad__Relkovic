import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "~/app/api/uploadthing/core";

/**
 * Typed UploadButton — endpoint prop je ograničen na ključeve OurFileRouter.
 * Koristi se u client komponentama za upload slika.
 */
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

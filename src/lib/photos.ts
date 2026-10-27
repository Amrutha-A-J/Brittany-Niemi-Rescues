/** Photo keys in the R2 bucket: "<cat folder>/<uuid>.webp" (made by the cat form). */
export const PHOTO_KEY = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;

/** Largest photo the upload route accepts. The cat form shrinks photos well below this. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

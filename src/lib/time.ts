/** Current time. Server components render once per request, so reading the clock is fine there. */
export const nowMs = () => Date.now();

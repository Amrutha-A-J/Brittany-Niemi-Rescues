/** Set NEXT_PUBLIC_NOINDEX=1 on preview/demo deployments to keep them out of Google. */
export const noIndex = process.env.NEXT_PUBLIC_NOINDEX === "1";

import { isDemo } from "./demo/config";

/** Keep previews and the demo out of Google. Set NEXT_PUBLIC_NOINDEX=1 on any other preview deployment. */
export const noIndex = isDemo || process.env.NEXT_PUBLIC_NOINDEX === "1";

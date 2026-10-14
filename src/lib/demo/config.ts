/**
 * Demo mode: no backend. Data comes from demo/seed.json and every change is
 * kept in the visitor's own browser. Turn on with NEXT_PUBLIC_DEMO=1.
 */
export const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

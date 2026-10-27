import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Rescue admin", template: "%s | Rescue admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-wash">{children}</div>;
}

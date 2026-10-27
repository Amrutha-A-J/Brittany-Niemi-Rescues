import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <Link href="/" aria-label="Back to the website">
        <Logo size={44} />
      </Link>
      <div className="mt-6 w-full max-w-[400px] rounded-2xl border border-line bg-white p-7 sm:p-8">
        <h1 className="mb-6 font-serif text-[28px] leading-tight">{title}</h1>
        {children}
      </div>
      <Link href="/" className="mt-6 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
        ← Back to website
      </Link>
    </div>
  );
}

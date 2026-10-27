import { DemoPanel } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { logout } from "@/lib/admin/auth-actions";
import { requireStaff } from "@/lib/admin/session";
import { all } from "@/lib/db";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (isDemo) return <DemoPanel>{children}</DemoPanel>;
  const { user } = await requireStaff();

  const fresh = await all<{ type: string }>("select type from applications where status = 'new'");
  const newCounts = {
    adopt: fresh.filter((a) => a.type === "adopt").length,
    foster: fresh.filter((a) => a.type === "foster").length,
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col md:flex-row">
      <aside className="border-b border-line bg-white px-4 py-4 md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r md:px-5 md:py-8">
        <div className="mb-4 flex items-center justify-between md:mb-8 md:block">
          <Link href="/admin" aria-label="Dashboard">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <form action={logout}>
              <button className="text-sm text-muted hover:text-ink">Log out</button>
            </form>
          </div>
        </div>
        <nav aria-label="Admin">
          <AdminNav newCounts={newCounts} />
        </nav>
        <div className="mt-8 hidden space-y-2 border-t border-line pt-6 text-sm md:block">
          <Link href="/" target="_blank" className="block text-muted hover:text-ink">
            View website ↗
          </Link>
          <form action={logout}>
            <button className="text-muted hover:text-ink">Log out</button>
          </form>
          <ThemeToggle className="-ml-2.5" />
          <p className="truncate pt-2 text-xs text-faint">{user.email}</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

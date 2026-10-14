import { DemoPanel } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/site/Logo";
import { logout } from "@/lib/admin/auth-actions";
import { requireStaff } from "@/lib/admin/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (isDemo) return <DemoPanel>{children}</DemoPanel>;
  const { supabase, user, isStaff } = await requireStaff();

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-serif text-3xl">No access yet</h1>
        <p className="mt-3 text-sm text-muted">
          You&apos;re logged in as {user.email}, but this account hasn&apos;t been added as rescue staff. See step 3 in SETUP.md.
        </p>
        <form action={logout} className="mt-6">
          <button className="btn-outline">Log out</button>
        </form>
      </div>
    );
  }

  const { data: fresh } = await supabase.from("applications").select("type").eq("status", "new");
  const newCounts = {
    adopt: (fresh ?? []).filter((a) => a.type === "adopt").length,
    foster: (fresh ?? []).filter((a) => a.type === "foster").length,
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col md:flex-row">
      <aside className="border-b border-line bg-white px-4 py-4 md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r md:px-5 md:py-8">
        <div className="mb-4 flex items-center justify-between md:mb-8 md:block">
          <Link href="/admin" aria-label="Dashboard">
            <Logo size={28} />
          </Link>
          <form action={logout} className="md:hidden">
            <button className="text-sm text-muted hover:text-ink">Log out</button>
          </form>
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
          <p className="truncate pt-2 text-xs text-faint">{user.email}</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

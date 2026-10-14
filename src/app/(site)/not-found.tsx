import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-section mt-2">This page wandered off</h1>
      <p className="mt-3 text-muted">Like cats do. Let&apos;s get you back to the ones looking for a home.</p>
      <Link href="/adopt" className="btn-primary mt-8">
        See adoptable cats
      </Link>
    </section>
  );
}

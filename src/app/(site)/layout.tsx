import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { UnderConstruction } from "@/components/site/UnderConstruction";
import { underConstruction } from "@/lib/launch";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  if (underConstruction) return <UnderConstruction />;
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

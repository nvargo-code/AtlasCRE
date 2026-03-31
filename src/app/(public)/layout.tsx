import { PublicNav } from "@/components/public/PublicNav";
import { Footer } from "@/components/public/Footer";
import { ValuationCTA } from "@/components/public/ValuationCTA";
import { ScrollToTop } from "@/components/public/ScrollToTop";
import { ScrollReset } from "@/components/public/ScrollReset";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav />
      <main>{children}</main>
      <Footer />
      <ValuationCTA />
      <ScrollToTop />
      <ScrollReset />
    </>
  );
}

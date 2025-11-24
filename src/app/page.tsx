import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import { getPlatformStats } from "@/lib/api/stats";

export default async function HomePage() {
  // SSR: получаем данные на сервере
  const initialStats = await getPlatformStats();

  return (
    <main className="bg-black text-white">
      <HeroSection />
      <StatsSection initialStats={initialStats} />
    </main>
  );
}


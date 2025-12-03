'use client';

import { motion } from "framer-motion";
import { usePlatformStats, type PlatformStats } from "@/lib/query";

interface StatsSectionProps {
  initialStats?: PlatformStats;
}

export default function StatsSection({ initialStats }: StatsSectionProps) {
  const { data: stats, isPending } = usePlatformStats({
    initialData: initialStats,
    staleTime: 30000
  });

  return (
    <motion.div
      className="mx-auto mt-16 max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
        <p>Live platform telemetry via TanStack Query</p>
        <p>{isPending ? "загрузка..." : "обновлено из кэша"}</p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-2xl font-semibold text-white">
        <div>
          <p>{stats?.rooms ?? "—"}</p>
          <span className="text-xs font-normal text-white/60">rooms</span>
        </div>
        <div>
          <p>{stats?.latency ?? "—"}</p>
          <span className="text-xs font-normal text-white/60">latency</span>
        </div>
        <div>
          <p>{stats?.retention ?? "—"}</p>
          <span className="text-xs font-normal text-white/60">retention</span>
        </div>
      </div>
    </motion.div>
  );
}

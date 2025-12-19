'use client';

import { motion } from "framer-motion";
import { SiNextdotjs, SiRedux, SiTailwindcss } from "react-icons/si";
import { TbSeo } from "react-icons/tb";
import ThemeSwitch from "@/components/ui/ThemeSwitch";

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-20 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h1
          className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Launch anonymous communities in minutes
        </motion.h1>
        <motion.p
          className="mt-6 text-lg leading-8 text-gray-300"
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Next.js + TypeScript + Tailwind CSS with Redux state, TanStack Query
          data, Framer Motion micro-animations and next-seo defaults already wired.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ThemeSwitch />
          <a
            href="https://tanstack.com/query/latest"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold leading-6 text-white/80 hover:text-white"
          >
            Документация TanStack Query →
          </a>
        </motion.div>
      </div>
      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {[
          {
            icon: <SiNextdotjs className="h-6 w-6 text-white" />,
            title: "Next.js 14 + App Router",
            body: "Оптимизированные маршруты, Metadata API и edge-friendly конфигурация."
          },
          {
            icon: <SiTailwindcss className="h-6 w-6 text-sky-300" />,
            title: "Tailwind CSS",
            body: "Темная тема, кастомные токены и полностью кастомизируемый дизайн."
          },
          {
            icon: <SiRedux className="h-6 w-6 text-purple-300" />,
            title: "Redux Toolkit",
            body: "Глобальное состояние с примером переключения темы и типизированными хуками."
          },
          {
            icon: <TbSeo className="h-6 w-6 text-emerald-300" />,
            title: "SEO-ready",
            body: "next-seo + OpenGraph + Twitter карты и готовые robots/sitemap хуки."
          }
        ].map((card, index) => (
          <motion.article
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-center gap-3">
              {card.icon}
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            </div>
            <p className="mt-3 text-sm text-white/70">{card.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

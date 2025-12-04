'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  FiHome,
  FiMessageSquare,
  FiDollarSign,
  FiBarChart2,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/lib/redux";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu as HeadlessMenu, Transition } from "@headlessui/react";

export const AdminHeader = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t("admin.companies"), path: "/admin", icon: FiHome },
    { name: t("admin.messages"), path: "/admin/messages", icon: FiMessageSquare },
    { name: t("admin.plans"), path: "/admin/plans", icon: FiDollarSign },
    { name: t("admin.analytics"), path: "/admin/analytics", icon: FiBarChart2 },
    { name: t("admin.admins"), path: "/admin/admins", icon: FiUsers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <h1 className="text-lg sm:text-xl font-bold text-primary">FeedbackHub</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navigation.map((item, index) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.path as any}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Profile Avatar with Dropdown Menu */}
          <HeadlessMenu as="div" className="relative">
            {({ open }) => (
              <>
                <HeadlessMenu.Button
                  as="button"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm sm:text-base hover:bg-primary/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "A"}
                </HeadlessMenu.Button>

                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95 translate-y-2"
                  enterTo="transform opacity-100 scale-100 translate-y-0"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100 translate-y-0"
                  leaveTo="transform opacity-0 scale-95 translate-y-2"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white border-2 border-primary shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
                    <div className="p-1">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link
                            href={"/admin/settings" as any}
                            className={cn(
                              "w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <FiSettings className="h-4 w-4 flex-shrink-0" />
                            <span>{t("common.settings")}</span>
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              logout();
                              // Используем window.location для полного сброса состояния
                              setTimeout(() => {
                                window.location.href = "/";
                              }, 50);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <FiLogOut className="h-4 w-4 flex-shrink-0" />
                            <span>{t("common.logout")}</span>
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </>
            )}
          </HeadlessMenu>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-card"
          >
            <nav className="container px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path as any}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};


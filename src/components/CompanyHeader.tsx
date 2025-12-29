'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  FiArrowLeft,
  FiLayout,
  FiMessageSquare,
  FiAward,
  FiBarChart2,
  FiCreditCard,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/lib/redux";
import { useNextAuth } from "@/lib/hooks/useNextAuth";
import { useCompany } from "@/lib/query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu as HeadlessMenu, Transition } from "@headlessui/react";

export const CompanyHeader = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { signOut: nextAuthSignOut, isAuthenticated: isNextAuthAuthenticated } = useNextAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  
  // Полноэкранный режим обрабатывается глобально через FullscreenProvider
  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId && (user?.role === 'company' || user?.role === 'admin' || user?.role === 'super_admin'),
  });

  // Проверяем, был ли вход выполнен под админом
  useEffect(() => {
    // Показываем стрелку назад только если вход был выполнен как admin или super_admin
    setShowBackButton(user?.role === 'admin' || user?.role === 'super_admin');
  }, [user]);

  const navigation = [
    { name: t("company.dashboard"), path: "/company", icon: FiLayout },
    { name: t("company.messages"), path: "/company/messages", icon: FiMessageSquare },
    { name: t("company.growth"), path: "/company/growth", icon: FiAward },
    { name: t("company.reports"), path: "/company/reports", icon: FiBarChart2 },
    { name: t("company.billing"), path: "/company/billing", icon: FiCreditCard },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9"
              onClick={() => router.push("/admin")}
            >
              <FiArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Link
            href="/company"
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/feedBack.svg"
              alt="Anonymous Chat"
              width={32}
              height={32}
              priority
              className="h-8 w-8 sm:h-9 sm:w-9"
            />
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
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm sm:text-base hover:bg-primary/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
                >
                  {company?.logoUrl ? (
                    <Image
                      src={company.logoUrl}
                      alt={company.name || "Company logo"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    user?.name?.charAt(0) || "C"
                  )}
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
                            href={"/company/settings" as any}
                            className={cn(
                              "w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <FiSettings className="h-4 w-4 flex-shrink-0" />
                            <span>{t("company.settings")}</span>
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={async () => {
                              try {
                                // Сначала выходим из NextAuth (если был залогинен через OAuth)
                                if (isNextAuthAuthenticated) {
                                  await nextAuthSignOut();
                                }
                                
                                // Затем выходим из Redux (это также удалит токен)
                                logout();
                                
                                // Дополнительно очищаем все куки NextAuth
                                if (typeof window !== 'undefined') {
                                  // Удаляем все NextAuth куки
                                  const nextAuthCookies = [
                                    'next-auth.session-token',
                                    '__Secure-next-auth.session-token',
                                    'next-auth.csrf-token',
                                    '__Host-next-auth.csrf-token',
                                    'next-auth.callback-url',
                                    '__Secure-next-auth.callback-url',
                                  ];
                                  
                                  nextAuthCookies.forEach(cookieName => {
                                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                                  });
                                }
                                
                                // Используем window.location для полного сброса состояния
                                // Задержка, чтобы все успело очиститься
                                setTimeout(() => {
                                  window.location.href = "/";
                                }, 200);
                              } catch (error) {
                                console.error('Logout error:', error);
                                // В случае ошибки все равно делаем редирект
                                logout();
                                setTimeout(() => {
                                  window.location.href = "/";
                                }, 200);
                              }
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


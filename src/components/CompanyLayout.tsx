'use client';

import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FiLogOut } from "react-icons/fi";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/redux";
interface CompanyLayoutProps {
  children: ReactNode;
  title?: string;
}
export const CompanyLayout = ({ children, title }: CompanyLayoutProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const navigation = [
    { name: t("company.dashboard"), path: "/company" },
    { name: t("company.messages"), path: "/company/messages" },
    { name: t("company.growth"), path: "/company/growth" },
    { name: t("company.reports"), path: "/company/reports" },
    { name: t("company.billing"), path: "/company/billing" },
    { name: t("company.settings"), path: "/company/settings" },
  ];
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card hidden lg:block">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">FeedbackHub</h1>
        </div>
        <nav className="px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              href={item.path as any}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{title || t("company.dashboard")}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <FiLogOut className="h-4 w-4 mr-2" />
              {t("common.logout")}
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

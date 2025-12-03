'use client';

import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiLogOut } from "react-icons/fi";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/redux";
interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}
export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const navigation = [
    { name: t("admin.companies"), path: "/admin" },
    { name: t("admin.messageModeration"), path: "/admin/messages" },
    { name: t("admin.plansAndPrices"), path: "/admin/plans" },
    { name: t("admin.analytics"), path: "/admin/analytics" },
    { name: t("admin.admins"), path: "/admin/admins" },
  ];
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card hidden lg:block">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">FeedbackHub Admin</h1>
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
            <h2 className="text-lg font-semibold text-foreground">{title || t("admin.title")}</h2>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-primary border-primary">
                {t("admin.superAdmin")}
              </Badge>
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
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

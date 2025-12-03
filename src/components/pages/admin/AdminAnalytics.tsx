'use client';

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FiDownload, FiTrendingUp, FiUsers, FiMessageSquare, FiHome } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useCompanies, useMessages } from "@/lib/query";
const AdminAnalytics = () => {
  const { t } = useTranslation();
  const { data: companies = [] } = useCompanies();
  const { data: messages = [] } = useMessages();
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.status === t("admin.active")).length;
  const totalMessages = messages.length;
  const resolvedMessages = messages.filter((m) => m.status === t("checkStatus.resolved")).length;
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col min-h-screen">
        <div className="container flex items-center justify-between px-6 py-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground">{t("admin.analytics")}</h2>
          <Button>
            <FiDownload className="h-4 w-4 mr-2" />
            {t("admin.export")}
          </Button>
        </div>
        <main className="container flex-1 p-6 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t("admin.overview")}</TabsTrigger>
              <TabsTrigger value="companies">{t("admin.companies")}</TabsTrigger>
              <TabsTrigger value="messages">{t("admin.messages")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiHome className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">{t("admin.totalCompanies")}</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalCompanies}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCompanies} {t("admin.active")}
                  </p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiMessageSquare className="h-5 w-5 text-secondary" />
                    <p className="text-sm text-muted-foreground">{t("admin.totalMessages")}</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalMessages}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resolvedMessages} {t("checkStatus.resolved")}
                  </p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiTrendingUp className="h-5 w-5 text-accent" />
                    <p className="text-sm text-muted-foreground">{t("admin.monthlyGrowth")}</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">+12%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.newCompanies")}
                  </p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiUsers className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">{t("admin.users")}</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {companies.reduce((sum, c) => sum + c.employees, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.inAllCompanies")}
                  </p>
                </Card>
              </div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t("admin.planDistribution")}</h3>
                <div className="space-y-3">
                  {[t("common.free"), t("admin.planPro"), t("admin.planBusiness")].map((plan) => {
                    const count = companies.filter((c) => c.plan === plan).length;
                    const percent = totalCompanies > 0 ? Math.round((count / totalCompanies) * 100) : 0;
                    return (
                      <div key={plan} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{plan}</span>
                          <span className="font-semibold">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="companies" className="mt-6">
              <p className="text-muted-foreground">{t("admin.detailedCompanyStats")}</p>
            </TabsContent>
            <TabsContent value="messages" className="mt-6">
              <p className="text-muted-foreground">{t("admin.detailedMessageStats")}</p>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};
export default AdminAnalytics;

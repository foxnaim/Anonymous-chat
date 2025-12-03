'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FiBell,
  FiSearch,
  FiFilter,
  FiMoreHorizontal,
} from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useCompany, useCompanyStats, useMessages } from "@/lib/query";
import { motion } from "framer-motion";

const CompanyDashboard = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: company, isLoading: companyLoading } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { data: stats, isLoading: statsLoading } = useCompanyStats(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useMessages(company?.code, {
    enabled: !!company?.code,
  });

  const displayStats = [
    { label: t("company.newMessages"), value: stats?.new || 0, color: "bg-accent text-accent-foreground" }, /* #F64C72 */
    { label: t("company.inProgress"), value: stats?.inProgress || 0, color: "bg-secondary text-secondary-foreground" }, /* #553D67 */
    { label: t("company.resolved"), value: stats?.resolved || 0, color: "bg-success text-success-foreground" }, /* Green */
  ];

  const filteredMessages = messages
    .filter((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "complaint":
        return t("sendMessage.complaint");
      case "praise":
        return t("sendMessage.praise");
      case "suggestion":
        return t("sendMessage.suggestion");
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    // API возвращает статусы на русском, поэтому проверяем оба варианта
    if (status === "Новое" || status === t("checkStatus.new")) {
      return t("checkStatus.new");
    }
    if (status === "В работе" || status === t("checkStatus.inProgress")) {
      return t("checkStatus.inProgress");
    }
    if (status === "Решено" || status === t("checkStatus.resolved")) {
      return t("checkStatus.resolved");
    }
    if (status === "Отклонено" || status === t("checkStatus.rejected")) {
      return t("checkStatus.rejected");
    }
    if (status === "Спам" || status === t("checkStatus.spam")) {
      return t("checkStatus.spam");
    }
    return status;
  };

  const getStatusColor = (status: string) => {
    // API возвращает статусы на русском, поэтому проверяем оба варианта
    if (status === "Новое" || status === t("checkStatus.new")) {
      return "bg-accent text-accent-foreground";
    }
    if (status === "В работе" || status === t("checkStatus.inProgress")) {
      return "bg-secondary text-secondary-foreground";
    }
    if (status === "Решено" || status === t("checkStatus.resolved")) {
      return "bg-success text-success-foreground";
    }
    if (status === "Спам" || status === t("checkStatus.spam")) {
      return "bg-destructive text-destructive-foreground";
    }
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <CompanyHeader />

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-border bg-card">
          <div className="container flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                {companyLoading ? t("common.loading") : company?.name || t("welcome.companyName")}
              </h2>
              {company && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {company.plan} {t("company.plan")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost">
                <FiBell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="container flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          {statsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4 sm:p-6">
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</p>
                      <Badge className={`${stat.color} text-xs`}>{stat.label}</Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("company.messageDistribution")}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("sendMessage.complaint")}</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: "45%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("sendMessage.praise")}</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: "30%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("sendMessage.suggestion")}</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "25%" }}></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("company.teamMood")}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("company.overallMood")}</span>
                  <Badge className="bg-secondary text-secondary-foreground">{t("company.positive")}</Badge>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent via-secondary to-primary" style={{ width: "70%" }}></div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t("company.growthRating")}</span>
                    <span className="text-2xl font-bold text-primary">8.5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("company.cultureStrong")}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Messages Table */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-3 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold">{t("company.recentMessages")}</h3>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("company.searchMessages")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 text-sm sm:text-base"
                    autoComplete="off"
                  />
                </div>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <FiFilter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">{t("messages.type")}</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">{t("checkStatus.created")}</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">{t("checkStatus.status")}</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">{t("sendMessage.message")}</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {messagesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : filteredMessages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t("company.noMessages")}
                      </td>
                    </tr>
                  ) : (
                    filteredMessages.map((message) => (
                      <tr key={message.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-4">
                          <code className="text-sm font-mono text-primary">{message.id}</code>
                        </td>
                        <td className="py-4">
                          <Badge
                            variant="outline"
                            className={
                              message.type === "complaint"
                                ? "border-accent text-accent"
                                : message.type === "praise"
                                ? "border-secondary text-secondary"
                                : "border-primary text-primary"
                            }
                          >
                            {getTypeLabel(message.type)}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="py-4">
                          <Badge className={getStatusColor(message.status)}>
                            {getStatusLabel(message.status)}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {message.content}
                        </td>
                        <td className="py-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/company/messages" as any)}
                          >
                            <FiMoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {messagesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("common.loading")}
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("company.noMessages")}
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <Card key={message.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs font-mono text-primary break-all">{message.id}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => router.push("/company/messages" as any)}
                        >
                          <FiMoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            message.type === "complaint"
                              ? "border-accent text-accent"
                              : message.type === "praise"
                              ? "border-secondary text-secondary"
                              : "border-primary text-primary"
                          }`}
                        >
                          {getTypeLabel(message.type)}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                          {getStatusLabel(message.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{message.content}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;

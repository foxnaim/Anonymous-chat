'use client';

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { AdminHeader } from "@/components/AdminHeader";
import { useCompanies, useMessages } from "@/lib/query";
import { useSocketMessages } from "@/lib/websocket/useSocket";
import { 
  FiMessageSquare, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiThumbsUp,
  FiZap,
  FiHome,
  FiCalendar
} from "react-icons/fi";

type AnalyticsPeriod = "all" | "month";

const getFromDateForMonth = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const AdminAnalytics = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const fromDate = period === "month" ? getFromDateForMonth() : undefined;
  
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    undefined, 1, 500, undefined, 
    { fromDate, staleTime: 1000 * 15 }
  );
  
  // Подключаемся к WebSocket для real-time обновлений аналитики
  useSocketMessages();

  const analytics = useMemo(() => {
    if (!companies || !messages) {
      return {
        totalCompanies: 0,
        activeCompanies: 0,
        trialCompanies: 0,
        blockedCompanies: 0,
        totalMessages: 0,
        newMessages: 0,
        inProgressMessages: 0,
        resolvedMessages: 0,
        complaints: 0,
        praises: 0,
        suggestions: 0,
        trialPlan: 0,
        standardPlan: 0,
        proPlan: 0,
        topCompanies: [],
        resolutionRate: 0,
        avgMessagesPerCompany: 0,
      };
    }

    // Получаем переводы заранее
    const activeStatus = t("admin.active");
    const trialStatus = t("admin.trial");
    const blockedStatus = t("admin.blocked");
    const newStatus = t("checkStatus.new");
    const inProgressStatus = t("checkStatus.inProgress");
    const resolvedStatus = t("checkStatus.resolved");
    
    // Названия планов - учитываем все возможные варианты
    const trialPlanNames = ["Пробный", "Trial", "Сынақ"];
    const standardPlanNames = ["Стандарт", "Стандартный", "Standard"];
    const proPlanNames = ["Про", "Pro"];

    // Основные метрики
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((c) => c.status === activeStatus).length;
    const trialCompanies = companies.filter((c) => c.status === trialStatus).length;
    const blockedCompanies = companies.filter((c) => c.status === blockedStatus).length;
    
    const totalMessages = messages.length;
    const newMessages = messages.filter((m) => m.status === newStatus).length;
    const inProgressMessages = messages.filter((m) => m.status === inProgressStatus).length;
    const resolvedMessages = messages.filter((m) => m.status === resolvedStatus).length;
    
    // Распределение по типам
    const complaints = messages.filter((m) => m.type === "complaint").length;
    const praises = messages.filter((m) => m.type === "praise").length;
    const suggestions = messages.filter((m) => m.type === "suggestion").length;
    
    // Распределение по планам (учитываем все возможные варианты названий)
    const trialPlan = companies.filter((c) => 
      trialPlanNames.some(name => c.plan === name)
    ).length;
    const standardPlan = companies.filter((c) => 
      standardPlanNames.some(name => c.plan === name)
    ).length;
    const proPlan = companies.filter((c) => 
      proPlanNames.some(name => c.plan === name)
    ).length;
    
    // Топ компаний по сообщениям
    const topCompanies = companies
      .map((company) => ({
        ...company,
        messageCount: messages.filter((m) => m.companyCode === company.code).length,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 3);
    
    // Конверсия (решенные / всего)
    const resolutionRate = totalMessages > 0 
      ? Math.round((resolvedMessages / totalMessages) * 100) 
      : 0;
    
    // Среднее сообщений на компанию
    const avgMessagesPerCompany = totalCompanies > 0 
      ? Math.round(totalMessages / totalCompanies) 
      : 0;

    return {
      totalCompanies,
      activeCompanies,
      trialCompanies,
      blockedCompanies,
      totalMessages,
      newMessages,
      inProgressMessages,
      resolvedMessages,
      complaints,
      praises,
      suggestions,
      trialPlan,
      standardPlan,
      proPlan,
      topCompanies,
      resolutionRate,
      avgMessagesPerCompany,
    };
  }, [companies, messages, t]);

  const isLoading = companiesLoading || messagesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col min-h-screen">
        <div className="container px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              {t("admin.analytics")}
            </h2>
            <div className="flex gap-2 p-1 rounded-lg bg-muted/50 w-fit">
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FiCalendar className="h-4 w-4" />
                {t("admin.periodMonth")}
              </button>
              <button
                type="button"
                onClick={() => setPeriod("all")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("admin.periodAll")}
              </button>
            </div>
          </div>

          {/* Основные метрики */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiHome className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{t("admin.totalCompanies")}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {analytics.totalCompanies}
              </p>
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <span>{analytics.activeCompanies} {t("admin.active")}</span>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiMessageSquare className="h-5 w-5 text-secondary" />
                <p className="text-sm text-muted-foreground">{t("admin.resolvedRequests")}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {analytics.resolvedMessages}
              </p>
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <span>{analytics.totalMessages} {t("admin.totalReceived")}</span>
                <span>•</span>
                <span>{analytics.resolutionRate}% {t("admin.resolutionRate")}</span>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiTrendingUp className="h-5 w-5 text-accent" />
                <p className="text-sm text-muted-foreground">{t("admin.engagementIndex")}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {analytics.avgMessagesPerCompany}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("admin.messagesPerCompany")}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Статусы сообщений */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                {t("admin.messageStatuses")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">{t("checkStatus.new")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{analytics.newMessages}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${analytics.totalMessages > 0 ? (analytics.newMessages / analytics.totalMessages) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiClock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{t("checkStatus.inProgress")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{analytics.inProgressMessages}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${analytics.totalMessages > 0 ? (analytics.inProgressMessages / analytics.totalMessages) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-muted-foreground">{t("checkStatus.resolved")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{analytics.resolvedMessages}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{
                          width: `${analytics.totalMessages > 0 ? (analytics.resolvedMessages / analytics.totalMessages) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Типы сообщений */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                {t("admin.messageTypes")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">{t("messages.complaint")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{analytics.complaints}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${analytics.totalMessages > 0 ? (analytics.complaints / analytics.totalMessages) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiThumbsUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-muted-foreground">{t("messages.praise")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{analytics.praises}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{
                          width: `${analytics.totalMessages > 0 ? (analytics.praises / analytics.totalMessages) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiZap className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">{t("messages.suggestion")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{analytics.suggestions}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary"
                        style={{
                          width: `${analytics.totalMessages > 0 ? (analytics.suggestions / analytics.totalMessages) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Распределение по планам */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                {t("admin.planDistribution")}
              </h3>
              <div className="space-y-3">
                {[
                  { name: t("admin.planTrial"), count: analytics.trialPlan, color: "bg-muted-foreground" },
                  { name: t("admin.planStandard"), count: analytics.standardPlan, color: "bg-primary" },
                  { name: t("admin.planPro"), count: analytics.proPlan, color: "bg-secondary" },
                ].map((plan) => {
                  const percent = analytics.totalCompanies > 0 
                    ? Math.round((plan.count / analytics.totalCompanies) * 100) 
                    : 0;
                  return (
                    <div key={plan.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{plan.name}</span>
                        <span className="font-semibold">{plan.count} ({percent}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${plan.color}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Топ компаний */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                {t("admin.topCompanies")}
              </h3>
              <div className="space-y-3">
                {analytics.topCompanies.length > 0 ? (
                  analytics.topCompanies.map((company, index) => (
                    <div key={company.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{company.messageCount}</p>
                        <p className="text-xs text-muted-foreground">{t("admin.messages")}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("admin.noData")}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

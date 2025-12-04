'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMessageDistribution, useCompanyStats, useGrowthMetrics, useCompany } from "@/lib/query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiDownload } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { jsPDF } from "jspdf";
const CompanyReports = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  
  // Состояние для выбранного месяца и года
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString());
  const { data: distribution, isLoading: distributionLoading } = useMessageDistribution(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: stats, isLoading: statsLoading } = useCompanyStats(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  
  const { data: growthMetrics, isLoading: growthLoading } = useGrowthMetrics(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  
  const { data: company, isLoading: companyLoading } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  
  const isLoading = distributionLoading || statsLoading || growthLoading || companyLoading;
  const total = distribution
    ? distribution.complaints + distribution.praises + distribution.suggestions
    : 0;
  const complaintsPercent = total > 0 ? Math.round((distribution?.complaints || 0) / total * 100) : 0;
  const praisesPercent = total > 0 ? Math.round((distribution?.praises || 0) / total * 100) : 0;
  const suggestionsPercent = total > 0 ? Math.round((distribution?.suggestions || 0) / total * 100) : 0;
  const resolved = stats?.resolved || 0;
  const unresolved = (stats?.new || 0) + (stats?.inProgress || 0);
  const getSelectedMonthPeriod = () => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const date = new Date(year, month - 1, 1);
    
    // Используем текущий язык из i18n для форматирования месяца
    const currentLang = i18nInstance.language || "ru";
    const localeMap: Record<string, string> = {
      ru: "ru-RU",
      en: "en-US",
      kk: "kk-KZ",
    };
    const locale = localeMap[currentLang] || "ru-RU";
    const monthName = date.toLocaleDateString(locale, { month: "long" });
    // Делаем первую букву заглавной
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };
  // Генерация списка месяцев
  const getMonthOptions = () => {
    const currentLang = i18nInstance.language || "ru";
    const localeMap: Record<string, string> = {
      ru: "ru-RU",
      en: "en-US",
      kk: "kk-KZ",
    };
    const locale = localeMap[currentLang] || "ru-RU";
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const date = new Date(2024, i - 1, 1);
      const monthName = date.toLocaleDateString(locale, { month: "long" });
      months.push({
        value: i.toString(),
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      });
    }
    return months;
  };
  // Генерация списка лет (последние 5 лет + текущий + следующие 2 года)
  const getYearOptions = () => {
    const currentYear = now.getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push({
        value: i.toString(),
        label: i.toString(),
      });
    }
    return years;
  };
  const getMoodLabel = (mood: string) => {
    if (mood === "Позитивный" || mood === "Positive" || mood.toLowerCase().includes("positive")) {
      return t("company.positive");
    }
    if (mood === "Негативный" || mood === "Negative" || mood.toLowerCase().includes("negative")) {
      return t("company.negative");
    }
    return t("company.neutral");
  };
  const getTrendLabel = (trend: string) => {
    if (trend === "up") return t("company.growing");
    if (trend === "down") return t("company.declining");
    return t("company.stable");
  };
  const generatePDFReport = () => {
    if (!distribution || !stats || !growthMetrics || !company) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;
    // Заголовок
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(t("company.reports"), pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
    // Период
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${t("company.period")}: ${getSelectedMonthPeriod()}`, margin, yPos);
    // Название компании
    doc.text(`${t("company.companyName")}: ${company.name}`, margin, yPos);
    yPos += 15;
    // Сводка по типам сообщений
    doc.setFontSize(16);
    doc.text(t("company.messageDistribution"), margin, yPos);
    doc.text(`${t("sendMessage.complaint")}: ${distribution.complaints} (${complaintsPercent}%)`, margin, yPos);
    yPos += 7;
    doc.text(`${t("sendMessage.praise")}: ${distribution.praises} (${praisesPercent}%)`, margin, yPos);
    doc.text(`${t("sendMessage.suggestion")}: ${distribution.suggestions} (${suggestionsPercent}%)`, margin, yPos);
    doc.text(`${t("admin.totalMessages")}: ${total}`, margin, yPos);
    // Количество решенных/нерешенных кейсов
    doc.text(t("company.resolvedCases"), margin, yPos);
    doc.text(`${t("company.resolved")}: ${resolved}`, margin, yPos);
    doc.text(`${t("company.unresolved")}: ${unresolved}`, margin, yPos);
    const resolvedPercent = total > 0 ? Math.round((resolved / total) * 100) : 0;
    doc.text(`${t("company.resolutionRate")}: ${resolvedPercent}%`, margin, yPos);
    // Динамика настроения команды
    doc.text(t("company.teamMood"), margin, yPos);
    doc.text(`${t("company.growthRating")}: ${growthMetrics.rating}`, margin, yPos);
    doc.text(`${t("company.overallMood")}: ${getMoodLabel(growthMetrics.mood)}`, margin, yPos);
    doc.text(`${t("company.trend")}: ${getTrendLabel(growthMetrics.trend)}`, margin, yPos);
    // Дата генерации
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const currentLang = i18nInstance.language || "ru";
    const localeMap: Record<string, string> = {
      ru: "ru-RU",
      en: "en-US",
      kk: "kk-KZ",
    };
    const locale = localeMap[currentLang] || "ru-RU";
    const generatedDate = new Date().toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`${t("company.generatedAt")}: ${generatedDate}`, margin, yPos);
    // Сохранение файла
    const month = parseInt(selectedMonth).toString().padStart(2, "0");
    const year = selectedYear;
    const fileName = `report_${company.code}_${year}-${month}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <CompanyHeader />
      <div className="flex flex-col">
        <div className="border-b border-border bg-card">
          <div className="container px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t("company.reports")}</h2>
              <Button onClick={generatePDFReport} disabled={isLoading}>
                <FiDownload className="h-4 w-4 mr-2" />
                {t("company.downloadMonthlyReport")}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">{t("company.selectMonth")}:</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <label className="text-sm text-muted-foreground">{t("company.selectYear")}:</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>
        <main className="container flex-1 p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("admin.totalMessages")}</p>
                    <p className="text-3xl font-bold text-foreground">{total}</p>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("sendMessage.complaint")}</p>
                    <p className="text-3xl font-bold text-accent">{distribution?.complaints || 0}</p>
                    <p className="text-xs text-muted-foreground">{complaintsPercent}%</p>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("sendMessage.praise")}</p>
                    <p className="text-3xl font-bold text-secondary">{distribution?.praises || 0}</p>
                    <p className="text-xs text-muted-foreground">{praisesPercent}%</p>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("sendMessage.suggestion")}</p>
                    <p className="text-3xl font-bold text-primary">{distribution?.suggestions || 0}</p>
                    <p className="text-xs text-muted-foreground">{suggestionsPercent}%</p>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("company.messageDistribution")}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("sendMessage.complaint")}</span>
                        <span className="font-semibold">{complaintsPercent}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${complaintsPercent}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("sendMessage.praise")}</span>
                        <span className="font-semibold">{praisesPercent}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${praisesPercent}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("sendMessage.suggestion")}</span>
                        <span className="font-semibold">{suggestionsPercent}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${suggestionsPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("company.resolvedCases")}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("company.resolved")}</span>
                      <span className="text-2xl font-bold text-success">{resolved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("company.unresolved")}</span>
                      <span className="text-2xl font-bold text-accent">{unresolved}</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("company.resolutionRate")}</span>
                        <span className="text-lg font-semibold">
                          {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              {growthMetrics && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">{t("company.teamMood")}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("company.growthRating")}</span>
                        <span className="text-2xl font-bold">{growthMetrics.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("company.overallMood")}</span>
                        <span className="text-lg font-semibold">{getMoodLabel(growthMetrics.mood)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("company.trend")}</span>
                        <span className="text-lg font-semibold">{getTrendLabel(growthMetrics.trend)}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
        </main>
      </div>
    </div>
  );
};
export default CompanyReports;

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
import { FiDownload, FiMessageSquare, FiAlertCircle, FiAward, FiZap, FiBarChart2, FiCheckCircle, FiX, FiTrendingUp } from "react-icons/fi";
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
    const margin = 16;
    let yPos = margin;
    const lineGap = 7;
    const sectionGap = 12;
    const valueCol = pageWidth * 0.62;

    const sectionTitle = (title: string) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, yPos);
      yPos += lineGap;
    };

    const row = (label: string, value: string, gap: number = lineGap) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(label, margin, yPos);
      doc.text(value, valueCol, yPos);
      yPos += gap;
    };

    const divider = () => {
      doc.setDrawColor(210);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
      doc.setDrawColor(0);
    };

    // Заголовок
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t("company.reports"), pageWidth / 2, yPos, { align: "center" });
    yPos += sectionGap;

    // Шапка
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    row(`${t("company.period")}:`, getSelectedMonthPeriod());
    row(`${t("company.companyName")}:`, company.name, sectionGap);

    // Распределение сообщений
    sectionTitle(t("company.messageDistribution"));
    row(`${t("sendMessage.complaint")}:`, `${distribution.complaints} (${complaintsPercent}%)`);
    row(`${t("sendMessage.praise")}:`, `${distribution.praises} (${praisesPercent}%)`);
    row(`${t("sendMessage.suggestion")}:`, `${distribution.suggestions} (${suggestionsPercent}%)`);
    row(`${t("admin.totalMessages")}:`, `${total}`, sectionGap);
    divider();

    // Решенные / нерешенные
    const resolvedPercent = total > 0 ? Math.round((resolved / total) * 100) : 0;
    sectionTitle(t("company.resolvedCases"));
    row(`${t("company.resolved")}:`, `${resolved}`);
    row(`${t("company.unresolved")}:`, `${unresolved}`);
    row(`${t("company.resolutionRate")}:`, `${resolvedPercent}%`, sectionGap);
    divider();

    // Настроение команды
    sectionTitle(t("company.teamMood"));
    row(`${t("company.growthRating")}:`, `${growthMetrics.rating}`);
    row(`${t("company.overallMood")}:`, `${getMoodLabel(growthMetrics.mood)}`);
    row(`${t("company.trend")}:`, `${getTrendLabel(growthMetrics.trend)}`, sectionGap);
    divider();

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
    row(`${t("company.generatedAt")}:`, generatedDate, sectionGap);

    // Сохранение файла
    const month = parseInt(selectedMonth).toString().padStart(2, "0");
    const year = selectedYear;
    const fileName = `report_${company.code}_${year}-${month}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <CompanyHeader />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-border bg-card flex-shrink-0">
          <div className="container px-6 py-3">
            <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-2">
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
              <Button onClick={generatePDFReport} disabled={isLoading}>
                <FiDownload className="h-4 w-4 mr-2" />
                {t("company.downloadMonthlyReport")}
              </Button>
            </div>
          </div>
        </div>
        <main className="flex-1 px-6 py-6 overflow-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-border shadow-lg relative overflow-hidden h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                        <FiMessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t("admin.totalMessages")}</p>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>{total}</p>
                  </div>
                </Card>
                <Card className="p-6 border-border shadow-lg relative overflow-hidden h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20" style={{ backgroundColor: 'hsl(var(--accent))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent))' }}>
                        <FiAlertCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{t("sendMessage.complaint")}</p>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--accent))' }}>{distribution?.complaints || 0}</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--accent))' }}>{complaintsPercent}%</p>
                  </div>
                </Card>
                <Card className="p-6 border-border shadow-lg relative overflow-hidden h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--secondary) / 0.08), hsl(var(--secondary) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                        <FiAward className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{t("sendMessage.praise")}</p>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--secondary))' }}>{distribution?.praises || 0}</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--secondary))' }}>{praisesPercent}%</p>
                  </div>
                </Card>
                <Card className="p-6 border-border shadow-lg relative overflow-hidden h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                        <FiZap className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{t("sendMessage.suggestion")}</p>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>{distribution?.suggestions || 0}</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>{suggestionsPercent}%</p>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                <Card className="p-6 border-border shadow-lg bg-card flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <FiBarChart2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{t("company.messageDistribution")}</h3>
                  </div>
                  <div className="space-y-5 flex-1 flex flex-col justify-center">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">{t("sendMessage.complaint")}</span>
                        <span className="font-bold" style={{ color: 'hsl(var(--accent))' }}>{complaintsPercent}%</span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${complaintsPercent}%`, backgroundColor: 'hsl(var(--accent))' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">{t("sendMessage.praise")}</span>
                        <span className="font-bold" style={{ color: 'hsl(var(--secondary))' }}>{praisesPercent}%</span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${praisesPercent}%`, backgroundColor: 'hsl(var(--secondary))' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">{t("sendMessage.suggestion")}</span>
                        <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>{suggestionsPercent}%</span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${suggestionsPercent}%`, backgroundColor: 'hsl(var(--primary))' }}></div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-border shadow-lg bg-card flex flex-col h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--success) / 0.08), hsl(var(--success) / 0.03))' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckCircle className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{t("company.resolvedCases")}</h3>
                  </div>
                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--success) / 0.3)' }}>
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
                        <span className="text-sm font-medium text-muted-foreground">{t("company.resolved")}</span>
                      </div>
                      <span className="text-4xl font-bold" style={{ color: 'hsl(var(--success))' }}>{resolved}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--accent) / 0.3)' }}>
                      <div className="flex items-center gap-3">
                        <FiX className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
                        <span className="text-sm font-medium text-muted-foreground">{t("company.unresolved")}</span>
                      </div>
                      <span className="text-4xl font-bold" style={{ color: 'hsl(var(--accent))' }}>{unresolved}</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">{t("company.resolutionRate")}</span>
                        <span className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                          {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
                {growthMetrics && (
                  <Card className="p-6 border-border shadow-lg relative overflow-hidden bg-card flex flex-col h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--secondary) / 0.08), hsl(var(--secondary) / 0.03))' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 opacity-20" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <FiTrendingUp className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">{t("company.teamMood")}</h3>
                      </div>
                      <div className="space-y-6 flex-1 flex flex-col justify-center">
                        <div className="p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{t("company.growthRating")}</span>
                            <span className="text-3xl font-bold" style={{ color: 'hsl(var(--secondary))' }}>{growthMetrics.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                          <span className="text-sm font-medium text-muted-foreground">{t("company.overallMood")}</span>
                          <span className="text-lg font-bold" style={{ color: 'hsl(var(--secondary))' }}>{getMoodLabel(growthMetrics.mood)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                          <span className="text-sm font-medium text-muted-foreground">{t("company.trend")}</span>
                          <span className="text-lg font-bold" style={{ color: 'hsl(var(--success))' }}>{getTrendLabel(growthMetrics.trend)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default CompanyReports;

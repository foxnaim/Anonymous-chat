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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";

const CompanyReports = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const permissions = usePlanPermissions();
  
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

  const generatePdfReport = async () => {
    if (!permissions.canViewReports || !distribution || !stats || !growthMetrics || !company) return;

    const totalMessages = total;
    const resolvedPercent = totalMessages > 0 ? Math.round((resolved / totalMessages) * 100) : 0;
    const month = parseInt(selectedMonth).toString().padStart(2, "0");
    const year = selectedYear;

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

    const doc = new jsPDF();

    // Функция для загрузки шрифта
    const loadFont = async (url: string) => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to read font'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    try {
      // Загружаем Regular и Medium (для bold) шрифты
      const [fontRegular, fontBold] = await Promise.all([
        loadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'),
        loadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf')
      ]);

      // Добавляем шрифты в VFS
      doc.addFileToVFS('Roboto-Regular.ttf', fontRegular);
      doc.addFileToVFS('Roboto-Bold.ttf', fontBold);

      // Регистрируем шрифты
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

      doc.setFont('Roboto');
    } catch (error) {
      console.error('Error loading fonts:', error);
    }

    // Заголовок
    doc.setFontSize(20);
    // Явно указываем normal, чтобы не сработало bold по умолчанию, если вдруг
    doc.setFont('Roboto', 'normal'); 
    doc.text(t("company.reports") || "Отчёт", 105, 20, { align: "center" });

    // Основная информация
    doc.setFontSize(12);
    autoTable(doc, {
      startY: 30,
      head: [],
      body: [
        [t("company.period") || "Период", getSelectedMonthPeriod()],
        [t("company.companyName", "Компания"), company.name],
        [t("company.codeForEmployees") || "Код компании", company.code],
      ],
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 2, font: 'Roboto' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    // Распределение сообщений
    doc.setFontSize(14);
    doc.text(t("company.messageDistribution") || "Распределение сообщений", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[t("messages.type") || "Тип", t("messages.total") || "Количество", "%"]],
      body: [
        [t("sendMessage.complaint") || "Жалоба", String(distribution.complaints), `${complaintsPercent}%`],
        [t("sendMessage.praise") || "Похвала", String(distribution.praises), `${praisesPercent}%`],
        [t("sendMessage.suggestion") || "Предложение", String(distribution.suggestions), `${suggestionsPercent}%`],
        [t("admin.totalMessages") || "Всего", String(totalMessages), ""],
      ],
      theme: 'grid',
      headStyles: { fillColor: [47, 45, 162], textColor: 255, fontStyle: 'bold', font: 'Roboto' },
      bodyStyles: { fontSize: 11, font: 'Roboto' },
      footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], font: 'Roboto' },
      didParseCell: (data: any) => {
        if (data.row.index === data.table.body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // Статус кейсов
    doc.setFontSize(14);
    doc.text(t("company.resolvedCases") || "Статус кейсов", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[t("company.resolvedCases") || "Статус", t("messages.total") || "Количество"]],
      body: [
        [t("company.resolved") || "Решено", String(resolved)],
        [t("company.unresolved") || "Нерешено", String(unresolved)],
        [t("company.resolutionRate") || "Процент решения", `${resolvedPercent}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [47, 45, 162], textColor: 255, fontStyle: 'bold', font: 'Roboto' },
      bodyStyles: { fontSize: 11, font: 'Roboto' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right' } },
    });

    // Настроение команды
    doc.setFontSize(14);
    doc.text(t("company.teamMood") || "Настроение команды", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[t("company.teamMood") || "Параметр", t("messages.total") || "Значение"]],
      body: [
        [t("company.growthRating") || "Рейтинг роста", String(growthMetrics.rating)],
        [t("company.overallMood") || "Общий настрой", getMoodLabel(growthMetrics.mood)],
        [t("company.trend") || "Тренд", getTrendLabel(growthMetrics.trend)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [47, 45, 162], textColor: 255, fontStyle: 'bold', font: 'Roboto' },
      bodyStyles: { fontSize: 11, font: 'Roboto' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right' } },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`${t("company.generatedAt") || "Сформировано"}: ${generatedDate}`, 195, 285, { align: "right" });
    }

    const fileName = `Report_${company.name.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_')}_${year}-${month}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <div className={`min-h-screen bg-background flex flex-col overflow-x-hidden ${isFullscreen ? 'h-auto overflow-y-auto' : ''}`}>
      <CompanyHeader />
      <div className={`flex flex-col flex-1 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
        <div className="border-b border-border bg-card flex-shrink-0">
          <div className="container px-3 sm:px-4 md:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 sm:flex-initial">
                  <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{t("company.selectMonth")}:</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 sm:flex-initial">
                  <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{t("company.selectYear")}:</label>
                  <div className="relative w-full sm:w-[140px]">
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      step="1"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value || new Date().getFullYear().toString())}
                      className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <FiBarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              {permissions.canViewReports && (
                <div className="relative">
                  <Button
                    onClick={generatePdfReport}
                    disabled={isLoading}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full flex-shrink-0 self-start sm:self-auto"
                    aria-label={t("company.downloadMonthlyReport")}
                  >
                    <FiDownload className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <main className={`flex-1 px-4 sm:px-6 py-4 sm:py-6 w-full ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-auto'}`}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0">
                <Card className="p-4 sm:p-6 border-border shadow-lg bg-card flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <FiBarChart2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-xs sm:text-sm font-semibold">{t("company.messageDistribution")}</h3>
                  </div>
                  <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-center">
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-muted-foreground">{t("sendMessage.complaint")}</span>
                        <span className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--accent))' }}>{complaintsPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${complaintsPercent}%`, backgroundColor: 'hsl(var(--accent))' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-muted-foreground">{t("sendMessage.praise")}</span>
                        <span className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--secondary))' }}>{praisesPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${praisesPercent}%`, backgroundColor: 'hsl(var(--secondary))' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-muted-foreground">{t("sendMessage.suggestion")}</span>
                        <span className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>{suggestionsPercent}%</span>
                      </div>
                      <div className="h-2 sm:h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${suggestionsPercent}%`, backgroundColor: 'hsl(var(--primary))' }}></div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 sm:p-6 border-border shadow-lg bg-card flex flex-col h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--success) / 0.08), hsl(var(--success) / 0.03))' }}>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <FiCheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-xs sm:text-sm font-semibold">{t("company.resolvedCases")}</h3>
                  </div>
                  <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--success) / 0.3)' }}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: 'hsl(var(--success))' }} />
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t("company.resolved")}</span>
                      </div>
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold flex-shrink-0 ml-2" style={{ color: 'hsl(var(--success))' }}>{resolved}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--accent) / 0.3)' }}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiX className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t("company.unresolved")}</span>
                      </div>
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold flex-shrink-0 ml-2" style={{ color: 'hsl(var(--accent))' }}>{unresolved}</span>
                    </div>
                    <div className="pt-3 sm:pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("company.resolutionRate")}</span>
                        <span className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                          {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
                {growthMetrics && permissions.canViewTeamMood && (
                  <Card className="p-4 sm:p-6 border-border shadow-lg relative overflow-hidden bg-card flex flex-col h-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--secondary) / 0.08), hsl(var(--secondary) / 0.03))' }}>
                    <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 opacity-20" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <FiTrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                        <h3 className="text-xs sm:text-sm font-semibold">{t("company.teamMood")}</h3>
                      </div>
                      <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center">
                        <div className="p-3 sm:p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t("company.growthRating")}</span>
                            <span className="text-2xl sm:text-3xl font-bold flex-shrink-0" style={{ color: 'hsl(var(--secondary))' }}>{growthMetrics.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t("company.overallMood")}</span>
                          <span className="text-base sm:text-lg font-bold flex-shrink-0 ml-2" style={{ color: 'hsl(var(--secondary))' }}>{getMoodLabel(growthMetrics.mood)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-card rounded-lg border" style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t("company.trend")}</span>
                          <span className="text-base sm:text-lg font-bold flex-shrink-0 ml-2" style={{ color: 'hsl(var(--success))' }}>{getTrendLabel(growthMetrics.trend)}</span>
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

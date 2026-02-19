'use client';

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FiAward, FiStar, FiMessageSquare, FiCheckCircle, FiClock, FiHelpCircle } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useGrowthMetrics, useGroupedAchievements, useCompanyStats, useMessages, useCompany } from "@/lib/query";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";

const CompanyGrowth = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t } = useTranslation();
  const { user } = useAuth();
  const permissions = usePlanPermissions();
  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: metrics, isLoading: isLoadingMetrics } = useGrowthMetrics(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: groupedAchievements = [], isLoading: isLoadingAchievements } = useGroupedAchievements(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: stats, isLoading: isLoadingStats } = useCompanyStats(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: messagesResult, isLoading: isLoadingMessages } = useMessages(company?.code ?? null, 1, 500);
  const messages = messagesResult?.data ?? [];
  
  const isLoading = isLoadingMetrics || isLoadingAchievements || isLoadingStats || isLoadingMessages;

  // Вычисляем реальную статистику
  const totalMessages = metrics?.pointsBreakdown?.totalMessages || messages.length || 0;
  const resolvedCount = stats?.resolved || 0;
  const totalProblems = (stats?.new || 0) + (stats?.inProgress || 0) + (stats?.resolved || 0);
  const resolvedPercent = totalProblems > 0 ? Math.round((resolvedCount / totalProblems) * 100) : 0;
  
  // Вычисляем среднее время ответа
  const getAverageResponseTime = () => {
    const messagesWithResponse = messages.filter(m => m.companyResponse && m.updatedAt);
    if (messagesWithResponse.length === 0) return 0;
    
    let totalHours = 0;
    messagesWithResponse.forEach(msg => {
      const created = new Date(msg.createdAt);
      const updated = new Date(msg.updatedAt!);
      totalHours += (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
    });
    
    const avgHours = totalHours / messagesWithResponse.length;
    return Math.round(avgHours / 24 * 10) / 10; // В днях с 1 знаком после запятой
  };
  
  const avgResponseDays = getAverageResponseTime();
  
  // Сообщений за текущий месяц
  const currentMonthMessages = messages.filter(m => {
    const date = new Date(m.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const getRatingDescription = (rating: number) => {
    if (rating >= 8) {
      return t("company.cultureExcellent");
    } else if (rating >= 6) {
      return t("company.cultureStrong");
    } else if (rating >= 4) {
      return t("company.cultureDeveloping");
    } else if (rating >= 2) {
      return t("company.cultureNeedsAttention");
    } else {
      return t("company.cultureNeedsImprovement");
    }
  };
  return (
    <div className={`min-h-screen bg-background flex flex-col overflow-x-hidden w-full ${isFullscreen ? 'h-auto overflow-y-auto' : ''}`}>
      <CompanyHeader />
      <div className={`flex flex-col flex-1 w-full min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
        <main className={`flex-1 px-6 py-4 w-full flex flex-col min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full h-full min-h-0 justify-between">
              {/* Rating Card */}
              {permissions.canViewGrowth && (
                <Card className="p-4 border-border shadow-lg relative overflow-hidden w-full flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--secondary) / 0.05))' }}>
                  <div className="absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 opacity-10" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                            <FiStar className="h-5 w-5 text-white fill-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-foreground">{t("company.growthRating")}</h3>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-0.5"
                                    aria-label={t("company.growthRatingInfo")}
                                  >
                                    <FiHelpCircle className="h-4 w-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  side="bottom" 
                                  align="start"
                                  sideOffset={8}
                                  className="max-w-xs z-[100]"
                                >
                                  <p className="text-sm">{t("company.growthRatingTooltip")}</p>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getRatingDescription(metrics?.rating || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                            {metrics?.rating?.toFixed(1) || "0.0"}
                          </span>
                          <span className="text-xl font-semibold text-muted-foreground">/ 10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {/* Achievements */}
              {permissions.canViewGrowth && (
                <Card className="p-4 w-full flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <FiAward className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("company.achievements")}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 auto-rows-fr">
                  {groupedAchievements.length === 0 ? (
                    <div className="col-span-full">
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {t("company.noAchievements")}
                      </p>
                    </div>
                  ) : (
                    groupedAchievements.map((group) => {
                      // Находим текущее активное достижение (первое незавершенное или последнее завершенное)
                      const activeAchievement = group.achievements.find(a => !a.completed) || 
                                                group.achievements[group.achievements.length - 1];
                      
                      if (!activeAchievement) return null;

                      const categoryTitle = t(group.categoryTitleKey);
                      const level = activeAchievement.achievement.level || 1;
                      const target = activeAchievement.achievement.target;
                      
                      // Формируем описание с параметрами
                      let description = "";
                      
                      // Исправляем использование переводов
                      const titleKey = activeAchievement.achievement.titleKey;
                      
                      if (titleKey) {
                        // Используем правильный формат для i18next интерполяции
                        const translationParams: Record<string, any> = {};
                        if (titleKey.includes("level") || titleKey.includes("reviews") || titleKey.includes("resolved") || titleKey.includes("responseSpeed") || titleKey.includes("longevity")) {
                          translationParams.level = level;
                          translationParams.target = target;
                        } else {
                          translationParams.target = target;
                        }
                        
                        description = String(t(titleKey, translationParams));
                      }
                      
                      return (
                        <div key={group.category} className="p-4 border rounded-md bg-card hover:shadow-sm transition-shadow flex flex-col h-full">
                          <div className="flex items-start justify-between gap-3 flex-1">
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-base font-semibold text-foreground leading-tight">{categoryTitle}</h4>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-0.5"
                                      aria-label={t(`company.achievement.categoryTooltip.${group.category === "response_speed" ? "responseSpeed" : group.category}`)}
                                    >
                                      <FiHelpCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                    side="top" 
                                    align="start"
                                    sideOffset={8}
                                    className="max-w-xs z-[100]"
                                  >
                                    <p className="text-sm">{t(`company.achievement.categoryTooltip.${group.category === "response_speed" ? "responseSpeed" : group.category}`)}</p>
                                  </PopoverContent>
                                </Popover>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  Lv.{group.currentLevel}/{group.maxLevel}
                                </span>
                              </div>
                              {description && (
                                <p className="text-base text-muted-foreground leading-relaxed">
                                  {description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end justify-start gap-2">
                              {activeAchievement.completed ? (
                                <Badge className="bg-secondary text-secondary-foreground text-sm px-2 py-1 h-6 whitespace-nowrap">
                                  {t("company.completed")}
                                </Badge>
                              ) : (
                                <span className="text-base font-semibold text-foreground whitespace-nowrap">
                                  {activeAchievement.progress}%
                                </span>
                              )}
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {activeAchievement.current}/{target}
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto pt-4">
                            <Progress value={activeAchievement.progress} className="h-2" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                </Card>
              )}
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full flex-shrink-0">
                <Card className="p-6 border-border shadow-lg relative overflow-hidden w-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                        <FiMessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{t("company.totalReviews")}</p>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>{totalMessages}</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>+{currentMonthMessages} {t("company.perMonth")}</p>
                  </div>
                </Card>
                <Card className="p-6 border-border shadow-lg relative overflow-hidden w-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--success) / 0.08), hsl(var(--success) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: 'hsl(var(--success))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--success))' }}>
                        <FiCheckCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{t("company.resolvedProblems")}</p>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--success))' }}>{resolvedCount}</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--success))' }}>{resolvedPercent}% {t("company.resolved")}</p>
                  </div>
                </Card>
                <Card className="p-6 border-border shadow-lg relative overflow-hidden w-full" style={{ background: 'linear-gradient(to bottom right, hsl(var(--secondary) / 0.08), hsl(var(--secondary) / 0.03))' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                        <FiClock className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{t("company.averageResponse")}</p>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--secondary))' }}>{avgResponseDays || "—"}</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--secondary))' }}>{t("company.days")}</p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default CompanyGrowth;

'use client';

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FiAward, FiStar, FiMessageSquare, FiCheckCircle, FiClock, FiHelpCircle } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useGrowthMetrics, useGroupedAchievements } from "@/lib/query";

const CompanyGrowth = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: metrics, isLoading: isLoadingMetrics } = useGrowthMetrics(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: groupedAchievements = [], isLoading: isLoadingAchievements } = useGroupedAchievements(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  
  const isLoading = isLoadingMetrics || isLoadingAchievements;

  const getRatingDescription = (rating: number) => {
    if (rating >= 8) {
      return "Культура обратной связи в вашей компании отличная";
    } else if (rating >= 6) {
      return "Культура обратной связи в вашей компании сильна";
    } else if (rating >= 4) {
      return "Культура обратной связи в вашей компании развивается";
    } else if (rating >= 2) {
      return "Культура обратной связи в вашей компании требует внимания";
    } else {
      return "Культура обратной связи в вашей компании нуждается в улучшении";
    }
  };
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden w-full">
      <CompanyHeader />
      <div className="flex flex-col flex-1 overflow-hidden w-full min-h-0">
        <main className="flex-1 px-6 py-4 overflow-hidden w-full flex flex-col min-h-0">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full h-full min-h-0 justify-between">
              {/* Rating Card */}
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={t("company.growthRatingInfo")}
                                  >
                                    <FiHelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{t("company.growthRatingTooltip")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
              {/* Achievements */}
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
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>127</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>+12 {t("company.perMonth")}</p>
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
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--success))' }}>89</p>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--success))' }}>70% {t("company.resolved")}</p>
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
                    <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--secondary))' }}>2.5</p>
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

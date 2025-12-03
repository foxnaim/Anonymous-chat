'use client';

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiAward, FiTrendingUp, FiTrendingDown, FiMinus, FiStar } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useGrowthMetrics } from "@/lib/query";

const CompanyGrowth = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: metrics, isLoading } = useGrowthMetrics(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const achievements = [
    { id: 1, title: t("company.achievementFirst10"), progress: 100, completed: true },
    { id: 2, title: t("company.achievement50"), progress: 45, completed: false },
    { id: 3, title: t("company.achievement100"), progress: 12, completed: false },
    { id: 4, title: t("company.achievement50Resolved"), progress: 78, completed: false },
    { id: 5, title: t("company.achievementMonthNoComplaints"), progress: 0, completed: false },
  ];
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <FiTrendingUp className="h-5 w-5 text-secondary" />;
      case "down":
        return <FiTrendingDown className="h-5 w-5 text-accent" />;
      default:
        return <FiMinus className="h-5 w-5 text-muted-foreground" />;
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <CompanyHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              {/* Rating Card */}
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{t("company.growthRating")}</h3>
                    <p className="text-muted-foreground">{t("company.cultureStrong")}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <FiStar className="h-8 w-8 text-primary fill-primary" />
                      <span className="text-4xl font-bold text-foreground">{metrics?.rating || 0}</span>
                    </div>
                    <Badge className="bg-secondary text-secondary-foreground">
                      {metrics?.mood || t("company.neutral")}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {getTrendIcon(metrics?.trend || "stable")}
                  <span className="text-sm text-muted-foreground">
                    {metrics?.trend === "up" ? t("company.growing") : metrics?.trend === "down" ? t("company.declining") : t("company.stable")}
                  </span>
                </div>
              </Card>
              {/* Achievements */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FiAward className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">{t("company.achievements")}</h3>
                </div>
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{achievement.title}</span>
                        {achievement.completed ? (
                          <Badge className="bg-secondary text-secondary-foreground">{t("company.completed")}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">{achievement.progress}%</span>
                        )}
                      </div>
                      <Progress value={achievement.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </Card>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("company.totalReviews")}</p>
                    <p className="text-3xl font-bold text-foreground">127</p>
                    <p className="text-xs text-muted-foreground">+12 {t("company.perMonth")}</p>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("company.resolvedProblems")}</p>
                    <p className="text-3xl font-bold text-foreground">89</p>
                    <p className="text-xs text-muted-foreground">70% {t("company.resolved")}</p>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("company.averageResponse")}</p>
                    <p className="text-3xl font-bold text-foreground">2.5</p>
                    <p className="text-xs text-muted-foreground">{t("company.days")}</p>
                  </div>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
export default CompanyGrowth;

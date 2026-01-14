'use client';

import { useTranslation } from "react-i18next";
import { useCompany, usePlans, useFreePlanSettings, useUpdateCompanyPlan } from "@/lib/query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";

const CompanyBilling = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: company, isLoading: companyLoading, refetch: refetchCompany } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: freePlanSettings, isLoading: freePlanSettingsLoading } = useFreePlanSettings();
  
  const { mutate: updatePlan } = useUpdateCompanyPlan({
    onSuccess: () => {
      toast.success(t("company.switchingPlan"));
      refetchCompany();
    },
    onError: (error: any) => {
      toast.error(error?.message || t("company.planSwitchError"));
    },
  });
  
  // Получаем количество дней пробного периода из плана (который обновляется на бэкенде)
  // Если план еще не загружен, используем настройки как fallback
  const freePlan = plans.find((p) => p.id === 'free' || p.isFree);
  const freePeriodDays = freePlan?.freePeriodDays || freePlanSettings?.freePeriodDays || 60;
  
  const handleUpgrade = async (planId: string) => {
    if (!user?.companyId || !company) {
      toast.error(t("common.error"));
      return;
    }
    
    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) {
      toast.error(t("company.planNotFound"));
      return;
    }
    
    const planName = typeof selectedPlan.name === "string" 
      ? selectedPlan.name 
      : selectedPlan.name?.ru || selectedPlan.name?.en || selectedPlan.name?.kk || "";
    
    // Вычисляем дату окончания плана (если не пробный)
    let planEndDate: string | undefined;
    if (planName !== "Пробный" && planName !== "Free" && planName !== "Бесплатный") {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 месяц
      planEndDate = endDate.toISOString().split('T')[0];
    }
    
    updatePlan({
      id: user.companyId,
      plan: planName as any,
      planEndDate,
    });
  };
  if (companyLoading || plansLoading || freePlanSettingsLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }
  const currentPlan = plans.find((p) => {
    const planName = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
    return planName === company?.plan || (typeof p.name === "object" && (p.name.ru === company?.plan || p.name.en === company?.plan || p.name.kk === company?.plan));
  });
  return (
    <div className={`min-h-screen bg-background flex flex-col overflow-x-hidden w-full ${isFullscreen ? 'h-auto overflow-y-auto' : ''}`}>
      <CompanyHeader />
      <div className={`flex flex-col flex-1 w-full min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
        <main className={`flex-1 px-6 py-4 w-full flex flex-col min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-y-auto'}`}>
          <div className="flex flex-col gap-4 w-full min-h-0 pb-6">
            {/* Current Plan Info Banner */}
            {currentPlan && company && (
              <Card className="p-6 border-border shadow-lg relative overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-foreground">{t("company.yourTariff")}</h3>
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {company.status === t("admin.trial") ? t("company.trialPeriod") : getTranslatedValue(currentPlan.name)}
                        </Badge>
                      </div>
                      {company.trialEndDate && (() => {
                        const endDate = new Date(company.trialEndDate);
                        const now = new Date();
                        const diffTime = endDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return (
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-sm text-muted-foreground">{t("company.daysUntilTariffEnds")}:</p>
                            {diffDays > 0 ? (
                              <Badge className="bg-primary text-white text-base px-4 py-1.5 font-semibold">
                                {diffDays} {diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive text-white text-base px-4 py-1.5 font-semibold">
                                {t("admin.tariffExpired")}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({new Date(company.trialEndDate).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })})
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right sm:text-left sm:min-w-[120px]">
                      <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
                        {company.status === t("admin.trial") ? t("common.free") : currentPlan.price === 0 ? t("common.free") : `${currentPlan.price} ₸`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {company.status === t("admin.trial") 
                          ? `Пробный период (${freePeriodDays} ${freePeriodDays === 1 ? 'день' : freePeriodDays < 5 ? 'дня' : 'дней'})`
                          : t("admin.perMonth")}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {/* Available Plans */}
            <div className="flex-shrink-0 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
              {plans.map((plan) => {
                const planName = typeof plan.name === "string" ? plan.name : getTranslatedValue(plan.name);
                const isCurrent = planName === company?.plan || (typeof plan.name === "object" && (plan.name.ru === company?.plan || plan.name.en === company?.plan || plan.name.kk === company?.plan));
                const isFree = plan.price === 0;
                const isStandard = plan.id === "standard";
                const isPro = plan.id === "pro";
                
                // Определяем цвета для каждого тарифа
                let badgeColor = "bg-muted text-muted-foreground";
                let buttonVariant: "default" | "outline" | "secondary" = "default";
                
                if (isFree) {
                  badgeColor = "bg-muted text-muted-foreground";
                  buttonVariant = "outline";
                } else if (isStandard) {
                  badgeColor = "bg-primary/20 text-primary-foreground";
                  buttonVariant = "default";
                } else if (isPro) {
                  badgeColor = "bg-secondary/20 text-secondary-foreground";
                  buttonVariant = "default";
                }
                
                const gradientStyle = isFree 
                  ? { background: 'linear-gradient(to bottom right, hsl(var(--muted) / 0.08), hsl(var(--muted) / 0.03))' }
                  : isStandard
                    ? { background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }
                    : { background: 'linear-gradient(to bottom right, hsl(var(--secondary) / 0.08), hsl(var(--secondary) / 0.03))' };
                
                const circleColor = isFree 
                  ? 'hsl(var(--muted))'
                  : isStandard
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--secondary))';
                
                const textColor = isFree 
                  ? 'hsl(var(--foreground))'
                  : isStandard
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--secondary))';
                
                return (
                  <Card
                    key={plan.id}
                    className={`p-6 border-border shadow-lg relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] flex flex-col h-full ${
                      isCurrent ? 'ring-2 ring-primary' : ''
                    }`}
                    style={gradientStyle}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: circleColor }}></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-foreground">{getTranslatedValue(plan.name)}</h4>
                          {isFree && !isCurrent && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {t("common.free")}
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className={`${badgeColor} shadow-sm`}>
                              <FiCheck className="h-3 w-3 mr-1" />
                              {t("company.current")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        {isFree && plan.freePeriodDays ? (
                          <div className="flex flex-col">
                            <p className="text-3xl font-bold text-foreground mb-1">
                              {plan.freePeriodDays} {plan.freePeriodDays === 1 ? 'день' : plan.freePeriodDays < 5 ? 'дня' : 'дней'}
                            </p>
                            <p className="text-sm text-muted-foreground">пробного доступа</p>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <p className="text-3xl font-bold" style={{ color: textColor }}>
                              {plan.price} ₸
                            </p>
                            <span className="text-xs text-muted-foreground">/{t("admin.perMonth")}</span>
                          </div>
                        )}
                        {/* Дни до окончания тарифа - только для текущего тарифа */}
                        {isCurrent && company?.trialEndDate && (() => {
                          const endDate = new Date(company.trialEndDate);
                          const now = new Date();
                          const diffTime = endDate.getTime() - now.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t("admin.daysUntilExpiry")}:</span>
                                <span className={`font-semibold ${diffDays <= 0 ? "text-destructive" : "text-foreground"}`}>
                                  {diffDays > 0 
                                    ? `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}`
                                    : t("admin.tariffExpired")
                                  }
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <ul className="space-y-2.5 mb-6 flex-grow">
                        {plan.features.map((feature, idx) => {
                          const isFirstFeature = idx === 0 && isFree;
                          return (
                            <li key={idx} className={`flex items-start gap-3 ${isFirstFeature ? 'text-base font-semibold' : 'text-sm'} text-foreground`}>
                              <div className={`mt-0.5 flex-shrink-0 rounded-full ${isFirstFeature ? 'p-1.5' : 'p-1'}`} style={{ backgroundColor: `${circleColor}15` }}>
                                <FiCheck className={isFirstFeature ? "h-4 w-4" : "h-3.5 w-3.5"} style={{ color: circleColor }} />
                              </div>
                              <span className={`leading-relaxed ${isFirstFeature ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                {getTranslatedValue(feature)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <Button
                        className={`w-full mt-auto ${
                          isCurrent 
                            ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed" 
                            : ""
                        }`}
                        variant={isCurrent ? "outline" : buttonVariant}
                        disabled={isCurrent}
                        onClick={() => handleUpgrade(plan.id)}
                        style={!isCurrent && !isFree ? { backgroundColor: circleColor } : {}}
                      >
                        {isCurrent ? t("company.currentPlan") : t("company.selectPlan")}
                        {!isCurrent && <FiArrowRight className="h-4 w-4 ml-2" />}
                      </Button>
                    </div>
                  </Card>
                );
              })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default CompanyBilling;

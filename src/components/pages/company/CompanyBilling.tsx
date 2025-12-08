'use client';

import { useTranslation } from "react-i18next";
import { useCompany, usePlans } from "@/lib/query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
const CompanyBilling = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: company, isLoading: companyLoading } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  
  const handleUpgrade = async (planId: string) => {
    // В реальном приложении здесь будет API вызов
    toast.success(t("company.switchingPlan"));
  };
  if (companyLoading || plansLoading) {
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
  const messagesUsage = company
    ? Math.round((company.messagesThisMonth || 0) / (company.messagesLimit || 1) * 100)
    : 0;
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden w-full">
      <CompanyHeader />
      <div className="flex flex-col flex-1 overflow-hidden w-full min-h-0">
        <main className="flex-1 px-6 py-4 overflow-hidden w-full flex flex-col min-h-0">
          <div className="flex flex-col gap-4 w-full h-full min-h-0 overflow-y-auto">
            {/* Current Plan */}
            {currentPlan && company && (
              <Card className="p-6 border-border shadow-lg relative overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{t("company.currentPlan")}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                          {company.status === t("admin.trial") ? t("company.trialPeriod") : getTranslatedValue(currentPlan.name)}
                        </Badge>
                        {company.status === t("admin.trial") && company.trialEndDate && (
                          <Badge className="bg-primary text-white text-xs">
                            {t("company.trialEnds")} {new Date(company.trialEndDate).toLocaleDateString("ru-RU")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
                        {company.status === t("admin.trial") ? t("common.free") : currentPlan.price === 0 ? t("common.free") : `${currentPlan.price} ₸`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {company.status === t("admin.trial") ? t("company.trialPeriod2Months") : t("admin.perMonth")}
                      </p>
                    </div>
                  </div>
                  {company.status === t("admin.trial") && company.trialEndDate && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {t("company.trialPeriodActive")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("company.trialPeriodDescription", { date: new Date(company.trialEndDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        }) })}
                      </p>
                    </div>
                  )}
                  {company.status === t("admin.trial") ? (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        {t("company.trialPeriodAllFeatures")}
                      </p>
                      <div className="text-sm">
                        <div>
                          <span className="text-muted-foreground">{t("sendMessage.message")}: </span>
                          <span className="font-semibold">{t("company.unlimited")}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("admin.messagesThisMonth")}</span>
                        <span className="font-semibold">
                          {company?.messagesThisMonth || 0} / {company?.messagesLimit || 0}
                        </span>
                      </div>
                      <Progress value={messagesUsage} className="h-2" />
                    </div>
                  )}
                </div>
              </Card>
            )}
            {/* Available Plans */}
            <div className="flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">{t("company.availablePlans")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    className={`p-6 border-border shadow-lg relative overflow-hidden transition-all hover:shadow-xl ${
                      isCurrent ? 'ring-2 ring-primary' : ''
                    }`}
                    style={gradientStyle}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: circleColor }}></div>
                    <div className="relative z-10">
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
                      <div className="flex items-baseline gap-1 mb-4">
                        <p className="text-3xl font-bold" style={{ color: textColor }}>
                          {plan.price === 0 ? t("common.free") : `${plan.price} ₸`}
                        </p>
                        {plan.price > 0 && (
                          <span className="text-xs text-muted-foreground">/{t("admin.perMonth")}</span>
                        )}
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => {
                          const isFirstFeature = idx === 0 && isFree;
                          return (
                            <li key={idx} className={`flex items-start gap-2 ${isFirstFeature ? 'text-base font-semibold' : 'text-sm'} text-foreground`}>
                              <div className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 ${isFirstFeature ? 'p-1' : ''}`} style={{ backgroundColor: `${circleColor}20` }}>
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
                        className={`w-full ${
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

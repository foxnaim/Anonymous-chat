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
    <div className="min-h-screen bg-background">
      <CompanyHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Current Plan */}
          {currentPlan && company && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{t("company.currentPlan")}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg">
                      {company.status === t("admin.trial") ? t("company.trialPeriod") : getTranslatedValue(currentPlan.name)}
                    </Badge>
                    {company.status === t("admin.trial") && company.trialEndDate && (
                      <Badge className="bg-primary text-white">
                        {t("company.trialEnds")} {new Date(company.trialEndDate).toLocaleDateString("ru-RU")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">
                    {company.status === t("admin.trial") ? t("common.free") : currentPlan.price === 0 ? t("common.free") : `${currentPlan.price} ₸`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {company.status === t("admin.trial") ? t("company.trialPeriod2Months") : t("admin.perMonth")}
                  </p>
                </div>
              </div>
              {company.status === t("admin.trial") && company.trialEndDate && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t("company.trialPeriodActive")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("company.trialPeriodDescription", { date: new Date(company.trialEndDate).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    }) })}
                  </p>
                </div>
              )}
              {company.status === t("admin.trial") ? (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
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
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("admin.messagesThisMonth")}</span>
                    <span className="font-semibold">
                      {company?.messagesThisMonth || 0} / {company?.messagesLimit || 0}
                    </span>
                  </div>
                  <Progress value={messagesUsage} className="h-2" />
                </div>
              )}
            </Card>
          )}
          {/* Available Plans */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">{t("company.availablePlans")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {plans.map((plan) => {
                const planName = typeof plan.name === "string" ? plan.name : getTranslatedValue(plan.name);
                const isCurrent = planName === company?.plan || (typeof plan.name === "object" && (plan.name.ru === company?.plan || plan.name.en === company?.plan || plan.name.kk === company?.plan));
                const isFree = plan.price === 0;
                const isPro = plan.id === "pro";
                const isBusiness = plan.id === "business";
                
                // Определяем цвета для каждого тарифа
                let cardBorderColor = "border-border";
                let cardBgGradient = "";
                let badgeColor = "bg-muted text-muted-foreground";
                let buttonVariant: "default" | "outline" | "secondary" = "default";
                if (isFree) {
                  cardBorderColor = "border-muted";
                  badgeColor = "bg-muted text-muted-foreground";
                  buttonVariant = "outline";
                } else if (isPro) {
                  cardBorderColor = "border-primary";
                  cardBgGradient = "bg-gradient-to-br from-primary/5 to-primary/10";
                  badgeColor = "bg-primary text-primary-foreground";
                  buttonVariant = "default";
                } else if (isBusiness) {
                  cardBorderColor = "border-secondary";
                  cardBgGradient = "bg-gradient-to-br from-secondary/5 to-secondary/10";
                  badgeColor = "bg-secondary text-secondary-foreground";
                }
                return (
                  <Card
                    key={plan.id}
                    className={`p-6 relative overflow-hidden transition-all hover:shadow-lg ${
                      isCurrent 
                        ? `ring-2 ${isPro ? "ring-primary" : isBusiness ? "ring-secondary" : "ring-primary"} ${cardBgGradient}` 
                        : `${cardBorderColor} ${cardBgGradient}`
                    }`}
                  >
                    {isCurrent && (
                      <div className={`absolute top-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] ${
                        isPro ? "border-t-primary" : isBusiness ? "border-t-secondary" : "border-t-primary"
                      }`} />
                    )}
                    <div className="space-y-4 relative z-10">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xl font-bold text-foreground">{getTranslatedValue(plan.name)}</h4>
                          {isCurrent && (
                            <Badge className={`${badgeColor} shadow-sm`}>
                              <FiCheck className="h-3 w-3 mr-1" />
                              {t("company.current")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <p className={`text-3xl font-bold ${
                            isPro ? "text-primary" : isBusiness ? "text-secondary" : "text-foreground"
                          }`}>
                            {plan.price === 0 ? t("common.free") : `${plan.price} ₸`}
                          </p>
                          {plan.price > 0 && (
                            <span className="text-sm text-muted-foreground">/{t("admin.perMonth")}</span>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-foreground">
                            <div className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 ${
                              isPro ? "bg-primary/20" : isBusiness ? "bg-secondary/20" : "bg-muted"
                            }`}>
                              <FiCheck className={`h-3.5 w-3.5 ${
                                isPro ? "text-primary" : isBusiness ? "text-secondary" : "text-muted-foreground"
                              }`} />
                            </div>
                            <span className="leading-relaxed">{getTranslatedValue(feature)}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-6 ${
                          isCurrent 
                            ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed" 
                            : isPro 
                              ? "bg-primary hover:bg-primary/90" 
                              : isBusiness 
                                ? "bg-secondary hover:bg-secondary/90"
                                : ""
                        }`}
                        variant={isCurrent ? "outline" : buttonVariant}
                        disabled={isCurrent}
                        onClick={() => handleUpgrade(plan.id)}
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
        </main>
      </div>
    </div>
  );
};
export default CompanyBilling;

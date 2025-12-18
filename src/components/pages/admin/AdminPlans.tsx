'use client';

import { Fragment, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FiSettings, FiCheck } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { usePlans, plansService, queryKeys } from "@/lib/query";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
const AdminPlans = () => {
  const { t } = useTranslation();
  const [isFreePlanSettingsOpen, setIsFreePlanSettingsOpen] = useState(false);
  const [freePlanSettings, setFreePlanSettings] = useState<{
    messagesLimit: number | "";
    freePeriodDays: number | "";
  }>({
    messagesLimit: 10,
    freePeriodDays: 60,
  });

  const { data: plans = [], isLoading, refetch } = usePlans();
  const queryClient = useQueryClient();

  // Загружаем настройки бесплатного плана при монтировании
  useEffect(() => {
    plansService.getFreePlanSettings().then((data) => {
      setFreePlanSettings({
        messagesLimit: data.messagesLimit ?? 10,
        freePeriodDays: data.freePeriodDays ?? 60,
      });
    });
  }, []);

  const { mutate: updateFreePlan } = useMutation({
    mutationFn: plansService.updateFreePlanSettings,
    onSuccess: () => {
      toast.success(t("admin.freePlanSettingsUpdated"));
      setIsFreePlanSettingsOpen(false);
      // Инвалидируем кэш планов и настроек бесплатного плана
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      queryClient.invalidateQueries({ queryKey: queryKeys.freePlanSettings });
      refetch();
    },
    onError: () => {
      toast.error(t("admin.settingsUpdateError"));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">{t("admin.plansAndPrices")}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Первые {freePlanSettings.freePeriodDays} {freePlanSettings.freePeriodDays === 1 ? 'день' : freePlanSettings.freePeriodDays < 5 ? 'дня' : 'дней'} после регистрации - полный доступ без ограничений
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsFreePlanSettingsOpen(true)} size="sm" className="w-full sm:w-auto">
              <FiSettings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t("admin.freePlanSettings")}</span>
              <span className="sm:hidden">{t("company.settings")}</span>
            </Button>
          </div>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {plans.map((plan) => {
                const isFree = plan.price === 0;
                const isStandard = plan.id === "standard";
                
                // Определяем цвета для каждого тарифа (как в CompanyBilling)
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
                    className={`p-6 border-border shadow-lg relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02]`}
                    style={gradientStyle}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10" style={{ backgroundColor: circleColor }}></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-foreground">{getTranslatedValue(plan.name)}</h4>
                          {isFree && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {t("common.free")}
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
                      </div>
                      <ul className="space-y-2.5 mb-6">
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
      {/* Free Plan Settings Dialog */}
      <Transition show={isFreePlanSettingsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsFreePlanSettingsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all p-6">
                  <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
                    {t("admin.freePlanSettings")}
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("admin.messagesLimit")}</Label>
                      <Input
                        type="number"
                        value={freePlanSettings.messagesLimit}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFreePlanSettings({
                            ...freePlanSettings,
                            messagesLimit: value === "" ? "" : Number(value),
                          });
                        }}
                        placeholder="10"
                        min="1"
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("admin.messagesLimitDescription")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.freePeriodDays")}</Label>
                      <Input
                        type="number"
                        value={freePlanSettings.freePeriodDays}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFreePlanSettings({
                            ...freePlanSettings,
                            freePeriodDays: value === "" ? "" : Number(value),
                          });
                        }}
                        placeholder={t("admin.unlimitedTimePlaceholder")}
                        min="0"
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("admin.unlimitedTimeDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsFreePlanSettingsOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        const messagesLimit =
                          freePlanSettings.messagesLimit === "" || Number.isNaN(Number(freePlanSettings.messagesLimit))
                            ? 1
                            : Math.max(1, Number(freePlanSettings.messagesLimit));
                        const freePeriodDays =
                          freePlanSettings.freePeriodDays === "" || Number.isNaN(Number(freePlanSettings.freePeriodDays))
                            ? 0
                            : Math.max(0, Number(freePlanSettings.freePeriodDays));

                        updateFreePlan({
                          messagesLimit,
                          storageLimit: 1,
                          freePeriodDays,
                        });
                      }}
                    >
                      {t("common.save")}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
export default AdminPlans;

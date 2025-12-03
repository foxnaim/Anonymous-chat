'use client';

import { Fragment, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FiPlus, FiEdit, FiTrash2, FiSettings } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { usePlans, plansService } from "@/lib/query";
import type { TranslatedString } from "@/types";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
const AdminPlans = () => {
  const { t } = useTranslation();
  // Список всех доступных функций для планов
  const AVAILABLE_FEATURES = [
    { id: "messages", label: t("admin.messagesFeature"), description: t("admin.messagesFeatureDesc") },
    { id: "storage", label: t("admin.storageFeature"), description: t("admin.storageFeatureDesc") },
    { id: "basic_analytics", label: t("admin.basicAnalytics"), description: t("admin.basicAnalyticsDesc") },
    { id: "advanced_analytics", label: t("admin.advancedAnalytics"), description: t("admin.advancedAnalyticsDesc") },
    { id: "full_analytics", label: t("admin.fullAnalytics"), description: t("admin.fullAnalyticsDesc") },
    { id: "priority_support", label: t("admin.prioritySupport"), description: t("admin.prioritySupportDesc") },
    { id: "support_24_7", label: t("admin.support247"), description: t("admin.support247Desc") },
    { id: "api_access", label: t("admin.apiAccess"), description: t("admin.apiAccessDesc") },
  ];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFreePlanSettingsOpen, setIsFreePlanSettingsOpen] = useState(false);
  const [freePlanSettings, setFreePlanSettings] = useState({
    messagesLimit: 10,
    storageLimit: 1,
    freePeriodDays: 0,
  });
  // Состояние для создания нового плана
  const [newPlan, setNewPlan] = useState({
    name: { ru: "", en: "", kk: "" },
    price: 0,
    messagesLimit: 0,
    storageLimit: 0,
    selectedFeatures: [] as string[],
    customFeatures: [] as { ru: string; en: string; kk: string }[],
  });

  const { data: plans = [], isLoading, refetch } = usePlans();

  // Загружаем настройки бесплатного плана при монтировании
  useEffect(() => {
    plansService.getFreePlanSettings().then((data) => {
      setFreePlanSettings(data);
    });
  }, []);

  const { mutate: updateFreePlan } = useMutation({
    mutationFn: plansService.updateFreePlanSettings,
    onSuccess: () => {
      toast.success(t("admin.freePlanSettingsUpdated"));
      setIsFreePlanSettingsOpen(false);
      refetch();
    },
    onError: () => {
      toast.error(t("admin.settingsUpdateError"));
    },
  });

  const { mutate: createPlan } = useMutation({
    mutationFn: plansService.create,
    onSuccess: () => {
      const planName = getTranslatedValue(newPlan.name);
      toast.success(t("admin.planCreated", { name: planName }));
      setIsDialogOpen(false);
      setNewPlan({
        name: { ru: "", en: "", kk: "" },
        price: 0,
        messagesLimit: 0,
        storageLimit: 0,
        selectedFeatures: [],
        customFeatures: [],
      });
      refetch();
    },
    onError: () => {
      toast.error(t("admin.planCreateError"));
    },
  });
  const handleDelete = async (planId: string) => {
    // В реальном приложении здесь будет API вызов
    toast.success(t("admin.planDeleted"));
    refetch();
  };
  const handleCreatePlan = () => {
    if (!newPlan.name.ru.trim() && !newPlan.name.en.trim() && !newPlan.name.kk.trim()) {
      toast.error(t("admin.enterPlanName"));
      return;
    }
    if (newPlan.selectedFeatures.length === 0 && newPlan.customFeatures.length === 0) {
      toast.error(t("admin.selectAtLeastOneFeature"));
      return;
    }
    // Генерируем features на основе выбранных функций с переводами
    const features: Array<TranslatedString> = [];
    
    if (newPlan.selectedFeatures.includes("messages")) {
      const limit = newPlan.messagesLimit || 0;
      if (limit === 0) {
        features.push({
          ru: t("admin.unlimitedMessages"),
          en: "Unlimited messages",
          kk: "Шектеусіз хабарламалар",
        });
      } else {
        features.push({
          ru: t("admin.messagesLimitPerMonth", { limit }),
          en: `Up to ${limit} messages per month`,
          kk: `Айына ${limit} хабарламаға дейін`,
        });
      }
    }
    if (newPlan.selectedFeatures.includes("storage")) {
      const limit = newPlan.storageLimit || 0;
      if (limit === 0) {
        features.push({
          ru: t("admin.unlimitedStorage"),
          en: "Unlimited storage",
          kk: "Шектеусіз қойма",
        });
      } else {
        features.push({
          ru: t("admin.storageGB", { limit }),
          en: `${limit} GB storage`,
          kk: `${limit} GB қойма`,
        });
      }
    }
    if (newPlan.selectedFeatures.includes("basic_analytics")) {
      features.push({
        ru: t("admin.basicAnalytics"),
        en: "Basic Analytics",
        kk: "Негізгі аналитика",
      });
    }
    if (newPlan.selectedFeatures.includes("advanced_analytics")) {
      features.push({
        ru: t("admin.advancedAnalytics"),
        en: "Advanced Analytics",
        kk: "Кеңейтілген аналитика",
      });
    }
    if (newPlan.selectedFeatures.includes("full_analytics")) {
      features.push({
        ru: t("admin.fullAnalytics"),
        en: "Full Analytics",
        kk: "Толық аналитика",
      });
    }
    if (newPlan.selectedFeatures.includes("priority_support")) {
      features.push({
        ru: t("admin.prioritySupport"),
        en: "Priority Support",
        kk: "Басымдықты қолдау",
      });
    }
    if (newPlan.selectedFeatures.includes("support_24_7")) {
      features.push({
        ru: t("admin.support247"),
        en: "24/7 Support",
        kk: "24/7 қолдау",
      });
    }
    if (newPlan.selectedFeatures.includes("api_access")) {
      features.push({
        ru: t("admin.apiAccess"),
        en: "API Access",
        kk: "API қол жетімділігі",
      });
    }
    // Добавляем кастомные функции
    newPlan.customFeatures.forEach((feature) => {
      if (feature.ru.trim() || feature.en.trim() || feature.kk.trim()) {
        features.push(feature);
      }
    });
    // Определяем лимиты (0 = без ограничений)
    const messagesLimit = newPlan.selectedFeatures.includes("messages") ? (newPlan.messagesLimit || 0) : 0;
    const storageLimit = newPlan.selectedFeatures.includes("storage") ? (newPlan.storageLimit || 0) : 0;
    createPlan({
      name: newPlan.name,
      price: newPlan.price,
      messagesLimit,
      storageLimit,
      features,
    });
  };

  const toggleFeature = (featureId: string) => {
    setNewPlan((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter((id) => id !== featureId)
        : [...prev.selectedFeatures, featureId],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">{t("admin.plansAndPrices")}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("admin.first2MonthsFullAccess")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setIsFreePlanSettingsOpen(true)} size="sm" className="w-full sm:w-auto">
                <FiSettings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("admin.freePlanSettings")}</span>
                <span className="sm:hidden">{t("company.settings")}</span>
              </Button>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                <FiPlus className="h-4 w-4 mr-2" />
                {t("admin.createPlan")}
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-foreground">{getTranslatedValue(plan.name)}</h3>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <FiEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                          <FiTrash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {plan.price === 0 ? t("common.free") : `${plan.price} ₸`}
                      </p>
                      <p className="text-sm text-muted-foreground">{t("admin.perMonth")}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {t("admin.messagesLimit")}: {plan.messagesLimit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.storage")}: {plan.storageLimit} GB
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-foreground">• {getTranslatedValue(feature)}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
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
                  <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">{t("admin.important")}:</p>
                    <p>{t("admin.trialPeriodEndDescription")}</p>
                    <p className="mt-2">{t("admin.freePlanLimitsDescription")}</p>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("admin.messagesLimit")}</Label>
                      <Input
                        type="number"
                        value={freePlanSettings.messagesLimit}
                        onChange={(e) =>
                          setFreePlanSettings({
                            ...freePlanSettings,
                            messagesLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.storageLimit")}</Label>
                      <Input
                        type="number"
                        value={freePlanSettings.storageLimit}
                        onChange={(e) =>
                          setFreePlanSettings({
                            ...freePlanSettings,
                            storageLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.freePeriodDays")}</Label>
                      <Input
                        type="number"
                        value={freePlanSettings.freePeriodDays}
                        onChange={(e) =>
                          setFreePlanSettings({
                            ...freePlanSettings,
                            freePeriodDays: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder={t("admin.unlimitedTimePlaceholder")}
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
                      onClick={() => updateFreePlan(freePlanSettings)}
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
      {/* Create Plan Dialog */}
      <Transition show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsDialogOpen}>
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all p-6 max-h-[90vh] overflow-y-auto">
                  <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
                    {t("admin.createPlan")}
                  </Dialog.Title>
                  <div className="space-y-6">
                    {/* Основная информация */}
                      <div className="space-y-4">
                        <Label>{t("admin.planName")} *</Label>
                        <div className="space-y-2">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Русский</Label>
                            <Input
                              placeholder={t("admin.planNameExample")}
                              value={newPlan.name.ru}
                              onChange={(e) => setNewPlan({ ...newPlan, name: { ...newPlan.name, ru: e.target.value } })}
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">English</Label>
                            <Input
                              placeholder="e.g., Premium"
                              value={newPlan.name.en}
                              onChange={(e) => setNewPlan({ ...newPlan, name: { ...newPlan.name, en: e.target.value } })}
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Қазақша</Label>
                            <Input
                              placeholder="мысалы, Премиум"
                              value={newPlan.name.kk}
                              onChange={(e) => setNewPlan({ ...newPlan, name: { ...newPlan.name, kk: e.target.value } })}
                              autoComplete="off"
                            />
                          </div>
                        </div>
                      
                        <div className="space-y-2">
                          <Label>{t("admin.price")} *</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newPlan.price}
                            onChange={(e) => setNewPlan({ ...newPlan, price: parseInt(e.target.value) || 0 })}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    {/* Лимиты (только если выбраны соответствующие функции) */}
                    {(newPlan.selectedFeatures.includes("messages") || newPlan.selectedFeatures.includes("storage")) && (
                      <>
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-foreground">{t("admin.limits")}</h4>
                          
                          {newPlan.selectedFeatures.includes("messages") && (
                            <div className="space-y-2">
                              <Label>{t("admin.messagesLimit")}</Label>
                              <Input
                                type="number"
                                placeholder={t("admin.unlimitedPlaceholder")}
                                min="0"
                                value={newPlan.messagesLimit || ""}
                                onChange={(e) => setNewPlan({ ...newPlan, messagesLimit: parseInt(e.target.value) || 0 })}
                                autoComplete="off"
                              />
                              <p className="text-xs text-muted-foreground">
                                {t("admin.unlimitedMessagesHint")}
                              </p>
                            </div>
                          )}
                          {newPlan.selectedFeatures.includes("storage") && (
                            <div className="space-y-2">
                              <Label>{t("admin.storageLimit")}</Label>
                              <Input
                                type="number"
                                value={newPlan.storageLimit || ""}
                                onChange={(e) => setNewPlan({ ...newPlan, storageLimit: parseInt(e.target.value) || 0 })}
                                autoComplete="off"
                              />
                              <p className="text-xs text-muted-foreground">
                                {t("admin.unlimitedStorageHint")}
                              </p>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </>
                    )}
                    {/* Выбор функций */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">{t("admin.availableFeatures")} *</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        {t("admin.selectFeaturesDescription")}
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-lg p-4">
                        {AVAILABLE_FEATURES.map((feature) => (
                          <div
                            key={feature.id}
                            className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={feature.id}
                              checked={newPlan.selectedFeatures.includes(feature.id)}
                              onCheckedChange={() => toggleFeature(feature.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={feature.id}
                                className="text-sm font-medium text-foreground cursor-pointer block"
                              >
                                {feature.label}
                              </label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Кастомные функции */}
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">{t("admin.customFeatures")}</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewPlan({
                                ...newPlan,
                                customFeatures: [...newPlan.customFeatures, { ru: "", en: "", kk: "" }],
                              });
                            }}
                          >
                            <FiPlus className="h-4 w-4 mr-1" />
                            {t("common.add")}
                          </Button>
                        </div>
                        <div className="space-y-3 mt-3">
                          {newPlan.customFeatures.map((feature, idx) => (
                          <div key={idx} className="space-y-2 p-3 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs text-muted-foreground">{t("admin.customFeature")} {idx + 1}</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNewPlan({
                                    ...newPlan,
                                    customFeatures: newPlan.customFeatures.filter((_, i) => i !== idx),
                                  });
                                }}
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              placeholder="Русский"
                              value={feature.ru}
                              onChange={(e) => {
                                const updated = [...newPlan.customFeatures];
                                updated[idx] = { ...updated[idx], ru: e.target.value };
                                setNewPlan({ ...newPlan, customFeatures: updated });
                              }}
                              autoComplete="off"
                            />
                            <Input
                              placeholder="English"
                              value={feature.en}
                              onChange={(e) => {
                                const updated = [...newPlan.customFeatures];
                                updated[idx] = { ...updated[idx], en: e.target.value };
                                setNewPlan({ ...newPlan, customFeatures: updated });
                              }}
                              autoComplete="off"
                            />
                            <Input
                              placeholder="Қазақша"
                              value={feature.kk}
                              onChange={(e) => {
                                const updated = [...newPlan.customFeatures];
                                updated[idx] = { ...updated[idx], kk: e.target.value };
                                setNewPlan({ ...newPlan, customFeatures: updated });
                              }}
                              autoComplete="off"
                            />
                          </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Предпросмотр */}
                    {(newPlan.selectedFeatures.length > 0 || newPlan.customFeatures.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">{t("admin.preview")}</h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{getTranslatedValue(newPlan.name) || t("admin.planName")}</span>
                            <span className="text-sm font-bold text-foreground">
                              {newPlan.price === 0 ? t("common.free") : `${newPlan.price} ₸/${t("admin.perMonth")}`}
                            </span>
                          </div>
                          <ul className="space-y-1 mt-3">
                              {newPlan.selectedFeatures.includes("messages") && (
                                <li className="text-xs text-foreground">
                                  • {t("admin.upTo")} {newPlan.messagesLimit || t("company.unlimited")} {t("admin.messagesPerMonth")}
                                </li>
                              )}
                              {newPlan.selectedFeatures.includes("storage") && (
                                <li className="text-xs text-foreground">
                                  • {newPlan.storageLimit || t("company.unlimited")} GB {t("admin.storage")}
                                </li>
                              )}
                              {newPlan.selectedFeatures.includes("basic_analytics") && (
                                <li className="text-xs text-foreground">• {t("admin.basicAnalytics")}</li>
                              )}
                              {newPlan.selectedFeatures.includes("advanced_analytics") && (
                                <li className="text-xs text-foreground">• {t("admin.advancedAnalytics")}</li>
                              )}
                              {newPlan.selectedFeatures.includes("full_analytics") && (
                                <li className="text-xs text-foreground">• {t("admin.fullAnalytics")}</li>
                              )}
                              {newPlan.selectedFeatures.includes("priority_support") && (
                                <li className="text-xs text-foreground">• {t("admin.prioritySupport")}</li>
                              )}
                              {newPlan.selectedFeatures.includes("support_24_7") && (
                                <li className="text-xs text-foreground">• {t("admin.support247")}</li>
                              )}
                              {newPlan.selectedFeatures.includes("api_access") && (
                                <li className="text-xs text-foreground">• {t("admin.apiAccess")}</li>
                              )}
                              {newPlan.customFeatures.map((feature, idx) => {
                                const translated = getTranslatedValue(feature);
                                if (translated) {
                                  return (
                                    <li key={`custom-${idx}`} className="text-xs text-foreground">
                                      • {translated}
                                    </li>
                                  );
                                }
                                return null;
                              })}
                          </ul>
                        </div>
                      </div>
                    )}
                    {/* Кнопки */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setNewPlan({
                            name: { ru: "", en: "", kk: "" },
                            price: 0,
                            messagesLimit: 0,
                            storageLimit: 0,
                            selectedFeatures: [],
                            customFeatures: [],
                          });
                        }}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={handleCreatePlan}
                        disabled={(!newPlan.name.ru.trim() && !newPlan.name.en.trim() && !newPlan.name.kk.trim()) || (newPlan.selectedFeatures.length === 0 && newPlan.customFeatures.length === 0)}
                      >
                        {t("admin.createPlan")}
                      </Button>
                    </div>
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

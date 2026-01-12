'use client';

import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
  FiAward,
  FiStar,
  FiCopy,
  FiShare2,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useCompany, useCompanyStats, useMessageDistribution, useGroupedAchievements, useGrowthMetrics, usePlans } from "@/lib/query";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import TrialCard from "@/components/TrialCard";
import { Badge } from "@/components/ui/badge";
import { getTranslatedValue } from "@/lib/utils/translations";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";

const CompanyDashboard = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedPassword, setCopiedPassword] = React.useState(false);
  const [showSensitiveData, setShowSensitiveData] = React.useState(false);

  const { data: company, isLoading: companyLoading } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { data: plans = [], isLoading: plansLoading } = usePlans();

  // Функция для проверки, является ли план пробным
  const isTrialPlan = (planName?: string): boolean => {
    if (!planName) return false;
    const trialPlanNames = ['Пробный', 'Trial', 'Бесплатный', 'Free', 'Тегін', 'Сынақ'];
    return trialPlanNames.includes(planName);
  };

  // Находим текущий план компании
  const currentPlan = React.useMemo(() => {
    if (!company?.plan || !plans.length) return null;
    return plans.find((p) => {
      const planName = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
      return planName === company.plan || (typeof p.name === "object" && (p.name.ru === company.plan || p.name.en === company.plan || p.name.kk === company.plan));
    });
  }, [company?.plan, plans]);

  // Генерация ежедневного буквенно-цифрового пароля на основе даты (UTC, чтобы совпадало с бэкендом)
  // Пароль автоматически обновляется каждый день
  // Используем useState с функцией-инициализатором, чтобы избежать проблем с hydration
  const getCurrentDate = () => {
    if (typeof window === 'undefined') return '';
    const today = new Date();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
  };

  // Обновляем дату каждый день через интервал
  const [dateKey, setDateKey] = React.useState(() => getCurrentDate());
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    // Устанавливаем mounted после монтирования компонента
    setMounted(true);
    // Устанавливаем правильную дату после монтирования
    const initialDate = getCurrentDate();
    if (initialDate) {
      setDateKey(initialDate);
    }
    
    // Проверяем изменение даты каждую минуту (для надежности)
    const interval = setInterval(() => {
      const today = new Date();
      const newDate = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
      if (newDate !== dateKey) {
        setDateKey(newDate);
      }
    }, 60000); // Проверяем каждую минуту

    return () => clearInterval(interval);
  }, [dateKey]);

  const dailyPassword = React.useMemo(() => {
    // Только вычисляем пароль после монтирования, чтобы избежать hydration mismatch
    if (!mounted || !dateKey) return '';
    
    const dateStr = dateKey.replace(/-/g, '');
    
    // Создаем seed на основе даты для детерминированной генерации
    const seed = dateStr.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
    
    // Используем seed для создания псевдослучайной последовательности
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    let currentSeed = Math.abs(seed);
    
    // Генерируем пароль используя seed
    for (let i = 0; i < 10; i++) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      const index = currentSeed % chars.length;
      password += chars[index];
    }
    
    return password;
  }, [mounted, dateKey]);

  // Ссылка для отправки сообщений
  const shareLink = React.useMemo(() => {
    if (typeof window === 'undefined' || !company?.code) return '';
    return `${window.location.origin}/?code=${company.code}`;
  }, [company?.code]);

  const { data: stats, isLoading: statsLoading } = useCompanyStats(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { data: distribution, isLoading: distributionLoading } = useMessageDistribution(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { data: groupedAchievements = [], isLoading: achievementsLoading } = useGroupedAchievements(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { data: growthMetrics, isLoading: growthLoading } = useGrowthMetrics(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  // Получаем достижения, близкие к получению (незавершенные с наибольшим прогрессом)
  const nearCompletionAchievements = React.useMemo(() => {
    if (!groupedAchievements.length) return [];
    
    // Собираем только незавершенные достижения из всех групп
    const incompleteAchievements: Array<{
      achievement: any;
      current: number;
      progress: number;
      completed: boolean;
      completedAt?: string;
      categoryTitle: string;
      category: string;
    }> = [];
    
    groupedAchievements.forEach(group => {
      const activeAchievement = group.achievements.find(a => !a.completed);
      if (activeAchievement && activeAchievement.progress > 0) {
        incompleteAchievements.push({
          ...activeAchievement,
          categoryTitle: group.categoryTitleKey,
          category: group.category,
        });
      }
    });
    
    // Сортируем по прогрессу (близкие к получению = высокий прогресс)
    incompleteAchievements.sort((a, b) => b.progress - a.progress);
    
    // Возвращаем только 2 самых близких к получению
    return incompleteAchievements.slice(0, 2);
  }, [groupedAchievements]);

  // Рассчитываем проценты распределения
  const totalDistribution = (distribution?.complaints || 0) + (distribution?.praises || 0) + (distribution?.suggestions || 0);
  const complaintPercent = totalDistribution > 0 ? Math.round(((distribution?.complaints || 0) / totalDistribution) * 100) : 0;
  const praisePercent = totalDistribution > 0 ? Math.round(((distribution?.praises || 0) / totalDistribution) * 100) : 0;
  const suggestionPercent = totalDistribution > 0 ? Math.round(((distribution?.suggestions || 0) / totalDistribution) * 100) : 0;

  // Автоматический сброс состояния копирования через useEffect
  React.useEffect(() => {
    if (copiedCode) {
      const timer = setTimeout(() => setCopiedCode(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedCode]);

  React.useEffect(() => {
    if (copiedLink) {
      const timer = setTimeout(() => setCopiedLink(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedLink]);

  React.useEffect(() => {
    if (copiedPassword) {
      const timer = setTimeout(() => setCopiedPassword(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedPassword]);

  const handleCopy = (text: string, type: 'code' | 'link' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      toast.success(t("company.codeCopiedToClipboard"));
    } else if (type === 'link') {
      setCopiedLink(true);
      toast.success(t("company.linkCopied"));
    } else if (type === 'password') {
      setCopiedPassword(true);
      toast.success(t("company.passwordCopiedToClipboard"));
    }
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col overflow-x-hidden w-full ${isFullscreen ? 'h-auto overflow-y-auto' : ''}`}>
      <CompanyHeader />
      <div className={`flex flex-col flex-1 w-full min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
        <main className={`flex-1 px-4 sm:px-6 py-4 w-full ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-y-auto'}`}>
          <div className="w-full space-y-4">
            {statsLoading || distributionLoading || achievementsLoading || growthLoading || companyLoading || plansLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            ) : !company && user?.companyId ? (
              // Компания была удалена
              <Card className="p-6 border-destructive/50 bg-destructive/10 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                      {t("company.deletedTitle") || "Компания была удалена"}
                    </h3>
                    <p className="text-sm text-foreground mb-4">
                      {t("company.deletedMessage") || "Ваша компания была удалена администратором. Ваш аккаунт больше не имеет доступа к сервису. Для получения дополнительной информации свяжитесь с администратором."}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push("/");
                      }}
                    >
                      {t("common.backToHome") || "Вернуться на главную"}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Blocked Company Warning - показывается если компания заблокирована */}
                {company && company.status === "Заблокирована" && (
                  <Card className="p-6 border-destructive/50 bg-destructive/10 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-destructive mb-2">
                          {t("company.blockedTitle") || "Компания заблокирована"}
                        </h3>
                        <p className="text-sm text-foreground mb-2">
                          {t("company.blockedMessage") || "Ваша компания была заблокирована администратором. Доступ к сервису ограничен. Для получения дополнительной информации свяжитесь с администратором."}
                        </p>
                        <Badge variant="destructive" className="mt-2">
                          {t("admin.blocked")}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}
                
                {/* Trial Card - показывается только для пробного периода */}
                {company && company.status !== "Заблокирована" && <TrialCard company={company} />}
                
                {/* Plan Info Card - показывается только если не пробный период */}
                {company && !isTrialPlan(company.plan) && currentPlan && (
                  <Card className="p-6 border-border shadow-lg relative overflow-hidden bg-card">
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10 bg-primary"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-2">{t("company.currentPlan")}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              {getTranslatedValue(currentPlan.name)}
                            </Badge>
                            {company.trialEndDate && (
                              <Badge className="bg-primary text-white text-xs">
                                {t("company.planEnds")} {new Date(company.trialEndDate).toLocaleDateString("ru-RU", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                })}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
                            {currentPlan.price === 0 ? t("common.free") : `${currentPlan.price} ₸`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("admin.perMonth")}
                          </p>
                        </div>
                      </div>
                      {company.trialEndDate && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-1">
                            {t("company.planActiveUntil")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(company.trialEndDate).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                
                {/* Company Code, Link and Password Block */}
                {company && (
                  <Card className="p-5 border-border shadow-lg relative overflow-hidden bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">{t("company.companyInfo")}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                        className="h-8 w-8"
                      >
                        {showSensitiveData ? (
                          <FiEyeOff className="h-4 w-4" />
                        ) : (
                          <FiEye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                      {/* Company Code */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("company.companyCode")}</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-base sm:text-lg md:text-xl font-mono font-bold text-primary bg-muted px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md tracking-wider min-w-0 overflow-hidden text-ellipsis">
                            {showSensitiveData ? company.code : '••••••••'}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(company.code, 'code')}
                            className="h-9 sm:h-10 w-9 sm:w-10 flex-shrink-0"
                          >
                            {copiedCode ? (
                              <FiCheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                            ) : (
                              <FiCopy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Share Link */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("company.shareLink")}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={showSensitiveData ? shareLink : '••••••••••••••••••••••••••••'}
                            readOnly
                            className="font-mono text-xs sm:text-sm h-9 sm:h-10 min-w-0 flex-1"
                            autoComplete="off"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(shareLink, 'link')}
                            className="h-9 sm:h-10 w-9 sm:w-10 flex-shrink-0"
                          >
                            {copiedLink ? (
                              <FiCheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                            ) : (
                              <FiShare2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Daily Password */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("company.passwordForSendingMessages")}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={showSensitiveData && dailyPassword ? dailyPassword : '••••••••••'}
                            readOnly
                            className="font-mono text-xs sm:text-sm h-9 sm:h-10 min-w-0 flex-1"
                            autoComplete="off"
                            suppressHydrationWarning
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(dailyPassword, 'password')}
                            className="h-9 sm:h-10 w-9 sm:w-10 flex-shrink-0"
                          >
                            {copiedPassword ? (
                              <FiCheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                            ) : (
                              <FiCopy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("company.updatesAutomaticallyDaily")}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Combined Stats Block */}
                <Card className="p-5 border-border shadow-lg relative overflow-hidden bg-card">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 lg:col-span-2">
                      <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.03))' }}>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent))' }}>
                          <FiMessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t("company.newMessages")}</p>
                          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>{stats?.new || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'linear-gradient(to bottom right, hsl(var(--secondary) / 0.08), hsl(var(--secondary) / 0.03))' }}>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                          <FiClock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t("company.inProgress")}</p>
                          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--secondary))' }}>{stats?.inProgress || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'linear-gradient(to bottom right, hsl(var(--success) / 0.08), hsl(var(--success) / 0.03))' }}>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--success))' }}>
                          <FiCheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t("company.resolved")}</p>
                          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{stats?.resolved || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Distribution Section */}
                    {totalDistribution > 0 && (
                      <div className="lg:col-span-1 lg:pl-5 lg:border-l lg:border-border/50">
                        <h3 className="text-sm font-semibold mb-4">{t("company.messageDistribution")}</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">{t("sendMessage.complaint")}</span>
                              <span className="font-semibold">{complaintPercent}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent rounded-full transition-all duration-500" 
                                style={{ width: `${complaintPercent}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">{t("sendMessage.praise")}</span>
                              <span className="font-semibold">{praisePercent}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary rounded-full transition-all duration-500" 
                                style={{ width: `${praisePercent}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">{t("sendMessage.suggestion")}</span>
                              <span className="font-semibold">{suggestionPercent}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-500" 
                                style={{ width: `${suggestionPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Button */}
                  <div className="pt-4 mt-4 border-t border-border/50 flex justify-end">
                    <Button 
                      onClick={() => router.push("/company/messages")}
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full shadow-sm hover:shadow-md transition-all duration-200 ml-auto"
                      aria-label={t("company.toMessages")}
                    >
                      <FiArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
                
                {/* Near Completion Achievements and Growth Rating Block */}
                <Card className="p-5 border-border shadow-lg relative overflow-hidden bg-card">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Achievements Section */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                          <FiAward className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold">{t("company.achievements")}</h3>
                      </div>
                      {nearCompletionAchievements.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("company.noAchievements")}</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {nearCompletionAchievements.map((achievement) => {
                            const categoryTitle = t(achievement.categoryTitle);
                            const level = achievement.achievement.level || 1;
                            const target = achievement.achievement.target;
                            
                            let description = "";
                            const titleKey = achievement.achievement.titleKey;
                            
                            if (titleKey) {
                              const translationParams: Record<string, any> = {};
                              if (titleKey.includes("level") || titleKey.includes("reviews") || titleKey.includes("resolved") || titleKey.includes("responseSpeed") || titleKey.includes("longevity")) {
                                translationParams.level = level;
                                translationParams.target = target;
                              } else {
                                translationParams.target = target;
                              }
                              description = String(t(titleKey, translationParams));
                            }
                            
                            // Вычисляем остаток до завершения
                            const remaining = target - achievement.current;
                            
                            // Определяем текст в зависимости от прогресса
                            const getRemainingText = () => {
                              if (achievement.progress >= 90) return t("company.remainingLittle");
                              if (achievement.progress >= 75) return t("company.almostReady");
                              if (achievement.progress >= 50) return t("company.halfway");
                              return t("company.remaining", { count: remaining });
                            };
                            
                            return (
                              <div key={`${achievement.category}-${achievement.achievement.id}`} className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-foreground leading-tight mb-1">{categoryTitle}</h4>
                                    {description && (
                                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                    <span className="text-lg font-bold text-primary whitespace-nowrap">
                                      {achievement.progress}%
                                    </span>
                                    {remaining > 0 && (
                                      <span className={`text-xs whitespace-nowrap ${
                                        achievement.progress >= 90 
                                          ? "text-primary font-semibold" 
                                          : "text-muted-foreground"
                                      }`}>
                                        {getRemainingText()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Progress value={achievement.progress} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Growth Rating Section */}
                    <div className="lg:col-span-1 lg:pl-5 lg:border-l lg:border-border/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                          <FiStar className="h-4 w-4 text-white fill-white" />
                        </div>
                        <h3 className="text-sm font-semibold">{t("company.growthRating")}</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-3xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                              {growthMetrics?.rating?.toFixed(1) || "0.0"}
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground">/ 10</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {growthMetrics?.rating && growthMetrics.rating >= 8
                              ? t("company.cultureExcellent")
                              : growthMetrics?.rating && growthMetrics.rating >= 6
                              ? t("company.cultureStrong")
                              : growthMetrics?.rating && growthMetrics.rating >= 4
                              ? t("company.cultureDeveloping")
                              : t("company.cultureNeedsAttention")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Button */}
                  <div className="pt-4 mt-4 border-t border-border/50 flex justify-end">
                    <Button 
                      onClick={() => router.push("/company/growth")}
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full shadow-sm hover:shadow-md transition-all duration-200 ml-auto"
                      aria-label={t("company.growth")}
                    >
                      <FiArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;

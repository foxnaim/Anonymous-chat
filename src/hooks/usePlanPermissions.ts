import { useMemo } from "react";
import { useCompany, usePlans } from "@/lib/query";
import { useAuth } from "@/lib/redux";
import { getTranslatedValue } from "@/lib/utils/translations";
import type { Company, SubscriptionPlan } from "@/types";

export interface PlanPermissions {
  canReply: boolean;
  canChangeStatus: boolean;
  canViewBasicAnalytics: boolean;
  canViewExtendedAnalytics: boolean;
  canViewReports: boolean;
  canViewGrowth: boolean;
  canViewTeamMood: boolean;
  isReadOnly: boolean;
  currentPlan: SubscriptionPlan | null;
  isFree: boolean;
  isStandard: boolean;
  isPro: boolean;
}

/**
 * Определяет план по имени
 */
function getPlanId(planName: string, plans: SubscriptionPlan[]): string | null {
  const freePlanNames = [
    "Пробный",
    "Trial",
    "Бесплатный",
    "Free",
    "Тегін",
    "Сынақ",
  ];
  
  if (freePlanNames.includes(planName)) {
    return "free";
  }

  const plan = plans.find((p) => {
    const pName = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
    return pName === planName || 
           (typeof p.name === "object" && (
             p.name.ru === planName || 
             p.name.en === planName || 
             p.name.kk === planName
           ));
  });

  return plan?.id || null;
}

/**
 * Проверяет, истек ли пробный период
 */
function isTrialExpired(company: Company | null | undefined): boolean {
  if (!company?.trialEndDate) {
    return false;
  }

  try {
    const endDate = new Date(company.trialEndDate);
    const now = new Date();
    return now > endDate;
  } catch {
    return false;
  }
}

/**
 * Хук для получения прав доступа на основе плана компании
 */
export function usePlanPermissions(): PlanPermissions {
  const { user } = useAuth();
  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: plans = [] } = usePlans();

  return useMemo(() => {
    if (!company || !plans.length) {
      return {
        canReply: false,
        canChangeStatus: false,
        canViewBasicAnalytics: false,
        canViewExtendedAnalytics: false,
        canViewReports: false,
        canViewGrowth: false,
        canViewTeamMood: false,
        isReadOnly: true,
        currentPlan: null,
        isFree: true,
        isStandard: false,
        isPro: false,
      };
    }

    const planId = getPlanId(company.plan, plans);
    const currentPlan = plans.find((p) => {
      const pName = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
      return pName === company.plan || 
             (typeof p.name === "object" && (
               p.name.ru === company.plan || 
               p.name.en === company.plan || 
               p.name.kk === company.plan
             ));
    }) || null;

    const isFree = planId === "free" || currentPlan?.isFree === true;
    const isStandard = planId === "standard";
    const isPro = planId === "pro";

    // Если план бесплатный, проверяем, не истек ли пробный период
    if (isFree) {
      const trialExpired = isTrialExpired(company);
      if (trialExpired) {
        return {
          canReply: false,
          canChangeStatus: false,
          canViewBasicAnalytics: false,
          canViewExtendedAnalytics: false,
          canViewReports: false,
          canViewGrowth: false,
          canViewTeamMood: false,
          isReadOnly: true,
          currentPlan,
          isFree: true,
          isStandard: false,
          isPro: false,
        };
      }
      // Пробный период активен - только просмотр (read-only)
      return {
        canReply: false,
        canChangeStatus: false,
        canViewBasicAnalytics: false,
        canViewExtendedAnalytics: false,
        canViewReports: false,
        canViewGrowth: false,
        canViewTeamMood: false,
        isReadOnly: true,
        currentPlan,
        isFree: true,
        isStandard: false,
        isPro: false,
      };
    }

    // Standard план
    if (isStandard) {
      return {
        canReply: true,
        canChangeStatus: true,
        canViewBasicAnalytics: true,
        canViewExtendedAnalytics: false,
        canViewReports: false,
        canViewGrowth: true,
        canViewTeamMood: false,
        isReadOnly: false,
        currentPlan,
        isFree: false,
        isStandard: true,
        isPro: false,
      };
    }

    // Pro план
    if (isPro) {
      return {
        canReply: true,
        canChangeStatus: true,
        canViewBasicAnalytics: true,
        canViewExtendedAnalytics: true,
        canViewReports: true,
        canViewGrowth: true,
        canViewTeamMood: true,
        isReadOnly: false,
        currentPlan,
        isFree: false,
        isStandard: false,
        isPro: true,
      };
    }

    // По умолчанию - только просмотр (для неизвестных планов)
    return {
      canReply: false,
      canChangeStatus: false,
      canViewBasicAnalytics: false,
      canViewExtendedAnalytics: false,
      canViewReports: false,
      canViewGrowth: false,
      canViewTeamMood: false,
      isReadOnly: true,
      currentPlan,
      isFree: true,
      isStandard: false,
      isPro: false,
    };
  }, [company, plans]);
}

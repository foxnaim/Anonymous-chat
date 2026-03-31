import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/redux";
import { useCompany, useSupportInfo, usePlans } from "@/lib/query";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { getTranslatedValue } from "@/lib/utils/translations";

/**
 * Хук для генерации WhatsApp ссылки поддержки с предзаполненным сообщением.
 * Включает: email, название компании, код, тарифный план.
 */
export function useWhatsAppSupport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: supportInfo } = useSupportInfo();
  const { data: plans = [] } = usePlans();
  const permissions = usePlanPermissions();

  const planDisplayName = useMemo(() => {
    if (!company?.plan) return "";
    const plan = plans.find((p) => {
      const pName = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
      return pName === company.plan ||
        (typeof p.name === "object" && (
          p.name.ru === company.plan ||
          p.name.en === company.plan ||
          p.name.kk === company.plan
        ));
    });
    if (plan) {
      return typeof plan.name === "string" ? plan.name : getTranslatedValue(plan.name);
    }
    return company.plan;
  }, [company?.plan, plans]);

  const message = useMemo(() => {
    const greeting = t("company.supportMessage") || "Здравствуйте! Мне нужна помощь с платформой FeedBack.";
    const priority = permissions.isPro
      ? `\n\n⚠️ ${t("company.prioritySupportNote") || "ПРИОРИТЕТНАЯ ПОДДЕРЖКА (Pro план)"}`
      : "";

    const details = [
      company?.name ? `${t("company.companyNameLabel") || "Компания:"} ${company.name}` : "",
      company?.code ? `${t("company.companyCodeLabelWithColon") || "Код:"} ${company.code}` : "",
      user?.email ? `${t("company.emailLabel") || "Email:"} ${user.email}` : "",
      planDisplayName ? `${t("company.planLabel") || "Тариф:"} ${planDisplayName}` : "",
    ].filter(Boolean).join("\n");

    return `${greeting}${priority}\n\n${details}`;
  }, [company?.name, company?.code, user?.email, planDisplayName, permissions.isPro, t]);

  const phoneNumber = supportInfo?.supportWhatsAppNumber?.replace(/[^0-9]/g, "") || "";
  const href = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    : "";

  return {
    href,
    message,
    phoneNumber: supportInfo?.supportWhatsAppNumber || "",
    hasSupport: !!supportInfo?.supportWhatsAppNumber,
  };
}

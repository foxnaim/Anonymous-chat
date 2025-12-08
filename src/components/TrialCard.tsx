'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { plansService } from "@/lib/query";

const TrialCard = () => {
  const { t } = useTranslation();
  const [freePeriodDays, setFreePeriodDays] = useState<number>(60);

  useEffect(() => {
    plansService.getFreePlanSettings().then((data) => {
      setFreePeriodDays(data.freePeriodDays || 60);
    });
  }, []);

  const getDaysText = (days: number) => {
    if (days === 1) return 'день';
    if (days < 5) return 'дня';
    return 'дней';
  };

  return (
    <Card className="p-6 border-border shadow-lg relative overflow-hidden bg-card">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10 bg-primary"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{t("admin.trial")}</h3>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {t("common.free")}
          </Badge>
        </div>
        <div className="mb-4">
          <p className="text-4xl font-bold text-foreground mb-1">
            {freePeriodDays} {getDaysText(freePeriodDays)}
          </p>
          <p className="text-sm" style={{ color: 'hsl(var(--accent))' }}>
            пробного доступа
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 rounded-full p-1" style={{ backgroundColor: 'hsl(var(--primary))15' }}>
            <FiCheck className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <span className="text-sm text-foreground leading-relaxed">
            Все функции на {freePeriodDays} {getDaysText(freePeriodDays)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default TrialCard;


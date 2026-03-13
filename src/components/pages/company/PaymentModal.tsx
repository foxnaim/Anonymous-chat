'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { FiShoppingCart } from "react-icons/fi";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planPrice: number;
  onPaymentSuccess: () => void;
}

// Курс KZT → USD (примерный). В продакшене лучше получать актуальный курс через API.
const KZT_TO_USD_RATE = 0.002;

const PaymentModal = ({ open, onOpenChange, planName, planPrice, onPaymentSuccess }: PaymentModalProps) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const priceUSD = Math.max(1, Math.round(planPrice * KZT_TO_USD_RATE * 100) / 100).toFixed(2);

  const handleClose = (value: boolean) => {
    if (!isProcessing) {
      onOpenChange(value);
    }
  };

  if (!clientId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("payment.title")}</DialogTitle>
            <DialogDescription>{t("payment.paypalNotConfigured")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiShoppingCart className="h-5 w-5" />
            {t("payment.title")}
          </DialogTitle>
          <DialogDescription>
            {t("payment.description", { plan: planName, price: planPrice })}
          </DialogDescription>
        </DialogHeader>

        {/* Информация о тарифе */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("payment.plan")}</span>
            <span className="font-semibold text-foreground">{planName}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">{t("payment.amount")}</span>
            <span className="text-lg font-bold text-primary">{planPrice} ₸</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{t("payment.convertedAmount")}</span>
            <span className="text-xs text-muted-foreground">≈ ${priceUSD} USD</span>
          </div>
        </div>

        {/* PayPal кнопки */}
        <div className="mt-2">
          <PayPalScriptProvider options={{
            clientId,
            currency: "USD",
            intent: "capture",
          }}>
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "pay",
                height: 45,
              }}
              disabled={isProcessing}
              createOrder={(_data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [{
                    description: `${planName} - FeedbackHub`,
                    amount: {
                      currency_code: "USD",
                      value: priceUSD,
                    },
                  }],
                });
              }}
              onApprove={async (_data, actions) => {
                setIsProcessing(true);
                try {
                  const details = await actions.order?.capture();
                  if (details?.status === "COMPLETED") {
                    toast.success(t("payment.success"));
                    onPaymentSuccess();
                    onOpenChange(false);
                  } else {
                    toast.error(t("payment.failed"));
                  }
                } catch {
                  toast.error(t("payment.failed"));
                } finally {
                  setIsProcessing(false);
                }
              }}
              onError={() => {
                toast.error(t("payment.failed"));
                setIsProcessing(false);
              }}
              onCancel={() => {
                toast.info(t("payment.cancelled"));
              }}
            />
          </PayPalScriptProvider>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-1">
          {t("payment.securePayment")}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

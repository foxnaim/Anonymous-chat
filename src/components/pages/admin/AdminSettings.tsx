'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AdminHeader } from "@/components/AdminHeader";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { useFullscreen } from "@/hooks/use-fullscreen";
const AdminSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const { isFullscreen, toggleFullscreen } = useFullscreen(user?.role === "user" ? null : (user?.role || null));
  const handleSave = async () => {
    // В реальном приложении здесь будет API вызов
    toast.success(t("admin.settingsSaved"));
  };
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-6 space-y-6">
          {/* Display Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("admin.displaySettings")}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("admin.fullscreenMode")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.fullscreenModeDescription")}
                  </p>
                </div>
                <Switch checked={isFullscreen} onCheckedChange={toggleFullscreen} />
              </div>
            </div>
          </Card>
          {/* Notifications */}
            <h3 className="text-lg font-semibold mb-6">{t("admin.notifications")}</h3>
                  <Label>{t("admin.emailNotifications")}</Label>
                    {t("admin.emailNotificationsDescription")}
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              <Separator />
                  <Label>{t("admin.dailyDigest")}</Label>
                    {t("admin.dailyDigestDescription")}
                <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
          <div className="flex justify-end gap-3">
            <Button variant="outline">{t("common.cancel")}</Button>
            <Button onClick={handleSave}>{t("admin.saveChanges")}</Button>
          </div>
        </main>
      </div>
    </div>
  );
};
export default AdminSettings;

'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminHeader } from "@/components/AdminHeader";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { useFullscreen } from "@/hooks/use-fullscreen";

const AdminSettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isFullscreen, toggleFullscreen } = useFullscreen(user?.role === "user" ? null : (user?.role || null));

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }
    // В реальном приложении здесь будет API вызов
    toast.success(t("admin.passwordChanged"));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLanguageChange = (lang: string) => {
    i18nInstance.changeLanguage(lang);
  };

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

          {/* Change Password */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("admin.changePassword")}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("admin.currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("admin.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("admin.confirmNewPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button onClick={handlePasswordChange} className="w-full sm:w-auto">
                {t("admin.changePassword")}
              </Button>
            </div>
          </Card>

          {/* Project Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("admin.projectSettings")}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.interfaceLanguage")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("admin.interfaceLanguageDescription")}
                </p>
                <Select value={i18nInstance.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="kk">Қазақша</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

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

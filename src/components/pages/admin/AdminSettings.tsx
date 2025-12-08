'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiEdit2, FiLock } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useAdminSettings, useUpdateAdminSettings } from "@/lib/query";

const AdminSettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  
  // Загружаем настройки из API
  const { data: settings, isLoading: settingsLoading } = useAdminSettings();
  const { mutateAsync: updateSettings, isPending: isUpdating } = useUpdateAdminSettings({
    onSuccess: () => {
      toast.success(t("admin.settingsSaved"));
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"));
    },
  });

  // Используем настройки из API или локальный хук как fallback
  const { isFullscreen, toggleFullscreen } = useFullscreen(
    user?.role === "user" ? null : (user?.role || null)
  );

  // Синхронизируем fullscreenMode с API
  useEffect(() => {
    if (settings && settings.fullscreenMode !== isFullscreen) {
      // Обновляем API при изменении локального состояния
      updateSettings({ fullscreenMode: isFullscreen }).catch(() => {
        // Игнорируем ошибки при автосинхронизации
      });
    }
  }, [isFullscreen, settings, updateSettings]);

  // Синхронизируем язык с API
  useEffect(() => {
    if (settings && settings.language && settings.language !== i18nInstance.language) {
      i18nInstance.changeLanguage(settings.language);
    }
  }, [settings, i18nInstance]);

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

  const handleLanguageChange = async (lang: string) => {
    i18nInstance.changeLanguage(lang);
    // Сохраняем в API
    await updateSettings({ language: lang as 'ru' | 'en' | 'kk' });
  };

  const handleFullscreenToggle = async (checked: boolean) => {
    toggleFullscreen();
    // Сохраняем в API
    await updateSettings({ fullscreenMode: checked });
  };

  const handleEmailEdit = () => {
    setIsEditingEmail(true);
    setNewEmail(user?.email || "");
  };

  const handleEmailCancel = () => {
    setIsEditingEmail(false);
    setNewEmail("");
    setEmailPassword("");
  };

  const handleEmailSave = async () => {
    if (!emailPassword) {
      toast.error(t("admin.passwordRequiredForEmailChange"));
      return;
    }
    if (!newEmail || newEmail === user?.email) {
      toast.error(t("admin.emailNotChanged"));
      return;
    }
    // В реальном приложении здесь будет API вызов для проверки пароля и изменения email
    // await adminService.changeEmail(newEmail, emailPassword);
    toast.success(t("admin.emailChanged"));
    setIsEditingEmail(false);
    setEmailPassword("");
  };

  const handleSave = async () => {
    // Сохраняем все настройки
    if (settings) {
      await updateSettings({
        fullscreenMode: isFullscreen,
        language: i18nInstance.language as 'ru' | 'en' | 'kk',
        theme: settings.theme,
        itemsPerPage: settings.itemsPerPage,
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications,
      });
    }
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
                <Switch 
                  checked={settings?.fullscreenMode ?? isFullscreen} 
                  onCheckedChange={handleFullscreenToggle}
                  disabled={settingsLoading || isUpdating}
                />
              </div>
            </div>
          </Card>

          {/* Change Email */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("auth.email")}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  {!isEditingEmail && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleEmailEdit}
                      className="h-8"
                    >
                      <FiEdit2 className="h-4 w-4 mr-2" />
                      {t("common.edit")}
                    </Button>
                  )}
                </div>
                {isEditingEmail ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleEmailSave();
                    }}
                    className="space-y-3"
                  >
                    {/* Скрытое поле username для доступности и автозаполнения */}
                    <input
                      type="text"
                      autoComplete="username"
                      value={user?.email || ""}
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                      style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
                    />
                    <div className="space-y-2">
                      <Input
                        id="email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        autoComplete="email"
                        placeholder={t("auth.email")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword" className="flex items-center gap-2">
                        <FiLock className="h-4 w-4" />
                        {t("admin.currentPasswordForEmail")}
                      </Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder={t("admin.enterPasswordToChangeEmail")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("admin.passwordRequiredToChangeEmail")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEmailCancel}
                        className="flex-1"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={!emailPassword || !newEmail || newEmail === user?.email}
                      >
                        {t("common.save")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    autoComplete="email"
                    className="bg-muted"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Change Password */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("admin.changePassword")}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordChange();
              }}
              className="space-y-4"
            >
              {/* Скрытое поле username для доступности и автозаполнения */}
              <input
                type="text"
                autoComplete="username"
                value={user?.email || ""}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
              />
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
              <Button type="submit" className="w-full sm:w-auto">
                {t("admin.changePassword")}
              </Button>
            </form>
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
                <Select 
                  value={settings?.language ?? i18nInstance.language} 
                  onValueChange={handleLanguageChange}
                  disabled={settingsLoading || isUpdating}
                >
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
            <Button variant="outline" disabled={settingsLoading || isUpdating}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={settingsLoading || isUpdating}>
              {isUpdating ? t("common.loading") : t("admin.saveChanges")}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};
export default AdminSettings;

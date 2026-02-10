'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiEdit2, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAuth, setUser } from "@/lib/redux";
import { toast } from "sonner";
import { useAdminSettings, useUpdateAdminSettings } from "@/lib/query";
import { authService } from "@/lib/api/auth";
import { useDispatch } from "react-redux";
import { validatePasswordStrength, validateSupportPhone, isValidEmail } from "@/lib/utils/validation";

const AdminSettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  
  // States
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [supportWhatsAppNumber, setSupportWhatsAppNumber] = useState("");

  // Загружаем настройки из API только если пользователь авторизован
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useAdminSettings({
    enabled: isAuthenticated,
  });
  const { mutateAsync: updateSettings, isPending: isUpdating } = useUpdateAdminSettings({
    onSuccess: async (updatedData) => {
      // После успешного обновления принудительно обновляем настройки
      await refetchSettings();
      toast.success(t("admin.settingsSaved"));
      setIsLanguageChanging(false);
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"));
      setIsLanguageChanging(false);
    },
  });

  // Синхронизируем настройки при загрузке
  useEffect(() => {
    if (settings) {
      setSupportWhatsAppNumber(settings.supportWhatsAppNumber || "");
    }
  }, [settings]);

  // Синхронизируем язык с API только один раз при первой загрузке настроек
  // Приоритет у localStorage, так как пользователь мог изменить язык в другом месте
  useEffect(() => {
    // Пропускаем синхронизацию если идет изменение языка или нет настроек
    if (!settings?.language || isLanguageChanging) {
      return;
    }

    // Синхронизируем только один раз при монтировании, чтобы избежать бесконечных циклов
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
    const currentLang = i18nInstance.language?.split('-')[0] || 'ru';
    
    // Если есть сохраненный язык в localStorage, он уже должен быть установлен при инициализации i18n
    // Поэтому просто проверяем, что он совпадает
    if (storedLang && ['en', 'ru', 'kk'].includes(storedLang)) {
      // Язык уже должен быть правильным из localStorage
      return;
    }
    
    // Если нет в localStorage, но есть в API - используем из API (только один раз)
    if (!storedLang && settings.language !== currentLang && ['en', 'ru', 'kk'].includes(settings.language)) {
      // Используем requestIdleCallback или setTimeout для отложенного выполнения
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          i18nInstance.changeLanguage(settings.language);
          localStorage.setItem('i18nextLng', settings.language);
        });
      } else {
        setTimeout(() => {
          i18nInstance.changeLanguage(settings.language);
          localStorage.setItem('i18nextLng', settings.language);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Запускаем только один раз при монтировании

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    // Проверка надежности пароля
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      // Показываем первую ошибку
      const firstError = passwordValidation.errors[0];
      toast.error(firstError || t("auth.passwordWeak"));
      return;
    }
    
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(t("admin.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      // Обработка различных типов ошибок
      let errorMessage = t("admin.passwordChangeError");
      
      if (error?.message) {
        const message = error.message.toLowerCase();
        if (message.includes("incorrect") || message.includes("invalid")) {
          errorMessage = t("auth.passwordInvalid") || "Неверный текущий пароль";
        } else if (message.includes("same") || message.includes("different")) {
          errorMessage = t("auth.passwordMustBeDifferent") || "Новый пароль должен отличаться от текущего";
        } else if (message.includes("required")) {
          errorMessage = t("common.fillAllFields");
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setIsLanguageChanging(true);
    const previousLang = settings?.language || i18nInstance.language.split('-')[0] || 'ru';
    
    // Сначала меняем язык локально для мгновенной обратной связи
    i18nInstance.changeLanguage(lang);
    // Сохраняем в localStorage сразу
    localStorage.setItem('i18nextLng', lang);
    
    // Затем сохраняем в API
    try {
      const updatedSettings = await updateSettings({ language: lang as 'ru' | 'en' | 'kk' });
      
      // Убеждаемся, что язык действительно обновился в настройках
      if (updatedSettings.language !== lang) {
        // Если язык не обновился, возвращаем предыдущий
        i18nInstance.changeLanguage(previousLang);
        localStorage.setItem('i18nextLng', previousLang);
        toast.error(t("common.error") || "Ошибка при сохранении языка");
      } else {
        toast.success(t("admin.settingsSaved") || "Настройки сохранены");
      }
    } catch (error: any) {
      // В случае ошибки возвращаем язык обратно
      i18nInstance.changeLanguage(previousLang);
      localStorage.setItem('i18nextLng', previousLang);
      const errorMessage = error?.message || t("common.error") || "Ошибка при сохранении настроек";
      toast.error(errorMessage);
    } finally {
      setIsLanguageChanging(false);
    }
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
    const trimmedEmail = newEmail.trim();
    if (!emailPassword) {
      toast.error(t("admin.passwordRequiredForEmailChange"));
      return;
    }
    if (!trimmedEmail) {
      toast.error(t("admin.emailNotChanged"));
      return;
    }
    if (trimmedEmail === user?.email) {
      toast.error(t("admin.emailNotChanged"));
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      toast.error(t("admin.emailChangeInvalidFormat"));
      return;
    }

    try {
      const response = await authService.changeEmail({
        newEmail: trimmedEmail,
        password: emailPassword,
      });

      // Обновляем пользователя в Redux store
      if (response.data.user && user) {
        dispatch(setUser({
          ...user,
          email: response.data.user.email,
        }));
      }

      toast.success(t("admin.emailChanged") || response.message || "Email успешно изменен");
      setIsEditingEmail(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (error: any) {
      // Получаем сообщение об ошибке с бэкенда
      const backendMessage = error?.message || error?.response?.data?.message || "";
      
      // Маппинг сообщений об ошибках на ключи переводов
      let translationKey = "common.error";
      
      if (backendMessage.includes("Authentication required") || backendMessage.includes("Not authenticated")) {
        translationKey = "admin.emailChangeAuthError";
      } else if (backendMessage.includes("required") && backendMessage.includes("email") && backendMessage.includes("password")) {
        translationKey = "admin.emailChangeFieldsRequired";
      } else if (backendMessage.includes("email format") || backendMessage.includes("Invalid email")) {
        translationKey = "admin.emailChangeInvalidFormat";
      } else if (backendMessage.includes("User not found") || backendMessage.includes("account not found")) {
        translationKey = "admin.emailChangeUserNotFound";
      } else if (backendMessage.includes("password") && (backendMessage.includes("incorrect") || backendMessage.includes("Invalid password"))) {
        translationKey = "admin.emailChangeInvalidPassword";
      } else if (backendMessage.includes("different from") || backendMessage.includes("must be different")) {
        translationKey = "admin.emailChangeSameEmail";
      } else if (backendMessage.includes("already registered") || backendMessage.includes("already in use")) {
        translationKey = "admin.emailChangeEmailInUse";
      }
      
      // Показываем переведенное сообщение или оригинальное, если перевода нет
      const translatedMessage = t(translationKey);
      const finalMessage = translatedMessage !== translationKey ? translatedMessage : backendMessage || t("common.error");
      toast.error(finalMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-6 space-y-6">
          {/* Change Email */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-1">{t("admin.emailSectionTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t("admin.emailSectionDescription")}</p>
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
                      <Label htmlFor="newEmail">{t("admin.newEmail")}</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        autoComplete="email"
                        placeholder={t("admin.newEmail")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword" className="flex items-center gap-2">
                        <FiLock className="h-4 w-4" />
                        {t("admin.currentPasswordForEmail")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="emailPassword"
                          type={showEmailPassword ? "text" : "password"}
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          autoComplete="current-password"
                          placeholder={t("admin.enterPasswordToChangeEmail")}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showEmailPassword ? (
                            <FiEyeOff className="h-4 w-4" />
                          ) : (
                            <FiEye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
                        disabled={!emailPassword || !newEmail.trim() || newEmail.trim() === user?.email}
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
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("admin.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("admin.confirmNewPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                  value={settings?.language || i18nInstance.language.split('-')[0] || 'ru'} 
                  onValueChange={handleLanguageChange}
                  disabled={settingsLoading || isUpdating || isLanguageChanging}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("admin.interfaceLanguage")} />
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

          {/* Support Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("admin.supportSettings") || "Настройки поддержки"}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supportWhatsAppNumber">{t("admin.supportWhatsAppNumber") || "Номер WhatsApp для поддержки"}</Label>
                <Input
                  id="supportWhatsAppNumber"
                  type="tel"
                  value={supportWhatsAppNumber}
                  onChange={(e) => setSupportWhatsAppNumber(e.target.value)}
                  placeholder="+7 700 123 4567"
                />
                <p className="text-xs text-muted-foreground">
                  {t("admin.supportWhatsAppNumberDescription") || "Этот номер будет доступен всем компаниям в их настройках. Для Pro плана - приоритетная поддержка"}
                </p>
                <Button
                  onClick={async () => {
                    const validation = validateSupportPhone(supportWhatsAppNumber);
                    if (!validation.valid) {
                      toast.error(validation.error || t("admin.supportPhoneInvalid"));
                      return;
                    }
                    try {
                      await updateSettings({ supportWhatsAppNumber: supportWhatsAppNumber.trim() });
                      toast.success(t("admin.settingsSaved"));
                    } catch (error: any) {
                      toast.error(error.message || t("common.error"));
                    }
                  }}
                  disabled={isUpdating || supportWhatsAppNumber === settings?.supportWhatsAppNumber}
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </Card>

        </main>
      </div>
    </div>
  );
};
export default AdminSettings;

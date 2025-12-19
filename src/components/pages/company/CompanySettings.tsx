'use client';

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiUpload, FiX, FiEdit2, FiLock } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useCompany, useUpdateCompany } from "@/lib/query";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import { setUser } from "@/lib/redux/slices/authSlice";
import type { UserRole } from "@/types";
import { validatePasswordStrength } from "@/lib/utils/validation";
import { compressImage, validateFileSize, validateImageType } from "@/lib/utils/imageCompression";

const CompanySettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const { data: company, isLoading, refetch: refetchCompany } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { mutate: updateCompany } = useUpdateCompany({
    onSuccess: () => {
      toast.success(t("company.settingsSaved"));
      refetchCompany();
    },
    onError: (error: any) => {
      toast.error(error?.message || t("company.settingsSaveError"));
    },
  });
  
  // Инициализируем имя компании и логотип при загрузке
  useEffect(() => {
    if (company?.name) {
      setCompanyName(company.name);
    }
    if (company?.logoUrl) {
      setLogoPreview(company.logoUrl);
    } else {
      // Сбрасываем превью, если логотип был удален
      setLogoPreview(null);
      setLogoFile(null);
    }
  }, [company]);
  
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка типа файла
      if (!validateImageType(file)) {
        toast.error(t("company.logoInvalidFormat"));
        return;
      }
      // Проверка размера (макс 5MB)
      if (!validateFileSize(file, 5)) {
        toast.error(t("company.logoTooLarge"));
        return;
      }
      
      setIsCompressing(true);
      try {
        // Сжимаем изображение до 200x200px и максимум 500KB
        const compressedBase64 = await compressImage(file, 200, 200, 0.8, 500);
        setLogoFile(file);
        setLogoPreview(compressedBase64);
      } catch (error: any) {
        toast.error(error?.message || t("company.logoUploadError"));
      } finally {
        setIsCompressing(false);
      }
    }
  };
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
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
      toast.success(t("company.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      // Обработка различных типов ошибок
      let errorMessage = t("company.passwordChangeError");
      
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

  const handleLanguageChange = (lang: string) => {
    i18nInstance.changeLanguage(lang);
  };

  const handleEmailEdit = () => {
    setIsEditingEmail(true);
    setNewEmail(company?.adminEmail || "");
  };

  const handleEmailCancel = () => {
    setIsEditingEmail(false);
    setNewEmail("");
    setEmailPassword("");
  };

  const handleEmailSave = async () => {
    if (!emailPassword) {
      toast.error(t("company.passwordRequiredForEmailChange"));
      return;
    }
    if (!newEmail || newEmail === company?.adminEmail) {
      toast.error(t("company.emailNotChanged"));
      return;
    }
    
    try {
      const response = await authService.changeEmail({
        newEmail,
        password: emailPassword,
      });
      
      // Обновляем пользователя в Redux
      if (response.data?.user) {
        setUser({
          ...response.data.user,
          role: response.data.user.role as UserRole,
          companyId: response.data.user.companyId
            ? String(response.data.user.companyId)
            : undefined,
        });
      }
      
      toast.success(t("company.emailChanged"));
      setIsEditingEmail(false);
      setEmailPassword("");
      // Обновляем компанию, чтобы получить новый adminEmail
      refetchCompany();
    } catch (error: any) {
      // Обработка различных типов ошибок
      let errorMessage = t("company.emailChangeError");
      
      if (error?.message) {
        const message = error.message.toLowerCase();
        if (message.includes("incorrect") || message.includes("invalid password")) {
          errorMessage = t("auth.passwordInvalid") || "Неверный пароль";
        } else if (message.includes("already") || message.includes("registered")) {
          errorMessage = t("auth.userEmailAlreadyExists");
        } else if (message.includes("format") || message.includes("invalid email")) {
          errorMessage = t("auth.invalidEmail");
        } else if (message.includes("same") || message.includes("different")) {
          errorMessage = t("admin.emailChangeSameEmail");
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!user?.companyId) {
      toast.error(t("common.error"));
      return;
    }
    
    // Обновляем имя компании, если оно изменилось
    if (companyName && companyName !== company?.name) {
      updateCompany({
        id: user.companyId,
        updates: { name: companyName },
      });
    }
    
    // Загрузка логотипа
    if (logoFile && logoPreview) {
      // logoPreview уже содержит сжатую base64 строку
      try {
        await updateCompany({
          id: user?.companyId || 0,
          updates: { logoUrl: logoPreview },
        });
        toast.success(t("company.logoUploaded"));
        setLogoFile(null); // Сбрасываем файл после успешной загрузки
      } catch (error) {
        toast.error(t("company.logoUploadError"));
      }
    } else if (logoPreview === null && company?.logoUrl) {
      // Удаление логотипа
      await updateCompany({
        id: user?.companyId || 0,
        updates: { logoUrl: "" },
      });
    }
    
    if (!companyName || companyName === company?.name) {
      toast.success(t("company.settingsSaved"));
    }
  };
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <CompanyHeader />
      <div className="flex flex-col">
        <main className="container flex-1 p-6 space-y-6">
          {/* Company Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("company.companyInfo")}</h3>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>{t("company.companyLogo")}</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-muted">
                          <Image
                            src={logoPreview}
                            alt={t("company.companyLogo")}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-border rounded-full flex items-center justify-center bg-muted">
                        <FiUpload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                    >
                      <FiUpload className="h-4 w-4 mr-2" />
                      {isCompressing ? t("common.loading") || "Загрузка..." : (logoPreview ? t("company.changeLogo") : t("company.uploadLogo"))}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("company.logoDescription")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.companyName")}</Label>
                <Input 
                  id="name" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="organization" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">{t("auth.adminEmail")}</Label>
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
                      value={company?.adminEmail || user?.email || ""}
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
                        placeholder={t("auth.adminEmail")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword" className="flex items-center gap-2">
                        <FiLock className="h-4 w-4" />
                        {t("company.currentPasswordForEmail")}
                      </Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder={t("company.enterPasswordToChangeEmail")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("company.passwordRequiredToChangeEmail")}
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
                        disabled={!emailPassword || !newEmail || newEmail === company?.adminEmail}
                      >
                        {t("common.save")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Input
                    id="email"
                    type="email"
                    value={company?.adminEmail || ""}
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
            <h3 className="text-lg font-semibold mb-6">{t("company.changePassword")}</h3>
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
                value={user?.email || company?.adminEmail || ""}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
              />
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("company.currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("company.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("company.confirmNewPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                {t("company.changePassword")}
              </Button>
            </form>
          </Card>

          {/* Project Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("company.projectSettings")}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("company.interfaceLanguage")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("company.interfaceLanguageDescription")}
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
              {/* Полноэкранный режим */}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("company.fullscreenMode")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("company.fullscreenModeDescription")}
                  </p>
                </div>
                <Switch 
                  checked={company?.fullscreenMode ?? false} 
                  onCheckedChange={(checked) => {
                    if (user?.companyId) {
                      updateCompany({
                        id: user.companyId,
                        updates: { fullscreenMode: checked },
                      });
                    }
                  }} 
                />
              </div>
            </div>
          </Card>
          {/* Danger Zone */}
          <Card className="p-6 border-destructive">
            <h3 className="text-lg font-semibold text-destructive mb-6">{t("company.dangerZone")}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t("company.deleteCompany")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("company.deleteCompanyWarning")}
                  </p>
                </div>
                <Button variant="destructive">{t("common.delete")}</Button>
              </div>
            </div>
          </Card>
          <div className="flex justify-end gap-3">
            <Button variant="outline">{t("common.cancel")}</Button>
            <Button onClick={handleSave}>{t("company.saveChanges")}</Button>
          </div>
        </main>
      </div>
    </div>
  );
};
export default CompanySettings;

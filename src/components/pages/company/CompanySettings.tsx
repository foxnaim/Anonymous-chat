'use client';

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiUpload, FiX, FiEdit2 } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useCompany, useUpdateCompany } from "@/lib/query";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import { validatePasswordStrength } from "@/lib/utils/validation";
import { compressImage, validateFileSize, validateImageType } from "@/lib/utils/imageCompression";

import { useFullscreenContext } from "@/components/providers/FullscreenProvider";

const CompanySettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const { isFullscreen } = useFullscreenContext();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const { data: company, refetch: refetchCompany } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  const { mutate: updateCompany } = useUpdateCompany({
    onSuccess: () => {
      setIsEditingEmail(false);
      setEmailPassword("");
      toast.success(t("company.settingsSaved"));
      refetchCompany();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("common.error"));
    },
  });

  useEffect(() => {
    if (company) {
      setLogoPreview(company.logoUrl || null);
      if (company.adminEmail) {
        setNewEmail(company.adminEmail);
      }
      if (company.name) {
        setCompanyName(company.name);
      }
    }
  }, [company]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (!validateFileSize(file, 5)) {
      toast.error(t("company.fileTooLarge"));
      return;
    }

    // Validate image type
    if (!validateImageType(file)) {
      toast.error(t("company.invalidFileType"));
      return;
    }

    try {
      setIsCompressing(true);
      // compressImage возвращает base64 строку (string), а не File
      // Поэтому сохраняем оригинальный файл для отправки на сервер
      const compressedBase64String: string = await compressImage(file);
      
      // Сохраняем base64 строку для preview
      setLogoPreview(compressedBase64String);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error(t("company.imageProcessingError"));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user?.companyId) return;

    try {
      const updates: Record<string, any> = {};

      // Имя компании
      if (companyName && companyName !== company?.name) {
        updates.name = companyName;
      }

      // Логотип: отправляем base64, если меняли; если удалили — пустую строку
      const hasBase64Logo = typeof logoPreview === "string" && logoPreview.startsWith("data:image/");
      const removedLogo = logoPreview === null && company?.logoUrl;

      if (hasBase64Logo) {
        updates.logoUrl = logoPreview;
      } else if (removedLogo) {
        updates.logoUrl = "";
      }

      await updateCompany({
        id: user.companyId,
        updates,
      });

      toast.success(t("company.settingsSaved"));
      refetchCompany();
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordsDoNotMatch"));
      return;
    }

    if (!validatePasswordStrength(newPassword)) {
      toast.error(t("auth.passwordRequirements"));
      return;
    }

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(t("auth.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("common.error"));
    }
  };
  
  const handleEmailChange = async () => {
    if (!user?.companyId) return;
    
    if (!emailPassword) {
      toast.error(t("company.passwordRequired"));
      return;
    }
    
    try {
      // Здесь должен быть вызов API для смены email с подтверждением пароля
      // Пока что просто имитация
      toast.success(t("company.emailUpdateLinkSent"));
      setIsEditingEmail(false);
      setEmailPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("common.error"));
    }
  };

  const handleLanguageChange = (value: string) => {
    i18nInstance.changeLanguage(value);
    localStorage.setItem('i18nextLng', value);
  };

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${isFullscreen ? 'h-auto overflow-y-auto' : ''}`}>
      <CompanyHeader />
      <div className={`flex flex-col ${isFullscreen ? 'h-auto block' : ''}`}>
        <main className={`container flex-1 p-6 space-y-6 ${isFullscreen ? 'h-auto overflow-visible block' : ''}`}>
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
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleLogoChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                    >
                      {isCompressing ? t("common.processing") : t("company.changeLogo")}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      <span className="font-medium">{t("company.logoRequirements")}:</span>{" "}
                      {t("company.logoRequirementsHint")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">{t("company.companyName")}</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t("company.companyName")}
                />
              </div>

              {/* Admin Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="adminEmail">{t("company.adminEmail")}</Label>
                  {!isEditingEmail && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={() => setIsEditingEmail(true)}
                    >
                      <FiEdit2 className="mr-2 h-3 w-3" />
                      {t("common.edit")}
                    </Button>
                  )}
                </div>
                
                {isEditingEmail ? (
                  <div className="space-y-4 p-4 border rounded-md bg-muted/30 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">{t("company.newEmail")}</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="new@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">{t("company.currentPassword")}</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsEditingEmail(false);
                          setNewEmail(company?.adminEmail || "");
                          setEmailPassword("");
                        }}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleEmailChange}
                        disabled={!newEmail || !emailPassword || newEmail === company?.adminEmail}
                      >
                        {t("common.save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm font-medium">
                    {company?.adminEmail || user?.email}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Password Change */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("company.changePassword")}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordChange();
              }}
            >
              <div className="space-y-4">
                {/* Hidden username field for accessibility/autocomplete context */}
                <input
                  type="email"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="username"
                  defaultValue={company?.adminEmail || user?.email || ""}
                />
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t("company.currentPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("company.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("company.confirmNewPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                  >
                    {t("company.updatePassword")}
                  </Button>
                </div>
              </div>
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

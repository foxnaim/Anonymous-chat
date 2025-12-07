'use client';

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiCopy, FiShare2, FiCheckCircle, FiHome, FiUpload, FiX } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useCompany } from "@/lib/query";
import { toast } from "sonner";
import { useFullscreen } from "@/hooks/use-fullscreen";

const CompanySettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(
    user?.role === "company" || user?.role === "admin" || user?.role === "super_admin" ? user.role : null
  );
  const { data: company, isLoading } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка типа файла
      if (!file.type.startsWith("image/")) {
        toast.error(t("company.logoInvalidFormat"));
        return;
      }
      // Проверка размера (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("company.logoTooLarge"));
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      toast.error("Заполните все поля");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }
    // В реальном приложении здесь будет API вызов
    toast.success(t("company.passwordChanged"));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLanguageChange = (lang: string) => {
    i18nInstance.changeLanguage(lang);
  };

  const handleSave = async () => {
    // В реальном приложении здесь будет API вызов для сохранения логотипа
    if (logoFile) {
      // Здесь будет загрузка файла на сервер
      // await companyService.uploadLogo(user?.companyId, logoFile);
    }
    toast.success(t("company.settingsSaved"));
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
    <div className="min-h-screen bg-background">
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
                        <Image
                          src={logoPreview}
                          alt={t("company.companyLogo")}
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
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
                    >
                      <FiUpload className="h-4 w-4 mr-2" />
                      {logoPreview ? t("company.changeLogo") : t("company.uploadLogo")}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("company.logoDescription")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.companyName")}</Label>
                <Input id="name" defaultValue={company?.name} autoComplete="organization" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">{t("company.companyCode")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={company?.code || ""}
                    disabled
                    className="text-lg font-mono tracking-wider font-bold uppercase"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (company?.code) {
                        navigator.clipboard.writeText(company.code);
                        setCopied(true);
                        toast.success(t("company.codeCopied"));
                        if (timeoutRef.current) {
                          clearTimeout(timeoutRef.current);
                        }
                        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                  >
                    {copied ? (
                      <FiCheckCircle className="h-4 w-4 text-secondary" />
                    ) : (
                      <FiCopy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("company.codeDescription")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.adminEmail")}</Label>
                <Input id="email" type="email" defaultValue={company?.adminEmail} autoComplete="email" />
              </div>
            </div>
          </Card>
          {/* Company Code Sharing */}
          {company && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiHome className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{t("company.codeForEmployees")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("company.shareCodeWithEmployees")}
                    </p>
                  </div>
                </div>
                <div className="bg-background border border-border rounded-lg p-6 space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">{t("company.companyCode")}</Label>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-2xl font-mono font-bold text-primary bg-muted px-4 py-3 rounded-md tracking-wider">
                        {company.code}
                      </code>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(company.code);
                          setCopied(true);
                          toast.success(t("company.codeCopiedToClipboard"));
                          if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                          }
                          timeoutRef.current = setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? (
                          <>
                            <FiCheckCircle className="h-4 w-4 mr-2" />
                            {t("company.copied")}
                          </>
                        ) : (
                          <>
                            <FiCopy className="h-4 w-4 mr-2" />
                            {t("company.copy")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">{t("company.shareLink")}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?code=${company.code}`}
                        readOnly
                        className="font-mono text-sm"
                        autoComplete="off"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?code=${company.code}`;
                          navigator.clipboard.writeText(link);
                          toast.success(t("company.linkCopied"));
                        }}
                      >
                        <FiShare2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("company.linkDescription")}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">{t("company.howToUse")}:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{t("company.howToUseStep1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{t("company.howToUseStep2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{t("company.howToUseStep3")}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {/* Change Password */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("company.changePassword")}</h3>
            <div className="space-y-4">
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
              <Button onClick={handlePasswordChange} className="w-full sm:w-auto">
                {t("company.changePassword")}
              </Button>
            </div>
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
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("company.fullscreenMode")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("company.fullscreenModeDescription")}
                  </p>
                </div>
                <Switch checked={isFullscreen} onCheckedChange={toggleFullscreen} />
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

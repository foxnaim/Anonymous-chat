'use client';

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FiUpload, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { useCompany, useUpdateCompany, useUpdateCompanyPassword, useDeleteCompany, useSupportInfo } from "@/lib/query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import { validatePasswordStrength } from "@/lib/utils/validation";
import { compressImage, validateFileSize, validateImageType } from "@/lib/utils/imageCompression";

import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";

const CompanySettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { isFullscreen } = useFullscreenContext();
  const permissions = usePlanPermissions();
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  
  const { data: company, refetch: refetchCompany } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });

  // Получаем номер WhatsApp поддержки от админа
  const { data: supportInfo } = useSupportInfo();

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

  const { mutateAsync: updateCompanyPassword, isPending: isUpdatingPassword } = useUpdateCompanyPassword({
    onSuccess: () => {
      toast.success(t("auth.passwordUpdated"));
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error?.message || t("common.error"));
    },
  });

  const { mutateAsync: deleteCompany, isPending: isDeleting } = useDeleteCompany({
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      toast.success(t("admin.companyDeleted") || t("company.companyDeleted") || "Компания удалена");
      // Перенаправляем на главную страницу после удаления компании
      router.push("/");
    },
    onError: (error: any) => {
      const backendMessage = error?.message || error?.response?.data?.error?.message || error?.response?.data?.message || "";
      const errorStatus = error?.status || error?.response?.status;
      const msgLower = backendMessage.toLowerCase();
      
      // Если 404 - компания уже удалена, это нормально
      const isNotFound = errorStatus === 404 || 
                        backendMessage.includes("Company not found") || 
                        backendMessage.includes("not found");
      
      if (isNotFound) {
        toast.success(t("admin.companyDeleted") || t("company.companyDeleted") || "Компания удалена");
        router.push("/");
      } else {
        // Маппинг сообщений об ошибках
        let errorMessage = backendMessage || t("common.error");
        
        // Проверка на недостаточные права доступа
        if (backendMessage.includes("Access denied") || 
            backendMessage.includes("Forbidden") ||
            backendMessage.includes("Insufficient permissions") ||
            msgLower.includes("insufficient permissions") ||
            msgLower.includes("access denied") ||
            msgLower.includes("forbidden") ||
            errorStatus === 403) {
          errorMessage = t("auth.accessDenied") || "Доступ запрещен. У вас нет прав для выполнения этого действия.";
        } else if (backendMessage.includes("Invalid password") || 
                   msgLower.includes("invalid password") ||
                   errorStatus === 401) {
          errorMessage = t("auth.invalidPassword") || t("auth.loginError") || "Неверный пароль";
          // Очищаем поле пароля при ошибке
          setDeletePassword("");
        } else if (backendMessage.includes("Password is required") || 
                   msgLower.includes("password is required")) {
          errorMessage = t("company.passwordRequired") || t("auth.passwordRequired") || "Пароль обязателен";
        }
        
        toast.error(errorMessage);
      }
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
      if (user?.role === "super_admin" && user?.companyId) {
        await updateCompanyPassword({
          id: user.companyId,
          password: newPassword,
        });
      } else {
        await authService.changePassword({
          currentPassword,
          newPassword,
        });
        toast.success(t("auth.passwordUpdated"));
        setCurrentPassword("");
      }
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error?.message || t("common.error"));
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
                      {isCompressing ? t("company.processing") : t("company.changeLogo")}
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

              {/* Ссылка на поддержку от админа */}
              {supportInfo?.supportWhatsAppNumber && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label>{t("company.contactSupport") || "Связаться с поддержкой"}</Label>
                  <a
                    href={`https://wa.me/${supportInfo.supportWhatsAppNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                  >
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      {supportInfo.supportWhatsAppNumber}
                    </span>
                    {permissions.isPro && (
                      <Badge variant="default" className="ml-auto text-xs bg-green-600">
                        {t("company.prioritySupport") || "Приоритетная"}
                      </Badge>
                    )}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {t("company.contactSupportDescription") || "Нажмите, чтобы открыть чат в WhatsApp"}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Password Change - для суперадмина без подтверждения старого, с предупреждением */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t("company.changePassword")}</h3>
            {user?.role === "super_admin" && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t("admin.superAdminPasswordWarning") || "Внимание: вы меняете пароль компании без подтверждения старого. Администратор компании потеряет доступ со старым паролем."}
                </p>
              </div>
            )}
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
                {user?.role !== "super_admin" && (
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
                )}
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
                    disabled={
                      (user?.role !== "super_admin" && (!currentPassword || !newPassword || !confirmPassword)) ||
                      (user?.role === "super_admin" && (!newPassword || !confirmPassword)) ||
                      isUpdatingPassword
                    }
                  >
                    {isUpdatingPassword ? t("common.loading") : t("company.updatePassword")}
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
                <Button 
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <FiTrash2 className="h-4 w-4 mr-2" />
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </Card>
          <div className="flex justify-end gap-3">
            <Button variant="outline">{t("common.cancel")}</Button>
            <Button onClick={handleSave}>{t("company.saveChanges")}</Button>
          </div>
        </main>
      </div>

      {/* Delete Company Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletePassword("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("company.deleteCompany") || t("admin.deleteCompany") || "Удалить компанию"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("company.deleteCompanyWarning") || t("admin.deleteCompanyWarning") || "Вы уверены, что хотите удалить эту компанию? Это действие нельзя отменить. Все данные компании будут безвозвратно удалены."}
              {company && (
                <span className="block mt-2 font-semibold text-foreground">
                  {company.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {user?.role === "company" && (
              <div className="space-y-2">
                <Label htmlFor="deletePassword">{t("company.currentPassword") || "Текущий пароль"}</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t("company.enterPasswordToDelete") || "Введите пароль для подтверждения удаления"}
                  autoComplete="current-password"
                />
                <p className="text-xs text-muted-foreground">
                  {t("company.passwordRequiredToDelete") || "Для удаления компании требуется подтверждение паролем"}
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletePassword("");
            }}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (user?.companyId) {
                  // Проверяем пароль для администраторов компании
                  if (user.role === "company" && !deletePassword) {
                    toast.error(t("company.passwordRequired") || t("auth.passwordRequired") || "Пароль обязателен");
                    return;
                  }
                  
                  try {
                    await deleteCompany({
                      id: user.companyId,
                      password: user.role === "company" ? deletePassword : undefined,
                    });
                  } catch (error) {
                    // Ошибка уже обработана в onError хука
                    console.error("[CompanySettings] Failed to delete company:", error);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting || (user?.role === "company" && !deletePassword)}
            >
              {isDeleting ? t("common.loading") : (t("company.deleteCompany") || t("admin.deleteCompany") || "Удалить")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default CompanySettings;

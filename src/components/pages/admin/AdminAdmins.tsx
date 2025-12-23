'use client';

import { useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiPlus, FiShield, FiTrash2, FiEdit2, FiEye, FiEyeOff, FiAlertTriangle } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAdmins, useDeleteAdmin, useCreateAdmin, useUpdateAdmin } from "@/lib/query";
import type { AdminUser } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/redux";
import { validatePasswordStrength } from "@/lib/utils/validation";

const AdminAdmins = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const { data: admins = [], isLoading, refetch } = useAdmins();
  const [adminsLocal, setAdminsLocal] = useState<AdminUser[]>(admins);
  const [editAdmin, setEditAdmin] = useState<{
    id: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  } | null>(null);
  const [createAdmin, setCreateAdmin] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const { user } = useAuth();

  // Синхронизируем с моковыми данными
  useEffect(() => {
    setAdminsLocal(admins);
  }, [admins]);

  // Сбрасываем состояние при закрытии модальных окон
  useEffect(() => {
    if (!isDialogOpen) {
      setCreateAdmin({ name: "", email: "", password: "", confirmPassword: "" });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isEditOpen) {
      setEditAdmin(null);
      setShowEditPassword(false);
      setShowEditConfirmPassword(false);
    }
  }, [isEditOpen]);

  // Фильтруем супер-админа из списка (он управляется через настройки)
  const filteredAdmins = adminsLocal.filter(admin => admin.role !== "super_admin");
  
  const createAdminMutation = useCreateAdmin({
    onSuccess: async (newAdmin) => {
      // Закрываем модальное окно и очищаем форму
      setIsDialogOpen(false);
      setCreateAdmin({ name: "", email: "", password: "", confirmPassword: "" });
      setShowPassword(false);
      setShowConfirmPassword(false);
      
      // Принудительно обновляем список админов
      await refetch();
      
      toast.success(t("common.success"));
    },
    onError: async (error: any) => {
      // apiClient выбрасывает ApiError: { message: string, status: number, code?: string }
      const backendMessage = String(error?.message || "").trim();
      const errorStatus = error?.status || 0;
      
      // Маппинг сообщений об ошибках - проверяем в строгом порядке приоритета
      let errorMessage = "";
      const msgLower = backendMessage.toLowerCase();
      
      // 1. Проверка имени админа
      if (backendMessage.includes("Admin with this name already exists") || 
          (msgLower.includes("name") && msgLower.includes("already exists") && msgLower.includes("admin"))) {
        errorMessage = t("auth.adminNameAlreadyExists");
      }
      // 2. Проверка email админа
      else if (backendMessage.includes("Admin with this email already exists") || 
               (msgLower.includes("email") && msgLower.includes("already exists") && msgLower.includes("admin"))) {
        errorMessage = t("auth.adminEmailAlreadyExists");
      }
      // 3. Проверка email компании
      else if (backendMessage.includes("Company with this email already exists") || 
               (msgLower.includes("email") && msgLower.includes("already exists") && msgLower.includes("company"))) {
        errorMessage = t("auth.companyEmailAlreadyExists");
      }
      // 4. Проверка email пользователя
      else if (backendMessage.includes("User with this email already exists") || 
               (msgLower.includes("user") && msgLower.includes("already exists")) ||
               (msgLower.includes("email") && msgLower.includes("already exists") && !msgLower.includes("company") && !msgLower.includes("admin"))) {
        errorMessage = t("auth.userEmailAlreadyExists");
      }
      // 5. Остальные ошибки
      else if (backendMessage.includes("Email is required") || msgLower.includes("required")) {
        errorMessage = t("auth.emailAndPasswordRequired");
      }
      else if (backendMessage.includes("Access denied")) {
        errorMessage = t("auth.accessDenied");
      }
      else if (errorStatus === 409) {
        errorMessage = "Данные уже существуют. Проверьте уникальность имени и email.";
      }
      else if (backendMessage && !backendMessage.includes("HTTP error")) {
        errorMessage = backendMessage;
      }
      else {
        errorMessage = t("admin.createError") || t("common.error");
      }
      
      // Если ошибка 409 (Conflict), обновляем список чтобы показать существующего админа
      if (errorStatus === 409) {
        await refetch();
      }
      
      toast.error(errorMessage);
    },
  });

  const updateAdminMutation = useUpdateAdmin({
    onSuccess: () => {
      toast.success(t("common.success"));
      setIsEditOpen(false);
      setEditAdmin(null);
      setShowEditPassword(false);
      setShowEditConfirmPassword(false);
      // Явно обновляем список админов
      refetch();
    },
    onError: (error: any) => {
      // Получаем сообщение об ошибке с бэкенда
      const backendMessage = error?.message || error?.response?.data?.error?.message || "";
      
      // Маппинг сообщений об ошибках на ключи переводов
      let translationKey = "admin.updateError";
      
      if (backendMessage.includes("Admin with this email already exists") || backendMessage.includes("admin already exists")) {
        translationKey = "auth.adminEmailAlreadyExists";
      } else if (backendMessage.includes("User with this email already exists") || backendMessage.includes("user already exists")) {
        translationKey = "auth.userEmailAlreadyExists";
      } else if (backendMessage.includes("Access denied")) {
        translationKey = "auth.accessDenied";
      }
      
      // Показываем переведенное сообщение или оригинальное, если перевода нет
      const translatedMessage = t(translationKey);
      const finalMessage = translatedMessage !== translationKey ? translatedMessage : backendMessage || t("admin.updateError");
      toast.error(finalMessage);
    },
  });

  const deleteAdminMutation = useDeleteAdmin({
    onSuccess: (_, adminId) => {
      toast.success(t("admin.adminDeleted"));
      setAdminsLocal(prev => prev.filter(admin => admin.id !== adminId));
      // Явно обновляем список админов
      refetch();
    },
    onError: () => {
      toast.error(t("admin.deleteError"));
    },
  });

  const handleDeleteClick = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (adminToDelete) {
      deleteAdminMutation.mutate(adminToDelete.id);
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setAdminToDelete(null);
  };

  const handleCreate = () => {
    const { name, email, password, confirmPassword } = createAdmin;

    // Проверка заполненности полей
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error(t("common.fillAllFields"));
      return;
    }

    // Проверка валидности email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    // Проверка надежности пароля
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      // Показываем первую ошибку
      const firstError = passwordValidation.errors[0];
      toast.error(firstError || t("auth.passwordWeak"));
      return;
    }

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    // Создаем админа через API (пароль не передается, бэкенд создаст дефолтный)
    createAdminMutation.mutate({
      email,
      name,
      role: "admin",
    });
  };

  const handleEdit = () => {
    if (!editAdmin) return;
    
    const { name, email, password, confirmPassword } = editAdmin;

    // Проверка заполненности обязательных полей
    if (!name.trim() || !email.trim()) {
      toast.error(t("common.fillAllFields"));
      return;
    }

    // Проверка валидности email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    // Если пароль введен, проверяем его
    if (password.trim()) {
      // Проверка надежности пароля
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        // Показываем первую ошибку
        const firstError = passwordValidation.errors[0];
        toast.error(firstError || t("auth.passwordWeak"));
        return;
      }

      // Проверка совпадения паролей
      if (password !== confirmPassword) {
        toast.error(t("auth.passwordMismatch"));
        return;
      }
      // Примечание: изменение пароля через этот endpoint не поддерживается
      // Нужен отдельный endpoint для смены пароля
    }

    // Обновляем админа через API
    updateAdminMutation.mutate({
      id: editAdmin.id,
      data: {
        name,
        // role можно добавить, если нужно
      },
    });
  };
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        {user?.role !== "super_admin" ? (
          <div className="container px-4 sm:px-6 py-8">
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">{t("admin.superAdminOnly")}</p>
            </Card>
          </div>
        ) : (
          <>
            <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">{t("admin.admins")}</h2>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                <FiPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("admin.addAdmin")}</span>
                <span className="sm:hidden">{t("common.add")}</span>
              </Button>
            </div>
            <main className="container flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t("common.loading")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAdmins.map((admin) => (
                    <Card key={admin.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {admin.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{admin.name}</p>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              <FiShield className="h-3 w-3 mr-1" />
                              {admin.role === "super_admin" ? t("admin.superAdmin") : t("admin.administrator")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>{t("admin.created")}: {new Date(admin.createdAt).toLocaleDateString("ru-RU")}</p>
                            {admin.lastLogin && (
                              <p>{t("admin.lastLogin")}: {new Date(admin.lastLogin).toLocaleDateString("ru-RU")}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditAdmin({
                                id: admin.id,
                                name: admin.name,
                                email: admin.email,
                                password: "",
                                confirmPassword: "",
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(admin)}
                            className="text-destructive"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </main>
          </>
        )}
      </div>
      {/* Add Admin Dialog */}
      <Transition show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsDialogOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all p-6">
                  <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
                    {t("admin.addAdmin")}
                  </Dialog.Title>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreate();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>{t("admin.name")}</Label>
                      <Input
                        placeholder={t("admin.adminNamePlaceholder")}
                        autoComplete="name"
                        value={createAdmin.name}
                        onChange={(e) => setCreateAdmin({ ...createAdmin, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("auth.email")}</Label>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        autoComplete="username"
                        value={createAdmin.email}
                        onChange={(e) => setCreateAdmin({ ...createAdmin, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("auth.password")}</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          autoComplete="new-password"
                          value={createAdmin.password}
                          onChange={(e) => setCreateAdmin({ ...createAdmin, password: e.target.value })}
                          className="pr-10"
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FiEye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("auth.passwordMinLength", { length: 8 }) || "Минимум 8 символов"}
                      </p>
                    </div>
                    <div>
                      <Label>{t("auth.confirmPassword")}</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="********"
                          autoComplete="new-password"
                          value={createAdmin.confirmPassword}
                          onChange={(e) => setCreateAdmin({ ...createAdmin, confirmPassword: e.target.value })}
                          className="pr-10"
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FiEye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                    >
                      {t("common.create")}
                    </Button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Admin Dialog */}
      <Transition show={isEditOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsEditOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all p-6">
                  <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
                    {t("common.edit")}
                  </Dialog.Title>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleEdit();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>{t("admin.name")}</Label>
                      <Input
                        placeholder={t("admin.adminNamePlaceholder")}
                        autoComplete="name"
                        value={editAdmin?.name || ""}
                        onChange={(e) => setEditAdmin((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                      />
                    </div>
                    <div>
                      <Label>{t("auth.email")}</Label>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        autoComplete="username"
                        value={editAdmin?.email || ""}
                        onChange={(e) => setEditAdmin((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                      />
                    </div>
                    <div>
                      <Label>{t("auth.password")}</Label>
                      <div className="relative">
                        <Input
                          type={showEditPassword ? "text" : "password"}
                          placeholder={t("auth.password")}
                          autoComplete="new-password"
                          value={editAdmin?.password || ""}
                          onChange={(e) => setEditAdmin((prev) => prev ? { ...prev, password: e.target.value } : prev)}
                          className="pr-10"
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          {showEditPassword ? (
                            <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FiEye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("auth.passwordMinLength", { length: 8 }) || "Минимум 8 символов"}
                      </p>
                    </div>
                    <div>
                      <Label>{t("auth.confirmPassword")}</Label>
                      <div className="relative">
                        <Input
                          type={showEditConfirmPassword ? "text" : "password"}
                          placeholder={t("auth.confirmPassword")}
                          autoComplete="new-password"
                          value={editAdmin?.confirmPassword || ""}
                          onChange={(e) => setEditAdmin((prev) => prev ? { ...prev, confirmPassword: e.target.value } : prev)}
                          className="pr-10"
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                        >
                          {showEditConfirmPassword ? (
                            <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FiEye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" className="flex-1" disabled={!editAdmin}>
                        {t("common.save")}
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Dialog */}
      <Transition show={isDeleteDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleDeleteCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <FiAlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-foreground">
                      {t("admin.confirmDelete") || "Подтвердите удаление"}
                    </Dialog.Title>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {adminToDelete && (
                        <>
                          {t("admin.deleteAdminWarning", { 
                            name: adminToDelete.name, 
                            email: adminToDelete.email 
                          }) || `Вы уверены, что хотите удалить администратора "${adminToDelete.name}" (${adminToDelete.email})? Это действие нельзя отменить.`}
                        </>
                      )}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={handleDeleteCancel}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleDeleteConfirm}
                        disabled={deleteAdminMutation.isPending}
                      >
                        {deleteAdminMutation.isPending ? t("common.loading") : (t("common.delete") || "Удалить")}
                      </Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
export default AdminAdmins;

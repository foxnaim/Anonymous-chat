'use client';

import { useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiPlus, FiShield, FiTrash2, FiEdit2 } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAdmins } from "@/lib/query";
import type { AdminUser } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/redux";
const AdminAdmins = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { data: admins = [], isLoading } = useAdmins();
  const [adminsLocal, setAdminsLocal] = useState<AdminUser[]>(admins);
  const [editAdmin, setEditAdmin] = useState<{
    id: string;
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [createAdmin, setCreateAdmin] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { user } = useAuth();

  // Синхронизируем с моковыми данными
  useEffect(() => {
    setAdminsLocal(admins);
  }, [admins]);

  // Фильтруем супер-админа из списка (он управляется через настройки)
  const filteredAdmins = adminsLocal.filter(admin => admin.role !== "super_admin");
  const handleDelete = async (adminId: string) => {
    // В реальном приложении здесь будет API вызов
    toast.success(t("admin.adminDeleted"));
    
  };

  const handleCreate = (name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      name,
      email,
      role: "admin",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    setAdminsLocal((prev) => [...prev, newAdmin]);
    toast.success(t("common.success"));
    setCreateAdmin({ name: "", email: "", password: "" });
    setIsDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editAdmin) return;
    if (!editAdmin.name.trim() || !editAdmin.email.trim()) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    setAdminsLocal((prev) =>
      prev.map((adm) =>
        adm.id === editAdmin.id
          ? { ...adm, name: editAdmin.name, email: editAdmin.email }
          : adm
      )
    );
    toast.success(t("common.success"));
    setIsEditOpen(false);
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
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(admin.id)}
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
                  <div className="space-y-4">
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
                      <Input
                        type="password"
                        placeholder="********"
                        autoComplete="new-password"
                        value={createAdmin.password}
                        onChange={(e) => setCreateAdmin({ ...createAdmin, password: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("auth.passwordMinLength", { length: 6 }) || "Минимум 6 символов"}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleCreate(createAdmin.name, createAdmin.email, createAdmin.password)}
                    >
                      {t("common.create")}
                    </Button>
                  </div>
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
                  <div className="space-y-4">
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
                      <Input
                        type="password"
                        placeholder="********"
                        autoComplete="new-password"
                        value={editAdmin?.password || ""}
                        onChange={(e) => setEditAdmin((prev) => prev ? { ...prev, password: e.target.value } : prev)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("auth.passwordMinLength", { length: 6 }) || "Минимум 6 символов"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button className="flex-1" onClick={handleEdit} disabled={!editAdmin}>
                        {t("common.save")}
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

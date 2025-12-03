'use client';

import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiPlus, FiShield, FiTrash2 } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAdmins } from "@/lib/query";
import { toast } from "sonner";
const AdminAdmins = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: admins = [], isLoading } = useAdmins();
  const filteredAdmins = admins;
  const handleDelete = async (adminId: string) => {
    // В реальном приложении здесь будет API вызов
    toast.success(t("admin.adminDeleted"));
    
  };
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col min-h-screen overflow-x-hidden">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(admin.id)}
                      className="text-destructive"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
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
                      <Input placeholder={t("admin.adminNamePlaceholder")} autoComplete="name" />
                    </div>
                    <div>
                      <Label>{t("auth.email")}</Label>
                      <Input type="email" placeholder="admin@example.com" autoComplete="username" />
                    </div>
                    <div>
                      <Label>{t("admin.role")}</Label>
                      <select className="w-full p-2 border rounded-md bg-background">
                        <option value="admin">{t("admin.administrator")}</option>
                        <option value="super_admin">{t("admin.superAdminFull")}</option>
                      </select>
                    </div>
                    <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                      {t("common.create")}
                    </Button>
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

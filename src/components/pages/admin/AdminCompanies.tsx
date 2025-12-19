'use client';

import { useState, useEffect, Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiX,
  FiCopy,
  FiEdit,
  FiDownload,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiAlertCircle,
  FiSettings,
  FiTrash2,
} from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { AdminHeader } from "@/components/AdminHeader";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useUpdateCompanyStatus,
  useUpdateCompanyPlan,
  useDeleteCompany,
  usePlans,
  useCompanyStats,
} from "@/lib/query";
import { getTranslatedValue } from "@/lib/utils/translations";
import { toast } from "sonner";
import type { Company, CompanyStatus, PlanType } from "@/types";
import { validatePasswordStrength } from "@/lib/utils/validation";

// Константы
const COMPANY_STATUS: Record<string, CompanyStatus> = {
  ACTIVE: "Активна",
  TRIAL: "Пробная",
  BLOCKED: "Заблокирована",
};

const ITEMS_PER_PAGE = 10;

const AdminCompanies = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Модальные окна
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  
  // Формы
  const [newCompany, setNewCompany] = useState({
    name: "",
    adminEmail: "",
    code: "",
    password: "",
    plan: "Пробный" as PlanType,
    employees: 0,
    messagesLimit: 10,
    storageLimit: 1,
  });
  
  const [editCompany, setEditCompany] = useState({
    name: "",
    adminEmail: "",
    code: "",
    status: COMPANY_STATUS.ACTIVE as CompanyStatus,
    plan: "Пробный" as PlanType,
    employees: 0,
    messagesLimit: 10,
    storageLimit: 1,
  });
  
  const [selectedStatus, setSelectedStatus] = useState<CompanyStatus>(COMPANY_STATUS.ACTIVE);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("Пробный");
  const [planEndDate, setPlanEndDate] = useState<string>("");

  const { data: companies = [], isLoading, refetch } = useCompanies();
  const { data: plans = [] } = usePlans();
  const { data: companyStats } = useCompanyStats(selectedCompany?.id || "", {
    enabled: !!selectedCompany?.id,
  });

  const { mutateAsync: createCompany, isPending: isCreating } = useCreateCompany({
    onSuccess: async () => {
      await refetch();
      setIsCreateOpen(false);
      resetNewCompanyForm();
      toast.success(t("admin.companyCreated") || "Компания создана");
    },
    onError: (error: any) => {
      // apiClient выбрасывает ApiError: { message: string, status: number, code?: string }
      const backendMessage = String(error?.message || "").trim();
      const errorStatus = error?.status || 0;
      
      // Маппинг сообщений об ошибках - проверяем в строгом порядке приоритета
      let errorMessage = "";
      const msgLower = backendMessage.toLowerCase();
      
      // 1. Проверка кода компании (самая специфичная)
      if (backendMessage.includes("Company with this code already exists") || 
          (msgLower.includes("code") && msgLower.includes("already exists"))) {
        errorMessage = t("auth.companyCodeAlreadyExists");
      }
      // 2. Проверка имени компании
      else if (backendMessage.includes("Company with this name already exists") || 
               (msgLower.includes("name") && msgLower.includes("already exists") && msgLower.includes("company"))) {
        errorMessage = t("auth.companyNameAlreadyExists");
      }
      // 3. Проверка email компании
      else if (backendMessage.includes("Company with this email already exists") || 
               (msgLower.includes("email") && msgLower.includes("already exists") && msgLower.includes("company"))) {
        errorMessage = t("auth.companyEmailAlreadyExists");
      }
      // 4. Проверка email админа
      else if (backendMessage.includes("Admin with this email already exists") || 
               (msgLower.includes("email") && msgLower.includes("already exists") && msgLower.includes("admin"))) {
        errorMessage = t("auth.adminEmailAlreadyExists");
      }
      // 5. Проверка email пользователя
      else if (backendMessage.includes("User with this email already exists") || 
               (msgLower.includes("user") && msgLower.includes("already exists")) ||
               (msgLower.includes("email") && msgLower.includes("already exists") && !msgLower.includes("company") && !msgLower.includes("admin"))) {
        errorMessage = t("auth.userEmailAlreadyExists");
      }
      // 6. Остальные ошибки
      else if (backendMessage.includes("Name, code, adminEmail, and password are required") || 
               msgLower.includes("required")) {
        errorMessage = t("auth.companyFieldsRequired");
      }
      else if (backendMessage.includes("Password must be at least")) {
        errorMessage = t("auth.passwordMinLength", { length: 8 });
      }
      else if (backendMessage.includes("Access denied")) {
        errorMessage = t("auth.accessDenied");
      }
      // 7. Если статус 409, но сообщение не распознано
      else if (errorStatus === 409) {
        errorMessage = "Данные уже существуют. Проверьте уникальность имени, email и кода компании.";
      }
      // 8. Если есть сообщение, показываем его
      else if (backendMessage && !backendMessage.includes("HTTP error")) {
        errorMessage = backendMessage;
      }
      // 9. Общая ошибка
      else {
        errorMessage = t("common.error") || "Произошла ошибка при создании компании";
      }
      
      // Всегда показываем toast с ошибкой
      toast.error(errorMessage);
    },
  });

  const { mutateAsync: deleteCompany, isPending: isDeleting } = useDeleteCompany({
    onSuccess: async () => {
      await refetch();
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
      if (isViewOpen) {
        setIsViewOpen(false);
      }
      toast.success(t("admin.companyDeleted") || "Компания удалена");
    },
    onError: (error: any) => {
      // Получаем сообщение об ошибке с бэкенда
      const backendMessage = error?.message || error?.response?.data?.error?.message || "";
      
      // Маппинг сообщений об ошибках на ключи переводов
      let translationKey = "common.error";
      
      if (backendMessage.includes("Company with this code already exists") || backendMessage.includes("code already exists")) {
        translationKey = "auth.companyCodeAlreadyExists";
      } else if (backendMessage.includes("User with this email already exists") || backendMessage.includes("user already exists")) {
        translationKey = "auth.userEmailAlreadyExists";
      } else if (backendMessage.includes("Name, code, adminEmail, and password are required") || backendMessage.includes("required")) {
        translationKey = "auth.companyFieldsRequired";
      } else if (backendMessage.includes("Password must be at least 8 characters") || backendMessage.includes("Password must be at least 6 characters")) {
        translationKey = "auth.passwordMinLength";
      } else if (backendMessage.includes("Access denied")) {
        translationKey = "auth.accessDenied";
      }
      
      // Показываем переведенное сообщение или оригинальное, если перевода нет
      const translatedMessage = t(translationKey);
      const finalMessage = translatedMessage !== translationKey ? translatedMessage : backendMessage || t("common.error");
      toast.error(finalMessage);
    },
  });

  const { mutateAsync: updateCompany, isPending: isUpdating } = useUpdateCompany({
    onSuccess: async () => {
      await refetch();
      setIsEditOpen(false);
      toast.success(t("common.success"));
    },
    onError: (error: any) => {
      // Получаем сообщение об ошибке с бэкенда
      const backendMessage = error?.message || error?.response?.data?.error?.message || "";
      
      // Маппинг сообщений об ошибках на ключи переводов
      let translationKey = "common.error";
      
      if (backendMessage.includes("Company with this code already exists") || backendMessage.includes("code already exists")) {
        translationKey = "auth.companyCodeAlreadyExists";
      } else if (backendMessage.includes("User with this email already exists") || backendMessage.includes("user already exists")) {
        translationKey = "auth.userEmailAlreadyExists";
      } else if (backendMessage.includes("Name, code, adminEmail, and password are required") || backendMessage.includes("required")) {
        translationKey = "auth.companyFieldsRequired";
      } else if (backendMessage.includes("Password must be at least 8 characters") || backendMessage.includes("Password must be at least 6 characters")) {
        translationKey = "auth.passwordMinLength";
      } else if (backendMessage.includes("Access denied")) {
        translationKey = "auth.accessDenied";
      }
      
      // Показываем переведенное сообщение или оригинальное, если перевода нет
      const translatedMessage = t(translationKey);
      const finalMessage = translatedMessage !== translationKey ? translatedMessage : backendMessage || t("common.error");
      toast.error(finalMessage);
    },
  });

  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateCompanyStatus({
    onSuccess: async () => {
      await refetch();
      setIsStatusModalOpen(false);
      toast.success(t("common.success"));
    },
    onError: (error: any) => {
      // Получаем сообщение об ошибке с бэкенда
      const backendMessage = error?.message || error?.response?.data?.error?.message || "";
      
      // Маппинг сообщений об ошибках на ключи переводов
      let translationKey = "common.error";
      
      if (backendMessage.includes("Company with this code already exists") || backendMessage.includes("code already exists")) {
        translationKey = "auth.companyCodeAlreadyExists";
      } else if (backendMessage.includes("User with this email already exists") || backendMessage.includes("user already exists")) {
        translationKey = "auth.userEmailAlreadyExists";
      } else if (backendMessage.includes("Name, code, adminEmail, and password are required") || backendMessage.includes("required")) {
        translationKey = "auth.companyFieldsRequired";
      } else if (backendMessage.includes("Password must be at least 8 characters") || backendMessage.includes("Password must be at least 6 characters")) {
        translationKey = "auth.passwordMinLength";
      } else if (backendMessage.includes("Access denied")) {
        translationKey = "auth.accessDenied";
      }
      
      // Показываем переведенное сообщение или оригинальное, если перевода нет
      const translatedMessage = t(translationKey);
      const finalMessage = translatedMessage !== translationKey ? translatedMessage : backendMessage || t("common.error");
      toast.error(finalMessage);
    },
  });

  const { mutateAsync: updatePlan, isPending: isUpdatingPlan } = useUpdateCompanyPlan({
    onSuccess: async () => {
      await refetch();
      setIsPlanModalOpen(false);
      setPlanEndDate("");
      toast.success(t("admin.planUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("admin.planUpdateError"));
    },
  });

  const generateCode = () =>
    Math.random().toString(36).slice(2, 10).toUpperCase();

  const resetNewCompanyForm = () => {
    setNewCompany({
      name: "",
      adminEmail: "",
      code: generateCode(),
      password: "",
      plan: "Пробный",
      employees: 0,
      messagesLimit: 10,
      storageLimit: 1,
    });
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.code.toLowerCase().includes(searchQuery.toLowerCase());

    const status = company.status.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && status === t("admin.active").toLowerCase()) ||
      (statusFilter === "blocked" && status === t("admin.blocked").toLowerCase());

    const matchesPlan =
      planFilter === "all" || company.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case t("admin.active"):
        return "bg-success text-white";
      case t("admin.blocked"):
        return "bg-accent text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleCreate = async () => {
    if (!newCompany.name || !newCompany.adminEmail || !newCompany.code || !newCompany.password) {
      toast.error(t("common.fillAllFields"));
      return;
    }

    if (newCompany.code.length !== 8) {
      toast.error(t("auth.companyCodeLength"));
      return;
    }

    // Проверка надежности пароля
    const passwordValidation = validatePasswordStrength(newCompany.password);
    if (!passwordValidation.isValid) {
      // Показываем первую ошибку
      const firstError = passwordValidation.errors[0];
      toast.error(firstError || t("auth.passwordTooWeak"));
      return;
    }

    // Добавляем обязательное поле status при создании компании
    // Используем mutateAsync - ошибка будет обработана в onError
    await createCompany({
      ...newCompany,
      status: selectedStatus,
    }).catch((error) => {
      // Дополнительная обработка, если onError не сработал
      // onError должен обработать, но на всякий случай показываем общую ошибку
      if (!error?.handled) {
        toast.error(error?.message || t("common.error"));
      }
    });
  };

  const handleEdit = async () => {
    if (!selectedCompany || !editCompany.name || !editCompany.adminEmail || !editCompany.code) {
      toast.error(t("common.fillAllFields"));
      return;
    }

    if (editCompany.code.length !== 8) {
      toast.error(t("auth.companyCodeLength"));
      return;
    }

    await updateCompany({
      id: selectedCompany.id,
      updates: editCompany,
    });
  };

  const handleStatusChange = async () => {
    if (!selectedCompany) return;
    await updateStatus({
      id: selectedCompany.id,
      status: selectedStatus,
    });
  };

  const handlePlanChange = async () => {
    if (!selectedCompany) return;
    await updatePlan({
      id: selectedCompany.id,
      plan: selectedPlan,
      planEndDate: planEndDate || undefined,
    });
  };

  const openEditModal = useCallback((company: Company) => {
    setSelectedCompany(company);
    setEditCompany({
      name: company.name,
      adminEmail: company.adminEmail || "",
      code: company.code,
      status: company.status,
      plan: company.plan as PlanType,
      employees: company.employees || 0,
      messagesLimit: company.messagesLimit || 10,
      storageLimit: company.storageLimit || 1,
    });
    setIsEditOpen(true);
  }, []);

  const openStatusModal = useCallback((company: Company) => {
    setSelectedCompany(company);
    setSelectedStatus(company.status);
    setIsStatusModalOpen(true);
  }, []);

  const openPlanModal = useCallback((company: Company) => {
    setSelectedCompany(company);
    setSelectedPlan(company.plan as PlanType);
    setPlanEndDate(company.trialEndDate || "");
    setIsPlanModalOpen(true);
  }, []);

  const openViewModal = useCallback((company: Company) => {
    setSelectedCompany(company);
    setIsViewOpen(true);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    // Используем requestIdleCallback для неблокирующей операции
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        navigator.clipboard.writeText(text).then(() => {
          toast.success(t("common.copy"));
        });
      });
    } else {
      setTimeout(() => {
        navigator.clipboard.writeText(text).then(() => {
          toast.success(t("common.copy"));
        });
      }, 0);
    }
  }, [t]);

  const exportToCSV = useCallback(() => {
    const headers = ["Название", "Код", "Email", "Статус", "План", "Сотрудники", "Сообщений", "Регистрация"];
    const rows = filteredCompanies.map((c) => [
      c.name,
      c.code,
      c.adminEmail || "",
      c.status,
      c.plan,
      c.employees || 0,
      c.messages || 0,
      c.registered,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `companies_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Используем requestIdleCallback для неблокирующего показа toast
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        toast.success(t("admin.dataExported"));
      });
    } else {
      setTimeout(() => {
        toast.success(t("admin.dataExported"));
      }, 0);
    }
  }, [filteredCompanies]);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {t("admin.companies")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("admin.manageCompanies")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="hidden sm:flex"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                {t("admin.export")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <FiRefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetNewCompanyForm();
                  setIsCreateOpen(true);
                }}
              >
                <FiPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("admin.createCompany")}</span>
                <span className="sm:hidden">{t("common.create")}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="border-b border-border bg-card px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.searchCompanies")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as typeof statusFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("admin.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="active">{t("admin.active")}</SelectItem>
                <SelectItem value="blocked">{t("admin.blocked")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={planFilter}
              onValueChange={(value) => {
                setPlanFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("admin.plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={getTranslatedValue(plan.name)}>
                    {getTranslatedValue(plan.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {t("common.all")}: {filteredCompanies.length} {t("admin.companies").toLowerCase()}
          </div>
        </div>

        {/* Companies Table */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.companyName")}
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.adminEmail")}
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Код
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.status")}
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.plan")}
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.employees")}
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.totalMessages")}
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.registration")}
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                      {t("admin.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        {t("admin.loadingCompanies")}
                      </td>
                    </tr>
                  ) : paginatedCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        {t("admin.companiesNotFound")}
                      </td>
                    </tr>
                  ) : (
                    paginatedCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold">
                              {company.name.charAt(0)}
                            </div>
                            <span className="font-medium text-foreground">{company.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {company.adminEmail || "—"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {company.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(company.code)}
                            >
                              <FiCopy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(company.status)}>
                            {company.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{company.plan}</Badge>
                        </td>
                        <td className="p-4 text-sm">{company.employees || 0}</td>
                        <td className="p-4 text-sm">{company.messages || 0}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {company.registered}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openViewModal(company)}
                            >
                              <FiEye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(company)}
                            >
                              <FiEdit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <FiMoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openStatusModal(company)}>
                                  <FiAlertCircle className="h-4 w-4 mr-2" />
                                  {t("admin.changeStatus")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPlanModal(company)}>
                                  <FiSettings className="h-4 w-4 mr-2" />
                                  {t("admin.changePlan")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => copyToClipboard(company.code)}
                                >
                                  <FiCopy className="h-4 w-4 mr-2" />
                                  {t("common.copy")} код
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCompanyToDelete(company);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <FiTrash2 className="h-4 w-4 mr-2" />
                                  {t("admin.deleteCompany") || "Удалить компанию"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {t("common.all")} {filteredCompanies.length} {t("admin.companies").toLowerCase()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      requestAnimationFrame(() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                      });
                    }}
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {currentPage} из {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      requestAnimationFrame(() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      });
                    }}
                    disabled={currentPage === totalPages}
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create Company Modal */}
      <Transition show={isCreateOpen} as={Fragment}>
        <Dialog onClose={() => setIsCreateOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-card rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold">
                    {t("admin.createCompany")}
                  </Dialog.Title>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreate();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label>{t("admin.companyName")}</Label>
                    <Input
                      value={newCompany.name}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, name: e.target.value })
                      }
                      placeholder="Введите название компании"
                    />
                  </div>
                  <div>
                    <Label>{t("admin.adminEmail")}</Label>
                    <Input
                      type="email"
                      value={newCompany.adminEmail}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, adminEmail: e.target.value })
                      }
                      placeholder="admin@company.com"
                    />
                  </div>
                  <div>
                    <Label>Код компании (8 символов)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCompany.code}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            code: e.target.value.toUpperCase().slice(0, 8),
                          })
                        }
                        placeholder="XXXXXXXX"
                        maxLength={8}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          setNewCompany({ ...newCompany, code: generateCode() })
                        }
                      >
                        Сгенерировать
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>{t("admin.plan")}</Label>
                    <Select
                      value={newCompany.plan}
                      onValueChange={(value) =>
                        setNewCompany({ ...newCompany, plan: value as PlanType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem
                            key={plan.id}
                            value={getTranslatedValue(plan.name)}
                          >
                            {getTranslatedValue(plan.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Пароль администратора</Label>
                    <Input
                      type="password"
                      value={newCompany.password}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, password: e.target.value })
                      }
                      placeholder="Минимум 6 символов"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <Label>{t("admin.employees")}</Label>
                    <Input
                      type="number"
                      value={newCompany.employees}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          employees: parseInt(e.target.value) || 0,
                        })
                      }
                      min={0}
                    />
                  </div>
                  {newCompany.plan !== "Пробный" && (
                    <>
                      <div>
                        <Label>{t("admin.messagesLimit")}</Label>
                        <Input
                          type="number"
                          value={newCompany.messagesLimit}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              messagesLimit: parseInt(e.target.value) || 0,
                            })
                          }
                          min={0}
                        />
                      </div>
                      <div>
                        <Label>{t("admin.storageLimit")}</Label>
                        <Input
                          type="number"
                          value={newCompany.storageLimit}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              storageLimit: parseFloat(e.target.value) || 0,
                            })
                          }
                          min={0}
                          step={0.1}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? t("common.loading") : t("common.create")}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Company Modal */}
      <Transition show={isEditOpen} as={Fragment}>
        <Dialog onClose={() => setIsEditOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-card rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold">
                    {t("common.edit")} {t("admin.companies").toLowerCase()}
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditOpen(false)}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>{t("admin.companyName")}</Label>
                    <Input
                      value={editCompany.name}
                      onChange={(e) =>
                        setEditCompany({ ...editCompany, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("admin.adminEmail")}</Label>
                    <Input
                      type="email"
                      value={editCompany.adminEmail}
                      onChange={(e) =>
                        setEditCompany({ ...editCompany, adminEmail: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Код компании (8 символов)</Label>
                    <Input
                      value={editCompany.code}
                      onChange={(e) =>
                        setEditCompany({
                          ...editCompany,
                          code: e.target.value.toUpperCase().slice(0, 8),
                        })
                      }
                      maxLength={8}
                      className="font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("admin.status")}</Label>
                      <Select
                        value={editCompany.status}
                        onValueChange={(value) =>
                          setEditCompany({ ...editCompany, status: value as CompanyStatus })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={COMPANY_STATUS.ACTIVE}>
                            {t("admin.active")}
                          </SelectItem>
                          <SelectItem value={COMPANY_STATUS.BLOCKED}>
                            {t("admin.blocked")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("admin.plan")}</Label>
                      <Select
                        value={editCompany.plan}
                        onValueChange={(value) =>
                          setEditCompany({ ...editCompany, plan: value as PlanType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem
                              key={plan.id}
                              value={getTranslatedValue(plan.name)}
                            >
                              {getTranslatedValue(plan.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{t("admin.employees")}</Label>
                    <Input
                      type="number"
                      value={editCompany.employees}
                      onChange={(e) =>
                        setEditCompany({
                          ...editCompany,
                          employees: parseInt(e.target.value) || 0,
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>{t("admin.messagesLimit")}</Label>
                    <Input
                      type="number"
                      value={editCompany.messagesLimit}
                      onChange={(e) =>
                        setEditCompany({
                          ...editCompany,
                          messagesLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>{t("admin.storageLimit")}</Label>
                    <Input
                      type="number"
                      value={editCompany.storageLimit}
                      onChange={(e) =>
                        setEditCompany({
                          ...editCompany,
                          storageLimit: parseFloat(e.target.value) || 0,
                        })
                      }
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleEdit} disabled={isUpdating}>
                    {isUpdating ? t("common.loading") : t("common.save")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* View Company Modal */}
      <Transition show={isViewOpen} as={Fragment}>
        <Dialog onClose={() => setIsViewOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl bg-card rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold">
                    {t("admin.companyDetails")}
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsViewOpen(false)}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCompany && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.companyName")}
                        </div>
                        <div className="text-lg font-semibold">{selectedCompany.name}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.adminEmail")}
                        </div>
                        <div className="text-lg">{selectedCompany.adminEmail || "—"}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">Код</div>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono">{selectedCompany.code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(selectedCompany.code)}
                          >
                            <FiCopy className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.status")}
                        </div>
                        <Badge className={getStatusColor(selectedCompany.status)}>
                          {selectedCompany.status}
                        </Badge>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.plan")}
                        </div>
                        <div className="text-lg">{selectedCompany.plan}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.registration")}
                        </div>
                        <div className="text-lg">{selectedCompany.registered}</div>
                      </Card>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.employees")}
                        </div>
                        <div className="text-2xl font-bold">{selectedCompany.employees || 0}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.totalMessages")}
                        </div>
                        <div className="text-2xl font-bold">{selectedCompany.messages || 0}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t("admin.messagesThisMonth")}
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedCompany.messagesThisMonth || 0}
                        </div>
                      </Card>
                    </div>
                    {companyStats && (
                      <Card className="p-4">
                        <div className="text-sm font-semibold mb-3">
                          {t("admin.usageStats")}
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t("checkStatus.new")}
                            </div>
                            <div className="text-lg font-semibold">{companyStats.new}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t("checkStatus.inProgress")}
                            </div>
                            <div className="text-lg font-semibold">{companyStats.inProgress}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t("checkStatus.resolved")}
                            </div>
                            <div className="text-lg font-semibold">{companyStats.resolved}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t("common.all")}
                            </div>
                            <div className="text-lg font-semibold">{companyStats.total}</div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                    {t("common.close")}
                  </Button>
                  {selectedCompany && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setCompanyToDelete(selectedCompany);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={isDeleting}
                      >
                        <FiTrash2 className="h-4 w-4 mr-2" />
                        {t("admin.deleteCompany") || "Удалить"}
                      </Button>
                      <Button onClick={() => openEditModal(selectedCompany)}>
                        <FiEdit className="h-4 w-4 mr-2" />
                        {t("common.edit")}
                      </Button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Status Change Modal */}
      <Transition show={isStatusModalOpen} as={Fragment}>
        <Dialog onClose={() => setIsStatusModalOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-card rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold">
                    {t("admin.changeStatus")}
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsStatusModalOpen(false)}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCompany && (
                  <div className="space-y-4">
                    <div>
                      <Label>Компания</Label>
                      <div className="text-lg font-semibold mt-1">{selectedCompany.name}</div>
                    </div>
                    <div>
                      <Label>{t("admin.status")}</Label>
                      <Select
                        value={selectedStatus}
                        onValueChange={(value) =>
                          setSelectedStatus(value as CompanyStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={COMPANY_STATUS.ACTIVE}>
                            {t("admin.active")}
                          </SelectItem>
                          <SelectItem value={COMPANY_STATUS.BLOCKED}>
                            {t("admin.blocked")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleStatusChange} disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? t("common.loading") : t("common.save")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Plan Change Modal */}
      <Transition show={isPlanModalOpen} as={Fragment}>
        <Dialog onClose={() => setIsPlanModalOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-card rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold">
                    {t("admin.changePlan")}
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPlanModalOpen(false)}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCompany && (
                  <div className="space-y-4">
                    <div>
                      <Label>Компания</Label>
                      <div className="text-lg font-semibold mt-1">{selectedCompany.name}</div>
                    </div>
                    <div>
                      <Label>{t("admin.plan")}</Label>
                      <Select
                        value={selectedPlan}
                        onValueChange={(value) => setSelectedPlan(value as PlanType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem
                              key={plan.id}
                              value={getTranslatedValue(plan.name)}
                            >
                              {getTranslatedValue(plan.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("admin.planEndDate")}</Label>
                      <Input
                        type="date"
                        value={planEndDate}
                        onChange={(e) => setPlanEndDate(e.target.value)}
                        placeholder={t("admin.planEndDateDescription")}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("admin.planEndDateDescription")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handlePlanChange} disabled={isUpdatingPlan}>
                    {isUpdatingPlan ? t("common.loading") : t("common.save")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Company Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteCompany") || "Удалить компанию"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.deleteCompanyWarning") || "Вы уверены, что хотите удалить эту компанию? Это действие нельзя отменить. Все данные компании будут безвозвратно удалены."}
              {companyToDelete && (
                <span className="block mt-2 font-semibold text-foreground">
                  {companyToDelete.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setCompanyToDelete(null);
            }}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (companyToDelete) {
                  await deleteCompany(companyToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? t("common.loading") : (t("admin.deleteCompany") || "Удалить")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCompanies;


'use client';

import { useState, useEffect, useRef, Fragment } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
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
  FiFilter,
  FiPlus,
  FiX,
  FiCopy,
  FiEdit,
  FiCheck,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
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
import { useCompanies, useCreateCompany, useDeleteCompany, usePlans, companyService } from "@/lib/query";
import { getTranslatedValue } from "@/lib/utils/translations";
import { toast } from "sonner";
import type { CompanyStatus, PlanType } from "@/types";
import { validatePasswordStrength } from "@/lib/utils/validation";

// Константы статусов компании
const COMPANY_STATUS: Record<string, CompanyStatus> = {
  ACTIVE: "Активна",
  TRIAL: "Пробная",
  BLOCKED: "Заблокирована",
};

const PLAN_OPTIONS = ["Пробный", "Стандарт", "Бизнес"] as const;

const AdminPanel = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [planEndDate, setPlanEndDate] = useState<string>("");
  const detailCloseRef = useRef<HTMLButtonElement | null>(null);
  const createCloseRef = useRef<HTMLButtonElement | null>(null);
  const viewCloseRef = useRef<HTMLButtonElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    adminEmail: "",
    code: "",
    password: "",
    plan: "Пробный" as (typeof PLAN_OPTIONS)[number],
  });

  const { data: companies = [], isLoading, refetch } = useCompanies();
  const { data: plans = [] } = usePlans();
  const { mutateAsync: createCompany, isPending: isCreating } = useCreateCompany({
    onSuccess: async (data) => {
      await refetch();
      setSelectedCompanyId(data.id);
      setIsCreateOpen(false);
      toast.success(t("admin.createCompany"));
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
        errorMessage = t("auth.companyConflictError") || "Данные уже существуют. Проверьте уникальность имени, email и кода компании.";
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
      setIsViewOpen(false);
      setIsDeleteDialogOpen(false);
      setSelectedCompanyId(null);
      toast.success(t("admin.companyDeleted") || "Компания удалена");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const generateCode = () =>
    Math.random().toString(36).slice(2, 10).toUpperCase();

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.code.toLowerCase().includes(searchQuery.toLowerCase());

    // Сравниваем напрямую с реальными значениями статусов из БД, а не с переводами
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && company.status === COMPANY_STATUS.ACTIVE) ||
      (statusFilter === "blocked" && company.status === COMPANY_STATUS.BLOCKED);

    return matchesSearch && matchesStatus;
  });

  // Определяем мобильный режим, чтобы не рендерить мобильный модал на десктопе
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case t("admin.active"):
        return "bg-success text-white"; /* Green */
      case t("admin.blocked"):
        return "bg-accent text-white"; /* #F64C72 */
      default:
        return "bg-muted text-muted-foreground"; /* #99738E */
    }
  };

  // Автовыбор первой компании при загрузке и после фильтра / поиска (только для десктопа)
  useEffect(() => {
    // На мобильных устройствах не выбираем автоматически - панель не должна открываться сама
    if (isMobile) {
      return;
    }
    if (filteredCompanies.length === 0) {
      setSelectedCompanyId(null);
      return;
    }
    // Если нет выбранной компании, выбираем первую
    if (!selectedCompanyId) {
      setSelectedCompanyId(filteredCompanies[0].id);
      return;
    }
    // Если выбранная компания ушла из списка, выбираем первую
    const exists = filteredCompanies.some((c) => c.id === selectedCompanyId);
    if (!exists) {
      setSelectedCompanyId(filteredCompanies[0].id);
    }
  }, [filteredCompanies, selectedCompanyId, isMobile]);

  const selectedCompanyData =
    (selectedCompanyId && filteredCompanies.find((c) => c.id === selectedCompanyId)) ||
    null;
  
  // Для мобильных: определяем, показывать ли модальное окно (только при явном выборе)
  const shouldShowMobileModal = selectedCompanyId !== null && isMobile;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <AdminHeader />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 border-b border-border bg-card">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{t("admin.companies")}</h2>
          </div>
        </header>

        {/* Main Dashboard */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Companies List */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">
            <div className="flex-shrink-0 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">{t("admin.companies")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t("admin.manageCompanies")}
                </p>
              </div>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => {
                setNewCompany((prev) => ({ ...prev, code: generateCode() }));
                setIsCreateOpen(true);
              }}>
                <FiPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("admin.createCompany")}</span>
                <span className="sm:hidden">{t("common.create")}</span>
              </Button>
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 relative">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.searchCompanies")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  autoComplete="off"
                />
              </div>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`flex-shrink-0 ${isFilterOpen ? "ring-2 ring-ring" : ""}`}
                  onClick={() => setIsFilterOpen((v) => !v)}
                >
                  <FiFilter className="h-4 w-4" />
                </Button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-10">
                    {[
                      { key: "all", label: t("common.all") },
                      { key: "active", label: t("admin.active") },
                      { key: "blocked", label: t("admin.blocked") },
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition ${
                          statusFilter === item.key ? "text-primary font-semibold" : "text-foreground"
                        }`}
                        onClick={() => {
                          setStatusFilter(item.key as typeof statusFilter);
                          setIsFilterOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Desktop Table */}
              <div className="hidden lg:block flex-1 overflow-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b border-border text-left bg-muted/30">
                    <th className="p-4 text-sm font-medium text-muted-foreground">{t("admin.companyName")}</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">{t("admin.adminEmail")}</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">{t("admin.status")}</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">{t("admin.plan")}</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">{t("admin.registration")}</th>
                  </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          {t("admin.loadingCompanies")}
                        </td>
                      </tr>
                    ) : filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          {t("admin.companiesNotFound")}
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company, index) => (
                        <tr
                          key={company.id}
                          className={`border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors relative ${
                            selectedCompanyId === company.id ? "bg-primary/5 border-l-4 border-l-primary" : "bg-card"
                          }`}
                          onClick={() => setSelectedCompanyId(company.id)}
                        >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {selectedCompanyId === company.id && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>
                            )}
                            <div className="w-10 h-10 rounded-full bg-[#553D67] flex items-center justify-center text-white font-semibold relative overflow-hidden flex-shrink-0">
                              {company.logoUrl ? (
                                <Image
                                  src={company.logoUrl}
                                  alt={company.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                company.name.charAt(0)
                              )}
                              {selectedCompanyId === company.id && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background z-10">
                                  <FiCheck className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`font-medium ${selectedCompanyId === company.id ? "text-primary" : "text-foreground"}`}>
                              {company.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{company.adminEmail || "—"}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(company.status)}>{company.status}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20">
                            {company.plan}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{company.registered}</span>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden flex-1 overflow-auto space-y-3 p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("admin.loadingCompanies")}
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("admin.companiesNotFound")}
                  </div>
                ) : (
                  filteredCompanies.map((company, index) => (
                    <Card
                      key={company.id}
                      className={`p-4 cursor-pointer transition-colors relative ${
                        selectedCompanyId === company.id ? "bg-primary/5 border-primary border-2" : "border-border"
                      }`}
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      {selectedCompanyId === company.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <FiCheck className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold flex-shrink-0 relative">
                          {company.name.charAt(0)}
                          {selectedCompanyId === company.id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                              <FiCheck className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium truncate ${selectedCompanyId === company.id ? "text-primary" : "text-foreground"}`}>
                            {company.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{company.adminEmail || "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getStatusColor(company.status)} text-xs`}>{company.status}</Badge>
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20 text-xs">
                          {company.plan}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{company.registered}</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Company Detail Panel - Desktop */}
          <aside className="hidden lg:block w-96 border-l border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("admin.companyDetails")}</h4>
              
              {selectedCompanyData ? (
                <Card
                  key={selectedCompanyData.id}
                  className="p-4 space-y-4 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold text-lg">
                      {selectedCompanyData.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-foreground">{selectedCompanyData.name}</h5>
                      <p className="text-sm text-muted-foreground">{selectedCompanyData.adminEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {selectedCompanyData.code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedCompanyData.code);
                            toast.success(t("common.copy") || "Скопировано");
                          }}
                        >
                          <FiCopy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("admin.status")}</p>
                    <Badge className={getStatusColor(selectedCompanyData.status)}>
                      {selectedCompanyData.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("admin.plan")}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedCompanyData.plan}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setSelectedPlan(selectedCompanyData.plan);
                          setPlanEndDate(selectedCompanyData.trialEndDate || "");
                          setIsPlanModalOpen(true);
                        }}
                      >
                        <FiEdit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("admin.totalMessages")}</span>
                    <span className="text-sm font-semibold">{selectedCompanyData.messages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("admin.registration")}</span>
                    <span className="text-sm font-semibold">{selectedCompanyData.registered}</span>
                  </div>
                </div>
              </Card>
              ) : (
                <Card className="p-4">
                  <p className="text-muted-foreground text-center">{t("admin.selectCompany")}</p>
                </Card>
              )}
            </div>

            <div className="space-y-3">
              {selectedCompanyData && (
                <>
                  {selectedCompanyData.status === COMPANY_STATUS.ACTIVE ? (
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.BLOCKED);
                          toast.success(t("admin.companyBlocked"));
                          refetch();
                        } catch (error) {
                          toast.error(t("admin.blockError"));
                        }
                      }}
                    >
                      {t("admin.blockCompany")}
                    </Button>
                  ) : selectedCompanyData.status === COMPANY_STATUS.BLOCKED ? (
                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.ACTIVE);
                          toast.success(t("admin.companyActivated"));
                          refetch();
                        } catch (error) {
                          toast.error(t("admin.activateError"));
                        }
                      }}
                    >
                      {t("admin.activateCompany")}
                    </Button>
                  ) : selectedCompanyData.status === COMPANY_STATUS.TRIAL ? (
                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.ACTIVE);
                          toast.success(t("admin.companyActivated"));
                          refetch();
                        } catch (error) {
                          toast.error(t("admin.activateError"));
                        }
                      }}
                    >
                      {t("admin.activateCompany")}
                    </Button>
                  ) : null}
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => {
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={isDeleting}
                  >
                    <FiTrash2 className="h-4 w-4 mr-2" />
                    {t("admin.deleteCompany") || "Удалить компанию"}
                  </Button>
                </>
              )}
            </div>

              <Card
                key={`usage-${selectedCompanyData?.id ?? "none"}`}
                className="p-4 bg-muted transition"
              >
              <h5 className="font-semibold text-sm mb-3">{t("admin.usageStats")}</h5>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t("admin.messagesThisMonth")}</span>
                    <span className="font-semibold">
                      {selectedCompanyData?.messagesThisMonth ?? "—"} / {selectedCompanyData?.messagesLimit ?? "—"}
                    </span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ 
                        width: selectedCompanyData?.messagesLimit 
                          ? `${Math.min(100, Math.round(((selectedCompanyData.messagesThisMonth || 0) / selectedCompanyData.messagesLimit) * 100))}%` 
                          : "0%" 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* Mobile Company Detail Panel - Bottom Panel */}
        <Transition show={shouldShowMobileModal} as={Fragment}>
          <Dialog
            as="div"
            className="lg:hidden relative z-50"
            onClose={() => setSelectedCompanyId(null)}
            initialFocus={detailCloseRef}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedCompanyId(null)} />
            </Transition.Child>

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="flex min-h-full items-end justify-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-full"
                  enterTo="opacity-100 translate-y-0"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-full"
                >
                  <Dialog.Panel className="w-full max-h-[85vh] overflow-y-auto bg-card border-t border-border shadow-xl rounded-t-2xl transform transition-all pointer-events-auto">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between mb-2 sticky top-0 bg-card z-10 pb-2 border-b border-border">
                        <Dialog.Title className="text-base sm:text-lg font-semibold">{t("admin.companyDetails")}</Dialog.Title>
                        <Button
                          ref={detailCloseRef}
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId(null);
                          }}
                        >
                          <FiX className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {selectedCompanyData && (
                        <>
                          <Card className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                                {selectedCompanyData.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-foreground truncate">{selectedCompanyData.name}</h5>
                                <p className="text-sm text-muted-foreground truncate">{selectedCompanyData.adminEmail}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {selectedCompanyData.code}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(selectedCompanyData.code);
                                      toast.success(t("common.copy") || "Скопировано");
                                    }}
                                  >
                                    <FiCopy className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">{t("admin.status")}</p>
                                <Badge className={getStatusColor(selectedCompanyData.status)}>
                                  {selectedCompanyData.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">{t("admin.plan")}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{selectedCompanyData.plan}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setSelectedPlan(selectedCompanyData.plan);
                                      setPlanEndDate(selectedCompanyData.trialEndDate || "");
                                      setIsPlanModalOpen(true);
                                    }}
                                  >
                                    <FiEdit className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-border space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{t("admin.totalMessages")}</span>
                                <span className="text-sm font-semibold">{selectedCompanyData.messages}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{t("admin.registration")}</span>
                                <span className="text-sm font-semibold">{selectedCompanyData.registered}</span>
                              </div>
                            </div>
                          </Card>

                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-foreground">{t("admin.actions")}</h5>
                            
                            {selectedCompanyData.status === COMPANY_STATUS.ACTIVE ? (
                              <Button
                                className="w-full"
                                variant="destructive"
                                onClick={async () => {
                                  try {
                                    await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.BLOCKED);
                                    toast.success(t("admin.companyBlocked"));
                                    setSelectedCompanyId(null);
                                    refetch();
                                  } catch (error) {
                                    toast.error(t("admin.blockError"));
                                  }
                                }}
                              >
                                {t("admin.blockCompany")}
                              </Button>
                            ) : selectedCompanyData.status === COMPANY_STATUS.BLOCKED ? (
                              <Button
                                className="w-full"
                                onClick={async () => {
                                  try {
                                    await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.ACTIVE);
                                    toast.success(t("admin.companyActivated"));
                                    setSelectedCompanyId(null);
                                    refetch();
                                  } catch (error) {
                                    toast.error(t("admin.activateError"));
                                  }
                                }}
                              >
                                {t("admin.activateCompany")}
                              </Button>
                            ) : selectedCompanyData.status === COMPANY_STATUS.TRIAL ? (
                              <Button
                                className="w-full"
                                onClick={async () => {
                                  try {
                                    await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.ACTIVE);
                                    toast.success(t("admin.companyActivated"));
                                    setSelectedCompanyId(null);
                                    refetch();
                                  } catch (error) {
                                    toast.error(t("admin.activateError"));
                                  }
                                }}
                              >
                                {t("admin.activateCompany")}
                              </Button>
                            ) : null}
                            <Button
                              className="w-full"
                              variant="destructive"
                              onClick={() => {
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={isDeleting}
                            >
                              <FiTrash2 className="h-4 w-4 mr-2" />
                              {t("admin.deleteCompany") || "Удалить компанию"}
                            </Button>
                          </div>

                          <Card className="p-4 bg-muted">
                            <h5 className="font-semibold text-sm mb-3">{t("admin.usageStats")}</h5>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">{t("admin.messagesThisMonth")}</span>
                                  <span className="font-semibold">
                                    {selectedCompanyData?.messagesThisMonth ?? "—"} / {selectedCompanyData?.messagesLimit ?? "—"}
                                  </span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ 
                                      width: selectedCompanyData?.messagesLimit 
                                        ? `${Math.min(100, Math.round(((selectedCompanyData.messagesThisMonth || 0) / selectedCompanyData.messagesLimit) * 100))}%` 
                                        : "0%" 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>

      {/* Create Company Dialog */}
      <Transition show={isCreateOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => !isCreating && setIsCreateOpen(false)}
          initialFocus={createCloseRef}
        >
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-card border border-border shadow-xl transition-all p-6 space-y-4">
                  <Dialog.Title className="text-lg font-semibold text-foreground">
                    {t("admin.createCompany")}
                  </Dialog.Title>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-foreground">{t("admin.companyName")}</label>
                      <Input
                        value={newCompany.name}
                        onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                        placeholder="Acme Corporation"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground">{t("admin.adminEmail")}</label>
                      <Input
                        type="email"
                        value={newCompany.adminEmail}
                        onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                        placeholder="admin@company.com"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground">Код компании</label>
                      <div className="flex gap-2">
                        <Input
                          value={newCompany.code}
                          onChange={(e) => setNewCompany({ ...newCompany, code: e.target.value.toUpperCase() })}
                          maxLength={8}
                          placeholder="ACME0001"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setNewCompany((prev) => ({ ...prev, code: generateCode() }))}
                        >
                          <FiRefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">8 символов, используйте буквы/цифры</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground">{t("admin.plan")}</label>
                      <select
                        className="w-full p-2 border rounded-md bg-background"
                        value={newCompany.plan}
                        onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value as (typeof PLAN_OPTIONS)[number] })}
                      >
                        {PLAN_OPTIONS.map((plan) => (
                          <option key={plan} value={plan}>{plan}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground">Пароль администратора</label>
                      <input
                        type="password"
                        className="w-full p-2 border rounded-md bg-background"
                        value={newCompany.password}
                        onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                        placeholder="Минимум 6 символов"
                        minLength={8}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      ref={createCloseRef}
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isCreating}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!newCompany.name.trim() || !newCompany.adminEmail.trim() || newCompany.code.length !== 8 || !newCompany.password.trim()) {
                          toast.error(t("common.fillAllFields") || "Заполните все поля");
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
                        await createCompany({
                          ...newCompany,
                          status: COMPANY_STATUS.ACTIVE, // По умолчанию "Активна" для новых компаний
                          messagesLimit: 100,
                          storageLimit: 10,
                        });
                        setNewCompany({
                          name: "",
                          adminEmail: "",
                          code: generateCode(),
                          password: "",
                          plan: "Пробный",
                        });
                      }}
                      disabled={isCreating}
                    >
                      {isCreating ? t("common.loading") : t("common.create")}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View company panel dialog */}
      <Transition show={isViewOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsViewOpen(false)}
          initialFocus={viewCloseRef}
        >
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
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-card border border-border shadow-xl transition-all p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold text-lg">
                        {selectedCompanyData?.name?.charAt(0) || "C"}
                      </div>
                      <div className="space-y-1">
                        <Dialog.Title className="text-lg font-semibold text-foreground">
                          {selectedCompanyData?.name || t("admin.companyDetails")}
                        </Dialog.Title>
                        <p className="text-sm text-muted-foreground">
                          {selectedCompanyData?.adminEmail || "—"}
                        </p>
                        {selectedCompanyData && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedCompanyData.code}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard?.writeText(selectedCompanyData.code);
                                toast.success(t("common.copy") || "Скопировано");
                              }}
                            >
                              <FiCopy className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      ref={viewCloseRef}
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsViewOpen(false)}
                    >
                      <FiX className="h-5 w-5" />
                    </Button>
                  </div>

                  {selectedCompanyData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card className="p-4 space-y-3 col-span-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(selectedCompanyData.status)}>
                            {selectedCompanyData.status}
                          </Badge>
                          <Badge variant="outline">{selectedCompanyData.plan}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {t("admin.registration")}: {selectedCompanyData.registered}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("admin.totalMessages")}</p>
                            <p className="text-base font-semibold">{selectedCompanyData.messages}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("admin.messagesThisMonth")}</p>
                            <p className="text-base font-semibold">
                              {selectedCompanyData.messagesThisMonth ?? "—"} / {selectedCompanyData.messagesLimit ?? "—"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t("admin.messagesThisMonth")}</p>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: selectedCompanyData.messagesLimit
                                    ? `${Math.min(
                                        100,
                                        Math.round(
                                          ((selectedCompanyData.messagesThisMonth || 0) /
                                            selectedCompanyData.messagesLimit) *
                                            100
                                        )
                                      )}%`
                                    : "0%",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 space-y-3">
                        <h5 className="text-sm font-semibold text-foreground">
                          {t("admin.actions")}
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t("admin.status")}</span>
                            <Badge className={getStatusColor(selectedCompanyData.status)}>
                              {selectedCompanyData.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t("admin.plan")}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{selectedCompanyData.plan}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setSelectedPlan(selectedCompanyData.plan);
                                  setPlanEndDate(selectedCompanyData.trialEndDate || "");
                                  setIsPlanModalOpen(true);
                                }}
                              >
                                <FiEdit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t("admin.registration")}</span>
                            <span className="text-sm font-semibold">{selectedCompanyData.registered}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border space-y-2">
                          <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => {
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={isDeleting}
                          >
                            <FiTrash2 className="h-4 w-4 mr-2" />
                            {t("admin.deleteCompany") || "Удалить компанию"}
                          </Button>
                          {selectedCompanyData.status === COMPANY_STATUS.ACTIVE ? (
                            <Button
                              className="w-full"
                              variant="destructive"
                              onClick={async () => {
                                try {
                                  await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.BLOCKED);
                                  toast.success(t("admin.companyBlocked"));
                                  setIsViewOpen(false);
                                  refetch();
                                } catch (error) {
                                  toast.error(t("admin.blockError"));
                                }
                              }}
                            >
                              {t("admin.blockCompany")}
                            </Button>
                          ) : selectedCompanyData.status === COMPANY_STATUS.BLOCKED ? (
                            <Button
                              className="w-full"
                              onClick={async () => {
                                try {
                                  await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.ACTIVE);
                                  toast.success(t("admin.companyActivated"));
                                  setIsViewOpen(false);
                                  refetch();
                                } catch (error) {
                                  toast.error(t("admin.activateError"));
                                }
                              }}
                            >
                              {t("admin.activateCompany")}
                            </Button>
                          ) : selectedCompanyData.status === COMPANY_STATUS.TRIAL ? (
                            <Button
                              className="w-full"
                              onClick={async () => {
                                try {
                                  await companyService.updateStatus(selectedCompanyData.id, COMPANY_STATUS.ACTIVE);
                                  toast.success(t("admin.companyActivated"));
                                  setIsViewOpen(false);
                                  refetch();
                                } catch (error) {
                                  toast.error(t("admin.activateError"));
                                }
                              }}
                            >
                              {t("admin.activateCompany")}
                            </Button>
                          ) : null}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("admin.selectCompany")}</p>
                  )}
                  
                  {selectedCompanyData && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      <Button
                        className="w-full sm:w-auto sm:ml-auto"
                        variant="destructive"
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={isDeleting}
                      >
                        <FiTrash2 className="h-4 w-4 mr-2" />
                        {t("admin.deleteCompany") || "Удалить компанию"}
                      </Button>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Update Plan Dialog */}
      <Transition show={isPlanModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsPlanModalOpen(false)}
        >
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-card border border-border shadow-xl transition-all p-6 space-y-4">
                  <Dialog.Title className="text-lg font-semibold text-foreground">
                    {t("admin.changePlan")}
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("admin.plan")}</Label>
                      <Select
                        value={selectedPlan}
                        onValueChange={setSelectedPlan}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin.selectPlan")} />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => {
                            const planName = getTranslatedValue(plan.name);
                            return (
                              <SelectItem key={plan.id} value={planName}>
                                {planName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.planEndDate")}</Label>
                      <Input
                        type="date"
                        value={planEndDate}
                        onChange={(e) => setPlanEndDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("admin.planEndDateDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsPlanModalOpen(false);
                        setSelectedPlan("");
                        setPlanEndDate("");
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        if (!selectedCompanyId || !selectedPlan) {
                          toast.error(t("common.fillAllFields"));
                          return;
                        }
                        try {
                          await companyService.updatePlan(
                            selectedCompanyId,
                            selectedPlan as PlanType,
                            planEndDate || undefined
                          );
                          toast.success(t("admin.planUpdated"));
                          setIsPlanModalOpen(false);
                          setSelectedPlan("");
                          setPlanEndDate("");
                          refetch();
                        } catch (error) {
                          toast.error(t("admin.planUpdateError"));
                        }
                      }}
                    >
                      {t("common.save")}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
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
              {selectedCompanyId && companies.find(c => c.id === selectedCompanyId) && (
                <span className="block mt-2 font-semibold text-foreground">
                  {companies.find(c => c.id === selectedCompanyId)?.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
            }}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedCompanyId) {
                  try {
                    await deleteCompany(selectedCompanyId);
                    setSelectedCompanyId(null);
                  } catch (error) {
                    toast.error(t("common.error"));
                  }
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

export default AdminPanel;

'use client';

import { useState, useEffect, useRef, Fragment } from "react";
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
  FiFilter,
  FiPlus,
  FiEye,
  FiX,
  FiCopy,
  FiEdit,
} from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useCompanies, useCreateCompany, usePlans, companyService } from "@/lib/query";
import { getTranslatedValue } from "@/lib/utils/translations";
import { toast } from "sonner";
import type { CompanyStatus, PlanType } from "@/types";
import TrialCard from "@/components/TrialCard";

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "trial" | "blocked">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
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
    status: COMPANY_STATUS.ACTIVE,
    plan: "Пробный" as (typeof PLAN_OPTIONS)[number],
    employees: 0,
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
    onError: () => toast.error(t("common.error")),
  });

  const generateCode = () =>
    Math.random().toString(36).slice(2, 10).toUpperCase();

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.code.toLowerCase().includes(searchQuery.toLowerCase());

    const status = company.status.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && status === t("admin.active").toLowerCase()) ||
      (statusFilter === "trial" && status === t("admin.trial").toLowerCase()) ||
      (statusFilter === "blocked" && status === t("admin.blocked").toLowerCase());

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
      case t("admin.trial"):
        return "bg-[#2F2FA2] text-white"; /* Primary blue */
      case t("admin.blocked"):
        return "bg-accent text-white"; /* #F64C72 */
      default:
        return "bg-muted text-muted-foreground"; /* #99738E */
    }
  };

  // Автовыбор первой компании после фильтра / поиска
  useEffect(() => {
    if (filteredCompanies.length === 0) {
      setSelectedCompanyId(null);
      return;
    }
    // если выбранная ушла из списка, выбрать первую
    const exists = selectedCompanyId && filteredCompanies.some((c) => c.id === selectedCompanyId);
    if (!exists) {
      setSelectedCompanyId(filteredCompanies[0].id);
    }
  }, [filteredCompanies, selectedCompanyId]);

  const selectedCompanyData =
    (selectedCompanyId && filteredCompanies.find((c) => c.id === selectedCompanyId)) ||
    filteredCompanies[0] ||
    null;
  
  // Для мобильных: определяем, показывать ли модальное окно
  const shouldShowMobileModal = selectedCompanyId !== null && filteredCompanies.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="border-b border-border bg-card">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{t("admin.title")}</h2>
          </div>
        </header>

        {/* Main Dashboard */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Companies List */}
          <div className="flex-1 p-4 sm:p-6">
            {/* Trial Card */}
            <div className="mb-4 sm:mb-6">
              <TrialCard />
            </div>
            
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 relative">
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
                      { key: "trial", label: t("admin.trial") },
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

            <Card>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
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
                          className={`border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${
                            selectedCompanyId === company.id ? "bg-muted/30" : "bg-card"
                          }`}
                          onClick={() => setSelectedCompanyId(company.id)}
                        >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold">
                              {company.name.charAt(0)}
                            </div>
                            <span className="font-medium text-foreground">{company.name}</span>
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
              <div className="lg:hidden space-y-3 p-4">
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
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedCompanyId === company.id ? "bg-muted/30 border-primary" : ""
                      }`}
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {company.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{company.name}</h4>
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
                    <span className="text-sm text-muted-foreground">{t("admin.employees")}</span>
                    <span className="text-sm font-semibold">{selectedCompanyData.employees}</span>
                  </div>
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
                  {selectedCompanyData.status === t("admin.active") ? (
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
                  ) : (
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
                  )}
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
                    <span className="font-semibold">34 / 100</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "34%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t("admin.storageUsed")}</span>
                    <span className="font-semibold">2.4 / 10 GB</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: "24%" }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* Mobile Company Detail Modal */}
        <Transition show={shouldShowMobileModal && isMobile} as={Fragment}>
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
              <div className="fixed inset-0 bg-black/50" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-full"
                  enterTo="opacity-100 translate-y-0"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-full"
                >
                  <Dialog.Panel className="w-full max-h-[85vh] overflow-y-auto bg-card border-t border-border rounded-t-2xl shadow-xl transform transition-all">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <Dialog.Title className="text-base sm:text-lg font-semibold">{t("admin.companyDetails")}</Dialog.Title>
                        <Button
                          ref={detailCloseRef}
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCompanyId(null)}
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
                                <span className="text-sm text-muted-foreground">{t("admin.employees")}</span>
                                <span className="text-sm font-semibold">{selectedCompanyData.employees}</span>
                              </div>
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
                            <Button className="w-full" variant="outline">
                              <FiEye className="h-4 w-4 mr-2" />
                              {t("admin.openPanel")}
                            </Button>
                            
                            {selectedCompanyData.status === t("admin.active") ? (
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
                            ) : selectedCompanyData.status === t("admin.blocked") ? (
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
                          </div>

                          <Card className="p-4 bg-muted">
                            <h5 className="font-semibold text-sm mb-3">{t("admin.usageStats")}</h5>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">{t("admin.messagesThisMonth")}</span>
                                  <span className="font-semibold">34 / 100</span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: "34%" }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">{t("admin.storageUsed")}</span>
                                  <span className="font-semibold">2.4 / 10 GB</span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div className="h-full bg-secondary" style={{ width: "24%" }}></div>
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
                          {t("common.add")}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">8 символов, используйте буквы/цифры</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground">{t("admin.status")}</label>
                      <select
                        className="w-full p-2 border rounded-md bg-background"
                        value={newCompany.status}
                        onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value as CompanyStatus })}
                      >
                        <option value={COMPANY_STATUS.ACTIVE}>{t("admin.active")}</option>
                        <option value={COMPANY_STATUS.TRIAL}>{t("admin.trial")}</option>
                        <option value={COMPANY_STATUS.BLOCKED}>{t("admin.blocked")}</option>
                      </select>
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
                        if (!newCompany.name.trim() || !newCompany.adminEmail.trim() || newCompany.code.length !== 8) {
                          toast.error(t("common.fillAllFields") || "Заполните все поля");
                          return;
                        }
                        try {
                          await createCompany({
                            ...newCompany,
                            messagesLimit: 100,
                            storageLimit: 10,
                          });
                        } catch (e) {
                          toast.error(t("common.error"));
                        }
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
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("admin.storageUsed")}</p>
                            <p className="text-base font-semibold">
                              {selectedCompanyData.storageUsed ?? "—"} / {selectedCompanyData.storageLimit ?? "—"} GB
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
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t("admin.storageUsed")}</p>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary"
                                style={{
                                  width: selectedCompanyData.storageLimit
                                    ? `${Math.min(
                                        100,
                                        Math.round(
                                          ((selectedCompanyData.storageUsed || 0) /
                                            selectedCompanyData.storageLimit) *
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
                        <div className="pt-2 space-y-2">
                          {selectedCompanyData.status === t("admin.active") ? (
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
                          ) : (
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
                          )}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("admin.selectCompany")}</p>
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
    </div>
  );
};

export default AdminPanel;

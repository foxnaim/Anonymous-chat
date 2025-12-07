'use client';

import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiMoreVertical,
  FiEye,
  FiX,
} from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useCompanies, companyService } from "@/lib/query";
import { toast } from "sonner";
import type { CompanyStatus } from "@/types";

// Константы статусов компании
const COMPANY_STATUS: Record<string, CompanyStatus> = {
  ACTIVE: "Активна",
  TRIAL: "Пробная",
  BLOCKED: "Заблокирована",
};

const AdminPanel = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  const { data: companies = [], isLoading, refetch } = useCompanies();

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Автоматически выбираем первую компанию на десктопе, если ничего не выбрано
  // На мобильных показываем только явно выбранную компанию
  const getSelectedCompanyData = () => {
    // Если компания явно выбрана и существует
    if (selectedCompany !== null && filteredCompanies[selectedCompany]) {
      return filteredCompanies[selectedCompany];
    }
    // На десктопе показываем первую компанию по умолчанию (для мобильных вернем null)
    if (filteredCompanies.length > 0) {
      return filteredCompanies[0];
    }
    return null;
  };

  const selectedCompanyData = getSelectedCompanyData();
  
  // Для мобильных: определяем, показывать ли модальное окно
  const shouldShowMobileModal = selectedCompany !== null && filteredCompanies.length > 0;

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
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">{t("admin.companies")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t("admin.manageCompanies")}
                </p>
              </div>
              <Button size="sm" className="w-full sm:w-auto">
                <FiPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("admin.createCompany")}</span>
                <span className="sm:hidden">{t("common.create")}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
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
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <FiFilter className="h-4 w-4" />
              </Button>
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
                            (selectedCompany === index || (selectedCompany === null && index === 0)) ? "bg-muted/30" : "bg-card"
                          }`}
                          onClick={() => setSelectedCompany(index)}
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <FiMoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
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
                        selectedCompany === index ? "bg-muted/30 border-primary" : ""
                      }`}
                      onClick={() => setSelectedCompany(index)}
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
                <Card className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-[#553D67] flex items-center justify-center text-white font-semibold text-lg">
                      {selectedCompanyData.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-foreground">{selectedCompanyData.name}</h5>
                      <p className="text-sm text-muted-foreground">{selectedCompanyData.adminEmail}</p>
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
                    <Badge variant="outline">{selectedCompanyData.plan}</Badge>
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
              <Button className="w-full" variant="outline">
                <FiEye className="h-4 w-4 mr-2" />
                {t("admin.openPanel")}
              </Button>
              
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
          </aside>
        </div>

        {/* Mobile Company Detail Modal */}
        <Transition show={shouldShowMobileModal} as={Fragment}>
          <Dialog as="div" className="lg:hidden relative z-50" onClose={() => setSelectedCompany(null)}>
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
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCompany(null)}>
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
                                <Badge variant="outline">{selectedCompanyData.plan}</Badge>
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
                                    setSelectedCompany(null);
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
                                    setSelectedCompany(null);
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
    </div>
  );
};

export default AdminPanel;

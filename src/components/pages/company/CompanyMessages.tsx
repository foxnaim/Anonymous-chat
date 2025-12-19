'use client';

import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useCompany, useMessages, useUpdateMessageStatus } from "@/lib/query";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FiSearch, FiEye, FiCheckCircle, FiClock, FiX, FiChevronDown, FiCheck, FiMessageSquare, FiAlertCircle } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { Message, MessageStatus } from "@/types";
import { toast } from "sonner";
import { MESSAGE_STATUSES } from "@/lib/utils/constants";
import { useSocketMessages } from "@/lib/websocket/useSocket";

const CompanyMessages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { mutate: updateMessageStatus } = useUpdateMessageStatus({
    onSuccess: () => {
      toast.success(t("messages.statusUpdated"));
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      const backendMessage = error?.response?.data?.message || error?.message || "";
      const msgLower = backendMessage.toLowerCase();
      
      // Маппинг ошибок из бэкенда на ключи переводов
      let errorMessage = t("messages.statusUpdateError");
      
      if (backendMessage.includes("Cannot modify status of message rejected by admin") ||
          backendMessage.includes("Cannot modify response for message rejected by admin") ||
          msgLower.includes("cannot modify") && msgLower.includes("rejected by admin")) {
        errorMessage = t("messages.cannotModifyRejected");
      } else if (backendMessage && !backendMessage.includes("HTTP error")) {
        errorMessage = backendMessage;
      }
      
      toast.error(errorMessage);
    },
  });
  const statusOptions = [
    { value: "all", label: t("messages.allStatuses") },
    { value: t("checkStatus.new"), label: t("checkStatus.new") },
    { value: t("checkStatus.inProgress"), label: t("checkStatus.inProgress") },
    { value: t("checkStatus.resolved"), label: t("checkStatus.resolved") },
    { value: t("checkStatus.rejected"), label: t("checkStatus.rejected") },
    { value: t("checkStatus.spam"), label: t("checkStatus.spam") },
  ];
  const typeOptions = [
    { value: "all", label: t("messages.allTypes") },
    { value: "complaint", label: t("sendMessage.complaint") },
    { value: "praise", label: t("sendMessage.praise") },
    { value: "suggestion", label: t("sendMessage.suggestion") },
  ];
  
  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  const { data: messages = [], isLoading, refetch } = useMessages(company?.code, undefined, undefined, {
    enabled: !!company?.code,
  });
  
  // Подключаемся к WebSocket для real-time обновлений
  useSocketMessages(company?.code);
  
  // Функция для нормализации статуса: переводит переведенное значение в значение из БД
  const normalizeStatus = (status: string): string => {
    if (status === "all") return "all";
    // Создаем маппинг переведенных значений на значения из БД
    const statusMap: Record<string, string> = {
      [t("checkStatus.new")]: MESSAGE_STATUSES.NEW,
      [t("checkStatus.inProgress")]: MESSAGE_STATUSES.IN_PROGRESS,
      [t("checkStatus.resolved")]: MESSAGE_STATUSES.RESOLVED,
      [t("checkStatus.rejected")]: MESSAGE_STATUSES.REJECTED,
      [t("checkStatus.spam")]: MESSAGE_STATUSES.SPAM,
    };
    return statusMap[status] || status;
  };
  
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.companyCode.toLowerCase().includes(searchQuery.toLowerCase());
    const normalizedStatus = normalizeStatus(statusFilter);
    const matchesStatus = normalizedStatus === "all" || msg.status === normalizedStatus;
    const matchesType = typeFilter === "all" || msg.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setResponseText(message.companyResponse || "");
    setIsDialogOpen(true);
  };
  const handleUpdateStatus = (status: MessageStatus) => {
    if (!selectedMessage) return;
    updateMessageStatus({
      id: selectedMessage.id,
      status,
      response: responseText || undefined,
    });
  };
  
  // Проверка, было ли сообщение отклонено админом
  const isRejectedByAdmin = (message: Message): boolean => {
    return message.status === "Спам" && !!message.previousStatus;
  };

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case t("checkStatus.new"):
        return "bg-accent text-accent-foreground"; /* #F64C72 */
      case t("checkStatus.inProgress"):
        return "bg-secondary text-secondary-foreground"; /* #553D67 */
      case t("checkStatus.resolved"):
        return "bg-success text-success-foreground"; /* Green */
      case t("messages.reject"):
      case "Отклонено":
        return "bg-muted text-muted-foreground"; /* #99738E */
      case t("checkStatus.spam"):
      case "Спам":
        return "bg-destructive text-destructive-foreground"; /* Red for spam */
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "complaint":
        return t("sendMessage.complaint");
      case "praise":
        return t("sendMessage.praise");
      case "suggestion":
        return t("sendMessage.suggestion");
      default:
        return type;
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden w-full">
      <CompanyHeader />
      <div className="flex flex-col flex-1 overflow-hidden w-full min-h-0">
        <main className="flex-1 px-6 py-4 overflow-hidden w-full flex flex-col min-h-0">
          <div className="flex flex-col gap-4 w-full h-full min-h-0">
            {/* Filters */}
            <Card className="p-4 border-border shadow-lg flex-shrink-0 bg-white">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("messages.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  autoComplete="off"
                />
              </div>
              <Listbox value={statusFilter} onChange={setStatusFilter}>
                <div className="relative w-full md:w-[180px]">
                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-input bg-background py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
                    <span className="block truncate">
                      {statusOptions.find((opt) => opt.value === statusFilter)?.label || t("checkStatus.status")}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FiChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card border border-border py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {statusOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? "bg-primary/10 text-primary" : "text-foreground"
                            }`
                          }
                          value={option.value}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FiCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
              <Listbox value={typeFilter} onChange={setTypeFilter}>
                <div className="relative w-full md:w-[180px]">
                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-input bg-background py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
                    <span className="block truncate">
                      {typeOptions.find((opt) => opt.value === typeFilter)?.label || t("messages.type")}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FiChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card border border-border py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {typeOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? "bg-primary/10 text-primary" : "text-foreground"
                            }`
                          }
                          value={option.value}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FiCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </Card>
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground px-2 mb-4">
                {t("messages.found")}: {filteredMessages.length} {filteredMessages.length === 1 ? t("messages.message") : t("messages.messages")} {messages.length !== filteredMessages.length && `(${messages.length} ${t("messages.total")})`}
              </div>
              {filteredMessages.length === 0 ? (
            <Card className="p-12 text-center">
              <FiMessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("messages.noMessagesFound")}</p>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredMessages.map((message) => {
                const rejected = isRejectedByAdmin(message);
                return (
                  <Card key={message.id} className="p-4 sm:p-6 border-border shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                        {rejected && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 sm:p-3">
                            <p className="text-xs sm:text-sm font-semibold text-destructive">
                              {t("checkStatus.rejectedByAdmin")}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <code className="text-xs sm:text-sm font-mono text-primary break-all">{message.id}</code>
                          <Badge variant="outline" className="text-accent border-accent text-xs">
                            {getTypeLabel(message.type)}
                          </Badge>
                          <Badge className={`${getStatusColor(message.status)} text-xs`}>
                            {message.status}
                          </Badge>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-foreground line-clamp-2">{message.content}</p>
                        {message.companyResponse && (
                          <div className="bg-muted p-2 sm:p-3 rounded-lg">
                            <p className="text-xs sm:text-sm font-semibold mb-1">{t("messages.yourResponse")}:</p>
                            <p className="text-xs sm:text-sm text-foreground">{message.companyResponse}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMessage(message)}
                        className="w-full sm:w-auto ml-0 sm:ml-4"
                      >
                        <FiEye className="h-4 w-4 mr-2" />
                        {t("messages.open")}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
            </>
          )}
          </div>
        </div>
        </main>
      </div>
      {/* Message Detail Dialog */}
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all">
                  <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <Dialog.Title className="text-lg font-semibold text-foreground mb-2">
                      {t("messages.messageDetails")}
                    </Dialog.Title>
                    <p className="text-sm text-muted-foreground mb-6">ID: {selectedMessage?.id}</p>
                    {selectedMessage && (
                      <div className="space-y-6">
                        {isRejectedByAdmin(selectedMessage) && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <p className="text-sm font-semibold text-destructive mb-1">
                              {t("checkStatus.rejectedByAdmin")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("messages.cannotModifyRejected")}
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getTypeLabel(selectedMessage.type)}</Badge>
                            <Badge className={getStatusColor(selectedMessage.status)}>
                              {selectedMessage.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("checkStatus.created")}: {new Date(selectedMessage.createdAt).toLocaleString("ru-RU")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("checkStatus.updated")}: {new Date(selectedMessage.updatedAt).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("sendMessage.message")}</Label>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-foreground whitespace-pre-wrap">{selectedMessage.content}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("messages.response")}</Label>
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder={t("messages.enterResponse")}
                            className="min-h-[120px]"
                            disabled={isRejectedByAdmin(selectedMessage)}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus(t("checkStatus.inProgress") as MessageStatus)}
                            disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === t("checkStatus.inProgress")}
                          >
                            <FiClock className="h-4 w-4 mr-2" />
                            {t("checkStatus.inProgress")}
                          </Button>
                          <Button
                            onClick={() => handleUpdateStatus(t("checkStatus.resolved") as MessageStatus)}
                            disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === t("checkStatus.resolved")}
                          >
                            <FiCheckCircle className="h-4 w-4 mr-2" />
                            {t("checkStatus.resolved")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus(t("checkStatus.rejected") as MessageStatus)}
                            disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === t("checkStatus.rejected") || selectedMessage.status === "Отклонено"}
                          >
                            <FiX className="h-4 w-4 mr-2" />
                            {t("messages.reject")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus(t("checkStatus.spam") as MessageStatus)}
                            disabled={isRejectedByAdmin(selectedMessage) || selectedMessage.status === t("checkStatus.spam") || selectedMessage.status === "Спам"}
                          >
                            <FiAlertCircle className="h-4 w-4 mr-2" />
                            {t("checkStatus.spam")}
                          </Button>
                        </div>
                      </div>
                    )}
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
export default CompanyMessages;

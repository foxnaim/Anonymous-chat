'use client';

import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { FiSearch, FiEye, FiCheckCircle, FiX, FiChevronDown, FiCheck, FiTrash2 } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useMessages } from "@/lib/query";
import { messageService } from "@/lib/query/services";
import { Message, MessageStatus } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MESSAGE_STATUSES } from "@/lib/utils/constants";
import { useSocketMessages } from "@/lib/websocket/useSocket";

const AdminMessages = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: messages = [], isLoading, refetch } = useMessages();
  
  // Подключаемся к WebSocket для real-time обновлений
  useSocketMessages();
  
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
    return matchesSearch && matchesStatus;
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
  };

  const handleModerate = async (action: "approve" | "reject") => {
    if (!selectedMessage) return;
    try {
      await messageService.moderate(selectedMessage.id, action);
      toast.success(action === "approve" ? t("admin.messageApproved") : t("admin.messageRejected"));
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(t("admin.moderationError"));
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMessage) return;
    try {
      await messageService.delete(selectedMessage.id);
      toast.success(t("admin.messageDeleted"));
      setIsDialogOpen(false);
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(t("admin.deleteMessageError"));
    }
  };

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case "Новое":
        return "bg-accent text-accent-foreground";
      case "В работе":
        return "bg-secondary text-secondary-foreground";
      case "Решено":
        return "bg-success text-success-foreground";
      case "Отклонено":
        return "bg-muted text-muted-foreground";
      case "Спам":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <main className="container flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.searchMessages")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  autoComplete="off"
                />
              </div>
              <Listbox value={statusFilter} onChange={setStatusFilter}>
                <div className="relative w-full md:w-[180px]">
                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-input bg-background py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:text-sm">
                    <span className="block truncate">
                      {statusFilter === "all" ? t("messages.allStatuses") : statusFilter}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FiChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card border border-border py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {["all", t("checkStatus.new"), t("checkStatus.inProgress"), t("checkStatus.resolved"), t("checkStatus.rejected"), t("checkStatus.spam")].map((status) => (
                        <Listbox.Option
                          key={status}
                          className={({ active }) =>
                            cn(
                              "relative cursor-default select-none py-2 pl-10 pr-4",
                              active ? "bg-primary/10 text-primary" : "text-foreground"
                            )
                          }
                          value={status}
                        >
                          {({ selected }) => (
                            <>
                              <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                {status === "all" ? t("messages.allStatuses") : status}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FiCheck className="h-4 w-4" aria-hidden="true" />
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
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground px-2">
                {t("messages.found")}: {filteredMessages.length} {filteredMessages.length === 1 ? t("messages.message") : t("messages.messages")} {messages.length !== filteredMessages.length && `(${messages.length} ${t("messages.total")})`}
              </div>
              <div className="space-y-3 sm:space-y-4">
                {filteredMessages.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">{t("messages.noMessagesFound")}</p>
                  </Card>
                ) : (
                  filteredMessages.map((message) => (
                <Card key={message.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 space-y-2 sm:space-y-3 w-full min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <code className="text-xs sm:text-sm font-mono text-primary break-all">{message.id}</code>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{message.companyCode}</Badge>
                        <Badge className="text-xs whitespace-nowrap">{message.status}</Badge>
                      </div>
                      <p className="text-sm sm:text-base text-foreground line-clamp-2 break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMessage(message)}
                      className="w-full sm:w-auto ml-0 sm:ml-4 flex-shrink-0"
                    >
                      <FiEye className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t("messages.view")}</span>
                      <span className="sm:hidden">{t("messages.open")}</span>
                    </Button>
                  </div>
                </Card>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
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
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-card border border-border shadow-xl transition-all p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                  <Dialog.Title className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                    {t("admin.messageModeration")}
                  </Dialog.Title>
                  {selectedMessage && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-muted-foreground break-all">ID: {selectedMessage.id}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.companyName")}: {selectedMessage.companyCode}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t("messages.type")}: {selectedMessage.type}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground">{t("checkStatus.status")}:</p>
                          <Badge className={`${getStatusColor(selectedMessage.status)} text-xs`}>
                            {selectedMessage.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{t("sendMessage.message")}:</p>
                        <div className="bg-muted p-3 sm:p-4 rounded-lg">
                          <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">{selectedMessage.content}</p>
                        </div>
                      </div>
                      {selectedMessage.companyResponse && (
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-semibold text-foreground">{t("checkStatus.companyResponse")}:</p>
                          <div className="bg-muted p-3 sm:p-4 rounded-lg border border-border">
                            <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">{selectedMessage.companyResponse}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleModerate("approve")}
                          className="flex-1 w-full sm:w-auto"
                        >
                          <FiCheckCircle className="h-4 w-4 mr-2" />
                          {t("admin.approve")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleModerate("reject")}
                          className="flex-1 w-full sm:w-auto"
                        >
                          <FiX className="h-4 w-4 mr-2" />
                          {t("admin.reject")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteClick}
                          className="flex-1 w-full sm:w-auto"
                        >
                          <FiTrash2 className="h-4 w-4 mr-2" />
                          {t("admin.deleteMessage")}
                        </Button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteMessage")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.deleteMessageConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMessages;

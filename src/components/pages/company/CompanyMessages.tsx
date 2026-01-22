'use client';

import { useState, Fragment, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCompany, useMessages, useUpdateMessageStatus } from "@/lib/query";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FiSearch, FiEye, FiCheckCircle, FiClock, FiX, FiChevronDown, FiCheck, FiMessageSquare, FiAlertCircle, FiAlertTriangle, FiCreditCard } from "react-icons/fi";
import { CompanyHeader } from "@/components/CompanyHeader";
import { useAuth } from "@/lib/redux";
import { Message, MessageStatus } from "@/types";
import { toast } from "sonner";
import { MESSAGE_STATUSES } from "@/lib/utils/constants";
import { useSocketMessages } from "@/lib/websocket/useSocket";
import { useFullscreenContext } from "@/components/providers/FullscreenProvider";
import { useDebounce } from "@/hooks/use-debounce";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useRouter } from "next/navigation";

const CompanyMessages = () => {
  const { isFullscreen } = useFullscreenContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const permissions = usePlanPermissions();
  const { data: company } = useCompany(user?.companyId || 0, {
    enabled: !!user?.companyId,
  });
  
  // Проверяем, истек ли тариф
  const isTrialExpired = company?.trialEndDate ? (() => {
    try {
      const endDate = new Date(company.trialEndDate);
      const now = new Date();
      return now > endDate;
    } catch {
      return false;
    }
  })() : false;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  
  // Реф для отслеживания времени последнего локального обновления
  // Используется для блокировки обновлений из списка (защита от race condition/stale cache)
  const lastLocalUpdateRef = useRef<number>(0);
  
  const { mutate: updateMessageStatus } = useUpdateMessageStatus({
    onMutate: async (variables) => {
      // Устанавливаем время последнего обновления
      lastLocalUpdateRef.current = Date.now();
      
      // Оптимистично обновляем selectedMessage ДО отправки запроса
      if (selectedMessage && selectedMessage.id === variables.id) {
        const optimisticMessage: Message = {
          ...selectedMessage,
          status: variables.status || selectedMessage.status,
          companyResponse: variables.response !== undefined ? variables.response : selectedMessage.companyResponse,
          updatedAt: new Date().toISOString().split('T')[0],
          lastUpdate: new Date().toISOString().split('T')[0],
        };
        setSelectedMessage(optimisticMessage);
        setResponseText(optimisticMessage.companyResponse || "");
        setIsEditingResponse(false);
      }
      // Возвращаем пустой объект, так как основной контекст уже обрабатывается в хуке
      return {} as any;
    },
    onSuccess: (updatedMessage) => {
      // Обновляем таймер защиты
      lastLocalUpdateRef.current = Date.now();
      
      toast.success(t("messages.statusUpdated"));
      
      // Защита от потери ответа: если сервер вернул пустой ответ, но мы отправляли текст,
      // форсируем использование отправленного текста.
      let messageToSet = updatedMessage;
      if (!updatedMessage.companyResponse && responseText && responseText.trim().length > 0) {
         messageToSet = {
            ...updatedMessage,
            companyResponse: responseText
         };
      }
      
      // Обновляем selectedMessage с данными с сервера (или исправленными)
      setSelectedMessage(messageToSet);
      setResponseText(messageToSet.companyResponse || "");
      
      // Явно выключаем режим редактирования, чтобы показать ответ в режиме чтения
      setIsEditingResponse(false);
      
      // Закрываем модальное окно после успешного обновления
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      // Если произошла ошибка, возвращаем режим редактирования
      setIsEditingResponse(true);
      
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
  
  // Определяем, является ли поисковый запрос похожим на ID сообщения (FB-YYYY-XXXXXX)
  // Используем debounced версию для поиска на бэкенде
  // Поддерживает форматы: FB-2024-ABC, FB2024ABC, FB_2024_ABC, fb-2024-abc и т.д.
  const trimmedQuery = debouncedSearchQuery.trim();
  
  // Проверяем, начинается ли запрос с "FB" (в любом регистре) и содержит ли цифры
  // Это признак того, что пользователь ищет по ID сообщения
  const looksLikeMessageId = trimmedQuery.length > 0 && 
    /^FB/i.test(trimmedQuery) && 
    /\d/.test(trimmedQuery) &&
    trimmedQuery.length >= 6; // Минимальная длина ID: FB + 4 цифры года
  
  // Если запрос похож на ID, используем поиск по ID на бэкенде
  const isMessageIdSearch = looksLikeMessageId;
  
  // Нормализуем ID: убираем все дефисы, подчеркивания и пробелы, приводим к верхнему регистру
  // Это нужно для того, чтобы поиск работал независимо от формата ввода (с дефисами или без)
  const normalizedMessageId = isMessageIdSearch
    ? trimmedQuery.replace(/[-_\s]/g, '').toUpperCase()
    : undefined;
  
  const { data: messages = [], isLoading, refetch } = useMessages(
    company?.code, 
    undefined, 
    undefined, 
    normalizedMessageId, // Передаем нормализованный ID для поиска на бэкенде
    {
      enabled: !!company?.code,
      staleTime: 1000 * 5, // считаем свежими 5с - уменьшено для более быстрого обновления через WebSocket
      refetchOnMount: true,
      refetchOnWindowFocus: true, // гарантируем подтяжку при фокусе/новом устройстве
      refetchOnReconnect: true,
      // без постоянного интервала — rely на сокет + события видимости
    }
  );
  
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
  
  // Функция для нормализации ID сообщения для поиска (убирает дефисы, приводит к верхнему регистру)
  const normalizeMessageId = (id: string): string => {
    return id.replace(/[-_]/g, '').toUpperCase();
  };
  
  const filteredMessages = messages.filter((msg) => {
    // Если поиск по ID на бэкенде уже выполнен, просто применяем фильтры по статусу и типу
    // Иначе делаем клиентскую фильтрацию
    if (!isMessageIdSearch || !normalizedMessageId) {
      // Обычный поиск - фильтруем на клиенте
      const normalizedSearchQuery = normalizeMessageId(searchQuery);
      const normalizedMsgId = normalizeMessageId(msg.id);
      const normalizedCompanyCode = msg.companyCode.toUpperCase();
      
      const matchesSearch = msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        normalizedMsgId.includes(normalizedSearchQuery) ||
        normalizedCompanyCode.includes(searchQuery.toUpperCase());
      const normalizedStatus = normalizeStatus(statusFilter);
      const matchesStatus = normalizedStatus === "all" || msg.status === normalizedStatus;
      const matchesType = typeFilter === "all" || msg.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    } else {
      // Поиск по ID на бэкенде - только фильтры по статусу и типу
      const normalizedStatus = normalizeStatus(statusFilter);
      const matchesStatus = normalizedStatus === "all" || msg.status === normalizedStatus;
      const matchesType = typeFilter === "all" || msg.type === typeFilter;
      return matchesStatus && matchesType;
    }
  });
  
  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setResponseText(message.companyResponse || "");
    setIsEditingResponse(false);
    setIsDialogOpen(true);
  };
  const handleUpdateStatus = (status: MessageStatus) => {
    if (!selectedMessage) return;
    
    // Сразу устанавливаем время обновления и закрываем форму для мгновенной реакции
    lastLocalUpdateRef.current = Date.now();
    setIsEditingResponse(false);
    
    updateMessageStatus({
      id: selectedMessage.id,
      status,
      response: responseText || undefined,
    });
  };
  
  // Сохраняем предыдущее значение selectedMessage для сравнения
  const prevSelectedMessageRef = useRef<Message | null>(null);
  
  // Обновляем selectedMessage когда сообщение обновляется в списке
  useEffect(() => {
    if (selectedMessage) {
      const updatedMessage = messages.find(m => m.id === selectedMessage.id);
      
      if (updatedMessage) {
        // АГРЕССИВНАЯ ЗАЩИТА: Проверяем, не является ли пришедшее сообщение "старым" по сравнению с локальным
        // 1. Если локально статус не "Новое", а пришло "Новое" - это явно старый кэш, игнорируем
        const isStaleStatus = updatedMessage.status === "Новое" && selectedMessage.status !== "Новое";
        
        // 2. Если локально есть ответ, а пришло без ответа - это явно старый кэш, игнорируем
        const isStaleResponse = !updatedMessage.companyResponse && selectedMessage.companyResponse;
        
        // 3. Grace period: если мы недавно обновили (менее 10 сек), полностью игнорируем обновления
        const isInGracePeriod = Date.now() - lastLocalUpdateRef.current < 10000;
        
        // Если любое из условий "старости" выполнено, НЕ обновляем selectedMessage
        if (isStaleStatus || isStaleResponse || isInGracePeriod) { 
          return;
        }
        
        // Сравниваем даты без учета времени для избежания проблем с форматами (ISO vs YYYY-MM-DD)
        const updatedDate = new Date(updatedMessage.updatedAt).toISOString().split('T')[0];
        const selectedDate = new Date(selectedMessage.updatedAt).toISOString().split('T')[0];
        
        const hasChanges = 
          updatedMessage.companyResponse !== selectedMessage.companyResponse ||
          updatedMessage.status !== selectedMessage.status ||
          updatedDate !== selectedDate;
          
        // Если данные изменились И они не "старые", обновляем выбранное сообщение
        if (hasChanges) {
          setSelectedMessage(updatedMessage);
          // Обновляем текст ответа только если мы НЕ редактируем его в данный момент
          if (!isEditingResponse) {
            setResponseText(updatedMessage.companyResponse || "");
          }
        }
      }
    }
    prevSelectedMessageRef.current = selectedMessage;
  }, [messages, selectedMessage, isEditingResponse]);

  // При возврате вкладки/окна в фокус — обновляем список, чтобы новые сообщения подтянулись сразу
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && company?.code) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [company?.code, refetch]);
  
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
    <div className={`min-h-screen bg-background flex flex-col overflow-x-hidden w-full ${isFullscreen ? 'h-auto overflow-y-auto' : ''}`}>
      <CompanyHeader />
      <div className={`flex flex-col flex-1 w-full min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
        <main className={`flex-1 px-6 py-4 w-full flex flex-col min-h-0 ${isFullscreen ? 'h-auto overflow-visible block' : 'overflow-hidden'}`}>
          <div className={`flex flex-col gap-4 w-full h-full min-h-0 ${isFullscreen ? 'h-auto block' : ''}`}>
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
          
          {/* Tariff Expired Warning - показывается если тариф истек и функции ограничены */}
          {isTrialExpired && permissions.isReadOnly && !permissions.canReply && (
            <Card className="p-4 border-destructive/50 bg-destructive/10 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <FiAlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-destructive mb-1">
                    {t("company.tariffExpiredTitle") || "Тариф истек"}
                  </h3>
                  <p className="text-xs text-foreground mb-3">
                    {t("company.tariffExpiredMessageShort") || "Ваш тариф истек. Ответы на сообщения и изменение статусов недоступны. Обновите тариф для продолжения работы."}
                  </p>
                  <Button
                    onClick={() => router.push("/company/billing")}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white text-xs"
                  >
                    <FiCreditCard className="h-3 w-3 mr-1.5" />
                    {t("company.upgradeTariff") || "Обновить тариф"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-2 sm:space-y-3 w-full min-w-0">
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
                        <p className="text-sm sm:text-base text-foreground break-words whitespace-pre-wrap overflow-wrap-anywhere">
                          {message.content}
                        </p>
                        {message.companyResponse && (
                          <div className="bg-muted p-2 sm:p-3 rounded-lg">
                            <p className="text-xs sm:text-sm font-semibold mb-1">{t("messages.yourResponse")}:</p>
                            <p className="text-xs sm:text-sm text-foreground break-words overflow-wrap-anywhere">{message.companyResponse}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMessage(message)}
                        className="w-full sm:w-auto sm:flex-shrink-0 ml-0 sm:ml-4"
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
                          <div className="bg-muted p-4 rounded-lg overflow-auto max-h-64">
                            <p className="text-foreground whitespace-pre-wrap break-words">
                              {selectedMessage.content}
                            </p>
                          </div>
                        </div>
                        {selectedMessage.companyResponse && !isEditingResponse ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>{t("messages.yourResponse")}</Label>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsEditingResponse(true)}
                                className="h-6 px-2 text-xs"
                              >
                                {t("common.edit") || "Редактировать"}
                              </Button>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                              <p className="text-foreground whitespace-pre-wrap break-words">
                                {selectedMessage.companyResponse}
                              </p>
                            </div>
                          </div>
                        ) : (
                          permissions.canReply ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>{t("messages.response")}</Label>
                                {selectedMessage.companyResponse && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setIsEditingResponse(false)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {t("common.cancel") || "Отмена"}
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder={t("messages.enterResponse")}
                                className="min-h-[120px]"
                                disabled={isRejectedByAdmin(selectedMessage)}
                              />
                            </div>
                          ) : (
                            <Card className="p-4 border-destructive/50 bg-destructive/10">
                              <div className="flex items-start gap-3">
                                <FiAlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-destructive mb-1">
                                    {t("company.functionUnavailable") || "Функция недоступна"}
                                  </p>
                                  <p className="text-xs text-foreground mb-3">
                                    {isTrialExpired 
                                      ? (t("company.tariffExpiredMessageShort") || "Ваш тариф истек. Обновите тариф для ответа на сообщения.")
                                      : (t("company.upgradeRequired") || "Для ответа на сообщения необходимо обновить тариф.")}
                                  </p>
                                  <Button
                                    onClick={() => router.push("/company/billing")}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white text-xs"
                                  >
                                    <FiCreditCard className="h-3 w-3 mr-1.5" />
                                    {t("company.upgradeTariff") || "Обновить тариф"}
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          )
                        )}
                        {permissions.canChangeStatus && (
                          <div className="flex gap-3 flex-wrap">
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
                        )}
                        {permissions.canReply && responseText.trim() && (
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (responseText.trim()) {
                                handleUpdateStatus(selectedMessage.status);
                              }
                            }}
                            disabled={!responseText.trim()}
                          >
                            {t("messages.saveResponse") || "Сохранить ответ"}
                          </Button>
                        )}
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

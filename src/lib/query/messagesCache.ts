/**
 * Вспомогательные функции для работы с кэшем сообщений.
 * Кэш может хранить Message[] (legacy) или { data: Message[], pagination } (с пагинацией).
 */

import type { Message } from "@/types";
import type { MessagesPagination } from "./services";

export type MessagesCacheValue = Message[] | { data: Message[]; pagination?: MessagesPagination };

export function getMessagesList(cached: MessagesCacheValue | undefined): Message[] {
  if (!cached) return [];
  if (Array.isArray(cached)) return cached;
  if (cached && typeof cached === "object" && "data" in cached && Array.isArray(cached.data)) {
    return cached.data;
  }
  return [];
}

export function setMessagesInCache(cached: MessagesCacheValue | undefined, newList: Message[]): MessagesCacheValue {
  if (cached && typeof cached === "object" && "pagination" in cached) {
    return { ...cached, data: newList };
  }
  return newList;
}

export function createMessagesCache(messages: Message[], pagination?: MessagesPagination): MessagesCacheValue {
  if (pagination) {
    return { data: messages, pagination };
  }
  return messages;
}

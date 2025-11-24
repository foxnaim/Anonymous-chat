export interface PlatformStats {
  rooms: number;
  latency: string;
  retention: string;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  // В реальном приложении здесь будет запрос к API
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    rooms: 42,
    latency: "54ms",
    retention: "92%"
  };
}


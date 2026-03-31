/**
 * Генерация browser fingerprint для антиспам-защиты.
 * Не является уникальным идентификатором пользователя,
 * но значительно усложняет массовый спам с одного устройства.
 */

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("fingerprint", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("fingerprint", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "";
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.language,
    navigator.languages?.join(",") || "",
    screen.width + "x" + screen.height,
    screen.colorDepth?.toString() || "",
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "",
    navigator.maxTouchPoints?.toString() || "",
    navigator.platform || "",
    getCanvasFingerprint(),
  ];

  return hashString(components.join("|"));
}

let cachedFingerprint: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  cachedFingerprint = await generateFingerprint();
  return cachedFingerprint;
}

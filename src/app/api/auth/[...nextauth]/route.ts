import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const handler = NextAuth(authOptions);

// Обертка для обработки ошибок
export async function GET(req: Request, context: { params: { nextauth: string[] } }) {
  try {
    return await handler(req, context);
  } catch (error) {
    console.error("NextAuth GET handler error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Authentication error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export async function POST(req: Request, context: { params: { nextauth: string[] } }) {
  try {
    return await handler(req, context);
  } catch (error) {
    console.error("NextAuth POST handler error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Authentication error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}



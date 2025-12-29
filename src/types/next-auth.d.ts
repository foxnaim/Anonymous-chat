import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      companyId?: string;
    };
    accessToken?: string;
    apiToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    companyId?: string;
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    companyId?: string;
    accessToken?: string;
    refreshToken?: string;
    apiToken?: string;
  }
}


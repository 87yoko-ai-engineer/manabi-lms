// Auth.js のセッション・JWTに id / role を追加する型拡張
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "student";
    } & DefaultSession["user"];
  }
  interface User {
    role: "admin" | "student";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "student";
  }
}

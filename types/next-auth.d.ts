import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
      mfaPending?: boolean;
      mfaEnrollmentRequired?: boolean;
      mfaVerifiedAt?: number;
      stepUpUntil?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    mfaPending?: boolean;
    mfaEnrollmentRequired?: boolean;
    mfaVerifiedAt?: number;
    stepUpUntil?: number;
  }
}

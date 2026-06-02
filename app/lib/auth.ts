import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth-options";

export const auth = () => getServerSession(authOptions);

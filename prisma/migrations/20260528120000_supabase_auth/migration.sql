-- Supabase Auth: link MapAble users to Supabase auth.users
ALTER TABLE "User" ADD COLUMN "authSupabaseId" TEXT;

CREATE UNIQUE INDEX "User_authSupabaseId_key" ON "User"("authSupabaseId");

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

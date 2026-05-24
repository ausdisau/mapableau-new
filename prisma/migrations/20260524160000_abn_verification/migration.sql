-- ABN verification: optional contractor ABN on workers
ALTER TABLE "WorkerProfile" ADD COLUMN IF NOT EXISTS "contractorAbn" TEXT;

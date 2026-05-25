import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VENDORS = [
  {
    vendorName: "Auth0",
    serviceName: "Universal Login",
    dataCategories: ["identity", "authentication"],
    handlesPhiOrEphi: false,
    handlesHealthInformation: false,
    baaRequired: false,
    baaSigned: false,
    notes: "Identity-only; no NDIS/clinical data in metadata",
  },
  {
    vendorName: "Google",
    serviceName: "Social Login",
    dataCategories: ["identity", "email", "profile"],
    handlesPhiOrEphi: false,
    handlesHealthInformation: false,
    baaRequired: false,
    baaSigned: false,
    notes: "openid email profile scopes only",
  },
  {
    vendorName: "Supabase",
    serviceName: "Postgres hosting",
    dataCategories: ["database", "personal_information", "health_information"],
    handlesPhiOrEphi: true,
    handlesHealthInformation: true,
    baaRequired: true,
    baaSigned: false,
    notes: "If used for PHI storage; review BAA with legal",
  },
  {
    vendorName: "Neon",
    serviceName: "Postgres hosting",
    dataCategories: ["database", "personal_information", "health_information"],
    handlesPhiOrEphi: true,
    handlesHealthInformation: true,
    baaRequired: true,
    baaSigned: false,
  },
  {
    vendorName: "Stripe",
    serviceName: "Payments",
    dataCategories: ["billing", "personal_information"],
    handlesPhiOrEphi: false,
    handlesHealthInformation: false,
    baaRequired: false,
    baaSigned: false,
  },
  {
    vendorName: "Xero",
    serviceName: "Accounting",
    dataCategories: ["billing", "invoices"],
    handlesPhiOrEphi: false,
    handlesHealthInformation: false,
    baaRequired: false,
    baaSigned: false,
  },
];

export async function seedVendorCompliance() {
  for (const v of VENDORS) {
    await prisma.vendorComplianceRecord.upsert({
      where: {
        vendorName_serviceName: {
          vendorName: v.vendorName,
          serviceName: v.serviceName,
        },
      },
      create: v,
      update: {
        dataCategories: v.dataCategories,
        handlesPhiOrEphi: v.handlesPhiOrEphi,
        handlesHealthInformation: v.handlesHealthInformation,
        baaRequired: v.baaRequired,
        notes: v.notes,
      },
    });
  }
}

if (require.main === module) {
  seedVendorCompliance()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}

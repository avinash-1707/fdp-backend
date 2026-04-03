import bcrypt from "bcryptjs";
import { prisma } from "../src/config/database";

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Clean slate ──────────────────────────────────────────────────────────
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin1234", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Alice Admin",
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: "Bob Analyst",
      email: "analyst@example.com",
      password: passwordHash,
      role: "ANALYST",
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: "Carol Viewer",
      email: "viewer@example.com",
      password: passwordHash,
      role: "VIEWER",
    },
  });

  console.log("✅ Created users:", [admin.email, analyst.email, viewer.email]);

  // ─── Financial records ────────────────────────────────────────────────────
  const records = [
    // Admin's records
    {
      amount: 5000,
      type: "INCOME" as const,
      category: "Salary",
      date: new Date("2024-01-01"),
      notes: "January salary",
      userId: admin.id,
    },
    {
      amount: 1200,
      type: "EXPENSE" as const,
      category: "Rent",
      date: new Date("2024-01-05"),
      notes: "Monthly rent",
      userId: admin.id,
    },
    {
      amount: 350,
      type: "EXPENSE" as const,
      category: "Utilities",
      date: new Date("2024-01-10"),
      notes: "Electricity + internet",
      userId: admin.id,
    },
    {
      amount: 2500,
      type: "INCOME" as const,
      category: "Freelance",
      date: new Date("2024-02-15"),
      notes: "Client project",
      userId: admin.id,
    },
    {
      amount: 600,
      type: "EXPENSE" as const,
      category: "Groceries",
      date: new Date("2024-02-20"),
      notes: "Monthly groceries",
      userId: admin.id,
    },
    {
      amount: 5000,
      type: "INCOME" as const,
      category: "Salary",
      date: new Date("2024-02-01"),
      notes: "February salary",
      userId: admin.id,
    },
    {
      amount: 800,
      type: "EXPENSE" as const,
      category: "Transport",
      date: new Date("2024-03-05"),
      notes: "Car service",
      userId: admin.id,
    },
    {
      amount: 5000,
      type: "INCOME" as const,
      category: "Salary",
      date: new Date("2024-03-01"),
      notes: "March salary",
      userId: admin.id,
    },

    // Analyst's records
    {
      amount: 4200,
      type: "INCOME" as const,
      category: "Salary",
      date: new Date("2024-01-01"),
      notes: "January salary",
      userId: analyst.id,
    },
    {
      amount: 900,
      type: "EXPENSE" as const,
      category: "Rent",
      date: new Date("2024-01-07"),
      notes: "Monthly rent",
      userId: analyst.id,
    },
    {
      amount: 1800,
      type: "INCOME" as const,
      category: "Consulting",
      date: new Date("2024-01-20"),
      notes: "Short consulting gig",
      userId: analyst.id,
    },
    {
      amount: 200,
      type: "EXPENSE" as const,
      category: "Subscriptions",
      date: new Date("2024-02-01"),
      notes: "SaaS tools",
      userId: analyst.id,
    },

    // Viewer's records
    {
      amount: 3500,
      type: "INCOME" as const,
      category: "Salary",
      date: new Date("2024-01-01"),
      notes: "January salary",
      userId: viewer.id,
    },
    {
      amount: 1000,
      type: "EXPENSE" as const,
      category: "Rent",
      date: new Date("2024-01-08"),
      notes: "Rent payment",
      userId: viewer.id,
    },
  ];

  await prisma.financialRecord.createMany({ data: records });
  console.log(`✅ Created ${records.length} financial records`);

  console.log("\n🎉 Seed complete! Test credentials (password: Admin1234):");
  console.log("   admin@example.com    → ADMIN");
  console.log("   analyst@example.com  → ANALYST");
  console.log("   viewer@example.com   → VIEWER");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

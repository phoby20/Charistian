import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash("master@christm", 10);
    await prisma.user.upsert({
      where: { email: "master@example.com" },
      update: {},
      create: {
        email: "master@example.com",
        password: hashedPassword,
        name: "Master Admin",
        birthDate: new Date("1970-01-01"),
        gender: "M",
        country: "South Korea",
        region: "Seoul", // Added to match schema
        role: "MASTER",
        church: {
          create: {
            name: "Master Church",
            address: "Master Address",
            country: "South Korea",
            phone: "000-0000-0000", // Renamed from phone to phone
            plan: "ENTERPRISE",
            state: "APPROVED", // Changed from status to state
          },
        },
      },
    });
    console.log("Seed data inserted successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Main error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  });

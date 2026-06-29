import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/database";
import { User, AcademicSession } from "./models";

async function seed() {
  await connectDB();

  await User.collection.dropIndex("username_1").catch(() => undefined);

  const superAdmin = await User.findOne({ email: "superadmin@school.com" });
  if (!superAdmin) {
    await User.create({
      name: "Super Admin",
      email: "superadmin@school.com",
      password: "admin123",
      role: "super_admin",
    });
    console.log("Super Admin created: superadmin@school.com / admin123");
  }

  const admin = await User.findOne({ email: "admin@school.com" });
  if (!admin) {
    await User.create({
      name: "School Admin",
      email: "admin@school.com",
      password: "admin123",
      role: "admin",
    });
    console.log("Admin created: admin@school.com / admin123");
  }

  const session = await AcademicSession.findOne({ name: "2025-26" });
  if (!session) {
    await AcademicSession.create({
      name: "2025-26",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
      isActive: true,
    });
    console.log("Academic session 2025-26 created");
  }

  console.log("Seed completed! Classes and sections will be created from student Excel import.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

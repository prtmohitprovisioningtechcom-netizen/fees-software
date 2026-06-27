import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/database";
import { User, Class, Section, AcademicSession } from "./models";

async function seed() {
  await connectDB();

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

  const classNames = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];
  for (const name of classNames) {
    await Class.findOneAndUpdate({ name }, { name, isActive: true }, { upsert: true });
  }
  console.log("Classes seeded");

  const classes = await Class.find();
  for (const cls of classes) {
    for (const sec of ["A", "B"]) {
      await Section.findOneAndUpdate(
        { classId: cls._id, name: sec },
        { classId: cls._id, name: sec, isActive: true },
        { upsert: true }
      );
    }
  }
  console.log("Sections seeded");

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

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

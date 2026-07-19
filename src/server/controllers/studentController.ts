import { Response } from "express";
import { Types } from "mongoose";
import * as XLSX from "xlsx";
import { AcademicSession, Class, Section, Student, TransportRoute } from "../models";
import { AuthRequest } from "../middleware/auth";
import { generateRegistrationNumber } from "../services/feeService";
import { resolveAcademicSession } from "../services/sessionService";
import { EXCEL_IMPORT_CLASS_DESC } from "../constants/classes";
import { asScalar } from "@/lib/student-display";
import {
  parseCalendarDate,
  toCalendarDateString,
  todayCalendarDateString,
} from "@/lib/calendar-date";

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;
    const status = req.query.status as string;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { studentPen: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (status) filter.status = status;

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: students.map((s) => withCalendarDates(s.toObject())),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch students", error: String(error) });
  }
};

export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name")
      .populate("transportRouteId", "name monthlyFee");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: withCalendarDates(student.toObject()) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch student", error: String(error) });
  }
};

const normalizeBoolean = (value: string) => ["yes", "true", "1", "y", "haan"].includes(value.trim().toLowerCase());

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveTransportRouteId = async (transportRequired: boolean, routeRef?: unknown) => {
  if (!transportRequired) return undefined;
  const ref = String(routeRef || "").trim();
  if (!ref) {
    throw new Error("Transport route is required when school transport is Yes");
  }
  if (Types.ObjectId.isValid(ref)) {
    const byId = await TransportRoute.findOne({ _id: ref, isActive: true });
    if (byId) return byId._id;
  }
  const byName = await TransportRoute.findOne({
    name: { $regex: `^${escapeRegex(ref)}$`, $options: "i" },
    isActive: true,
  });
  if (!byName) throw new Error(`Transport route not found: ${ref}`);
  return byName._id;
};

const normalizeStudentTransport = async (
  data: Record<string, unknown>,
  options: { requireWhenMissing?: boolean } = {}
) => {
  const hasTransportField =
    data.transportRequired !== undefined ||
    data.transportRouteId !== undefined ||
    data.transportRoute !== undefined ||
    data.transportRouteName !== undefined;

  if (!hasTransportField && !options.requireWhenMissing) {
    delete data.transportRequired;
    delete data.transportRouteId;
    delete data.transportRoute;
    delete data.transportRouteName;
    return;
  }

  if (data.transportRequired !== undefined) {
    if (typeof data.transportRequired === "boolean") {
      data.transportRequired = data.transportRequired;
    } else {
      data.transportRequired = normalizeBoolean(String(data.transportRequired));
    }
  } else {
    data.transportRequired = false;
  }

  if (!data.transportRequired) {
    data.transportRouteId = null;
    return;
  }

  const routeRef = data.transportRouteId ?? data.transportRoute ?? data.transportRouteName;
  data.transportRouteId = await resolveTransportRouteId(true, routeRef);
};

const parseStudentBody = (body: Record<string, unknown>) => {
  const data = { ...body };
  if (typeof data.address === "string") {
    data.address = JSON.parse(data.address as string);
  }
  return data;
};

const getMongoPhoto = (file?: Express.Multer.File) => {
  if (!file?.buffer) return undefined;
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

type ExcelRow = Record<string, unknown>;
type ParsedExcelRow = { rowNumber: number; data: ExcelRow };

const normalizeHeader = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");

const getCell = (row: ExcelRow, aliases: string[]) => {
  const wanted = aliases.map(normalizeHeader);
  const entry = Object.entries(row).find(([key]) => wanted.includes(normalizeHeader(key)));
  if (!entry) return "";
  const value = entry[1];
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return toCalendarDateString(value);
  }
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
};

const getHeaderScore = (row: unknown[]) => {
  const headers = row.map((cell) => normalizeHeader(String(cell || "")));
  const has = (aliases: string[]) => aliases.some((alias) => headers.includes(normalizeHeader(alias)));
  let score = 0;
  if (has(["Class"])) score += 3;
  if (has(["Section"])) score += 3;
  if (has(["Name", "Student Name"])) score += 3;
  if (has(["Gender"])) score += 2;
  if (has(["Student PEN", "Admission Number"])) score += 2;
  if (has(["Student State Code"])) score += 2;
  if (has(["Father Name"])) score += 1;
  if (has(["Mother Name"])) score += 1;
  return score;
};

const parseWorksheetRows = (worksheet: XLSX.WorkSheet): ParsedExcelRow[] => {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "", blankrows: false });
  const headerIndex = rawRows.reduce(
    (best, row, index) => {
      const score = getHeaderScore(row);
      return score > best.score ? { index, score } : best;
    },
    { index: -1, score: 0 }
  );

  if (headerIndex.index === -1 || headerIndex.score < 6) return [];

  const headers = rawRows[headerIndex.index].map((header, index) => {
    const text = String(header || "").trim();
    return text || `Column ${index + 1}`;
  });

  return rawRows
    .slice(headerIndex.index + 1)
    .map((row, index) => {
      const data = headers.reduce<ExcelRow>((acc, header, columnIndex) => {
        acc[header] = row[columnIndex] ?? "";
        return acc;
      }, {});

      return {
        rowNumber: headerIndex.index + index + 2,
        data,
      };
    })
    .filter(({ data }) => Object.values(data).some((value) => String(value || "").trim()));
};

/** Parse DOB / admission — UTC noon of the school calendar day. */
const parseExcelDate = (value: unknown) => {
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return parseCalendarDate(
        `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`
      );
    }
  }
  return parseCalendarDate(value);
};

const withCalendarDates = (student: unknown) => {
  const next = { ...(student as Record<string, unknown>) };
  if ("dateOfBirth" in next) {
    next.dateOfBirth = toCalendarDateString(next.dateOfBirth);
  }
  if ("admissionDate" in next) {
    next.admissionDate = toCalendarDateString(next.admissionDate);
  }
  return next;
};

const normalizeGender = (value: string) => {
  const gender = value.trim().toLowerCase();
  if (["m", "male", "boy"].includes(gender)) return "male";
  if (["f", "female", "girl"].includes(gender)) return "female";
  if (["other", "others"].includes(gender)) return "other";
  return null;
};

const normalizeStatus = (value: string) => {
  const status = value.trim().toLowerCase();
  if (["active", "inactive", "left"].includes(status)) return status as "active" | "inactive" | "left";
  return "active";
};

const getCurrentSession = () => resolveAcademicSession();

const findClass = async (value: string) => {
  const ref = value || "";
  if (!ref) return null;
  if (Types.ObjectId.isValid(ref)) return Class.findOne({ _id: ref, isActive: true });
  const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Class.findOne({
    isActive: true,
    description: EXCEL_IMPORT_CLASS_DESC,
    $or: [
      { name: { $regex: `^${escaped}$`, $options: "i" } },
      { name: { $regex: `^class\\s*${escaped}$`, $options: "i" } },
    ],
  });
};

const ensureClass = async (value: string) => {
  const className = value.trim();
  const existing = await findClass(className);
  if (existing) return existing;

  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const conflicting = await Class.findOne({
    $or: [
      { name: { $regex: `^${escaped}$`, $options: "i" } },
      { name: { $regex: `^class\\s*${escaped}$`, $options: "i" } },
    ],
  });

  if (conflicting) {
    conflicting.name = className;
    conflicting.description = EXCEL_IMPORT_CLASS_DESC;
    conflicting.isActive = true;
    await conflicting.save();
    return conflicting;
  }

  return Class.create({ name: className, description: EXCEL_IMPORT_CLASS_DESC, isActive: true });
};

const findSession = async (value: string) => {
  const ref = value || "";
  if (!ref) return null;
  if (Types.ObjectId.isValid(ref)) return AcademicSession.findOne({ _id: ref, isActive: true });
  return AcademicSession.findOne({ name: { $regex: `^${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }, isActive: true });
};

const findSection = async (value: string, classId: string) => {
  const ref = value || "";
  if (!ref) return null;
  if (Types.ObjectId.isValid(ref)) return Section.findOne({ _id: ref, classId, isActive: true });
  return Section.findOne({
    classId,
    isActive: true,
    name: { $regex: `^${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
};

const ensureSection = async (value: string, classId: string) => {
  const sectionName = value.trim();
  const existing = await findSection(sectionName, classId);
  if (existing) return existing;
  return Section.create({ name: sectionName, classId, isActive: true });
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const photo = getMongoPhoto(req.file);
    const parsed = parseStudentBody(req.body);
    const today = parseCalendarDate(todayCalendarDateString()) || new Date();

    const className = String(parsed.className || parsed.class || "").trim();
    const sectionName = String(parsed.sectionName || parsed.section || "").trim();
    const studentPen = String(parsed.studentPen || "").trim();
    const studentStateCode = String(parsed.studentStateCode || "").trim();
    const aadharNumber = String(parsed.aadharNumber || "").trim();
    const studentName = String(parsed.studentName || parsed.name || "").trim() || "Student";
    const admissionNumber = String(
      parsed.admissionNumber || studentPen || studentStateCode || aadharNumber || `TMP-${Date.now()}`
    ).trim();

    let registrationNumber = String(parsed.registrationNumber || "").trim();
    if (registrationNumber) {
      const regExists = await Student.findOne({ registrationNumber });
      if (regExists) {
        return res.status(400).json({ success: false, message: "Registration number already exists" });
      }
    } else {
      registrationNumber = await generateRegistrationNumber();
    }

    if (admissionNumber) {
      const existing = await Student.findOne({ admissionNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: "Student already exists with this Admission/PEN number" });
      }
    }

    let classId = parsed.classId;
    let sectionId = parsed.sectionId;
    if (!classId && className) {
      const cls = await ensureClass(className);
      classId = cls?._id;
      if (sectionName) {
        const section = await ensureSection(sectionName, String(classId));
        sectionId = section?._id;
      }
    } else if (classId && sectionName && !sectionId) {
      const section = await ensureSection(sectionName, String(classId));
      sectionId = section?._id;
    }

    const session = parsed.sessionId
      ? await findSession(String(parsed.sessionId))
      : await getCurrentSession();
    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Academic Session not found. Create or mark one active/current session.",
      });
    }

    await normalizeStudentTransport(parsed, { requireWhenMissing: false });

    const student = await Student.create({
      ...parsed,
      registrationNumber,
      photo,
      admissionNumber,
      rollNumber: String(parsed.rollNumber || studentStateCode || studentPen || admissionNumber || ""),
      studentName,
      fatherName: String(parsed.fatherName || ""),
      motherName: String(parsed.motherName || ""),
      mobileNumber: String(parsed.mobileNumber || ""),
      gender: normalizeGender(String(parsed.gender || "")) || "other",
      dateOfBirth: parseExcelDate(parsed.dateOfBirth) || today,
      classId: classId || undefined,
      sectionId: sectionId || undefined,
      sessionId: parsed.sessionId || session._id,
      admissionDate: parseExcelDate(parsed.admissionDate) || today,
      address: parsed.address || {
        line1: "",
        city: "",
        state: "",
        pincode: "",
      },
      status: normalizeStatus(String(parsed.status || "active")),
      transportRequired: Boolean(parsed.transportRequired),
      transportRouteId: parsed.transportRouteId,
      initializedAtSdms: String(parsed.initializedAtSdms || ""),
      studentPen,
      studentStateCode,
      category: String(parsed.socialCategory || parsed.category || ""),
      minorityGroup: String(parsed.minorityGroup || ""),
      bplBeneficiary: normalizeBoolean(String(parsed.bplBeneficiary || "")),
      cwsn: normalizeBoolean(String(parsed.cwsn || "")),
      typeOfImpairments: String(parsed.typeOfImpairments || ""),
      isRepeater: normalizeBoolean(String(parsed.isRepeater || "")),
      suspectedDuplicate: normalizeBoolean(String(parsed.suspectedDuplicate || "")),
      entryStatus: String(parsed.entryStatus || ""),
      aadharNumber,
      nameAsPerAadhaar: String(parsed.nameAsPerAadhaar || ""),
      aadhaarValidationStatus: String(parsed.aadhaarValidationStatus || ""),
      mbuStatus: String(parsed.mbuStatus || ""),
      apaarId: String(parsed.apaarId || ""),
      apaarStatus: String(parsed.apaarStatus || ""),
      createdBy: req.user?.id,
    });

    await student.populate(["classId", "sectionId", "sessionId", { path: "transportRouteId", select: "name monthlyFee" }]);
    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: withCalendarDates(student.toObject()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to register student", error: String(error) });
  }
};

export const importStudents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, message: "Excel file is required" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = parseWorksheetRows(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not find SDMS header row. Please keep columns like Class, Section, Name, Gender, Student PEN in the sheet.",
      });
    }

    const imported = [];
    const errors: { row: number; admissionNumber?: string; studentName?: string; message: string }[] = [];
    const seenAdmissionNumbers = new Set<string>();

    for (const { rowNumber, data: row } of rows) {
      const studentPen = getCell(row, ["Student PEN", "PEN", "studentPen"]);
      const studentStateCode = getCell(row, ["Student State Code", "State Code", "studentStateCode"]);
      const aadharNumber = getCell(row, ["AADHAAR No.", "AADHAAR No", "Aadhar Number", "Aadhaar Number", "aadharNumber"]);
      const admissionNumber = getCell(row, ["Admission Number", "Admission No", "admissionNumber"]) || studentPen || studentStateCode || aadharNumber;
      const studentName = getCell(row, ["Student Name", "Name", "studentName"]);

      try {
        const rollNumber = getCell(row, ["Roll Number", "Roll No", "rollNumber"]) || studentStateCode || studentPen || String(rowNumber - 1);
        const fatherName = getCell(row, ["Father Name", "fatherName"]) || "-";
        const motherName = getCell(row, ["Mother Name", "motherName"]) || "-";
        const mobileNumber = getCell(row, ["Mobile Number", "Mobile", "Phone", "mobileNumber"]) || "0000000000";
        const gender = normalizeGender(getCell(row, ["Gender", "Sex"])) || "other";
        const today = parseCalendarDate(todayCalendarDateString()) || new Date();
        const dateOfBirth = parseExcelDate(getCell(row, ["Date Of Birth", "DOB", "Birth Date", "dateOfBirth"])) || today;
        const admissionDate = parseExcelDate(getCell(row, ["Admission Date", "admissionDate"])) || today;
        const classRef = getCell(row, ["Class", "Class Name", "className", "classId"]);
        const sectionRef = getCell(row, ["Section", "Section Name", "sectionName", "sectionId"]);
        const sessionRef = getCell(row, ["Session", "Academic Session", "sessionName", "sessionId"]);
        const addressLine1 = getCell(row, ["Address", "Address Line 1", "addressLine1"]) || "Imported from SDMS";
        const city = getCell(row, ["City"]) || "N/A";
        const state = getCell(row, ["State"]) || "N/A";
        const pincode = (getCell(row, ["Pincode", "Pin Code", "PIN"]) || "000000").padStart(6, "0");

        const missing = [
          ["Admission Number", admissionNumber],
          ["Roll Number", rollNumber],
          ["Name", studentName],
          ["Class", classRef],
          ["Section", sectionRef],
        ]
          .filter(([, value]) => !value)
          .map(([label]) => label);

        if (missing.length) throw new Error(`Missing required fields: ${missing.join(", ")}`);
        if (mobileNumber !== "0000000000" && !/^[6-9]\d{9}$/.test(mobileNumber)) {
          throw new Error("Mobile Number must be a valid 10-digit Indian mobile number");
        }
        if (!/^\d{6}$/.test(pincode)) throw new Error("Pincode must be 6 digits");
        if (seenAdmissionNumbers.has(admissionNumber.toLowerCase())) throw new Error("Duplicate Admission Number in uploaded file");

        const existing = await Student.findOne({ admissionNumber });
        if (existing) throw new Error("Admission Number already exists");

        const cls = await ensureClass(classRef);

        const section = await ensureSection(sectionRef, String(cls._id));

        const session = sessionRef ? await findSession(sessionRef) : await getCurrentSession();
        if (!session) throw new Error("Academic Session not found. Create or mark one active/current session.");

        const transportRequired = normalizeBoolean(getCell(row, ["Transport Required", "Transport", "transportRequired"]));
        const transportRouteRef = getCell(row, ["Transport Route", "Village", "transportRoute"]);
        const transportRouteId = transportRequired
          ? await resolveTransportRouteId(true, transportRouteRef)
          : undefined;

        const registrationNumber = await generateRegistrationNumber();
        const student = await Student.create({
          registrationNumber,
          admissionNumber,
          rollNumber,
          studentName,
          fatherName,
          motherName,
          mobileNumber,
          alternateMobile: getCell(row, ["Alternate Mobile", "Alternate Mobile Number", "alternateMobile"]),
          email: getCell(row, ["Email"]),
          gender,
          dateOfBirth,
          bloodGroup: getCell(row, ["Blood Group", "bloodGroup"]),
          category: getCell(row, ["Social Category", "Category"]),
          religion: getCell(row, ["Religion"]),
          aadharNumber,
          classId: cls._id,
          sectionId: section._id,
          sessionId: session._id,
          admissionDate,
          address: {
            line1: addressLine1,
            city,
            state,
            pincode,
          },
          status: normalizeStatus(getCell(row, ["Status"])),
          previousSchool: getCell(row, ["Previous School", "previousSchool"]),
          transportRequired,
          transportRouteId,
          initializedAtSdms: getCell(row, ["Initialised at SDMS", "Initialized at SDMS"]),
          studentPen,
          studentStateCode,
          minorityGroup: getCell(row, ["Minority Group"]),
          bplBeneficiary: normalizeBoolean(getCell(row, ["BPL beneficiary", "BPL beneficiary "])),
          cwsn: normalizeBoolean(getCell(row, ["CWSN"])),
          typeOfImpairments: getCell(row, ["Type of Impairments", "Type of Impairment"]),
          isRepeater: normalizeBoolean(getCell(row, ["Is Repeater"])),
          suspectedDuplicate: normalizeBoolean(getCell(row, ["Suspected Duplicate"])),
          entryStatus: getCell(row, ["Entry Status"]),
          nameAsPerAadhaar: getCell(row, ["Name As per AADHAAR", "Name As per Aadhaar"]),
          aadhaarValidationStatus: getCell(row, ["AADHAAR Validation Status", "Aadhaar Validation Status"]),
          mbuStatus: getCell(row, ["MBU Status"]),
          apaarId: getCell(row, ["APAAR ID"]),
          apaarStatus: getCell(row, ["APAAR Status"]),
          createdBy: req.user?.id,
        });

        seenAdmissionNumbers.add(admissionNumber.toLowerCase());
        imported.push({
          _id: student._id,
          registrationNumber: student.registrationNumber,
          admissionNumber: student.admissionNumber,
          studentName: student.studentName,
          className: cls.name,
          sectionName: section.name,
        });
      } catch (error) {
        errors.push({
          row: rowNumber,
          admissionNumber: admissionNumber || undefined,
          studentName: studentName || undefined,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    res.json({
      success: true,
      message: `${imported.length} student(s) imported successfully`,
      data: {
        importedCount: imported.length,
        failedCount: errors.length,
        totalRows: rows.length,
        imported,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to import students", error: String(error) });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const body = parseStudentBody(req.body);

    const pick = (key: string) => asScalar(body[key]);

    const updates: Record<string, unknown> = {};

    if (req.file) {
      updates.photo = getMongoPhoto(req.file);
    }

    const registrationNumber = pick("registrationNumber");
    if (registrationNumber) {
      const clash = await Student.findOne({
        registrationNumber,
        _id: { $ne: req.params.id },
      });
      if (clash) {
        return res.status(400).json({ success: false, message: "Registration number already exists" });
      }
      updates.registrationNumber = registrationNumber;
    }

    const stringFields = [
      "admissionNumber",
      "rollNumber",
      "studentName",
      "studentPen",
      "fatherName",
      "motherName",
      "mobileNumber",
      "studentStateCode",
      "aadharNumber",
      "bloodGroup",
      "previousSchool",
      "religion",
      "minorityGroup",
      "typeOfImpairments",
      "entryStatus",
      "nameAsPerAadhaar",
      "aadhaarValidationStatus",
      "mbuStatus",
      "apaarId",
      "apaarStatus",
      "initializedAtSdms",
    ] as const;

    for (const key of stringFields) {
      if (body[key] !== undefined) {
        updates[key] = pick(key);
      }
    }

    if (body.category !== undefined || body.socialCategory !== undefined) {
      updates.category = pick("category") || pick("socialCategory");
    }

    if (body.gender !== undefined) {
      updates.gender = normalizeGender(pick("gender")) || "other";
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(pick("status") || "active");
    }

    if (body.dateOfBirth !== undefined) {
      const dob = parseExcelDate(pick("dateOfBirth"));
      if (dob) updates.dateOfBirth = dob;
    }
    if (body.admissionDate !== undefined) {
      const adm = parseExcelDate(pick("admissionDate"));
      if (adm) updates.admissionDate = adm;
    }

    for (const key of ["classId", "sectionId", "sessionId"] as const) {
      const id = pick(key);
      if (id && Types.ObjectId.isValid(id)) {
        updates[key] = new Types.ObjectId(id);
      }
    }

    if (body.address !== undefined) {
      const addr =
        typeof body.address === "object" && body.address
          ? (body.address as Record<string, unknown>)
          : {};
      updates.address = {
        line1: asScalar(addr.line1) || "-",
        city: asScalar(addr.city) || "-",
        state: asScalar(addr.state) || "-",
        pincode: asScalar(addr.pincode) || "000000",
      };
    }

    if (
      body.transportRequired !== undefined ||
      body.transportRouteId !== undefined ||
      body.transportRoute !== undefined ||
      body.transportRouteName !== undefined
    ) {
      const transportPatch: Record<string, unknown> = {
        transportRequired: body.transportRequired,
        transportRouteId: body.transportRouteId,
        transportRoute: body.transportRoute,
        transportRouteName: body.transportRouteName,
      };
      await normalizeStudentTransport(transportPatch);
      if (transportPatch.transportRequired !== undefined) {
        updates.transportRequired = transportPatch.transportRequired;
      }
      if (transportPatch.transportRouteId !== undefined) {
        updates.transportRouteId = transportPatch.transportRouteId;
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name")
      .populate("transportRouteId", "name monthlyFee");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({
      success: true,
      message: "Student updated successfully",
      data: withCalendarDates(student.toObject()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update student", error: String(error) });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete student", error: String(error) });
  }
};

export const updateStudentFeeDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const feeDiscount = Math.max(0, Number(req.body.feeDiscount) || 0);
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { feeDiscount },
      { new: true }
    )
      .populate("classId", "name")
      .populate("sectionId", "name");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student discount updated", data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update discount", error: String(error) });
  }
};

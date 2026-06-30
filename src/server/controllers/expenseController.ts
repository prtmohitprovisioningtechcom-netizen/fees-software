import { Response } from "express";
import { Types } from "mongoose";
import { Expense, ExpenseCategory } from "../models";
import { AuthRequest } from "../middleware/auth";

const DEFAULT_CATEGORIES = [
  "Salary",
  "Utilities",
  "Maintenance",
  "Stationery",
  "Transport",
  "Event / Function",
  "Rent",
  "Miscellaneous",
];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const ensureDefaultCategories = async () => {
  const count = await ExpenseCategory.countDocuments();
  if (count === 0) {
    await ExpenseCategory.insertMany(DEFAULT_CATEGORIES.map((name) => ({ name })));
  }
};

export const generateVoucherNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `EXP${year}`;
  const last = await Expense.findOne({ voucherNumber: new RegExp(`^${prefix}`) })
    .sort({ voucherNumber: -1 })
    .select("voucherNumber");

  let seq = 1;
  if (last?.voucherNumber) {
    const num = parseInt(last.voucherNumber.replace(prefix, ""), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `${prefix}${String(seq).padStart(5, "0")}`;
};

export const getExpenseCategories = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCategories();
    const categories = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch categories", error: String(error) });
  }
};

export const createExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });

    const existing = await ExpenseCategory.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (existing) return res.status(400).json({ success: false, message: "Category already exists" });

    const category = await ExpenseCategory.create({ name });
    res.status(201).json({ success: true, message: "Category created", data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create category", error: String(error) });
  }
};

export const deleteExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const inUse = await Expense.countDocuments({ categoryId: req.params.id, status: "active" });
    if (inUse > 0) {
      return res.status(400).json({ success: false, message: "Category is used in expenses and cannot be deleted" });
    }
    const category = await ExpenseCategory.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete category", error: String(error) });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const categoryId = req.query.categoryId as string;
    const sessionId = req.query.sessionId as string;
    const paymentMode = req.query.paymentMode as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const filter: Record<string, unknown> = { status: "active" };
    if (categoryId) filter.categoryId = categoryId;
    if (sessionId) filter.sessionId = sessionId;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) (filter.expenseDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (filter.expenseDate as Record<string, Date>).$lte = end;
      }
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { paidTo: { $regex: search, $options: "i" } },
        { voucherNumber: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .populate("categoryId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name")
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch expenses", error: String(error) });
  }
};

export const getExpenseStats = async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const baseFilter: Record<string, unknown> = { status: "active" };
    if (sessionId) baseFilter.sessionId = new Types.ObjectId(sessionId);

    const rangeFilter = { ...baseFilter };
    if (startDate || endDate) {
      rangeFilter.expenseDate = {};
      if (startDate) (rangeFilter.expenseDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (rangeFilter.expenseDate as Record<string, Date>).$lte = end;
      }
    }

    const [todayAgg, monthAgg, rangeAgg, byCategory, recentExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: { ...baseFilter, expenseDate: { $gte: startOfToday(), $lte: endOfToday() } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { ...baseFilter, expenseDate: { $gte: startOfMonth() } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: rangeFilter },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: rangeFilter },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Expense.find(rangeFilter)
        .populate("categoryId", "name")
        .sort({ expenseDate: -1 })
        .limit(5)
        .select("voucherNumber title amount expenseDate categoryId paymentMode"),
    ]);

    const categoryIds = byCategory.map((item) => item._id).filter(Boolean);
    const categories = await ExpenseCategory.find({ _id: { $in: categoryIds } }).select("name");
    const categoryMap = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));

    res.json({
      success: true,
      data: {
        todayTotal: todayAgg[0]?.total || 0,
        todayCount: todayAgg[0]?.count || 0,
        monthTotal: monthAgg[0]?.total || 0,
        monthCount: monthAgg[0]?.count || 0,
        rangeTotal: rangeAgg[0]?.total || 0,
        rangeCount: rangeAgg[0]?.count || 0,
        byCategory: byCategory.map((item) => ({
          categoryId: item._id?.toString(),
          categoryName: categoryMap[item._id?.toString()] || "Unknown",
          total: item.total,
          count: item.count,
        })),
        recentExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch expense stats", error: String(error) });
  }
};

export const getExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("categoryId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name");
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch expense", error: String(error) });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const voucherNumber = await generateVoucherNumber();
    const expense = await Expense.create({
      ...req.body,
      voucherNumber,
      amount: Number(req.body.amount),
      createdBy: req.user?.id,
    });

    await expense.populate(["categoryId", "sessionId", "createdBy"]);
    res.status(201).json({ success: true, message: "Expense recorded", data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create expense", error: String(error) });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    if (updates.amount !== undefined) updates.amount = Number(updates.amount);

    const expense = await Expense.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("categoryId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name");

    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, message: "Expense updated", data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update expense", error: String(error) });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete expense", error: String(error) });
  }
};

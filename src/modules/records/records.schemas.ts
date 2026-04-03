import { z } from "zod";
import { RecordType } from "../../generated/prisma/enums";

export const createRecordSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be a positive number")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  type: z.enum(RecordType, {
    error: "Type must be INCOME or EXPENSE",
  }),
  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category must be under 100 characters")
    .trim(),
  date: z
    .string({ error: "Date is required" })
    .datetime({ message: "Date must be a valid ISO 8601 datetime string" })
    .or(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    )
    .transform((val) => new Date(val)),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .trim()
    .optional(),
});

// All fields optional on update
export const updateRecordSchema = createRecordSchema.partial();

export const listRecordsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(RecordType).optional(),
  category: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => new Date(val))
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;

import { prisma } from "../../config/database";
import type { Prisma } from "../../generated/prisma/client";
import type { RecordType } from "../../generated/prisma/enums";

export interface FindRecordsOptions {
  page: number;
  limit: number;
  userId?: string;
  type?: RecordType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy: "date" | "amount" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface CreateRecordData {
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes?: string;
  userId: string;
}

export interface UpdateRecordData {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: Date;
  notes?: string | null;
}

export class RecordsRepository {
  private buildWhereClause(
    options: FindRecordsOptions,
  ): Prisma.FinancialRecordWhereInput {
    const { userId, type, category, startDate, endDate, search } = options;

    return {
      isDeleted: false,
      ...(userId && { userId }),
      ...(type && { type }),
      ...(category && {
        category: { contains: category, mode: "insensitive" },
      }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { category: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
  }

  async findAll(options: FindRecordsOptions) {
    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(options);

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return { records, total };
  }

  async findById(id: string) {
    return prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return prisma.financialRecord.findFirst({
      where: { id, userId, isDeleted: false },
    });
  }

  async create(data: CreateRecordData) {
    return prisma.financialRecord.create({
      data: {
        // Prisma accepts number for Decimal columns — the driver handles conversion
        amount: data.amount as unknown as Prisma.Decimal,
        type: data.type,
        category: data.category,
        date: data.date,
        notes: data.notes ?? null,
        userId: data.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(id: string, data: UpdateRecordData) {
    return prisma.financialRecord.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && {
          amount: data.amount as unknown as Prisma.Decimal,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async softDelete(id: string) {
    return prisma.financialRecord.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const record = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
    });
    return record !== null;
  }
}

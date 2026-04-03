import { prisma } from "../../config/database";
import type { Prisma } from "../../generated/prisma/client";

export interface DashboardDateFilter {
  startDate?: Date;
  endDate?: Date;
}

export class DashboardService {
  /**
   * Builds the shared base WHERE clause used across all dashboard queries.
   * Soft-deleted records are always excluded.
   */
  private buildBaseWhere(
    filter: DashboardDateFilter,
  ): Prisma.FinancialRecordWhereInput {
    return {
      isDeleted: false,
      ...(filter.startDate || filter.endDate
        ? {
            date: {
              ...(filter.startDate && { gte: filter.startDate }),
              ...(filter.endDate && { lte: filter.endDate }),
            },
          }
        : {}),
    };
  }

  /**
   * GET /dashboard/summary
   * Returns total income, total expenses, and net balance.
   */
  async getSummary(filter: DashboardDateFilter) {
    const where = this.buildBaseWhere(filter);

    const [incomeResult, expenseResult, totalRecords] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...where, type: "INCOME" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.count({ where }),
    ]);

    const totalIncome = Number(incomeResult._sum.amount ?? 0);
    const totalExpenses = Number(expenseResult._sum.amount ?? 0);
    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      incomeCount: incomeResult._count,
      expenseCount: expenseResult._count,
      totalRecords,
    };
  }

  /**
   * GET /dashboard/category-breakdown
   * Returns per-category totals split by type (income vs expense).
   */
  async getCategoryBreakdown(filter: DashboardDateFilter) {
    const where = this.buildBaseWhere(filter);

    const breakdown = await prisma.financialRecord.groupBy({
      by: ["category", "type"],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    });

    // Reshape into a friendlier structure grouped by category
    const categoryMap = new Map<
      string,
      { category: string; income: number; expense: number; count: number }
    >();

    for (const row of breakdown) {
      const existing = categoryMap.get(row.category) ?? {
        category: row.category,
        income: 0,
        expense: 0,
        count: 0,
      };

      if (row.type === "INCOME") {
        existing.income += Number(row._sum.amount ?? 0);
      } else {
        existing.expense += Number(row._sum.amount ?? 0);
      }
      existing.count += row._count;

      categoryMap.set(row.category, existing);
    }

    return Array.from(categoryMap.values()).sort(
      (a, b) => b.income + b.expense - (a.income + a.expense),
    );
  }

  /**
   * GET /dashboard/trends
   * Returns monthly income vs expense totals for charting.
   * Uses raw SQL for date truncation which Prisma groupBy doesn't natively support.
   */
  async getMonthlyTrends(filter: DashboardDateFilter) {
    // Build the date range condition dynamically for the raw query
    const conditions: string[] = ["is_deleted = false"];
    const params: (Date | string)[] = [];
    let paramIndex = 1;

    if (filter.startDate) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(filter.endDate);
    }

    const whereClause = conditions.join(" AND ");

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        month: Date;
        type: string;
        total: string; // Prisma returns Decimal as string in raw queries
        count: bigint;
      }>
    >(
      `
      SELECT
        DATE_TRUNC('month', date) AS month,
        type,
        SUM(amount)              AS total,
        COUNT(*)                 AS count
      FROM financial_records
      WHERE ${whereClause}
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY month ASC, type ASC
      `,
      ...params,
    );

    // Reshape into monthly buckets
    const monthMap = new Map<
      string,
      { month: string; income: number; expense: number }
    >();

    for (const row of rows) {
      const monthKey = row.month.toISOString().slice(0, 7); // "YYYY-MM"
      const existing = monthMap.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        expense: 0,
      };

      if (row.type === "INCOME") {
        existing.income += parseFloat(row.total);
      } else {
        existing.expense += parseFloat(row.total);
      }

      monthMap.set(monthKey, existing);
    }

    return Array.from(monthMap.values());
  }

  /**
   * GET /dashboard/recent
   * Returns the N most recent non-deleted records.
   */
  async getRecentActivity(limit = 10) {
    const safeLimit = Math.min(50, Math.max(1, limit));

    const records = await prisma.financialRecord.findMany({
      where: { isDeleted: false },
      orderBy: { date: "desc" },
      take: safeLimit,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return records;
  }
}

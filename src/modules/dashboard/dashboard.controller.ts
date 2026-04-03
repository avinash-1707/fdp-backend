import type { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service";
import { successResponse } from "../../utils/apiResponse";
import { AppError } from "../../utils/AppError";

const dashboardService = new DashboardService();

function parseDateFilter(query: Request["query"]) {
  const { startDate, endDate } = query;

  const filter: { startDate?: Date; endDate?: Date } = {};

  if (startDate) {
    const parsed = new Date(String(startDate));
    if (isNaN(parsed.getTime())) {
      throw AppError.badRequest(
        "startDate must be a valid date (YYYY-MM-DD or ISO 8601)",
      );
    }
    filter.startDate = parsed;
  }

  if (endDate) {
    const parsed = new Date(String(endDate));
    if (isNaN(parsed.getTime())) {
      throw AppError.badRequest(
        "endDate must be a valid date (YYYY-MM-DD or ISO 8601)",
      );
    }
    filter.endDate = parsed;
  }

  if (filter.startDate && filter.endDate && filter.startDate > filter.endDate) {
    throw AppError.badRequest("startDate must be before endDate");
  }

  return filter;
}

export class DashboardController {
  async getSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = parseDateFilter(req.query);
      const data = await dashboardService.getSummary(filter);
      res
        .status(200)
        .json(successResponse("Dashboard summary retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = parseDateFilter(req.query);
      const data = await dashboardService.getCategoryBreakdown(filter);
      res
        .status(200)
        .json(successResponse("Category breakdown retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyTrends(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = parseDateFilter(req.query);
      const data = await dashboardService.getMonthlyTrends(filter);
      res.status(200).json(successResponse("Monthly trends retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const limit = parseInt(String(req.query.limit ?? 10), 10);
      const data = await dashboardService.getRecentActivity(limit);
      res.status(200).json(successResponse("Recent activity retrieved", data));
    } catch (error) {
      next(error);
    }
  }
}

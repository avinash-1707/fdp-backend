import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/apiResponse";
import { env } from "../config/env";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Known operational errors (AppError)
  if (error instanceof AppError) {
    res.status(error.statusCode).json(errorResponse(error.message));
    return;
  }

  // Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.join(", ") ?? "field";
        res
          .status(409)
          .json(errorResponse(`A record with this ${field} already exists`));
        return;
      }
      case "P2025": {
        // Record not found
        res.status(404).json(errorResponse("Record not found"));
        return;
      }
      case "P2003": {
        // Foreign key constraint
        res.status(400).json(errorResponse("Related record not found"));
        return;
      }
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json(errorResponse("Invalid data provided"));
    return;
  }

  // Unknown errors - log and return generic message
  console.error(`[${req.method} ${req.path}]`, error);

  const message =
    env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";

  res.status(500).json(errorResponse(message));
}

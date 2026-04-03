import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z, ZodError, type ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError";

type RequestTarget = "body" | "query" | "params";

/**
 * Validate middleware factory using Zod schemas.
 * Usage:
 *   validate(schema)
 *   validate(schema, "query")
 */
export function validate<T extends ZodTypeAny>(
  schema: T,
  target: RequestTarget = "body",
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);

      // Safe assignment with proper typing
      Object.assign(req[target], parsed);

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        );

        return next(AppError.badRequest(messages.join(", ")));
      }

      return next(error);
    }
  };
}

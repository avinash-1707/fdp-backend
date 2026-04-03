import { z } from "zod";
import { Role } from "../../generated/prisma/browser";

export const assignRoleSchema = z.object({
  role: z.enum(Role, {
    error: `Role must be one of: ${Object.values(Role).join(", ")}`,
  }),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive (boolean) is required" }),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(Role).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  search: z.string().optional(),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

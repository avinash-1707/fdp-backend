import { Router } from "express";
import { UsersController } from "./users.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  assignRoleSchema,
  updateStatusSchema,
  listUsersQuerySchema,
} from "./users.schemas";

const router = Router();
const usersController = new UsersController();

// All user management routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

router.get("/", validate(listUsersQuerySchema, "query"), (req, res, next) =>
  usersController.listUsers(req, res, next),
);

router.get("/:id", (req, res, next) =>
  usersController.getUserById(req, res, next),
);

router.patch("/:id/role", validate(assignRoleSchema), (req, res, next) =>
  usersController.assignRole(req, res, next),
);

router.patch("/:id/status", validate(updateStatusSchema), (req, res, next) =>
  usersController.updateStatus(req, res, next),
);

export default router;

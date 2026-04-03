import { Router } from "express";
import { RecordsController } from "./records.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createRecordSchema,
  updateRecordSchema,
  listRecordsQuerySchema,
} from "./records.schemas";

const router = Router();
const recordsController = new RecordsController();

// All records routes require authentication
router.use(authenticate);

// GET /records  — VIEWER, ANALYST, ADMIN (service scopes by role)
router.get(
  "/",
  authorize("VIEWER", "ANALYST", "ADMIN"),
  validate(listRecordsQuerySchema, "query"),
  (req, res, next) => recordsController.listRecords(req, res, next),
);

// GET /records/:id  — VIEWER, ANALYST, ADMIN (service enforces ownership for VIEWER)
router.get("/:id", authorize("VIEWER", "ANALYST", "ADMIN"), (req, res, next) =>
  recordsController.getRecordById(req, res, next),
);

// POST /records  — ANALYST, ADMIN only
router.post(
  "/",
  authorize("ANALYST", "ADMIN"),
  validate(createRecordSchema),
  (req, res, next) => recordsController.createRecord(req, res, next),
);

// PATCH /records/:id  — ANALYST (own), ADMIN (any) — service enforces ownership
router.patch(
  "/:id",
  authorize("ANALYST", "ADMIN"),
  validate(updateRecordSchema),
  (req, res, next) => recordsController.updateRecord(req, res, next),
);

// DELETE /records/:id  — ADMIN only (soft delete)
router.delete("/:id", authorize("ADMIN"), (req, res, next) =>
  recordsController.deleteRecord(req, res, next),
);

export default router;

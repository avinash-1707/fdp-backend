import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes: must be authenticated; any role can read
router.use(authenticate, authorize("VIEWER", "ANALYST", "ADMIN"));

router.get("/summary", (req, res, next) =>
  dashboardController.getSummary(req, res, next),
);

router.get("/category-breakdown", (req, res, next) =>
  dashboardController.getCategoryBreakdown(req, res, next),
);

router.get("/trends", (req, res, next) =>
  dashboardController.getMonthlyTrends(req, res, next),
);

router.get("/recent", (req, res, next) =>
  dashboardController.getRecentActivity(req, res, next),
);

export default router;

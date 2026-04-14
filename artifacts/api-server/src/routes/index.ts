import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prescriptionsRouter from "./prescriptions";
import logsRouter from "./logs";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(prescriptionsRouter);
router.use(logsRouter);
router.use(dashboardRouter);

export default router;

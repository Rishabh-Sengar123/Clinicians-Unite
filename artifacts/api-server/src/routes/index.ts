import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prescriptionsRouter from "./prescriptions";
import logsRouter from "./logs";
import dashboardRouter from "./dashboard";
import doctorsRouter from "./doctors";
import insuranceRouter from "./insurance";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(prescriptionsRouter);
router.use(logsRouter);
router.use(dashboardRouter);
router.use(doctorsRouter);
router.use(insuranceRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);

export default router;

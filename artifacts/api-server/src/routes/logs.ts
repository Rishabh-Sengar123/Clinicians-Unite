import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, workflowLogsTable } from "@workspace/db";
import { GetLogsForPrescriptionParams } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /logs/:prescriptionId — get workflow logs for a prescription
 */
router.get("/logs/:prescriptionId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.prescriptionId)
    ? req.params.prescriptionId[0]
    : req.params.prescriptionId;

  const params = GetLogsForPrescriptionParams.safeParse({
    prescriptionId: parseInt(raw, 10),
  });

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(workflowLogsTable)
    .where(eq(workflowLogsTable.prescriptionId, params.data.prescriptionId))
    .orderBy(asc(workflowLogsTable.createdAt));

  res.json(logs);
});

export default router;

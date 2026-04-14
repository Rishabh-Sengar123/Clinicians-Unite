import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, prescriptionsTable, workflowLogsTable } from "@workspace/db";
import {
  SubmitPrescriptionBody,
  GetPrescriptionParams,
  ProcessPrescriptionParams,
} from "@workspace/api-zod";
import {
  getAiDecision,
  callInsurance,
  callPharmacy,
  escalate,
} from "../lib/aiAgent";

const router: IRouter = Router();

/**
 * GET /prescriptions — list all prescriptions
 */
router.get("/prescriptions", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(prescriptionsTable)
    .orderBy(desc(prescriptionsTable.createdAt));
  res.json(rows);
});

/**
 * POST /prescriptions — submit a new prescription
 */
router.post("/prescriptions", async (req, res): Promise<void> => {
  const parsed = SubmitPrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prescription] = await db
    .insert(prescriptionsTable)
    .values({
      drug: parsed.data.drug,
      reason: parsed.data.reason,
      status: "rejected",
    })
    .returning();

  res.status(201).json(prescription);
});

/**
 * GET /prescriptions/:id — get a single prescription
 */
router.get("/prescriptions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPrescriptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prescription] = await db
    .select()
    .from(prescriptionsTable)
    .where(eq(prescriptionsTable.id, params.data.id));

  if (!prescription) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }

  res.json(prescription);
});

/**
 * POST /prescriptions/:id/process — trigger AI agentic workflow
 */
router.post("/prescriptions/:id/process", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ProcessPrescriptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prescription] = await db
    .select()
    .from(prescriptionsTable)
    .where(eq(prescriptionsTable.id, params.data.id));

  if (!prescription) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }

  req.log.info({ prescriptionId: params.data.id }, "Starting AI agentic workflow");

  // Update status to processing
  await db
    .update(prescriptionsTable)
    .set({ status: "processing" })
    .where(eq(prescriptionsTable.id, params.data.id));

  // Step 2: Call AI agent
  const agentDecision = await getAiDecision(prescription.reason);
  req.log.info({ decision: agentDecision.decision }, "AI decision received");

  // Log AI decision
  await db.insert(workflowLogsTable).values({
    prescriptionId: params.data.id,
    step: "ai_decision",
    message: `AI agent decision: ${agentDecision.decision}`,
  });

  // Step 3-4: Perform workflow action based on decision
  let callResult: { status: string; message: string };
  let actionTaken: string;

  if (agentDecision.decision === "call_insurance") {
    await db.insert(workflowLogsTable).values({
      prescriptionId: params.data.id,
      step: "call_started",
      message: "Initiating insurance authorization call",
    });

    callResult = callInsurance();
    actionTaken = "Insurance Call";
  } else if (agentDecision.decision === "call_pharmacy") {
    await db.insert(workflowLogsTable).values({
      prescriptionId: params.data.id,
      step: "call_started",
      message: "Initiating pharmacy availability check",
    });

    callResult = callPharmacy();
    actionTaken = "Pharmacy Call";
  } else {
    await db.insert(workflowLogsTable).values({
      prescriptionId: params.data.id,
      step: "call_started",
      message: "Escalating to senior clinical pharmacist",
    });

    callResult = escalate();
    actionTaken = "Escalated";
  }

  // Log call response
  await db.insert(workflowLogsTable).values({
    prescriptionId: params.data.id,
    step: "call_response",
    message: `Response: ${callResult.message}`,
  });

  // Step 5: Update prescription with final result
  const finalStatus = callResult.status;
  const updatedStatus =
    callResult.status === "approved" || callResult.status === "available"
      ? "approved"
      : callResult.status === "escalated"
      ? "pending"
      : "rejected";

  const [updatedPrescription] = await db
    .update(prescriptionsTable)
    .set({
      status: updatedStatus,
      actionTaken,
      finalStatus,
      aiDecision: agentDecision.decision,
    })
    .where(eq(prescriptionsTable.id, params.data.id))
    .returning();

  // Log final result
  await db.insert(workflowLogsTable).values({
    prescriptionId: params.data.id,
    step: "final_result",
    message: `Workflow complete. Final status: ${finalStatus}. ${callResult.message}`,
  });

  req.log.info(
    { prescriptionId: params.data.id, finalStatus },
    "AI agentic workflow complete"
  );

  res.json({
    prescription: updatedPrescription,
    aiDecision: agentDecision.decision,
    callResult,
    logsCreated: 4,
  });
});

export default router;

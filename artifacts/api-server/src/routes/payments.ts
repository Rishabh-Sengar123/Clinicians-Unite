import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, appointmentsTable, insurancePlansTable, patientsTable, doctorsTable } from "@workspace/db";
import { createOrder, verifySignature, RAZORPAY_KEY_ID } from "../lib/razorpay";
import { sendAppointmentConfirmationEmail } from "../lib/emailService";

const router: IRouter = Router();

// ─── Config ──────────────────────────────────────────────────────────────────

router.get("/payments/config", (_req, res): void => {
  res.json({ keyId: RAZORPAY_KEY_ID });
});

// ─── Appointment: create payment order ───────────────────────────────────────

const CreateAppointmentOrderBody = z.object({
  appointmentId: z.number().int().positive(),
});

router.post("/payments/appointment/create-order", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, parsed.data.appointmentId));

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  if (appt.paymentStatus === "paid") {
    res.status(409).json({ error: "Appointment already paid" });
    return;
  }

  let order: any;
  try {
    order = await createOrder({
      amountInPaise: appt.consultationFee,
      receipt: `appt_${appt.id}`,
      notes: { appointmentId: String(appt.id) },
    });
  } catch (err: any) {
    req.log.error({ err }, "Razorpay create order failed");
    const msg = err?.error?.description || err?.message || "Failed to create payment order";
    res.status(502).json({ error: msg });
    return;
  }

  await db
    .update(appointmentsTable)
    .set({ razorpayOrderId: order.id })
    .where(eq(appointmentsTable.id, appt.id));

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
  });
});

// ─── Appointment: verify payment & confirm ───────────────────────────────────

const VerifyAppointmentBody = z.object({
  appointmentId: z.number().int().positive(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

router.post("/payments/appointment/verify", async (req, res): Promise<void> => {
  const parsed = VerifyAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  let valid = false;
  try {
    valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  } catch (err: any) {
    req.log.error({ err }, "Signature verification error");
    res.status(500).json({ error: "Signature verification failed" });
    return;
  }

  if (!valid) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, appointmentId));

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [updated] = await db
    .update(appointmentsTable)
    .set({ status: "confirmed", paymentStatus: "paid", paymentId: razorpayPaymentId })
    .where(eq(appointmentsTable.id, appointmentId))
    .returning();

  // Send confirmation email (non-blocking)
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, appt.patientId));
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, appt.doctorId));
  if (patient && doctor) {
    sendAppointmentConfirmationEmail({
      patientName: patient.name,
      patientEmail: patient.email,
      doctorName: doctor.name,
      scheduledAt: updated.scheduledAt,
      prescriptionDrug: null,
      prescriptionReason: null,
    }).catch((err) => req.log.error({ err }, "Failed to send appointment email"));
  }

  res.json({ success: true, appointment: updated });
});

// ─── Insurance plan: create payment order ────────────────────────────────────

const CreatePlanOrderBody = z.object({
  planId: z.number().int().positive(),
  patientId: z.number().int().positive(),
});

router.post("/payments/insurance/create-order", async (req, res): Promise<void> => {
  const parsed = CreatePlanOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [plan] = await db
    .select()
    .from(insurancePlansTable)
    .where(eq(insurancePlansTable.id, parsed.data.planId));

  if (!plan) {
    res.status(404).json({ error: "Insurance plan not found" });
    return;
  }

  let order: any;
  try {
    order = await createOrder({
      amountInPaise: plan.price,
      receipt: `plan_${plan.id}_pat_${parsed.data.patientId}`,
      notes: { planId: String(plan.id), patientId: String(parsed.data.patientId) },
    });
  } catch (err: any) {
    req.log.error({ err }, "Razorpay create insurance order failed");
    const msg = err?.error?.description || err?.message || "Failed to create payment order";
    res.status(502).json({ error: msg });
    return;
  }

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    planName: plan.planName,
  });
});

// ─── Insurance plan: verify payment & assign to patient ──────────────────────

const VerifyPlanBody = z.object({
  planId: z.number().int().positive(),
  patientId: z.number().int().positive(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

router.post("/payments/insurance/verify", async (req, res): Promise<void> => {
  const parsed = VerifyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { planId, patientId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  let valid = false;
  try {
    valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  } catch (err: any) {
    req.log.error({ err }, "Signature verification error");
    res.status(500).json({ error: "Signature verification failed" });
    return;
  }

  if (!valid) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const [updated] = await db
    .update(patientsTable)
    .set({ insurancePlanId: planId })
    .where(eq(patientsTable.id, patientId))
    .returning();

  const { passwordHash: _ph, ...safePatient } = updated;
  res.json({ success: true, patient: safePatient });
});

export default router;

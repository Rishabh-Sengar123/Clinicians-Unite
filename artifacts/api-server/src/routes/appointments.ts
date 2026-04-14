import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, appointmentsTable, patientsTable, doctorsTable, prescriptionsTable } from "@workspace/db";
import { CreateAppointmentBody, ConfirmAppointmentParams } from "@workspace/api-zod";
import { sendAppointmentConfirmationEmail } from "../lib/emailService";

const router: IRouter = Router();

router.get("/appointments", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      doctorId: appointmentsTable.doctorId,
      prescriptionId: appointmentsTable.prescriptionId,
      insurancePlanId: appointmentsTable.insurancePlanId,
      status: appointmentsTable.status,
      scheduledAt: appointmentsTable.scheduledAt,
      createdAt: appointmentsTable.createdAt,
      patientName: patientsTable.name,
      doctorName: doctorsTable.name,
    })
    .from(appointmentsTable)
    .leftJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .orderBy(desc(appointmentsTable.scheduledAt));

  res.json(rows);
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      patientId: parsed.data.patientId,
      doctorId: parsed.data.doctorId,
      prescriptionId: parsed.data.prescriptionId ?? null,
      insurancePlanId: parsed.data.insurancePlanId ?? null,
      scheduledAt: new Date(parsed.data.scheduledAt),
      status: "pending",
    })
    .returning();

  const [full] = await db
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      doctorId: appointmentsTable.doctorId,
      prescriptionId: appointmentsTable.prescriptionId,
      insurancePlanId: appointmentsTable.insurancePlanId,
      status: appointmentsTable.status,
      scheduledAt: appointmentsTable.scheduledAt,
      createdAt: appointmentsTable.createdAt,
      patientName: patientsTable.name,
      doctorName: doctorsTable.name,
    })
    .from(appointmentsTable)
    .leftJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.id, appointment.id));

  res.status(201).json(full);
});

router.post("/appointments/:id/confirm", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ConfirmAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [updated] = await db
    .update(appointmentsTable)
    .set({ status: "confirmed" })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  // Fetch related data for email
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, existing.patientId));

  const [doctor] = await db
    .select()
    .from(doctorsTable)
    .where(eq(doctorsTable.id, existing.doctorId));

  let prescriptionDrug: string | null = null;
  let prescriptionReason: string | null = null;
  if (existing.prescriptionId) {
    const [prescription] = await db
      .select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, existing.prescriptionId));
    prescriptionDrug = prescription?.drug ?? null;
    prescriptionReason = prescription?.reason ?? null;
  }

  // Send confirmation email (non-blocking — don't fail if email fails)
  if (patient && doctor) {
    sendAppointmentConfirmationEmail({
      patientName: patient.name,
      patientEmail: patient.email,
      doctorName: doctor.name,
      scheduledAt: updated.scheduledAt,
      prescriptionDrug,
      prescriptionReason,
    }).catch((err) => {
      req.log.error({ err }, "Failed to send appointment confirmation email");
    });
  }

  res.json({
    ...updated,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
  });
});

export default router;

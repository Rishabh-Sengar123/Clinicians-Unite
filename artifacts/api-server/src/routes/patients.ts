import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, patientsTable, insurancePlansTable } from "@workspace/db";
import { RegisterPatientBody, LoginPatientBody } from "@workspace/api-zod";
import { signToken, requireAuth, type JwtPayload } from "../lib/auth";

const router: IRouter = Router();
const SALT_ROUNDS = 10;

router.post("/patients/register", async (req, res): Promise<void> => {
  const parsed = RegisterPatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.email, parsed.data.email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
  const [patient] = await db
    .insert(patientsTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      age: parsed.data.age,
      medicalHistory: parsed.data.medicalHistory ?? null,
      insurancePlanId: parsed.data.insurancePlanId ?? null,
    })
    .returning();

  const token = signToken({ patientId: patient.id, email: patient.email });
  const { passwordHash: _ph, ...safePatient } = patient;
  res.status(201).json({ token, patient: { ...safePatient, insurancePlan: null } });
});

router.post("/patients/login", async (req, res): Promise<void> => {
  const parsed = LoginPatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.email, parsed.data.email));

  if (!patient) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, patient.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ patientId: patient.id, email: patient.email });

  let insurancePlan = null;
  if (patient.insurancePlanId) {
    const [plan] = await db
      .select()
      .from(insurancePlansTable)
      .where(eq(insurancePlansTable.id, patient.insurancePlanId));
    insurancePlan = plan ?? null;
  }

  const { passwordHash: _ph, ...safePatient } = patient;
  res.json({ token, patient: { ...safePatient, insurancePlan } });
});

router.get(
  "/patients/me",
  requireAuth,
  async (req: Request & { patientPayload?: JwtPayload }, res): Promise<void> => {
    const payload = req.patientPayload!;

    const [patient] = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.id, payload.patientId));

    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    let insurancePlan = null;
    if (patient.insurancePlanId) {
      const [plan] = await db
        .select()
        .from(insurancePlansTable)
        .where(eq(insurancePlansTable.id, patient.insurancePlanId));
      insurancePlan = plan ?? null;
    }

    const { passwordHash: _ph, ...safePatient } = patient;
    res.json({ ...safePatient, insurancePlan });
  }
);

export default router;

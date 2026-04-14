import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, doctorsTable } from "@workspace/db";
import { CreateDoctorBody, GetDoctorParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctors", async (req, res): Promise<void> => {
  const { specialization } = req.query;
  let rows;
  if (typeof specialization === "string" && specialization) {
    rows = await db
      .select()
      .from(doctorsTable)
      .where(ilike(doctorsTable.specialization, `%${specialization}%`));
  } else {
    rows = await db.select().from(doctorsTable);
  }
  res.json(rows);
});

router.post("/doctors", async (req, res): Promise<void> => {
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doctor] = await db.insert(doctorsTable).values(parsed.data).returning();
  res.status(201).json(doctor);
});

router.get("/doctors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDoctorParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, params.data.id));
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }
  res.json(doctor);
});

export default router;

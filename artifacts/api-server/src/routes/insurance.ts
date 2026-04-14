import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, insuranceCompaniesTable, insurancePlansTable } from "@workspace/db";
import {
  CreateInsuranceCompanyBody,
  CreateInsurancePlanBody,
  ListInsurancePlansParams,
  CreateInsurancePlanParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/insurance/companies", async (_req, res): Promise<void> => {
  const rows = await db.select().from(insuranceCompaniesTable);
  res.json(rows);
});

router.post("/insurance/companies", async (req, res): Promise<void> => {
  const parsed = CreateInsuranceCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [company] = await db.insert(insuranceCompaniesTable).values(parsed.data).returning();
  res.status(201).json(company);
});

router.get("/insurance/companies/:companyId/plans", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.companyId) ? req.params.companyId[0] : req.params.companyId;
  const params = ListInsurancePlansParams.safeParse({ companyId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const plans = await db
    .select()
    .from(insurancePlansTable)
    .where(eq(insurancePlansTable.companyId, params.data.companyId));
  res.json(plans);
});

router.post("/insurance/companies/:companyId/plans", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.companyId) ? req.params.companyId[0] : req.params.companyId;
  const params = CreateInsurancePlanParams.safeParse({ companyId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateInsurancePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [plan] = await db
    .insert(insurancePlansTable)
    .values({ ...parsed.data, companyId: params.data.companyId })
    .returning();
  res.status(201).json(plan);
});

export default router;

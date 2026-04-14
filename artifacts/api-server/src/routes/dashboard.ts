import { Router, type IRouter } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db, prescriptionsTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * GET /dashboard/summary — returns counts by status
 */
router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ status: prescriptionsTable.status, count: count() })
    .from(prescriptionsTable)
    .groupBy(prescriptionsTable.status);

  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    processing: 0,
  };

  for (const row of rows) {
    const n = Number(row.count);
    summary.total += n;
    const s = row.status as string;
    if (s === "pending") summary.pending += n;
    else if (s === "approved") summary.approved += n;
    else if (s === "rejected") summary.rejected += n;
    else if (s === "processing") summary.processing += n;
  }

  res.json(summary);
});

/**
 * GET /dashboard/recent-activity — returns 10 most recent prescriptions
 */
router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: prescriptionsTable.id,
      drug: prescriptionsTable.drug,
      status: prescriptionsTable.status,
      actionTaken: prescriptionsTable.actionTaken,
      createdAt: prescriptionsTable.createdAt,
    })
    .from(prescriptionsTable)
    .orderBy(desc(prescriptionsTable.createdAt))
    .limit(10);

  res.json(rows);
});

export default router;

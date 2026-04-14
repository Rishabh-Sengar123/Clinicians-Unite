import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workflowLogsTable = pgTable("workflow_logs", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull(),
  step: text("step").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkflowLogSchema = createInsertSchema(workflowLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkflowLog = z.infer<typeof insertWorkflowLogSchema>;
export type WorkflowLog = typeof workflowLogsTable.$inferSelect;

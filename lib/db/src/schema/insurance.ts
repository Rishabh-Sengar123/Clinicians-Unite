import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insuranceCompaniesTable = pgTable("insurance_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  supportedPlans: text("supported_plans").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insurancePlansTable = pgTable("insurance_plans", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  planName: text("plan_name").notNull(),
  coverageDetails: text("coverage_details").notNull(),
  // Price in paise (e.g. 50000 = ₹500)
  price: integer("price").notNull().default(50000),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompaniesTable).omit({ id: true, createdAt: true });
export const insertInsurancePlanSchema = createInsertSchema(insurancePlansTable).omit({ id: true, createdAt: true });
export type InsertInsuranceCompany = z.infer<typeof insertInsuranceCompanySchema>;
export type InsertInsurancePlan = z.infer<typeof insertInsurancePlanSchema>;
export type InsuranceCompany = typeof insuranceCompaniesTable.$inferSelect;
export type InsurancePlan = typeof insurancePlansTable.$inferSelect;

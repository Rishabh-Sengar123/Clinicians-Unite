# Clinicians Unchained – AI Agentic Workflow for Prescription Resolution

## Overview

A full-stack web application that uses AI to resolve rejected prescriptions. Clinicians submit rejected prescriptions, an AI agent analyzes each case, and automatically routes it to the appropriate resolution path (insurance call, pharmacy call, or escalation).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (no personal API key needed)

## Architecture

### Frontend (`artifacts/clinicians-unchained/`)
- React + Vite single-page app at `/` 
- Pages: Dashboard, Prescriptions list, Submit form, Prescription detail with logs
- Uses generated API hooks from `@workspace/api-client-react`

### Backend (`artifacts/api-server/`)
- Express 5 API server at `/api`
- Routes: `/api/prescriptions`, `/api/logs/:id`, `/api/dashboard/summary`, `/api/dashboard/recent-activity`
- AI agent logic in `src/lib/aiAgent.ts` — calls OpenAI to get decisions

### Database (`lib/db/`)
- **prescriptions** table: drug, reason, status, actionTaken, finalStatus, aiDecision
- **workflow_logs** table: prescriptionId, step, message, createdAt

### AI Integration (`lib/integrations-openai-ai-server/`)
- OpenAI client pre-configured with Replit AI Integrations proxy
- Decision types: `call_insurance`, `call_pharmacy`, `escalate`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/clinicians-unchained run dev` — run frontend locally

## AI Workflow

1. Clinician submits rejected prescription (drug name + rejection reason)
2. Press "Process with AI" button
3. AI agent analyzes reason and returns decision: `call_insurance` | `call_pharmacy` | `escalate`
4. System simulates the appropriate call and updates prescription status
5. All steps logged to workflow_logs table with timestamps

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy URL (auto-set by Replit AI integration)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key proxy (auto-set by Replit AI integration)

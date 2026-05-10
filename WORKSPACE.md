# Clinicians-Unite Workspace Documentation

## Project Overview
**Clinicians-Unite** is a full-stack TypeScript monorepo healthcare application enabling clinicians to manage patient appointments, prescriptions, insurance, and payments.

---

## 📁 Root Level Files & Configuration

### Core Configuration Files
- **`package.json`** - Main workspace package configuration for pnpm monorepo
- **`pnpm-workspace.yaml`** - Defines pnpm workspace structure and package relationships
- **`pnpm-lock.yaml`** - Locked dependency versions for reproducible installs
- **`tsconfig.base.json`** - Base TypeScript configuration shared across all packages
- **`tsconfig.json`** - Root TypeScript configuration
- **`README.md`** - Main project documentation
- **`replit.md`** - Replit-specific deployment/setup instructions

### Supporting Files
- **`attached_assets/`** - Project brief and requirements documentation

---

## 📦 Workspace Structure

### `/artifacts` - Applications & Main Services

#### `api-server/` - Backend API Server
**Purpose**: Express-based REST API for the application  
**Language**: TypeScript  
**Port**: Configurable (typically 3000+)

**Key Files**:
- `src/app.ts` - Express app configuration and middleware setup
- `src/index.ts` - Server entry point
- `src/lib/`
  - `aiAgent.ts` - AI integration for healthcare features
  - `auth.ts` - Authentication/authorization logic
  - `emailService.ts` - Email notification service
  - `logger.ts` - Logging utility
  - `razorpay.ts` - Payment gateway integration
- `src/middlewares/` - Express middleware (CORS, auth, validation, etc.)
- `src/routes/` - API endpoints
  - `appointments.ts` - Appointment CRUD and scheduling
  - `dashboard.ts` - Dashboard data aggregation
  - `doctors.ts` - Doctor management
  - `health.ts` - Health/status check endpoint
  - `insurance.ts` - Insurance verification and claims
  - `logs.ts` - System logs endpoint
  - `patients.ts` - Patient management
  - `payments.ts` - Payment processing
  - `prescriptions.ts` - Prescription management
  - `index.ts` - Route registration
- `build.mjs` - Custom build script for production bundling
- `package.json` - API-specific dependencies
- `tsconfig.json` - API-specific TypeScript config

#### `clinicians-unchained/` - React Frontend Application
**Purpose**: Vite-powered React SPA for clinicians  
**Language**: TypeScript + React (TSX)  
**Build Tool**: Vite

**Directory Structure**:
- `src/App.tsx` - Root React component
- `src/main.tsx` - Vite entry point
- `src/index.css` - Global styles
- `src/components/`
  - `layout/` - Layout components (header, sidebar, footer, etc.)
  - `ui/` - Reusable UI components
- `src/context/`
  - `AuthContext.tsx` - Authentication state management
- `src/hooks/`
  - `use-mobile.tsx` - Mobile responsiveness hook
  - `use-toast.ts` - Toast notification hook
- `src/lib/`
  - `razorpay.ts` - Payment gateway integration
  - `utils.ts` - Utility functions
- `src/pages/` - Page components
  - `appointments.tsx` - Appointments management page
  - `dashboard.tsx` - Main dashboard
  - `doctors.tsx` - Doctor listing/management
  - `insurance.tsx` - Insurance information page
  - `login.tsx` - Authentication page
  - `not-found.tsx` - 404 page
  - (Additional pages for other features)
- `public/` - Static assets
- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration
- `components.json` - shadcn/ui components registry
- `package.json` - Frontend dependencies
- `tsconfig.json` - Frontend TypeScript config

#### `mockup-sandbox/` - UI Component Sandbox
**Purpose**: Preview and test UI components in isolation  
**Language**: TypeScript + React (TSX)  
**Build Tool**: Vite

**Structure**: Similar to `clinicians-unchained/` for component development and testing

---

### `/lib` - Shared Libraries & Packages

#### `api-client-react/` - React API Client Library
**Purpose**: Automatically generated API client for React applications  
**Language**: TypeScript

**Contents**:
- `src/custom-fetch.ts` - Fetch wrapper with interceptors
- `src/index.ts` - Export barrel file
- `src/generated/` - Auto-generated API types and hooks (from OpenAPI spec)
- `package.json` - Library dependencies
- `tsconfig.json` - TypeScript configuration

#### `api-spec/` - OpenAPI Specification
**Purpose**: Single source of truth for API contracts  

**Files**:
- `openapi.yaml` - Complete API specification in OpenAPI 3.0 format
- `orval.config.ts` - Code generation configuration for creating clients/types from OpenAPI
- `package.json` - Tools for spec validation and generation

#### `api-zod/` - Zod Schema Library
**Purpose**: Runtime validation schemas for API requests/responses  
**Language**: TypeScript

**Contents**:
- `src/index.ts` - Main export file
- `src/generated/` - Zod schemas auto-generated from OpenAPI spec
- Provides type-safe validation on both client and server

#### `db/` - Database & ORM Configuration
**Purpose**: Database schema and ORM setup  
**Language**: TypeScript

**Files**:
- `drizzle.config.ts` - Drizzle ORM configuration (migrations, connections)
- `src/index.ts` - Database connection and exports
- `src/schema/` - Drizzle table schemas
  - Patient schema
  - Appointment schema
  - Prescription schema
  - Doctor schema
  - Payment schema
  - Insurance schema
  - (Other domain schemas)
- `package.json` - Database dependencies (drizzle-orm, database drivers)

#### `integrations/openai_ai_integrations/` - OpenAI AI Backend Integration
**Purpose**: Server-side OpenAI integration for AI features  
**Language**: TypeScript

**Uses**: OpenAI API for AI agent functionality, completions, embeddings

#### `integrations-openai-ai-react/` - OpenAI AI Frontend Integration
**Purpose**: React components and hooks for AI features  
**Language**: TypeScript + React

**Structure**:
- `src/audio/` - Audio processing components
- `src/index.ts` - Exports
- `src/` - React hooks and utilities

#### `integrations-openai-ai-server/` - OpenAI AI Server SDK
**Purpose**: Unified server-side OpenAI client  
**Language**: TypeScript

**Structure**:
- `src/client.ts` - OpenAI client initialization
- `src/index.ts` - Main exports
- `src/audio/` - Audio processing utilities
- `src/batch/` - Batch processing utilities
- `src/image/` - Image generation utilities

---

### `/scripts` - Utility Scripts & Tools

**Purpose**: Build automation, post-merge hooks, and development utilities

**Contents**:
- `package.json` - Scripts package configuration
- `tsconfig.json` - TypeScript config for scripts
- `post-merge.sh` - Git post-merge hook for running setup tasks
- `src/hello.ts` - Example script file

---

## 🔄 Monorepo Workflow

### Package Dependencies
```
clinicians-unchained → api-client-react → api-spec
                    → api-zod
                    → integrations-openai-ai-react
                    
api-server → db (schema)
          → api-zod (validation)
          → integrations-openai-ai-server
          → api-spec (route definitions)
```

### Development Workflow
1. **API Spec Changes**: Update `lib/api-spec/openapi.yaml`
2. **Code Generation**: Run orval to regenerate clients and schemas
3. **Frontend**: Update `clinicians-unchained/` components
4. **Backend**: Update `artifacts/api-server/` routes
5. **Database**: Migrations via `lib/db/drizzle.config.ts`

---

## 🚀 Key Technologies

| Technology | Purpose | Location |
|-----------|---------|----------|
| **TypeScript** | Type-safe development | All packages |
| **Express** | REST API framework | `api-server/` |
| **React** | UI framework | `clinicians-unchained/`, `mockup-sandbox/` |
| **Vite** | Frontend build tool | React apps |
| **Drizzle ORM** | Database access | `lib/db/` |
| **Zod** | Runtime validation | `lib/api-zod/` |
| **OpenAI** | AI integration | `lib/integrations-openai-ai-*` |
| **Razorpay** | Payment processing | `api-server/`, `clinicians-unchained/` |
| **pnpm** | Package manager | Root workspace |

---

## 📋 Feature Modules

### Core Features by Route/Package
- **Appointments**: Schedule, manage, and track appointments
- **Patients**: Patient profile management and history
- **Doctors**: Doctor profiles and specialties
- **Prescriptions**: Digital prescription management
- **Insurance**: Insurance verification and claims handling
- **Payments**: Payment processing via Razorpay
- **Dashboard**: Analytics and overview dashboard
- **Health**: System health and status endpoints
- **Logs**: Application logging and monitoring

### Integration Features
- **AI Agent**: OpenAI-powered healthcare assistant
- **Audio**: Voice capabilities for patient interactions
- **Image**: Medical image processing
- **Batch Processing**: Bulk data operations

---

## 📝 Configuration & Environment

### TypeScript Strategy
- **Base Config** (`tsconfig.base.json`): Shared settings
- **Per-Package Configs** (`tsconfig.json`): Package-specific overrides
- **Path Aliases**: Monorepo-wide import resolution

### Build System
- **API Server**: `build.mjs` for production bundling
- **Frontend Apps**: Vite for development and production
- **Code Generation**: Orval for OpenAPI-based code generation

---

## 🔧 Development Setup

### Installation
```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run development servers
pnpm dev
```

### Useful Commands (typically in root package.json)
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Test all packages

---

## 📚 Documentation References

- **Architecture**: This file (WORKSPACE.md)
- **Setup**: README.md, replit.md
- **API Spec**: `lib/api-spec/openapi.yaml`
- **Project Brief**: `attached_assets/`

---

## 🎯 Quick Reference

### Adding a New Feature
1. Define API endpoints in `lib/api-spec/openapi.yaml`
2. Generate types/client code via Orval
3. Implement backend routes in `api-server/src/routes/`
4. Create frontend pages in `clinicians-unchained/src/pages/`
5. Add UI components in `clinicians-unchained/src/components/`

### Adding Dependencies
- Use `pnpm add -w` in root to add to workspace root
- Use `pnpm add` in specific package to add to that package only

### Updating Database Schema
1. Modify schema in `lib/db/src/schema/`
2. Run Drizzle migrations
3. Update API validation in `lib/api-zod/src/generated/`

---

**Last Updated**: May 2026  
**Status**: Active Development

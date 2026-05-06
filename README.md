# 🏥 Clinicians-Unite

> A comprehensive full-stack healthcare platform connecting clinicians, patients, and insurance providers seamlessly.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)

## 📋 Overview

Clinicians-Unite is a modern healthcare management system built with a monorepo architecture. It provides a unified platform for managing appointments, patient records, prescriptions, insurance claims, and payments.

### ✨ Key Features

- 🗓️ **Appointment Management** - Schedule and track medical appointments
- 👥 **Patient Records** - Comprehensive patient information management
- 💊 **Prescription Management** - Digital prescription handling
- 🏥 **Doctor Dashboard** - Professional clinician portal
- 💰 **Payment Integration** - Secure Razorpay payment processing
- 🔐 **Authentication & Authorization** - Secure user authentication
- 📧 **Email Notifications** - Automated email communications
- 🤖 **AI Agent** - Intelligent healthcare assistant

## 🏗️ Project Structure

```
Clinicians-Unite/
├── artifacts/                    # Main application packages
│   ├── api-server/              # Express.js backend API
│   ├── clinicians-unchained/    # React frontend application
│   └── mockup-sandbox/          # UI component sandbox
├── lib/                         # Shared libraries
│   ├── api-client-react/        # React API client
│   ├── api-spec/                # OpenAPI specification
│   ├── api-zod/                 # Zod validation schemas
│   ├── db/                      # Database configuration (Drizzle ORM)
│   └── integrations/            # Third-party integrations
└── scripts/                     # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PNPM (v8 or higher)

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Navigate to the project root
cd Clinicians-Unite
```

### Development

```bash
# Install workspace dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 📦 Packages

### 🖥️ API Server (`artifacts/api-server`)
Express.js backend server providing RESTful API endpoints.

**Key Routes:**
- `/api/appointments` - Appointment management
- `/api/doctors` - Doctor profiles and schedules
- `/api/patients` - Patient records
- `/api/prescriptions` - Prescription handling
- `/api/payments` - Payment processing
- `/api/insurance` - Insurance claims
- `/api/dashboard` - Analytics and insights
- `/api/health` - Health checks

**Technologies:**
- Express.js
- OpenAI Integration
- Razorpay API
- Email Service

### ⚛️ Frontend (`artifacts/clinicians-unchained`)
Modern React application with Vite for fast development.

**Key Pages:**
- Dashboard - Overview and analytics
- Appointments - Schedule and manage appointments
- Doctors - Find and connect with doctors
- Patients - Patient management
- Insurance - Insurance information
- Login - User authentication

**Technologies:**
- React 18
- Vite
- TypeScript
- React Context API
- Tailwind CSS

### 🎨 Mockup Sandbox (`artifacts/mockup-sandbox`)
Interactive UI component showcase and prototyping environment.

## 📚 Shared Libraries

### `lib/api-client-react`
Type-safe React API client with generated endpoints from OpenAPI spec.

### `lib/api-spec`
OpenAPI specification with Orval code generation configuration.

### `lib/api-zod`
Zod validation schemas for runtime type checking.

### `lib/db`
Drizzle ORM configuration and database schema definitions.

### `lib/integrations`
Third-party service integrations:
- OpenAI AI integrations
- Audio processing
- Batch operations
- Image handling

## 🔧 Available Commands

```bash
# Development
pnpm dev              # Start all development servers
pnpm dev:api         # Start API server only
pnpm dev:frontend    # Start frontend only

# Building
pnpm build           # Build all packages
pnpm build:api       # Build API server
pnpm build:frontend  # Build frontend

# Testing & Linting
pnpm test            # Run tests
pnpm lint            # Lint code
pnpm type-check      # Type checking

# Database
pnpm db:generate     # Generate database migrations
pnpm db:push         # Push migrations to database
```

## 🔐 Environment Variables

Create a `.env.local` file in each package root:

### API Server
```env
PORT=3001
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_SERVICE_API_KEY=your_email_service_key
JWT_SECRET=your_jwt_secret
```

### Frontend
```env
VITE_API_URL=http://localhost:3001
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

## 🔄 Git Workflow

The project uses a feature branch workflow:

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: description"

# Push to remote
git push origin feature/your-feature

# Create pull request on GitHub
```

## 📊 Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | Drizzle ORM |
| **API** | OpenAPI, REST |
| **Authentication** | JWT |
| **Payments** | Razorpay |
| **AI** | OpenAI API |
| **Email** | Custom Email Service |
| **Package Manager** | PNPM (Monorepo) |

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass: `pnpm test`
4. Commit with clear messages
5. Submit a pull request

## 📝 License

This project is proprietary and confidential.

## 👨‍💼 Project Lead

**Rishabh Sengar** - Creator and Lead Developer

## 📞 Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Last Updated:** May 2026  
**Status:** 🚀 Active Development

# VisionPlan - Replit Configuration

## Project Overview

**VisionPlan** is a professional construction project management platform (Plataforma Integrada de Gestão de Obras) built with React, TypeScript, and Vite. It provides integrated planning and management tools with 4D capabilities and Last Planner System (LPS) methodology.

### Version: 2.2.0

## Architecture

- **Frontend Framework**: React 18.2 with TypeScript 5.2
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.3
- **State Management**: Zustand 4.4
- **Routing**: React Router v6
- **Backend**: Supabase (Auth, Database, Storage, Real-time)
- **Charts**: Recharts 2.10
- **3D Visualization**: React Three Fiber
- **Gantt Charts**: DHTMLX Gantt, gantt-task-react

## Key Features

- Theme customization system (12 customizable colors per client)
- Professional dashboard with KPIs and presentation mode
- Personal Kanban board with drag & drop
- Complete authentication with Supabase
- Real-time updates via WebSockets
- Responsive design (mobile, tablet, desktop)
- 100% TypeScript for type safety

## Project Structure

```
visionplan/
├── src/                    # Source code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── stores/           # Zustand state stores
│   ├── services/         # API services
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── routes/           # Route configuration
│   └── styles/           # Global styles
├── docs/                 # Documentation
├── public/              # Static assets
└── dist/                # Production build output
```

## Environment Setup

### Required Environment Variables

The application requires Supabase credentials to function. Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_APP_NAME=VisionPlan
VITE_APP_VERSION=2.2.0
VITE_APP_ENV=development
```

See `.env.example` for the complete list of available variables.

## Replit Configuration

### Development

- **Port**: 5000 (configured for Replit webview)
- **Host**: 0.0.0.0 (allows Replit proxy access)
- **Allowed Hosts**: true (required for Replit proxy to access the dev server)
- **HMR Protocol**: WSS on port 443 (for Replit environment)
- **Workflow**: "VisionPlan Frontend" runs `npm run dev`

### Deployment

- **Type**: Static site
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

The build compiles TypeScript and bundles all assets into the `dist` folder for production deployment.

## Development Workflow

1. **Install Dependencies**: `npm install`
2. **Run Development Server**: `npm run dev` (runs on port 5000)
3. **Build for Production**: `npm run build`
4. **Preview Production Build**: `npm run preview`
5. **Lint Code**: `npm run lint`

## Database

The application uses Supabase as its backend service, which provides:
- PostgreSQL 15+ database
- Authentication and authorization
- Real-time subscriptions
- Row Level Security (RLS)
- File storage

## Recent Changes

- **2024-11-29**: Admin User Management Page
  - Created `AdminUsuariosPage.tsx` - complete user management page with:
    - User listing with search and filters (by governance layer, access profile, status)
    - Statistics cards showing total, active, and inactive users
    - Create new user modal with Supabase Auth integration
    - Edit user functionality (name, governance layer, access profile)
    - Activate/deactivate user toggle
    - Password reset via email
  - Created `userService.ts` with CRUD operations:
    - Integration with Supabase Auth for user creation
    - Database operations for user profile management
    - Error handling for duplicate emails
  - Route protection:
    - Only ADMIN and DIRETOR profiles can access `/admin/usuarios`
    - AdminRoute component for protected admin routes
  - Sidebar navigation updated with "Gestão de Usuários" link
  - Labels for 3 governance layers and 10 access profiles

- **2024-11-29**: Initial Replit setup
  - Configured Vite for Replit environment (port 5000, host 0.0.0.0)
  - Set up HMR for Replit proxy with WSS protocol
  - Installed all dependencies
  - Configured deployment for static site hosting
  - Created workflow for frontend development

## User Permissions System

### Governance Layers (Camadas de Governança)
1. **PROPONENTE** - Client/Owner (Profiles: ADMIN, DIRETOR, GERENTE_PROJETO)
2. **FISCALIZACAO** - Inspection/Audit (Profiles: FISCALIZACAO_LEAD, FISCALIZACAO_TECNICO)
3. **CONTRATADA** - Contractor (Profiles: ENGENHEIRO_PLANEJAMENTO, COORDENADOR_OBRA, MESTRE_OBRAS, ENCARREGADO, COLABORADOR)

### Access Profiles
- ADMIN: Full system access including user management and themes
- DIRETOR: Dashboard, reports, scope change approvals
- GERENTE_PROJETO: Project management and oversight
- ENGENHEIRO_PLANEJAMENTO: Schedule editing, activity creation, restrictions
- COORDENADOR_OBRA: Construction coordination
- MESTRE_OBRAS: Field supervision
- ENCARREGADO: Team management
- COLABORADOR: Kanban tasks, check-in/check-out
- FISCALIZACAO_LEAD: Quality approvals, schedule releases
- FISCALIZACAO_TECNICO: Technical inspections

## Notes

- The app shows a login page on startup (requires Supabase configuration)
- Dependencies are installed and up to date
- No backend server needed - uses Supabase for all backend functionality
- The project is fully TypeScript with comprehensive type definitions

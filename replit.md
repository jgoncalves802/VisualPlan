# VisionPlan - Replit Configuration

## Overview

VisionPlan is a professional construction project management platform (Plataforma Integrada de Gestão de Obras) built with React, TypeScript, and Vite. It provides integrated planning and management tools with 4D capabilities and the Last Planner System (LPS) methodology. The platform aims to revolutionize construction project management through advanced planning, real-time monitoring, and collaborative features, targeting a significant share of the construction tech market.

## User Preferences

The user prefers an iterative development approach. Major changes should be discussed and approved before implementation. The user values clear, concise communication and detailed explanations for complex features.

## System Architecture

VisionPlan is a single-page application (SPA) with a modern frontend stack and a serverless backend.

**Key Architectural Decisions:**

*   **Frontend Framework**: React 18.2 with TypeScript 5.2 for robust, type-safe development.
*   **Build Tool**: Vite 5.0 for fast development and optimized builds.
*   **Styling**: Tailwind CSS 3.3 for utility-first styling and rapid UI development.
*   **State Management**: Zustand 4.4 for a lightweight and flexible state management solution.
*   **Routing**: React Router v6 for declarative navigation.
*   **Backend**: Supabase for all backend services (Auth, Database, Storage, Real-time).
*   **UI/UX Decisions**:
    *   **Theme Customization**: A system allowing 12 customizable colors per client for branding.
    *   **Responsive Design**: Optimized for mobile, tablet, and desktop.
    *   **Component-based**: Utilizes a reusable UI component library (`src/components/ui/`) including `Toast`, `Modal`, `ConfirmDialog`, and `Button` for consistent design and enhanced user experience.
*   **Technical Implementations**:
    *   **4D Capabilities**: Integration with 3D visualization tools (React Three Fiber) and Gantt charts (DHTMLX Gantt, gantt-task-react).
    *   **Real-time Updates**: Achieved via WebSockets through Supabase.
    *   **Multi-tenancy**: Implemented through a robust company system (`empresas` table) with Row Level Security (RLS) for data isolation.
    *   **User Management**: Comprehensive user, profile, and permission management including Governance Layers (PROPONENTE, FISCALIZACAO, CONTRATADA) and fine-grained Access Profiles.
    *   **Organizational Structures**: Support for Enterprise Project Structure (EPS) based on Primavera P6 model and Organizational Breakdown Structure (OBS) with hierarchical nodes.
    *   **Hierarchy Levels and Organizational Units**: Configurable vertical hierarchy levels and departmental organizational units to define project and company structures.
    *   **Admin Panel**: A centralized dashboard (`AdminPage.tsx`) with role-based access for managing users, companies, themes, access profiles, and organizational structures.
*   **Project Structure**:
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

## External Dependencies

*   **Supabase**: Provides PostgreSQL database, authentication, authorization, real-time subscriptions, Row Level Security (RLS), and file storage.
*   **Recharts**: For dynamic and interactive charts.
*   **React Three Fiber**: For 3D visualization capabilities.
*   **DHTMLX Gantt**: For professional Gantt chart functionalities.
*   **gantt-task-react**: Another library for Gantt chart rendering.
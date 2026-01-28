# VisionPlan - Replit Configuration

## Overview
VisionPlan is a professional construction project management platform built with React, TypeScript, and Vite. It aims to revolutionize construction project management through advanced planning, real-time monitoring, and collaborative features, providing a comprehensive solution for managing complex construction projects. Key capabilities include integrated planning and management tools, 4D visualization, and support for the Last Planner System (LPS) methodology.

## User Preferences
The user prefers an iterative development approach. Major changes should be discussed and approved before implementation. The user values clear, concise communication and detailed explanations for complex features.

## System Architecture
VisionPlan is a single-page application (SPA) leveraging a modern frontend stack and a serverless backend.

**UI/UX Decisions:**
*   **Design System:** Standardized professional design with reusable layout components, design tokens for spacing, typography, and shadows, a suavized color palette supporting light/dark modes, and consistent CSS utility classes.
*   **Responsiveness:** Fully responsive design for various devices.
*   **Theming:** Customizable themes.

**Technical Implementations:**
*   **Frontend:** React 18.2, TypeScript 5.2, Vite 5.0, Tailwind CSS 3.3, Zustand 4.4, React Router v6.
*   **Backend:** Supabase for authentication, database, storage, and real-time functionalities.
*   **4D Capabilities:** Integration with 3D visualization tools (React Three Fiber) and VisionGantt.
*   **VisionGantt Library:** Custom enterprise Gantt chart with features like CalendarStore, resource management, Critical Path Method (CPM), constraint validation, and a P6-style column system.
*   **Resource Management:** Comprehensive resource allocation, histogram visualization, conflict detection, and multi-rate pricing.
*   **Baseline Tracking:** Project baselines with variance analysis.
*   **Multi-tenancy:** Implemented via a company system with Row Level Security (RLS).
*   **User Management:** Detailed user, profile, and permission management, including Governance Layers and Access Profiles.
*   **Organizational Structures:** Enterprise Project Structure (EPS) and Organizational Breakdown Structure (OBS).
*   **Admin Panel:** Centralized dashboard for system administration.
*   **Event-Sourced Architecture:** Unidirectional data flow for Gantt chart state management.
*   **P6 Enterprise Columns System:** Over 80 professional columns with TypeScript types and EVM calculations.
*   **Ishikawa Analysis (Kaizen):** Interactive fishbone diagrams, Pareto charts, and trend analysis.
*   **Reuniões Matrix:** Calendar-based meeting management with auto-generated agendas.
*   **Portfolio Prioritization:** Multi-criteria scoring matrix with bubble and radar chart visualizations.
*   **WBS Integration:** WBS nodes integrated into schedules as read-only summary tasks.
*   **Performance & UX:** Caching, optimistic UI, batch updates, skeleton loaders, scroll preservation, and robust error handling.
*   **Take-off / Quantity Surveying Module:** Manages construction quantities, physical progress tracking, dynamic Excel import with custom column configuration, and integration with schedules.
*   **Medições Module:** Manages construction billing periods, contractual terms, progress tracking, and a 3-level approval workflow.
*   **Indicadores Module:** Comprehensive tables for EVM, LPS, Quality, and S-Curve analysis with user preferences and periodic snapshots.
*   **Global Project Filtering:** Consistent project selection across all modules using `useProjetoStore`.
*   **Check-in / Check-out Module (LPS):** Implements Last Planner System weekly work plan, daily activity tracking, root cause analysis (6M+S), PPC calculation, and TV mode. Includes an acceptance workflow for weekly programming between planning and production departments with permission-based control and rejection with readiness conditions.
*   **Interference Tracking:** Records work site interferences during check-in/check-out with audit trails and conversion to Ishikawa restrictions.
*   **Global Modal System:** Centralized modal management using `ModalContext` for consistent behavior.
*   **Primavera P6 Import Systems (Excel & XML):**
    *   **Excel Import:** Multi-step wizard with project selection/creation, sheet selection, comprehensive column mapping (110+ fields), intelligent auto-mapping, dynamic data transformation, and user review. Supports WBS integration into EPS nodes.
    *   **XML Import:** Native XML parsing for Project, WBS, Activity, and Calendar elements, building WBS hierarchy, and linking activities.
*   **Data Isolation Architecture:** Ensures complete data segregation between projects through `CronogramaStore` project tracking, `DataIntegrityService`, project-specific cache keys, and a `useProjectIsolation` logging hook.
*   **Storage Service Architecture:** Centralized abstraction for `sessionStorage` (project-specific data) and `localStorage` (user preferences).
*   **Tutorial Page:** Interactive onboarding guide.

## External Dependencies
*   **Supabase**: PostgreSQL database, authentication, authorization, real-time subscriptions, RLS, and file storage.
*   **Recharts**: For dynamic and interactive charts.
*   **React Three Fiber**: For 3D visualization.
*   **VisionGantt**: Custom Gantt chart library.
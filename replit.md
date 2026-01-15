# VisionPlan - Replit Configuration

## Overview
VisionPlan is a professional construction project management platform built with React, TypeScript, and Vite. It offers integrated planning and management tools, including 4D capabilities and the Last Planner System (LPS) methodology. The platform aims to revolutionize construction project management through advanced planning, real-time monitoring, and collaborative features, providing a comprehensive solution for managing complex construction projects.

## User Preferences
The user prefers an iterative development approach. Major changes should be discussed and approved before implementation. The user values clear, concise communication and detailed explanations for complex features.

## System Architecture
VisionPlan is a single-page application (SPA) with a modern frontend stack and a serverless backend.

*   **Frontend Framework**: React 18.2 with TypeScript 5.2, Vite 5.0, Tailwind CSS 3.3, Zustand 4.4, React Router v6.
*   **Backend**: Supabase (Auth, Database, Storage, Real-time).
*   **UI/UX Decisions**: Theme customization, responsive design, component-based architecture.
*   **Technical Implementations**:
    *   **4D Capabilities**: Integration with 3D visualization tools (React Three Fiber) and VisionGantt.
    *   **VisionGantt Library**: Custom enterprise Gantt library with CalendarStore, resource management, Critical Path Method (CPM), constraint validation, and a P6-style column system.
    *   **Resource Management**: Full resource allocation with histogram visualization, conflict detection, multi-rate pricing, and resource curves.
    *   **Baseline Tracking**: Project baselines with variance analysis.
    *   **Real-time Updates**: Via WebSockets through Supabase.
    *   **Multi-tenancy**: Implemented via a company system (`empresas` table) with Row Level Security (RLS).
    *   **User Management**: Comprehensive user, profile, and permission management, including Governance Layers and Access Profiles.
    *   **Organizational Structures**: Enterprise Project Structure (EPS) and Organizational Breakdown Structure (OBS).
    *   **Admin Panel**: Centralized dashboard for managing users, companies, themes, access profiles, and organizational structures.
    *   **Event-Sourced Controller Architecture**: Unidirectional data flow for Gantt chart state management.
    *   **P6 Enterprise Columns System**: Over 80 professional columns with TypeScript types and EVM calculations.
    *   **Ishikawa Analysis (Kaizen)**: Interactive fishbone diagram with 6M categories, hierarchical filters, Pareto chart, trend analysis, and KPI cards.
    *   **Reuniões Matrix**: Calendar-based meeting management with auto-generated agendas based on restrictions, KPIs, and 5W2H actions.
    *   **Portfolio Prioritization**: Multi-criteria scoring matrix with bubble chart visualization, radar chart comparison, and weighted ranking.
    *   **WBS Integration to Schedule**: WBS nodes are inherited as read-only summary tasks in the schedule; activities can be assigned to WBS nodes.
    *   **Database Schema**: `atividades_cronograma` (main schedule), `dependencias_atividades` (dependencies), `cronograma_column_configs` (user preferences).
    *   **Performance & UX**: Caching strategies, optimistic UI updates, batch update manager, skeleton loaders, scroll preservation, inline editing, and robust error handling.
    *   **Take-off / Quantity Surveying Module**: Manages construction quantities and physical progress tracking, including Excel import, schedule integration, and a dedicated dashboard.
    *   **Service Layer Architecture**: Dedicated Supabase services for various modules (Take-off, 5W2H actions, Change Management, Meetings, Audit, Ishikawa Restrictions, LPS Restrictions, Bidirectional Sync between Restrictions and 5W2H, Dashboard, Portfolio, Calendars, Indicators, Measurements, Curva S, User Preferences).
    *   **Medições Module**: Complete measurement period management for construction billing, including configurable periods, contractual terms integration, progress tracking from schedule and take-off, 3-level approval workflow, and restrictions integration.
    *   **Indicadores Module**: Comprehensive indicator tables for EVM, LPS, Quality, and S-Curve analysis, including user preferences persistence, periodic EVM snapshots, weekly LPS indicators, quality indicators, project baselines, and S-Curve data with multi-baseline support.
    *   **Global Project Filtering Architecture**: All modules use `useProjetoStore` for consistent project selection, with a `ProjetoSelector` component for switching projects. Services accept optional `projetoId` for filtering, and new records auto-fill `projeto_id`.
    *   **Check-in / Check-out Module**: Implements the Last Planner System (LPS) weekly work plan and daily tracking, including weekly program planning, activity tracking with daily targets and restrictions, daily check-in/check-out with root cause analysis (6M+S categories), PPC calculation, TV mode, and PDF export.
    *   **Acceptance Workflow**: Full workflow for weekly programming acceptance between planning and production departments (PLANEJADA → AGUARDANDO_ACEITE → ACEITA → EM_EXECUCAO → CONCLUIDA), with permission-based editing control. Planning sector can edit in PLANEJADA/AGUARDANDO_ACEITE status; production gives acceptance; editing is blocked after acceptance.
    *   **Interference Tracking**: During check-in/check-out, users can register work site interferences (by company type: CONTRATADA/CONTRATANTE/FISCALIZACAO) with full audit trail. Interferences can be converted to Ishikawa restrictions for follow-up in the Kaizen module.
    *   **Database Tables**: `aceites_programacao` (acceptance history with user, sector, type, and observations), `interferencias_obra` (interference records with empresa_id scope and RLS policies).

## External Dependencies
*   **Supabase**: PostgreSQL database, authentication, authorization, real-time subscriptions, Row Level Security (RLS), and file storage.
*   **Recharts**: For dynamic and interactive charts.
*   **React Three Fiber**: For 3D visualization.
*   **VisionGantt**: Custom Gantt chart library.
# VisionPlan - Replit Configuration

## Overview

VisionPlan is a professional construction project management platform built with React, TypeScript, and Vite. It offers integrated planning and management tools, including 4D capabilities and the Last Planner System (LPS) methodology. The platform aims to revolutionize construction project management through advanced planning, real-time monitoring, and collaborative features.

## User Preferences

The user prefers an iterative development approach. Major changes should be discussed and approved before implementation. The user values clear, concise communication and detailed explanations for complex features.

## System Architecture

VisionPlan is a single-page application (SPA) with a modern frontend stack and a serverless backend.

*   **Frontend Framework**: React 18.2 with TypeScript 5.2.
*   **Build Tool**: Vite 5.0.
*   **Styling**: Tailwind CSS 3.3.
*   **State Management**: Zustand 4.4.
*   **Routing**: React Router v6.
*   **Backend**: Supabase (Auth, Database, Storage, Real-time).
*   **UI/UX Decisions**:
    *   **Theme Customization**: 12 customizable colors per client.
    *   **Responsive Design**: Optimized for mobile, tablet, and desktop.
    *   **Component-based**: Reusable UI component library (`src/components/ui/`).
*   **Technical Implementations**:
    *   **4D Capabilities**: Integration with 3D visualization tools (React Three Fiber) and VisionGantt.
    *   **VisionGantt Library**: Custom Gantt library (`src/lib/vision-gantt/`) with enterprise features, including CalendarStore, resource management, critical path method (CPM) with near-critical path detection, constraint validation, and P6-style column system.
    *   **Resource Management**: Full resource allocation with histogram visualization and conflict detection.
    *   **Baseline Tracking**: Project baselines with variance analysis (Primavera P6 model).
    *   **Real-time Updates**: Via WebSockets through Supabase.
    *   **Multi-tenancy**: Implemented through a company system (`empresas` table) with Row Level Security (RLS).
    *   **User Management**: Comprehensive user, profile, and permission management, including Governance Layers and Access Profiles.
    *   **Organizational Structures**: Enterprise Project Structure (EPS) and Organizational Breakdown Structure (OBS) with hierarchical nodes.
    *   **Admin Panel**: Centralized dashboard (`AdminPage.tsx`) for managing users, companies, themes, access profiles, and organizational structures.
    *   **Event-Sourced Controller Architecture**: Unidirectional data flow for Gantt chart state management using `useGanttController` hook to prevent race conditions and ensure data consistency.
    *   **P6 Enterprise Columns System**: Over 80 professional columns organized by category (Baselines, EVM, Activity Codes, Resources, Critical Path, Schedule) with TypeScript types and EVM calculations.
    *   **Predecessor/Successor Columns**: P6-style dependency columns displaying lag with color-coded badges and visual lag on arrows.
    *   **Error Link Column**: MS Project-style dependency validation column with status indicators and error messages for missing dependencies, constraint conflicts, and non-preferred link types.
    *   **Ishikawa Analysis (Kaizen)**: Interactive fishbone diagram with 6M categories adapted for construction (Método, Mão de Obra, Material, Medida, Meio Ambiente, Máquina), hierarchical filters (EPS/WBS/Activity), Pareto chart, trend analysis, and KPI cards (TMR, TRC, IRP, Eficácia).
    *   **Reuniões Matrix**: Calendar-based meeting management with auto-generated agendas based on restrictions, KPIs, and 5W2H actions. Supports meeting minutes and history.
    *   **Portfolio Prioritization**: Multi-criteria scoring matrix with bubble chart visualization, radar chart comparison, and weighted ranking (ROI, Strategic Alignment, Urgency, Complexity, Resources, Risk).
    *   **WBS Integration to Schedule**: WBS nodes from the WBS page are automatically inherited and displayed in the schedule (cronograma) as read-only summary tasks. EDT codes are auto-generated using hierarchical numbering (1, 1.1, 1.1.2). Activities can be assigned to WBS nodes via a dedicated dropdown, maintaining proper separation between WBS structure assignment (`wbs_id`) and activity parent relationships (`parent_id`). Synthetic IDs (`wbs-xxx`) are used internally for UI binding while real UUIDs are persisted.

## Database Schema

### Cronograma (Schedule) Tables

*   **atividades_cronograma**: Main schedule activities table with full Primavera P6-compatible fields:
    - UUID primary keys
    - WBS integration via `wbs_id` foreign key
    - Activity hierarchy via `parent_id` self-reference
    - CPM fields: `e_critica`, `folga_total`
    - EVM fields: `custo_planejado`, `custo_real`, `valor_planejado`, `valor_real`
    - Multi-tenancy via `empresa_id` with RLS policies

*   **dependencias_atividades**: Activity dependencies/relationships:
    - Supports all 4 PDM dependency types: FS, SS, FF, SF
    - Lag support in days
    - Cascading deletes linked to activities

### Migration Files

*   `scripts/migrations/013_create_atividades_cronograma.sql`: Creates schedule tables with RLS policies

**Note**: Tables must be created in the Supabase Dashboard SQL Editor for production use.

## External Dependencies

*   **Supabase**: PostgreSQL database, authentication, authorization, real-time subscriptions, Row Level Security (RLS), and file storage.
*   **Recharts**: For dynamic and interactive charts.
*   **React Three Fiber**: For 3D visualization.
*   **VisionGantt** (internal): Custom Gantt chart library.

## Recent Changes (December 2025)

*   **TaskDetailPanel**: Comprehensive panel showing selected task details (status, dates, progress, resources, dependencies, EVM metrics). WBS/EPS hierarchy nodes show "somente leitura" banner and hide edit actions.
*   **Column Configuration Modal**: Drag-drop interface for managing active/available columns. WBS column is always locked as first column and cannot be removed.
*   **Column Drag-Drop in GanttGrid**: Users can reorder columns directly in the grid header, with WBS column locked.
*   **Read-Only Enforcement**: VisionGanttWrapper enriches selected tasks with isWbsNode/isReadOnly flags to ensure WBS/EPS nodes cannot be edited.
*   **EPS Selection Flow**: Implemented EpsSelector component with tree view - double-click on project nodes (nivel === 1) opens the schedule. Routes updated from `/cronograma/proj-1` to `/cronograma` with optional `:projetoId` parameter.
*   **Cronograma Service Migration**: Converted `cronogramaService.ts` from mock data to real Supabase CRUD operations
*   **CPM Calculation**: Fixed Critical Path Method to return proper `FolgaAtividade` type with early/late dates and float values
*   **Database Tables**: Created `atividades_cronograma` and `dependencias_atividades` tables with proper indexes and RLS
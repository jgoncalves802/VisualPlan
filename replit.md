# VisionPlan - Replit Configuration

## Overview
VisionPlan is a professional construction project management platform built with React, TypeScript, and Vite. It offers integrated planning and management tools, including 4D capabilities and the Last Planner System (LPS) methodology. The platform aims to revolutionize construction project management through advanced planning, real-time monitoring, and collaborative features, providing a comprehensive solution for managing complex construction projects.

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
    *   **VisionGantt Library**: Custom Gantt library (`src/lib/vision-gantt/`) with enterprise features, including CalendarStore, resource management, critical path method (CPM) with near-critical path detection, constraint validation, and a P6-style column system.
    *   **Resource Management**: Full resource allocation with histogram visualization and conflict detection, supporting multi-rate pricing, resource curves, and split-view allocation.
    *   **Baseline Tracking**: Project baselines with variance analysis (Primavera P6 model).
    *   **Real-time Updates**: Via WebSockets through Supabase.
    *   **Multi-tenancy**: Implemented through a company system (`empresas` table) with Row Level Security (RLS).
    *   **User Management**: Comprehensive user, profile, and permission management, including Governance Layers and Access Profiles.
    *   **Organizational Structures**: Enterprise Project Structure (EPS) and Organizational Breakdown Structure (OBS) with hierarchical nodes.
    *   **Admin Panel**: Centralized dashboard (`AdminPage.tsx`) for managing users, companies, themes, access profiles, and organizational structures.
    *   **Event-Sourced Controller Architecture**: Unidirectional data flow for Gantt chart state management using `useGanttController` hook.
    *   **P6 Enterprise Columns System**: Over 80 professional columns organized by category with TypeScript types and EVM calculations. Includes predecessor/successor columns with lag and an error link column for dependency validation.
    *   **Ishikawa Analysis (Kaizen)**: Interactive fishbone diagram with 6M categories adapted for construction, hierarchical filters, Pareto chart, trend analysis, and KPI cards.
    *   **Reuniões Matrix**: Calendar-based meeting management with auto-generated agendas based on restrictions, KPIs, and 5W2H actions.
    *   **Portfolio Prioritization**: Multi-criteria scoring matrix with bubble chart visualization, radar chart comparison, and weighted ranking.
    *   **WBS Integration to Schedule**: WBS nodes from the WBS page are automatically inherited and displayed in the schedule as read-only summary tasks. Activities can be assigned to WBS nodes.
    *   **Database Schema**:
        *   **atividades_cronograma**: Main schedule activities table with Primavera P6-compatible fields, WBS integration, activity hierarchy, CPM fields, EVM fields, and multi-tenancy.
        *   **dependencias_atividades**: Activity dependencies/relationships supporting 4 PDM types and lag.
        *   **cronograma_column_configs**: Per-user, per-project column visibility and order preferences.
    *   **Performance & UX**: Implemented caching strategies (localStorage with TTL), optimistic UI updates, batch update manager, skeleton loaders, fade-in animations, scroll preservation, inline editing, and robust error handling with network resilience.
    *   **Take-off / Quantity Surveying Module**: Complete module for managing construction quantities and physical progress tracking:
        *   **Database Tables**: 8 tables in Supabase (takeoff_disciplinas, takeoff_colunas_config, takeoff_mapas, takeoff_itens, takeoff_valores_custom, takeoff_medicoes, takeoff_vinculos, takeoff_documentos)
        *   **SQL Migrations**: Located in `supabase/migrations/` - includes table creation, indexes, triggers, RLS policies, and seed function
        *   **RPC Function**: `initialize_takeoff_disciplinas(p_empresa_id UUID)` - seeds default disciplinas for a company
        *   **Generated Columns**: peso_total, custo_total, and percentual_executado are auto-calculated by PostgreSQL (never insert/update directly)
        *   **6 Discipline Templates**: Tubulação, Elétrica, Caldeiraria, Suporte, Estrutura, Equipamentos - each with specific columns
        *   **Excel Import**: Column mapping UI with auto-detection, preview, batch insert with validation
        *   **Schedule Integration**: Link take-off items to activities via vinculos table with weighted progress calculation
        *   **Dashboard**: KPIs, progress by discipline, pie chart distribution, detailed breakdown table
        *   **Service**: `takeoffService.ts` with CRUD for all entities, batch operations, totals aggregation, RPC initialization
        *   **Store**: `takeoffStore.ts` with Zustand for state management, filters, selections
        *   **Route**: `/takeoff` accessible from sidebar menu
        *   **Theme**: Strict neutral color scheme for UI (no blue/violet/purple), disciplina colors only in charts
    *   **Service Layer Architecture**: Dedicated Supabase services for each management module with PGRST205 graceful error handling:
        *   `takeoffService.ts`: Take-off/Quantity management with discipline templates, batch imports, measurements, schedule linkage
        *   `acoes5w2hService.ts`: CRUD operations for 5W2H actions with `updateWithSync()` for bidirectional sync
        *   `gestaoMudancaService.ts`: Change request management with workflow support
        *   `reunioesService.ts`: Meeting scheduling and agenda management
        *   `auditoriaService.ts`: Audit templates and audits management
        *   `restricoesIshikawaService.ts`: Ishikawa analysis restrictions linked to EPS/WBS/Activities
        *   `restricoesLpsService.ts`: LPS restrictions with automatic sync to Ishikawa analysis table (async CRUD operations, UUID validation, Ishikawa 6M categories, paralisar_obra critical flag with score-based priority reconstruction)
        *   `restricao5w2hSyncService.ts`: Bidirectional synchronization between Restrictions (Ishikawa 6M) and 5W2H actions - auto-creates 5W2H when restriction is created, syncs updates bidirectionally, cascades deletions, and includes `syncAllRestricoesSemAcao()` for retroactive sync of existing restrictions without linked 5W2H actions (accessible via "Sincronizar Restrições" button in 5W2H page)
        *   `dashboardService.ts`: KPI aggregation from multiple services with smart fallback to demo data
        *   `portfolioService.ts`: Project portfolio management with multi-criteria scoring and ranking
        *   `calendariosService.ts`: Work calendars with exceptions (holidays, work days, overtime)
        *   `indicadoresService.ts`: Comprehensive KPI calculations (EVM, LPS, Quality, Resources, Management)

## External Dependencies
*   **Supabase**: PostgreSQL database, authentication, authorization, real-time subscriptions, Row Level Security (RLS), and file storage.
*   **Recharts**: For dynamic and interactive charts.
*   **React Three Fiber**: For 3D visualization.
*   **VisionGantt**: Custom Gantt chart library.
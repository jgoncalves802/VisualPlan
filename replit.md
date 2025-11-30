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
    *   **4D Capabilities**: Integration with 3D visualization tools (React Three Fiber) and VisionGantt for advanced scheduling.
    *   **VisionGantt Library**: Custom Gantt library (`src/lib/vision-gantt/`) inspired by Bryntum Scheduler Pro with enterprise-grade features including:
        - CalendarStore for working calendar management with holidays and exceptions
        - Resource management with allocation tracking
        - Full calendar integration via visionplan-adapter.ts converter
        - Dynamic Critical Path Method (CPM) with automatic recalculation via `useCriticalPath` hook
        - Near-critical path detection (total float ≤ 5 days per Primavera P6 standard)
        - Constraint validation with visual violation indicators
    *   **Resource Management**: Full resource allocation system with histogram visualization, resource types, calendars, and conflict detection.
    *   **Baseline Tracking**: Support for project baselines with variance analysis (Primavera P6 model).
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
*   **VisionGantt** (internal): Custom Gantt chart library with MS Project/Primavera P6 grade features.

## Recent Changes (November 2025)

*   **Resizable Splitter Between Grid and Timeline**: Replaced fixed scroll divider with draggable splitter for adjusting grid/timeline proportions. Position is persisted in localStorage.
*   **Alt+Scroll Zoom**: Added zoom functionality when holding Alt key and scrolling mouse wheel over the timeline. Cycles through presets: year → quarter → month → week → day.
*   **Adjustable Columns with Persistence**: Column widths are saved to localStorage and restored on page load. Columns are prioritized over timeline width when resizing.
*   **Keyboard Shortcuts Configuration Page**: Added new "Atalhos de Teclado" tab in Settings page with:
    - Editable shortcuts for all actions
    - Category grouping (Navigation, Selection, Editing, View, General)
    - Enable/disable individual shortcuts
    - Reset to defaults functionality
    - All preferences persisted via Zustand with localStorage
*   **MS Project-Style Keyboard Shortcuts**: Implemented professional keyboard navigation:
    - **Right-click context menu**: Task actions modal now opens on right-click (like MS Project/Excel)
    - **Left-click selection**: Click to select a single task
    - **Shift+Arrow Up/Down**: Multi-select tasks for batch operations
    - **Alt+Shift+Arrow Right**: Indent task (make subtask of task above)
    - **Alt+Shift+Arrow Left**: Outdent task (move to parent level)
*   **Task Hierarchy Management**: Added `indentTask`, `outdentTask`, `indentTasks`, `outdentTasks` methods to TaskStore for managing task hierarchies with automatic WBS regeneration. Indent logic follows MS Project/P6 behavior: tasks become children of the closest task above at same or higher level, preserving existing hierarchies.
*   **Invisible Splitter**: Replaced visible scroll divider with invisible splitter between grid and timeline. Only shows on hover (subtle blue indicator when dragging).
*   **Settings Navigation**: Added Configuracoes link in sidebar menu with Settings icon, routing to full ConfiguracoesPage with Tema and Atalhos tabs.
*   **P6 Columns Documentation**: Created `docs/P6-COLUMNS-IMPLEMENTATION.md` with detailed specification for Primavera P6-style columns including EPS structure, baselines, resources, EVM, and UDFs for future implementation.
*   **EditDependencyModal**: Created component (`src/components/features/cronograma/EditDependencyModal.tsx`) allowing users to click on dependency arrows to edit dependency type (FS/SS/FF/SF) and lag. Features visual type selection, validated lag input (-365 to 365 days), and delete functionality.
*   **Dependency Click Handler**: Integrated onDependencyClick handler throughout the component chain (DependencyArrow → GanttTimeline → GanttChart → VisionGanttWrapper) enabling interactive dependency editing.
*   **Dynamic Critical Path System**: Implemented `useCriticalPath` hook with automatic recalculation when tasks or dependencies change. Includes near-critical path detection (total float ≤ 5 days) with distinct orange visual styling.
*   **Visual Critical Path Updates**: All Gantt components (TaskBar, DependencyArrow, GanttTimeline, GanttChart) now reactively display critical (red), near-critical (orange), and normal (blue) states.
*   **Theme Enhancements**: Added `nearCriticalActivity` colors to all three themes (P6 Classic, Dark, Construction).
*   **VisionGantt-only architecture**: Removed DHTMLX Gantt dual-engine architecture, CronogramaPage now uses VisionGantt exclusively.
*   **Calendar integration**: Added full calendar conversion from VisionPlan to VisionGantt CalendarStore.
*   **Resource and baseline hooks**: Created useResources.ts and useBaselines.ts for proper state management.
*   **Improved Dependency Arrow Rendering**: Enhanced dependency arrows with orthogonal routing (SVAR-style) with proper spacing and elegant arrowheads. Dependencies now follow 90-degree paths for cleaner visualization.
*   **Enhanced Milestone Visualization**: Milestones now render as larger, more prominent diamond shapes (70% of bar height) with improved centering and visibility.
*   **Robust Indent/Outdent Synchronization**: Fixed indent/outdent propagation to broadcast ALL tasks after hierarchy changes. This ensures complete synchronization between TaskStore and external VisionPlan stores, including WBS, parentId, isGroup, and level changes for all ancestors and descendants.
*   **Improved Change Detection**: Enhanced `detectTaskChanges` in visionplan-adapter.ts to properly detect parentId changes (with null/undefined normalization) and tipo transitions (Marco/Fase/Tarefa).
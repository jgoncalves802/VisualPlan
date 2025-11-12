/**
 * Type definitions for dhtmlx-gantt (COMPLETE VERSION)
 * Declarações de tipos COMPLETAS para o DHTMLX Gantt
 * Inclui todas as extensões, plugins e recursos avançados
 */

declare module 'dhtmlx-gantt' {
  export interface GanttStatic {
    // ========================================================================
    // CORE METHODS
    // ========================================================================
    init(container: HTMLElement | string): void;
    parse(data: any): void;
    clearAll(): void;
    render(): void;
    destructor(): void;
    eachTask(callback: (task: any) => void, parentId?: string, master?: any): void;
    open(id: string): void;
    close(id: string): void;
    hasChild(id: string): boolean;
    batchUpdate(callback: () => void): void;
    
    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    config: GanttConfigOptions;
    locale: any;
    i18n: any;
    
    // ========================================================================
    // DATA MANIPULATION
    // ========================================================================
    addTask(task: any, parent?: string, index?: number): string;
    updateTask(id: string, task?: any): void;
    deleteTask(id: string): void;
    getTask(id: string): any;
    getChildren(id: string): string[];
    getParent(id: string): string | number;
    getLink(id: string): any;
    addLink(link: any): string;
    updateLink(id: string, link?: any): void;
    deleteLink(id: string): void;
    isTaskExists(id: string): boolean;
    isLinkExists(id: string): boolean;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    attachEvent(name: string, handler: Function): string;
    detachEvent(id: string): void;
    callEvent(name: string, params: any[]): boolean;
    
    // ========================================================================
    // TEMPLATES
    // ========================================================================
    templates: GanttTemplates;
    
    // ========================================================================
    // PLUGINS & EXTENSIONS
    // ========================================================================
    plugins(config: any): void;
    ext: {
      quickInfo: any;
      fullscreen: any;
      zoom: any;
      undo: any;
      tooltips: any;
      overlay: any;
      inlineEditors: any;
      keyboardNavigation: any;
    };
    
    // ========================================================================
    // WBS CODES
    // ========================================================================
    getWBSCode(task: any): string;
    getGlobalTaskIndex(id: string | number): number;
    
    // ========================================================================
    // CRITICAL PATH
    // ========================================================================
    isCriticalTask(task: any): boolean;
    isCriticalLink(link: any): boolean;
    
    // ========================================================================
    // AUTO-SCHEDULING
    // ========================================================================
    autoSchedule(taskId?: string): void;
    isCircularLink(link: any): boolean;
    findCycles(): any[];
    
    // ========================================================================
    // UNDO/REDO
    // ========================================================================
    undo(): void;
    redo(): void;
    clearUndoStack(): void;
    
    // ========================================================================
    // EXPORT & IMPORT
    // ========================================================================
    exportToPDF(config?: any): void;
    exportToPNG(config?: any): void;
    exportToExcel(config?: any): void;
    exportToMSProject(config?: any): void;
    exportToPrimaveraP6(config?: any): void;
    exportToICal(config?: any): void;
    importFromMSProject(config?: any): void;
    importFromPrimaveraP6(config?: any): void;
    importFromExcel(config?: any): void;
    
    // ========================================================================
    // MARKERS & LINES
    // ========================================================================
    addMarker(marker: any): string;
    deleteMarker(id: string): void;
    getMarker(id: string): any;
    updateMarker(id: string, marker: any): void;
    renderMarkers(): void;
    
    // ========================================================================
    // BASELINES
    // ========================================================================
    addTaskLayer(func: (task: any) => any): string;
    removeTaskLayer(id: string): void;
    
    // ========================================================================
    // GROUPING
    // ========================================================================
    groupBy(config: any): void;
    
    // ========================================================================
    // SORTING
    // ========================================================================
    sort(field: string, desc?: boolean, parent?: string): void;
    
    // ========================================================================
    // FILTERING
    // ========================================================================
    filter(rule: (task: any) => boolean): void;
    resetFilter(): void;
    
    // ========================================================================
    // WORKING TIME & CALENDARS
    // ========================================================================
    setWorkTime(config: any): void;
    isWorkTime(date: Date, unit?: string, task?: any): boolean;
    getClosestWorkTime(config: any): Date;
    calculateDuration(start: Date, end: Date, task?: any): number;
    calculateEndDate(start: Date, duration: number, unit?: string, task?: any): Date;
    getCalendar(id?: string): any;
    addCalendar(calendar: any): string;
    deleteCalendar(id: string): void;
    
    // ========================================================================
    // RESOURCES
    // ========================================================================
    getResourceAssignments(resourceId: string, taskId?: string): any[];
    
    // ========================================================================
    // ZOOM & VIEW
    // ========================================================================
    showDate(date: Date): void;
    showTask(id: string): void;
    getScale(): any;
    
    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    message(text: string): void;
    message(config: { text: string; type?: string; expire?: number }): void;
    modalbox(config: any): any;
    confirm(config: any): any;
    alert(config: any): any;
    uid(): string;
    copy(task: any): any;
    date: {
      add(date: Date, number: number, unit: string): Date;
      date_part(date: Date): Date;
      time_part(date: Date): number;
      day_start(date: Date): Date;
      week_start(date: Date): Date;
      month_start(date: Date): Date;
      year_start(date: Date): Date;
      to_fixed(num: number): string;
      date_to_str(format: string): (date: Date) => string;
      str_to_date(format: string): (str: string) => Date;
      convert_to_utc(date: Date): Date;
    };
  }

  export interface GanttConfigOptions {
    // ========================================================================
    // DATE FORMAT
    // ========================================================================
    date_format?: string;
    xml_date?: string;
    api_date?: string;
    
    // ========================================================================
    // SCALE CONFIGURATION
    // ========================================================================
    scale_unit?: string;
    date_scale?: string;
    subscales?: Array<{ unit: string; step: number; date: string }>;
    step?: number;
    min_column_width?: number;
    scale_height?: number;
    
    // ========================================================================
    // COLUMNS
    // ========================================================================
    columns?: Array<{
      name: string;
      label: string;
      width?: number | string;
      align?: string;
      tree?: boolean;
      template?: (task: any) => string;
      resize?: boolean;
      hide?: boolean;
    }>;
    
    // ========================================================================
    // LAYOUT
    // ========================================================================
    layout?: any;
    show_grid?: boolean;
    show_chart?: boolean;
    grid_width?: number;
    grid_resize?: boolean;
    row_height?: number;
    bar_height?: number;
    
    // ========================================================================
    // BEHAVIOR - DRAG & DROP
    // ========================================================================
    readonly?: boolean;
    drag_move?: boolean;
    drag_resize?: boolean;
    drag_progress?: boolean;
    drag_links?: boolean;
    drag_lightbox?: boolean;
    drag_multiple?: boolean;
    round_dnd_dates?: boolean;
    details_on_dblclick?: boolean;
    click_drag?: any;
    
    // ========================================================================
    // BEHAVIOR - EDITING
    // ========================================================================
    details_on_create?: boolean;
    inline_editors_date_processing?: string;
    auto_types?: boolean;
    type_renderers?: any;
    
    // ========================================================================
    // BEHAVIOR - SELECTION
    // ========================================================================
    select_task?: boolean;
    multiselect?: boolean;
    
    // ========================================================================
    // EXTENSIONS - CRITICAL PATH
    // ========================================================================
    highlight_critical_path?: boolean;
    
    // ========================================================================
    // EXTENSIONS - AUTO SCHEDULING
    // ========================================================================
    auto_scheduling?: boolean;
    auto_scheduling_strict?: boolean;
    auto_scheduling_initial?: boolean;
    auto_scheduling_use_progress?: boolean;
    auto_scheduling_descendant_links?: boolean;
    auto_scheduling_move_projects?: boolean;
    
    // ========================================================================
    // EXTENSIONS - MARKERS
    // ========================================================================
    show_markers?: boolean;
    show_today?: boolean;
    show_errors?: boolean;
    
    // ========================================================================
    // EXTENSIONS - QUICK INFO
    // ========================================================================
    quickinfo_buttons?: string[];
    show_quick_info?: boolean;
    
    // ========================================================================
    // EXTENSIONS - TOOLTIPS
    // ========================================================================
    tooltip_offset_x?: number;
    tooltip_offset_y?: number;
    tooltip_timeout?: number;
    tooltip_hide_timeout?: number;
    
    // ========================================================================
    // EXTENSIONS - KEYBOARD NAVIGATION
    // ========================================================================
    keyboard_navigation?: boolean;
    keyboard_navigation_cells?: boolean;
    
    // ========================================================================
    // EXTENSIONS - GROUPING
    // ========================================================================
    group_by?: string;
    group_by_order?: boolean;
    
    // ========================================================================
    // EXTENSIONS - INLINE EDITORS
    // ========================================================================
    editor_types?: any;
    
    // ========================================================================
    // WORKING TIME
    // ========================================================================
    work_time?: boolean;
    correct_work_time?: boolean;
    skip_off_time?: boolean;
    duration_unit?: string;
    duration_step?: number;
    
    // ========================================================================
    // LINKS
    // ========================================================================
    show_links?: boolean;
    link_line_width?: number;
    link_arrow_size?: number;
    link_wrapper_width?: number;
    
    // ========================================================================
    // PROGRESS
    // ========================================================================
    show_progress?: boolean;
    
    // ========================================================================
    // BASELINES
    // ========================================================================
    show_baselines?: boolean;
    
    // ========================================================================
    // TASK TYPES
    // ========================================================================
    types?: {
      task: string;
      project: string;
      milestone: string;
    };
    
    // ========================================================================
    // PERFORMANCE
    // ========================================================================
    smart_rendering?: boolean;
    static_background?: boolean;
    preserve_scroll?: boolean;
    
    // ========================================================================
    // LOCALIZATION
    // ========================================================================
    locale?: any;
    
    // ========================================================================
    // RESPONSIVE
    // ========================================================================
    autosize?: boolean | string;
    autofit?: boolean;
    
    // ========================================================================
    // CONSTRAINTS
    // ========================================================================
    constraint_types?: any;
    
    // ========================================================================
    // RESOURCES
    // ========================================================================
    resource_store?: string;
    resource_property?: string;
    resource_render_empty_cells?: boolean;
    
    // ========================================================================
    // WBS CODES
    // ========================================================================
    wbs_code_separator?: string;
    
    // ========================================================================
    // OTHER
    // ========================================================================
    open_tree_initially?: boolean;
    branch_loading?: boolean;
    branch_loading_property?: string;
    order_branch?: boolean | string;
    order_branch_free?: boolean;
    reorder_grid_columns?: boolean;
    fit_tasks?: boolean;
    start_date?: Date;
    end_date?: Date;
    show_task_cells?: boolean;
    show_unscheduled?: boolean;
    readonly_form?: boolean;
    lightbox?: any;
    buttons_left?: string[];
    buttons_right?: string[];
    
    [key: string]: any;
  }

  export interface GanttTemplates {
    // ========================================================================
    // TASK TEMPLATES
    // ========================================================================
    task_text?: (start: Date, end: Date, task: any) => string;
    task_class?: (start: Date, end: Date, task: any) => string;
    task_unscheduled_time?: (task: any) => string;
    task_time?: (start: Date, end: Date, task: any) => string;
    task_row_class?: (start: Date, end: Date, task: any) => string;
    task_date?: (date: Date) => string;
    
    // ========================================================================
    // GRID TEMPLATES
    // ========================================================================
    grid_header_class?: (columnName: string, column: any) => string;
    grid_row_class?: (start: Date, end: Date, task: any) => string;
    grid_cell_class?: (item: any, columnName: string) => string;
    grid_file?: (item: any) => string;
    grid_folder?: (item: any) => string;
    grid_open?: (item: any) => string;
    grid_blank?: (item: any) => string;
    grid_indent?: (item: any) => string;
    
    // ========================================================================
    // SCALE TEMPLATES
    // ========================================================================
    scale_cell_class?: (date: Date) => string;
    scale_row_class?: (scale: any) => string;
    date_scale?: (date: Date) => string;
    
    // ========================================================================
    // TIMELINE TEMPLATES
    // ========================================================================
    timeline_cell_class?: (task: any, date: Date) => string;
    
    // ========================================================================
    // TOOLTIP TEMPLATES
    // ========================================================================
    tooltip_text?: (start: Date, end: Date, task: any) => string;
    tooltip_date_format?: (date: Date) => string;
    
    // ========================================================================
    // LINK TEMPLATES
    // ========================================================================
    link_class?: (link: any) => string;
    link_description?: (link: any) => string;
    
    // ========================================================================
    // PROGRESS TEMPLATES
    // ========================================================================
    progress_text?: (start: Date, end: Date, task: any) => string;
    
    // ========================================================================
    // LIGHTBOX TEMPLATES
    // ========================================================================
    lightbox_header?: (start: Date, end: Date, task: any) => string;
    
    // ========================================================================
    // QUICK INFO TEMPLATES
    // ========================================================================
    quick_info_title?: (start: Date, end: Date, task: any) => string;
    quick_info_content?: (start: Date, end: Date, task: any) => string;
    quick_info_date?: (start: Date, end: Date, task: any) => string;
    quick_info_class?: (start: Date, end: Date, task: any) => string;
    
    // ========================================================================
    // BASELINE TEMPLATES
    // ========================================================================
    baseline_class?: (task: any) => string;
    
    // ========================================================================
    // RESOURCE TEMPLATES
    // ========================================================================
    resource_cell_class?: (start: Date, end: Date, resource: any, tasks: any[]) => string;
    resource_cell_value?: (start: Date, end: Date, resource: any, tasks: any[]) => string;
    
    // ========================================================================
    // DRAG TEMPLATES
    // ========================================================================
    drag_link?: (from: any, fromStart: boolean, to: any, toStart: boolean) => string;
    drag_link_class?: (from: any, fromStart: boolean, to: any, toStart: boolean) => string;
    
    // ========================================================================
    // MARKER TEMPLATES
    // ========================================================================
    marker_text?: (marker: any) => string;
    marker_class?: (marker: any) => string;
    
    // ========================================================================
    // XML/PARSE TEMPLATES
    // ========================================================================
    xml_date?: string;
    xml_format?: string;
    format_date?: (date: Date) => string;
    parse_date?: (str: string) => Date;
    
    [key: string]: any;
  }

  const gantt: GanttStatic;
  export default gantt;
}


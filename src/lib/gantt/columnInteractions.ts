export interface ColumnDefinition {
  name: string;
  width?: number;
  min_width?: number;
  [key: string]: any;
}

interface ApplyColumnDragResizeOptions {
  container: HTMLElement | null;
  columns: ColumnDefinition[];
  onChange: () => void;
  resizerClass: string;
}

export function attachColumnDragAndResize({
  container,
  columns,
  onChange,
  resizerClass,
}: ApplyColumnDragResizeOptions): () => void {
  if (!container) {
    return () => {};
  }

  const headerCells = Array.from(
    container.querySelectorAll<HTMLElement>('.gantt_grid_head_cell')
  );

  const disposers: Array<() => void> = [];

  headerCells.forEach((cell, index) => {
    cell.style.position = 'relative';
    cell.dataset.colIndex = String(index);
    cell.draggable = true;

    // ----- Column drag & drop -----
    const handleDragStart = (event: DragEvent) => {
      event.dataTransfer?.setData('text/column-index', cell.dataset.colIndex || `${index}`);
      event.dataTransfer?.setData('text/plain', cell.dataset.colIndex || `${index}`);
      event.dataTransfer && (event.dataTransfer.effectAllowed = 'move');
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer && (event.dataTransfer.dropEffect = 'move');
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer?.getData('text/column-index'));
      const toIndex = Number((event.currentTarget as HTMLElement).dataset.colIndex);
      if (Number.isNaN(fromIndex) || Number.isNaN(toIndex) || fromIndex === toIndex) {
        return;
      }

      const [movedColumn] = columns.splice(fromIndex, 1);
      columns.splice(toIndex, 0, movedColumn);
      onChange();
    };

    cell.addEventListener('dragstart', handleDragStart);
    cell.addEventListener('dragover', handleDragOver);
    cell.addEventListener('drop', handleDrop);

    disposers.push(() => {
      cell.removeAttribute('draggable');
      cell.removeEventListener('dragstart', handleDragStart);
      cell.removeEventListener('dragover', handleDragOver);
      cell.removeEventListener('drop', handleDrop);
    });

    // ----- Column resize -----
    cell.querySelector(`.${resizerClass}`)?.remove();
    const resizer = document.createElement('div');
    resizer.className = resizerClass;
    cell.appendChild(resizer);

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const column = columns[index];
      const startWidth = typeof column.width === 'number' ? column.width : cell.offsetWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(column.min_width || 80, startWidth + delta);
        column.width = newWidth;
        onChange();
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    resizer.addEventListener('mousedown', handleMouseDown);

    disposers.push(() => {
      resizer.removeEventListener('mousedown', handleMouseDown);
      resizer.remove();
    });
  });

  return () => {
    disposers.forEach((dispose) => dispose());
  };
}


export interface GridResizerOptions {
  container: HTMLElement | null;
  getWidth: () => number;
  setWidth: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  resizerClass: string;
}

export interface GridResizerHandle {
  dispose: () => void;
  update: () => void;
}

export function attachGridResizer({
  container,
  getWidth,
  setWidth,
  minWidth = 240,
  maxWidth,
  resizerClass,
}: GridResizerOptions): GridResizerHandle {
  if (!container) {
    return {
      dispose: () => {},
      update: () => {},
    };
  }

  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }

  const resizer = document.createElement('div');
  resizer.className = resizerClass;
  container.appendChild(resizer);

  const updatePosition = () => {
    const width = getWidth();
    const clampedWidth = clamp(width, minWidth, maxWidth);
    resizer.style.left = `${clampedWidth - resizer.offsetWidth / 2}px`;
  };

  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = clamp(getWidth(), minWidth, maxWidth);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = clamp(startWidth + delta, minWidth, maxWidth);
      setWidth(newWidth);
      updatePosition();
      document.body.style.cursor = 'col-resize';
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  resizer.addEventListener('mousedown', handleMouseDown);
  updatePosition();

  return {
    dispose: () => {
      resizer.removeEventListener('mousedown', handleMouseDown);
      resizer.remove();
    },
    update: updatePosition,
  };
}

function clamp(value: number, min: number, max?: number) {
  const withMin = Math.max(value, min);
  if (typeof max === 'number') {
    return Math.min(withMin, max);
  }
  return withMin;
}


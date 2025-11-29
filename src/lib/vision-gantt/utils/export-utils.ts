
/**
 * Export Utilities
 * Functions for exporting Gantt data in various formats
 */

import type { Task, Dependency } from '../types';

/**
 * Export tasks to CSV format
 */
export function exportToCSV(tasks: Task[]): string {
  const headers = [
    'ID',
    'Name',
    'WBS',
    'Start Date',
    'End Date',
    'Duration (days)',
    'Progress (%)',
    'Status',
    'Parent ID'
  ];

  const rows = tasks.map(task => {
    const duration = Math.round(
      (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return [
      task.id,
      task.name,
      task.wbs || '',
      task.startDate.toISOString().split('T')[0],
      task.endDate.toISOString().split('T')[0],
      duration.toString(),
      task.progress.toString(),
      task.status,
      task.parentId || ''
    ];
  });

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csv;
}

/**
 * Export tasks to JSON format
 */
export function exportToJSON(tasks: Task[], dependencies: Dependency[]): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tasks: tasks.map(task => ({
      id: task.id,
      name: task.name,
      wbs: task.wbs,
      startDate: task.startDate.toISOString(),
      endDate: task.endDate.toISOString(),
      progress: task.progress,
      status: task.status,
      parentId: task.parentId,
      isExpanded: task.expanded
    })),
    dependencies: dependencies.map(dep => ({
      id: dep.id,
      fromTaskId: dep.fromTaskId,
      toTaskId: dep.toTaskId,
      type: dep.type
    }))
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to Microsoft Project XML format (basic)
 */
export function exportToMSProjectXML(tasks: Task[], dependencies: Dependency[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Exported Project</Name>
  <Tasks>
${tasks.map((task, index) => `    <Task>
      <UID>${index + 1}</UID>
      <ID>${task.id}</ID>
      <Name>${escapeXml(task.name)}</Name>
      <Start>${task.startDate.toISOString()}</Start>
      <Finish>${task.endDate.toISOString()}</Finish>
      <PercentComplete>${task.progress}</PercentComplete>
      <WBS>${task.wbs || ''}</WBS>
    </Task>`).join('\n')}
  </Tasks>
  <Dependencies>
${dependencies.map((dep, index) => `    <Dependency>
      <UID>${index + 1}</UID>
      <PredecessorUID>${dep.fromTaskId}</PredecessorUID>
      <SuccessorUID>${dep.toTaskId}</SuccessorUID>
      <Type>${dep.type === 'FS' ? 'FF' : dep.type}</Type>
    </Dependency>`).join('\n')}
  </Dependencies>
</Project>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export Gantt chart as image (requires canvas)
 */
export async function exportToImage(
  svgElement: SVGSVGElement,
  filename: string = 'gantt-chart.png'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size
      const bbox = svgElement.getBoundingClientRect();
      canvas.width = bbox.width;
      canvas.height = bbox.height;

      // Create image from SVG
      const img = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        // Convert to PNG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Could not create blob from canvas'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load SVG image'));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}


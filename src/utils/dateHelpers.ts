export function parseDateOnly(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  
  return new Date(year, month, day);
}

export function parseDateOnlyRequired(dateString: string): Date {
  const result = parseDateOnly(dateString);
  if (!result) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return result;
}

export function formatDateOnly(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function formatDateOnlyRequired(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function toLocaleDateStringBR(date: Date | null | undefined): string {
  if (!date) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

export function parseInputDateValue(inputValue: string): Date | null {
  if (!inputValue) return null;
  return parseDateOnly(inputValue);
}

export function getInputDateValue(date: Date | null | undefined): string {
  if (!date) return '';
  return formatDateOnlyRequired(date);
}

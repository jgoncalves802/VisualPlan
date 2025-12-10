import { ResourceRate } from '@/services/resourceService';

export interface RateResolverInput {
  resourceId: string;
  rateType: number;
  units: number;
  workingDays: number;
  unitsPerTime: number;
  rates: ResourceRate[];
  defaultRate: number;
  referenceDate?: Date;
}

export interface ResolvedCost {
  rateType: number;
  pricePerUnit: number;
  costPerUse: number;
  totalUnits: number;
  totalCost: number;
  effectiveDate?: string;
  isDefault: boolean;
}

export const RATE_TYPE_NAMES: Record<number, string> = {
  1: 'Padrão',
  2: 'Hora Extra',
  3: 'Externo',
  4: 'Especial',
  5: 'Emergência',
};

export const RATE_TYPE_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 1.2,
  4: 1.3,
  5: 2.0,
};

function isWithinEffectivePeriod(rate: ResourceRate, date: Date): boolean {
  const rateStart = rate.effectiveFrom ? new Date(rate.effectiveFrom) : new Date(0);
  const rateEnd = rate.effectiveTo ? new Date(rate.effectiveTo) : new Date(9999, 11, 31);
  return date >= rateStart && date <= rateEnd;
}

function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function resolveResourceRate(input: RateResolverInput): ResolvedCost {
  const { rateType, units, workingDays, unitsPerTime, rates, defaultRate, referenceDate } = input;
  const refDate = referenceDate || new Date();
  
  const applicableRates = rates
    .filter(r => r.rateType === rateType && isWithinEffectivePeriod(r, refDate))
    .sort((a, b) => {
      if (!a.effectiveFrom) return 1;
      if (!b.effectiveFrom) return -1;
      return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
    });
  
  const currentRate = applicableRates[0];
  
  const isDefault = !currentRate;
  const pricePerUnit = currentRate?.pricePerUnit ?? (defaultRate * (RATE_TYPE_MULTIPLIERS[rateType] || 1));
  const costPerUse = 0;
  
  const dailyUnits = (units / 100) * unitsPerTime;
  const totalUnits = dailyUnits * workingDays;
  
  const totalCost = (totalUnits * pricePerUnit) + costPerUse;
  
  return {
    rateType,
    pricePerUnit,
    costPerUse,
    totalUnits,
    totalCost,
    effectiveDate: currentRate?.effectiveFrom,
    isDefault,
  };
}

export { countWorkingDays };

export function calculateMultiRateCost(
  assignments: Array<{
    resourceId: string;
    rateType: number;
    units: number;
    unitsPerTime: number;
    startDate: string;
    endDate: string;
    rates: ResourceRate[];
    defaultRate: number;
  }>
): { totalCost: number; breakdown: ResolvedCost[]; periodDetails: Array<{ date: Date; units: number; rate: number; cost: number }> } {
  const breakdown: ResolvedCost[] = [];
  const periodDetails: Array<{ date: Date; units: number; rate: number; cost: number }> = [];
  let totalCost = 0;
  
  for (const assignment of assignments) {
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);
    
    const { totalCost: assignmentCost, periodCosts } = calculateTimeVariedCostInternal(
      assignment.resourceId,
      assignment.rates,
      assignment.rateType,
      assignment.defaultRate,
      assignment.units,
      assignment.unitsPerTime,
      start,
      end,
      true
    );
    
    periodDetails.push(...periodCosts);
    
    const ratesByPeriod = new Map<number, { totalUnits: number; totalCost: number; rate: number }>();
    for (const period of periodCosts) {
      const existing = ratesByPeriod.get(period.rate) || { totalUnits: 0, totalCost: 0, rate: period.rate };
      existing.totalUnits += period.units;
      existing.totalCost += period.cost;
      ratesByPeriod.set(period.rate, existing);
    }
    
    ratesByPeriod.forEach((data, rate) => {
      breakdown.push({
        rateType: assignment.rateType,
        pricePerUnit: rate,
        costPerUse: 0,
        totalUnits: data.totalUnits,
        totalCost: data.totalCost,
        isDefault: false,
      });
    });
    
    totalCost += assignmentCost;
  }
  
  return { totalCost, breakdown, periodDetails };
}

function calculateTimeVariedCostInternal(
  _resourceId: string,
  rates: ResourceRate[],
  rateType: number,
  defaultRate: number,
  units: number,
  unitsPerTime: number,
  startDate: Date,
  endDate: Date,
  excludeWeekends: boolean = true
): { totalCost: number; periodCosts: Array<{ date: Date; units: number; rate: number; cost: number }> } {
  const periodCosts: Array<{ date: Date; units: number; rate: number; cost: number }> = [];
  let totalCost = 0;
  
  const dailyUnits = (units / 100) * unitsPerTime;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!excludeWeekends || !isWeekend) {
      const effectiveRate = getRateEffectiveOnDate(rates, rateType, currentDate);
      const rate = effectiveRate?.pricePerUnit ?? (defaultRate * (RATE_TYPE_MULTIPLIERS[rateType] || 1));
      const cost = dailyUnits * rate;
      
      periodCosts.push({
        date: new Date(currentDate),
        units: dailyUnits,
        rate,
        cost,
      });
      
      totalCost += cost;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { totalCost, periodCosts };
}

export function getRateEffectiveOnDate(
  rates: ResourceRate[],
  rateType: number,
  date: Date
): ResourceRate | null {
  return rates
    .filter(r => r.rateType === rateType)
    .filter(r => isWithinEffectivePeriod(r, date))
    .sort((a, b) => {
      if (!a.effectiveFrom) return 1;
      if (!b.effectiveFrom) return -1;
      return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
    })[0] || null;
}

export function calculateTimeVariedCost(
  _resourceId: string,
  rates: ResourceRate[],
  rateType: number,
  defaultRate: number,
  units: number,
  unitsPerTime: number,
  startDate: Date,
  endDate: Date,
  excludeWeekends: boolean = true
): { totalCost: number; periodCosts: Array<{ date: Date; units: number; rate: number; cost: number }> } {
  const periodCosts: Array<{ date: Date; units: number; rate: number; cost: number }> = [];
  let totalCost = 0;
  
  const dailyUnits = (units / 100) * unitsPerTime;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!excludeWeekends || !isWeekend) {
      const effectiveRate = getRateEffectiveOnDate(rates, rateType, currentDate);
      const rate = effectiveRate?.pricePerUnit ?? (defaultRate * (RATE_TYPE_MULTIPLIERS[rateType] || 1));
      const cost = dailyUnits * rate;
      
      periodCosts.push({
        date: new Date(currentDate),
        units: dailyUnits,
        rate,
        cost,
      });
      
      totalCost += cost;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { totalCost, periodCosts };
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUnits(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
}

export default {
  resolveResourceRate,
  calculateMultiRateCost,
  getRateEffectiveOnDate,
  calculateTimeVariedCost,
  formatCurrency,
  formatUnits,
  RATE_TYPE_NAMES,
  RATE_TYPE_MULTIPLIERS,
};

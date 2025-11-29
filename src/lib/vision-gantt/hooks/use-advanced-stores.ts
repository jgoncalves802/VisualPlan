

/**
 * Hook to use advanced feature stores in components
 */



import { useState, useEffect, useMemo } from 'react';
import { ResourceStore } from '../stores/resource-store';
import { ScenarioStore } from '../stores/scenario-store';
import { CalendarStore } from '../stores/calendar-store';
import { ConstraintStore } from '../stores/constraint-store';
import type { Resource } from '../types';
import type {
  ResourceAllocation,
  ResourceAvailability,
  Scenario,
  WorkingCalendar,
  TaskConstraint
} from '../types/advanced-features';

interface UseAdvancedStoresProps {
  resources?: Resource[];
  allocations?: ResourceAllocation[];
  availabilities?: ResourceAvailability[];
  scenarios?: Scenario[];
  calendars?: WorkingCalendar[];
  constraints?: TaskConstraint[];
}

export function useAdvancedStores({
  resources = [],
  allocations = [],
  availabilities = [],
  scenarios = [],
  calendars = [],
  constraints = []
}: UseAdvancedStoresProps = {}) {
  // Initialize stores
  const resourceStore = useMemo(
    () => new ResourceStore(resources, allocations, availabilities),
    []
  );

  const scenarioStore = useMemo(
    () => new ScenarioStore(scenarios),
    []
  );

  const calendarStore = useMemo(
    () => new CalendarStore(calendars),
    []
  );

  const constraintStore = useMemo(
    () => new ConstraintStore(constraints),
    []
  );

  // State for triggering re-renders
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  // Subscribe to stores
  useEffect(() => {
    const unsubscribeResource = resourceStore.subscribe(forceUpdate);
    const unsubscribeScenario = scenarioStore.subscribe(forceUpdate);
    const unsubscribeCalendar = calendarStore.subscribe(forceUpdate);
    const unsubscribeConstraint = constraintStore.subscribe(forceUpdate);

    return () => {
      unsubscribeResource();
      unsubscribeScenario();
      unsubscribeCalendar();
      unsubscribeConstraint();
    };
  }, [resourceStore, scenarioStore, calendarStore, constraintStore]);

  return {
    resourceStore,
    scenarioStore,
    calendarStore,
    constraintStore,

    // Convenience getters
    resources: resourceStore.getResources(),
    allocations: resourceStore.getAllocations(),
    conflicts: resourceStore.getConflicts(),
    
    scenarios: scenarioStore.getScenarios(),
    activeScenario: scenarioStore.getActiveScenario(),
    
    calendars: calendarStore.getCalendars(),
    activeCalendar: calendarStore.getActiveCalendar(),
    
    constraints: constraintStore.getConstraints(),
    violations: constraintStore.getViolations()
  };
}


import { useState, useEffect, useCallback } from 'react';
import { resourceService, Resource, ResourceAllocation, ResourceConflict, ResourceType } from '../services/resourceService';

export interface UseResourcesReturn {
  resources: Resource[];
  resourceTypes: ResourceType[];
  allocations: ResourceAllocation[];
  conflicts: ResourceConflict[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'resourceType'>) => Promise<Resource | null>;
  updateResource: (id: string, resource: Partial<Resource>) => Promise<Resource | null>;
  deleteResource: (id: string) => Promise<void>;
  createAllocation: (allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt' | 'resource'>) => Promise<ResourceAllocation | null>;
  updateAllocation: (id: string, allocation: Partial<ResourceAllocation>) => Promise<ResourceAllocation | null>;
  deleteAllocation: (id: string) => Promise<void>;
  detectConflicts: (resourceId?: string) => Promise<ResourceConflict[]>;
  calculateHistogram: (resourceId: string, startDate: Date, endDate: Date) => any[];
}

export function useResources(empresaId: string, projetoId?: string): UseResourcesReturn {
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const [resourcesData, typesData] = await Promise.all([
        resourceService.getResources(empresaId),
        resourceService.getResourceTypes(empresaId),
      ]);

      setResources(resourcesData);
      setResourceTypes(typesData);

      const allocationsData = await resourceService.getAllocations(empresaId, projetoId);
      setAllocations(allocationsData);

      const conflictsList = await resourceService.getConflicts(empresaId, true);
      setConflicts(conflictsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar recursos');
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, projetoId]);

  useEffect(() => {
    if (empresaId) {
      loadResources();
    }
  }, [empresaId, projetoId, loadResources]);

  const createResource = useCallback(async (
    resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'resourceType'>
  ): Promise<Resource | null> => {
    try {
      const created = await resourceService.createResource(resource);
      if (created) {
        setResources(prev => [...prev, created]);
      }
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar recurso');
      return null;
    }
  }, []);

  const updateResource = useCallback(async (
    id: string,
    resource: Partial<Resource>
  ): Promise<Resource | null> => {
    try {
      const updated = await resourceService.updateResource(id, resource);
      if (updated) {
        setResources(prev => prev.map(r => r.id === id ? updated : r));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar recurso');
      return null;
    }
  }, []);

  const deleteResource = useCallback(async (id: string): Promise<void> => {
    try {
      await resourceService.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar recurso');
    }
  }, []);

  const createAllocation = useCallback(async (
    allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt' | 'resource'>
  ): Promise<ResourceAllocation | null> => {
    try {
      const created = await resourceService.createAllocation(allocation);
      if (created) {
        setAllocations(prev => [...prev, created]);
      }
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar alocação');
      return null;
    }
  }, []);

  const updateAllocation = useCallback(async (
    id: string,
    allocation: Partial<ResourceAllocation>
  ): Promise<ResourceAllocation | null> => {
    try {
      const updated = await resourceService.updateAllocation(id, allocation);
      if (updated) {
        setAllocations(prev => prev.map(a => a.id === id ? updated : a));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar alocação');
      return null;
    }
  }, []);

  const deleteAllocation = useCallback(async (id: string): Promise<void> => {
    try {
      await resourceService.deleteAllocation(id);
      setAllocations(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar alocação');
    }
  }, []);

  const detectConflicts = useCallback(async (
    resourceId?: string
  ): Promise<ResourceConflict[]> => {
    try {
      const detected = await resourceService.detectConflicts(empresaId, resourceId);
      setConflicts(detected);
      return detected;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao detectar conflitos');
      return [];
    }
  }, [empresaId]);

  const calculateHistogram = useCallback((
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): any[] => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return [];
    
    const resourceAllocations = allocations.filter(a => a.resourceId === resourceId);
    return resourceService.calculateResourceHistogram(resourceAllocations, resource, startDate, endDate);
  }, [resources, allocations]);

  return {
    resources,
    resourceTypes,
    allocations,
    conflicts,
    isLoading,
    error,
    refresh: loadResources,
    createResource,
    updateResource,
    deleteResource,
    createAllocation,
    updateAllocation,
    deleteAllocation,
    detectConflicts,
    calculateHistogram,
  };
}

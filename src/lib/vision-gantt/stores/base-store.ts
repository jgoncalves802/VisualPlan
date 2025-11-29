
/**
 * Base Store implementation with Observer Pattern
 */

import type { Store, StoreListener } from '../types';

export abstract class BaseStore<T extends { id: string }> implements Store<T> {
  data: T[] = [];
  listeners: Set<StoreListener<T>> = new Set();

  constructor(initialData: T[] = []) {
    this.data = initialData;
  }

  /**
   * Subscribe to store changes
   */
  subscribe(listener: StoreListener<T>): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.data]);
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    });
  }

  /**
   * Get item by ID
   */
  getById(id: string): T | undefined {
    return this.data.find((item) => item?.id === id);
  }

  /**
   * Add new item
   */
  add(item: T): void {
    if (!item?.id) {
      console.warn('Cannot add item without id');
      return;
    }
    this.data.push(item);
    this.notify();
  }

  /**
   * Update existing item
   */
  update(id: string, updates: Partial<T>): void {
    const index = this.data.findIndex((item) => item?.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      this.notify();
    }
  }

  /**
   * Remove item
   */
  remove(id: string): void {
    const index = this.data.findIndex((item) => item?.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Get all items
   */
  getAll(): T[] {
    return [...this.data];
  }

  /**
   * Replace all data
   */
  setData(newData: T[]): void {
    this.data = newData;
    this.notify();
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.data = [];
    this.notify();
  }

  /**
   * Get count
   */
  count(): number {
    return this.data.length;
  }
}

import { DirtEntry } from '@/types';

const STORAGE_KEY = 'dirt-log-entries';

/**
 * Get all dirt entries from localStorage
 */
export function getEntries(): DirtEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new dirt entry
 */
export function saveEntry(entry: DirtEntry): void {
  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Delete a dirt entry by ID
 */
export function deleteEntry(id: string): void {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Update a dirt entry
 */
export function updateEntry(updated: DirtEntry): void {
  const entries = getEntries().map(e => e.id === updated.id ? updated : e);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Clear all entries
 */
export function clearEntries(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Load seed data if no entries exist
 */
export function initializeWithSeedData(seedEntries: DirtEntry[]): void {
  const existing = getEntries();
  if (existing.length === 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
  }
}

/**
 * Generate a unique ID for new entries
 */
export function generateId(): string {
  return `entry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

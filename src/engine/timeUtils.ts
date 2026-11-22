/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterScheduleWindow } from '../types/game';

export const MINUTES_PER_DAY = 1440;
export const INVESTIGATION_DAY_BASE = 1440; // Day 2 starts at minute 1440 (00:00 Day 2)
export const DEFAULT_INVESTIGATION_START_MINUTES = INVESTIGATION_DAY_BASE + 9 * 60; // Day 2 · 09:00

export function parseHHMM(hhmm: string): number {
  const parts = hhmm.trim().split(':');
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  return Math.max(0, Math.min(1439, h * 60 + m));
}

export function formatMinutesHHMM(totalMinutes: number): string {
  const mod = ((Math.floor(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(mod / 60);
  const m = mod % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatInvestigationClock(totalMinutes: number): string {
  const relativeMinutes = Math.max(0, totalMinutes - INVESTIGATION_DAY_BASE);
  const dayNumber = Math.floor(relativeMinutes / MINUTES_PER_DAY) + 1;
  return `Day ${dayNumber} · ${formatMinutesHHMM(totalMinutes)}`;
}

export function is24HourSchedule(openingHours?: { open: string; close: string }): boolean {
  if (!openingHours) return true;
  return openingHours.open === '00:00' && (openingHours.close === '23:59' || openingHours.close === '24:00');
}

export function isMinuteOfDayInRange(
  minuteOfDay: number,
  openMin: number,
  closeMin: number
): boolean {
  if (openMin === 0 && closeMin >= 1439) return true;
  if (openMin === closeMin) return true;
  if (closeMin > openMin) {
    return minuteOfDay >= openMin && minuteOfDay < closeMin;
  }
  // Overnight wrap (e.g. 18:00 to 03:00)
  return minuteOfDay >= openMin || minuteOfDay < closeMin;
}

export function isLocationOpenAt(
  openingHours: { open: string; close: string } | undefined,
  totalMinutes: number
): boolean {
  if (!openingHours || is24HourSchedule(openingHours)) return true;
  const openMin = parseHHMM(openingHours.open);
  const closeMin = parseHHMM(openingHours.close);
  const minuteOfDay = ((Math.floor(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return isMinuteOfDayInRange(minuteOfDay, openMin, closeMin);
}

/**
 * Returns the next totalMinutes >= currentTotalMinutes when the location is open.
 * If already open, returns currentTotalMinutes.
 */
export function getNextOpeningTotalMinutes(
  openingHours: { open: string; close: string } | undefined,
  currentTotalMinutes: number
): number {
  if (!openingHours || isLocationOpenAt(openingHours, currentTotalMinutes)) {
    return currentTotalMinutes;
  }
  const openMin = parseHHMM(openingHours.open);
  const minuteOfDay = ((Math.floor(currentTotalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const dayBase = Math.floor(currentTotalMinutes / MINUTES_PER_DAY) * MINUTES_PER_DAY;
  if (minuteOfDay < openMin) {
    return dayBase + openMin;
  }
  return dayBase + MINUTES_PER_DAY + openMin;
}

/**
 * Returns the canonical [start, end] minute window on a given dayBase (e.g. 0 for Day 1 or 1440 for Day 2)
 * representing one full operating shift of openingHours. Handles overnight wraps cleanly.
 */
export function getOperatingWindowOnDay(
  openingHours: { open: string; close: string } | undefined,
  dayBase: number
): { start: number; end: number } {
  if (!openingHours || is24HourSchedule(openingHours)) {
    return { start: dayBase, end: dayBase + 1439 };
  }
  const openMin = parseHHMM(openingHours.open);
  const closeMin = parseHHMM(openingHours.close);
  if (closeMin > openMin) {
    return { start: dayBase + openMin, end: dayBase + closeMin };
  }
  return { start: dayBase + openMin, end: dayBase + MINUTES_PER_DAY + closeMin };
}

/**
 * Checks whether a character has an active schedule window at a given location and totalMinutes.
 * Supports wrapping daily schedules smoothly if investigation advances past Day 2 midnight into Day 3+.
 */
export function getActiveScheduleWindow(
  schedules: Record<string, CharacterScheduleWindow[]> | undefined,
  characterId: string,
  locationId: string,
  totalMinutes: number,
  openingHours?: { open: string; close: string },
  phase: 'murder_night' | 'investigation_day' = 'investigation_day'
): CharacterScheduleWindow | null {
  if (!schedules) return null;
  const entries = schedules[characterId];
  if (!entries || entries.length === 0) return null;

  if (!isLocationOpenAt(openingHours, totalMinutes)) {
    return null;
  }

  const phaseEntries = entries.filter(
    (w) => w.locationId === locationId && w.timelinePhase === phase
  );
  if (phaseEntries.length === 0) return null;

  // Direct match
  for (const w of phaseEntries) {
    if (totalMinutes >= w.startMinutes && totalMinutes < w.endMinutes) {
      return w;
    }
  }

  // If investigation runs past Day 2 into Day 3+, match equivalent time-of-day on Day 2 (or previous overnight tail)
  if (phase === 'investigation_day' && totalMinutes >= INVESTIGATION_DAY_BASE) {
    const mod = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const normalizedDay2 = INVESTIGATION_DAY_BASE + mod;
    const normalizedPrevTail = INVESTIGATION_DAY_BASE + MINUTES_PER_DAY + mod;
    for (const w of phaseEntries) {
      if (normalizedDay2 >= w.startMinutes && normalizedDay2 < w.endMinutes) {
        return w;
      }
      if (normalizedPrevTail >= w.startMinutes && normalizedPrevTail < w.endMinutes) {
        return w;
      }
    }
  }

  return null;
}

export function isCharacterPresentAt(
  schedules: Record<string, CharacterScheduleWindow[]> | undefined,
  characterId: string,
  locationId: string,
  totalMinutes: number,
  openingHours?: { open: string; close: string },
  phase: 'murder_night' | 'investigation_day' = 'investigation_day'
): boolean {
  return Boolean(
    getActiveScheduleWindow(schedules, characterId, locationId, totalMinutes, openingHours, phase)
  );
}

/**
 * Finds the next arrival window (startMinutes >= currentTotalMinutes) at a given location across all characters.
 */
export function getNextArrivalAtLocation(
  schedules: Record<string, CharacterScheduleWindow[]> | undefined,
  locationId: string,
  currentTotalMinutes: number,
  phase: 'murder_night' | 'investigation_day' = 'investigation_day'
): { characterId: string; window: CharacterScheduleWindow; arrivalMinutes: number } | null {
  if (!schedules) return null;
  let best: { characterId: string; window: CharacterScheduleWindow; arrivalMinutes: number } | null = null;
  const currentDayBase = Math.floor(currentTotalMinutes / MINUTES_PER_DAY) * MINUTES_PER_DAY;

  for (const [charId, windows] of Object.entries(schedules)) {
    for (const w of windows) {
      if (w.locationId !== locationId || w.timelinePhase !== phase) continue;
      let candidateStart = w.startMinutes;
      if (candidateStart < currentTotalMinutes && phase === 'investigation_day') {
        const startOfDay = ((w.startMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
        candidateStart = currentDayBase + startOfDay;
        if (candidateStart < currentTotalMinutes) {
          candidateStart += MINUTES_PER_DAY;
        }
      }
      if (candidateStart >= currentTotalMinutes) {
        if (!best || candidateStart < best.arrivalMinutes) {
          best = { characterId: charId, window: w, arrivalMinutes: candidateStart };
        }
      }
    }
  }
  return best;
}

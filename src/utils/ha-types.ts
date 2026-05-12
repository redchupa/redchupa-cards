/**
 * Minimal HA frontend type surface that custom cards interact with.
 * Kept narrow on purpose — only what our cards actually read.
 * For richer typings, depend on `custom-card-helpers` later if needed.
 */

export interface HassEntityAttributeBase {
  friendly_name?: string;
  icon?: string;
  unit_of_measurement?: string;
  device_class?: string;
  [key: string]: unknown;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: HassEntityAttributeBase;
  last_changed: string;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
  locale: { language: string };
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ) => Promise<void>;
  /** Generic WebSocket call. Used by cards that need history/etc. */
  callWS: <T = unknown>(msg: Record<string, unknown>) => Promise<T>;
}

/** Compact history-stream item from `history/history_during_period`. */
export interface CompactHistoryEntry {
  s?: string;
  a?: Record<string, unknown>;
  lu?: number;
  lc?: number;
}

/** Legacy long-form history item — same endpoint, older HA versions. */
export interface LongHistoryEntry {
  state?: string;
  attributes?: Record<string, unknown>;
  last_updated?: string;
  last_changed?: string;
}

export type HistoryEntry = CompactHistoryEntry & LongHistoryEntry;
export type HistoryResult = Record<string, HistoryEntry[]>;

export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

/** Card registry entry surfaced to the HA frontend for the picker. */
export interface CardRegistration {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
}

declare global {
  interface Window {
    customCards?: CardRegistration[];
  }
}

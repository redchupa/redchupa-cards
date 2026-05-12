import type { CardRegistration } from './ha-types';

/**
 * Push a card into window.customCards so the dashboard picker lists it.
 * Idempotent — re-registering the same type replaces the previous entry.
 */
export function registerCard(entry: CardRegistration): void {
  window.customCards = window.customCards ?? [];
  const existing = window.customCards.findIndex((c) => c.type === entry.type);
  if (existing >= 0) {
    window.customCards[existing] = entry;
  } else {
    window.customCards.push(entry);
  }
}

/** Banner once per page load so users can confirm the bundle loaded. */
export function logBanner(version: string): void {
  const style =
    'color: white; background: #1f6feb; padding: 2px 6px; border-radius: 4px;';
  // eslint-disable-next-line no-console
  console.info(`%cREDCHUPA-CARDS%c v${version}`, style, '');
}

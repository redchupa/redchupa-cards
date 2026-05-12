import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type {
  HomeAssistant,
  LovelaceCardConfig,
  HassEntity,
  HistoryResult,
  HistoryEntry,
} from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';
import { TTLCache } from '../utils/cache';

interface AiAlertTimelineCardConfig extends LovelaceCardConfig {
  type: 'custom:ai-alert-timeline-card';
  entities: string[];
  title?: string;
  show_thumbnails?: boolean;
  show_confidence?: boolean;
  max_rows?: number;
  /** Hours of history to fetch. 0 disables history (current-state only). */
  history_hours?: number;
}

interface Row {
  entity_id: string;
  label: string;
  text: string;
  timestamp: Date;
  snapshotUrl?: string;
  eventType?: string;
  confidence?: number;
}

/**
 * History responses are shared across every instance of this card on the
 * dashboard — opening the same view a second time reuses the cached result
 * for 60s, so we don't hammer the WS API.
 */
const historyCache = new TTLCache<Row[]>(60_000);

/**
 * Timeline of "latest AI output" entities — typically a small set of
 * `input_text.*` or `sensor.*` that user automations refill each time a
 * baby-cam / front-door / similar AI Task fires.
 *
 * Fetches `history/history_during_period` for the watched entities and
 * renders a true scrollback, merged with the current `hass.states` value
 * so the latest event is always visible. History fetch is gated on a
 * "did any watched entity change since last fetch?" check, which avoids
 * polling but still picks up new events as they arrive.
 */
@customElement('ai-alert-timeline-card')
export class AiAlertTimelineCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: AiAlertTimelineCardConfig;
  @state() private _historyRows: Row[] = [];
  @state() private _loading = false;
  private _lastSeenStates = new Map<string, string>();
  private _historyEverLoaded = false;

  public setConfig(config: AiAlertTimelineCardConfig): void {
    if (
      !config ||
      !Array.isArray(config.entities) ||
      config.entities.length === 0
    ) {
      throw new Error(
        'ai-alert-timeline-card: `entities` (non-empty array) is required',
      );
    }
    this._config = config;
    this._historyEverLoaded = false;
    this._lastSeenStates.clear();
  }

  public getCardSize(): number {
    return Math.max(3, Math.min(this._config?.entities.length ?? 3, 6));
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('hass') || changed.has('_config')) {
      void this._maybeFetchHistory();
    }
  }

  private async _maybeFetchHistory(): Promise<void> {
    if (!this.hass || !this._config) return;
    const hours = this._config.history_hours ?? 24;
    if (hours <= 0) return;

    if (!this._shouldRefetch()) return;

    const ids = this._config.entities;
    const cacheKey = `${ids.slice().sort().join(',')}|${hours}`;
    const cached = historyCache.get(cacheKey);
    if (cached) {
      this._historyRows = cached;
      this._historyEverLoaded = true;
      return;
    }

    this._loading = true;
    try {
      const start = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const result = await this.hass.callWS<HistoryResult>({
        type: 'history/history_during_period',
        start_time: start,
        entity_ids: ids,
        minimal_response: false,
        significant_changes_only: false,
        no_attributes: false,
      });
      const rows = this._historyToRows(result);
      historyCache.set(cacheKey, rows);
      this._historyRows = rows;
      this._historyEverLoaded = true;
    } catch (err) {
      // History API isn't fatal — we still render current state below.
      // eslint-disable-next-line no-console
      console.warn('[ai-alert-timeline-card] history fetch failed:', err);
      this._historyRows = [];
    } finally {
      this._loading = false;
    }
  }

  /**
   * True when (a) we never loaded history yet, or (b) at least one watched
   * entity has a different last_changed than when we last fetched. This lets
   * us pick up fresh AI events without timer-driven polling.
   */
  private _shouldRefetch(): boolean {
    if (!this._historyEverLoaded) return true;
    let changed = false;
    for (const id of this._config!.entities) {
      const cur = this.hass!.states[id]?.last_changed;
      if (!cur) continue;
      const prev = this._lastSeenStates.get(id);
      if (cur !== prev) {
        this._lastSeenStates.set(id, cur);
        changed = true;
      }
    }
    return changed;
  }

  private _historyToRows(result: HistoryResult): Row[] {
    const out: Row[] = [];
    for (const [entityId, entries] of Object.entries(result)) {
      if (!Array.isArray(entries)) continue;
      let lastAttrs: Record<string, unknown> = {};
      for (const e of entries) {
        const row = this._historyEntryToRow(entityId, e, lastAttrs);
        if (row) {
          out.push(row.row);
          lastAttrs = row.attrs;
        }
      }
    }
    return out;
  }

  private _historyEntryToRow(
    entityId: string,
    e: HistoryEntry,
    forwardAttrs: Record<string, unknown>,
  ): { row: Row; attrs: Record<string, unknown> } | null {
    const stateVal = e.s ?? e.state;
    if (
      typeof stateVal !== 'string' ||
      stateVal === '' ||
      stateVal === 'unavailable' ||
      stateVal === 'unknown'
    ) {
      return null;
    }
    const attrs: Record<string, unknown> =
      e.a ?? e.attributes ?? forwardAttrs;
    const tsSource =
      typeof e.lu === 'number'
        ? new Date(e.lu * 1000)
        : typeof e.lc === 'number'
          ? new Date(e.lc * 1000)
          : e.last_updated
            ? new Date(e.last_updated)
            : e.last_changed
              ? new Date(e.last_changed)
              : null;
    if (!tsSource || Number.isNaN(tsSource.getTime())) return null;

    const confRaw = this._pickAttr(attrs, ['confidence', 'score', 'prob']);
    const conf =
      typeof confRaw === 'number'
        ? confRaw
        : typeof confRaw === 'string' && !isNaN(Number(confRaw))
          ? Number(confRaw)
          : undefined;

    return {
      row: {
        entity_id: entityId,
        label:
          (attrs.friendly_name as string | undefined) ??
          entityId.split('.').pop() ??
          entityId,
        text: stateVal,
        timestamp: tsSource,
        snapshotUrl: this._asString(
          this._pickAttr(attrs, ['snapshot_url', 'image_url', 'thumbnail']),
        ),
        eventType: this._asString(
          this._pickAttr(attrs, ['event_type', 'category', 'kind']),
        ),
        confidence: conf,
      },
      attrs,
    };
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('../editors/ai-alert-timeline-editor');
    return document.createElement('ai-alert-timeline-card-editor');
  }

  public static getStubConfig(): AiAlertTimelineCardConfig {
    return { type: 'custom:ai-alert-timeline-card', entities: [] };
  }

  static styles = css`
    :host {
      display: block;
    }
    .title {
      padding: 12px 16px 4px;
      font-size: 1rem;
      font-weight: 500;
    }
    .timeline {
      padding: 4px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .day-header {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.6;
      margin: 12px 0 4px;
    }
    .day-header:first-child {
      margin-top: 4px;
    }
    .row {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 12px;
      padding: 8px 0;
      border-left: 2px solid var(--divider-color);
      padding-left: 12px;
      position: relative;
    }
    .row::before {
      content: '';
      position: absolute;
      left: -5px;
      top: 14px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
    }
    .thumb {
      width: 72px;
      height: 54px;
      border-radius: 6px;
      object-fit: cover;
      background: var(--secondary-background-color);
    }
    .row.no-thumb {
      grid-template-columns: 1fr;
    }
    .meta {
      display: flex;
      gap: 8px;
      align-items: baseline;
      font-size: 0.8rem;
      opacity: 0.7;
    }
    .label {
      font-weight: 500;
      color: var(--primary-text-color);
      opacity: 1;
    }
    .time {
      font-variant-numeric: tabular-nums;
    }
    .badge {
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: 8px;
      background: var(--secondary-background-color);
      opacity: 1;
    }
    .text {
      margin-top: 4px;
      line-height: 1.4;
      word-break: break-word;
    }
    .empty {
      padding: 16px;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .loading {
      padding: 12px;
      text-align: center;
      font-size: 0.85rem;
      opacity: 0.7;
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const lang = pickLang(this.hass.language);
    const cfg = this._config;
    const showThumbs = cfg.show_thumbnails !== false;
    const showConf = cfg.show_confidence !== false;

    const rows = this._buildRows().slice(0, cfg.max_rows ?? 10);
    const firstFetchPending =
      this._loading && !this._historyEverLoaded && rows.length === 0;

    return html`
      <ha-card>
        <div class="title">${cfg.title ?? t('timeline.title', lang)}</div>
        ${firstFetchPending
          ? html`<div class="loading">…</div>`
          : rows.length === 0
            ? html`<div class="empty">${t('timeline.empty', lang)}</div>`
            : html`<div class="timeline">
                ${this._renderGrouped(rows, lang, showThumbs, showConf)}
              </div>`}
      </ha-card>
    `;
  }

  private _buildRows(): Row[] {
    const merged: Row[] = [...this._historyRows];

    // Append current state for each entity. If history is in use, dedupe by
    // (entity_id + timestamp ms) so we don't double-count the latest event
    // that already appeared in the history response.
    const seen = new Set(
      merged.map((r) => `${r.entity_id}|${r.timestamp.getTime()}`),
    );

    for (const id of this._config!.entities) {
      const stateObj: HassEntity | undefined = this.hass!.states[id];
      if (!stateObj) continue;
      if (stateObj.state === 'unavailable' || stateObj.state === 'unknown') {
        continue;
      }
      const attrs = stateObj.attributes;
      const ts = new Date(stateObj.last_changed);
      if (Number.isNaN(ts.getTime())) continue;

      const key = `${id}|${ts.getTime()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const confRaw = this._pickAttr(attrs, ['confidence', 'score', 'prob']);
      const conf =
        typeof confRaw === 'number'
          ? confRaw
          : typeof confRaw === 'string' && !isNaN(Number(confRaw))
            ? Number(confRaw)
            : undefined;

      merged.push({
        entity_id: id,
        label:
          (attrs.friendly_name as string | undefined) ??
          id.split('.').pop() ??
          id,
        text: stateObj.state,
        timestamp: ts,
        snapshotUrl: this._asString(
          this._pickAttr(attrs, ['snapshot_url', 'image_url', 'thumbnail']),
        ),
        eventType: this._asString(
          this._pickAttr(attrs, ['event_type', 'category', 'kind']),
        ),
        confidence: conf,
      });
    }
    merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return merged;
  }

  private _renderGrouped(
    rows: Row[],
    lang: 'ko' | 'en',
    showThumbs: boolean,
    showConf: boolean,
  ): TemplateResult {
    const groups = new Map<string, Row[]>();
    for (const r of rows) {
      const key = this._dayLabel(r.timestamp, lang);
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }

    return html`${Array.from(groups.entries()).map(
      ([day, list]) => html`
        <div class="day-header">${day}</div>
        ${list.map((r) => this._renderRow(r, lang, showThumbs, showConf))}
      `,
    )}`;
  }

  private _renderRow(
    r: Row,
    lang: 'ko' | 'en',
    showThumbs: boolean,
    showConf: boolean,
  ): TemplateResult {
    const time = r.timestamp.toLocaleTimeString(
      lang === 'ko' ? 'ko-KR' : 'en-US',
      { hour: '2-digit', minute: '2-digit' },
    );
    const hasThumb = showThumbs && Boolean(r.snapshotUrl);

    return html`
      <div class="row ${hasThumb ? '' : 'no-thumb'}">
        ${hasThumb
          ? html`<img
              class="thumb"
              src="${r.snapshotUrl!}"
              alt=""
              loading="lazy"
            />`
          : nothing}
        <div>
          <div class="meta">
            <span class="label">${r.label}</span>
            <span class="time">${time}</span>
            ${r.eventType
              ? html`<span class="badge">${r.eventType}</span>`
              : nothing}
            ${showConf && r.confidence !== undefined
              ? html`<span class="badge">
                  ${t('timeline.confidence', lang)}
                  ${(r.confidence * (r.confidence <= 1 ? 100 : 1)).toFixed(0)}%
                </span>`
              : nothing}
          </div>
          <div class="text">${r.text}</div>
        </div>
      </div>
    `;
  }

  private _dayLabel(d: Date, lang: 'ko' | 'en'): string {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (startOfToday.getTime() - startOfDay.getTime()) / 86400000,
    );
    if (diffDays === 0) return t('timeline.today', lang);
    if (diffDays === 1) return t('timeline.yesterday', lang);
    return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
  }

  private _pickAttr(
    attrs: Record<string, unknown>,
    keys: readonly string[],
  ): unknown {
    for (const k of keys) {
      const v = attrs[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
  }

  private _asString(v: unknown): string | undefined {
    if (typeof v === 'string' && v.length > 0) return v;
    return undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-alert-timeline-card': AiAlertTimelineCard;
  }
}

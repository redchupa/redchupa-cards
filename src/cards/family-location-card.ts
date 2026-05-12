import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type {
  HomeAssistant,
  LovelaceCardConfig,
  HassEntity,
} from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';

type EntityEntry = string | { entity: string; name?: string };

interface FamilyLocationCardConfig extends LovelaceCardConfig {
  type: 'custom:family-location-card';
  entities: EntityEntry[];
  title?: string;
  show_battery?: boolean;
  show_last_changed?: boolean;
}

interface Row {
  entity_id: string;
  domain: string;
  name: string;
  avatar?: string;
  rawState: string;
  stateLabel: string;
  stateKind: 'home' | 'away' | 'zone' | 'unknown';
  battery?: number;
  lastChanged: string;
}

/**
 * Unified view for `person.*`, `device_tracker.*`, and vehicle GPS sensors.
 *
 * The card renders one row per configured entity in declared order — no
 * automatic re-sorting, so the dashboard reflects exactly what the user
 * asked for. GPS coordinates are deliberately NOT displayed; the card shows
 * only state (home / zone name / away), battery, and last-seen time.
 */
@customElement('family-location-card')
export class FamilyLocationCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: FamilyLocationCardConfig;

  public setConfig(config: FamilyLocationCardConfig): void {
    if (
      !config ||
      !Array.isArray(config.entities) ||
      config.entities.length === 0
    ) {
      throw new Error(
        'family-location-card: `entities` (non-empty array) is required',
      );
    }
    this._config = config;
  }

  public getCardSize(): number {
    return Math.max(2, this._config?.entities.length ?? 2);
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
    .rows {
      padding: 4px 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .row {
      display: grid;
      grid-template-columns: 40px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 8px 8px;
      border-radius: 8px;
    }
    .row:hover {
      background: var(--secondary-background-color);
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      background: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 600;
      color: var(--secondary-text-color);
    }
    img.avatar {
      color: transparent;
    }
    .name {
      font-weight: 500;
      line-height: 1.2;
    }
    .last-seen {
      font-size: 0.75rem;
      opacity: 0.6;
      margin-top: 2px;
    }
    .right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .state-badge {
      font-size: 0.8rem;
      padding: 2px 10px;
      border-radius: 12px;
      font-weight: 500;
    }
    .state-badge.home {
      background: #2e7d32;
      color: white;
    }
    .state-badge.away {
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .state-badge.zone {
      background: #1565c0;
      color: white;
    }
    .state-badge.unknown {
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      font-style: italic;
    }
    .battery {
      font-size: 0.75rem;
      opacity: 0.7;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .battery.low {
      color: #d32f2f;
      opacity: 1;
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const lang = pickLang(this.hass.language);
    const cfg = this._config;
    const rows = cfg.entities
      .map((e) => this._buildRow(e, lang))
      .filter((r): r is Row => r !== null);

    return html`
      <ha-card>
        <div class="title">${cfg.title ?? t('family.title', lang)}</div>
        ${rows.length === 0
          ? html`<div class="empty">${t('family.no_entities', lang)}</div>`
          : html`<div class="rows">
              ${rows.map((r) => this._renderRow(r, lang, cfg))}
            </div>`}
      </ha-card>
    `;
  }

  private _buildRow(entry: EntityEntry, lang: 'ko' | 'en'): Row | null {
    const id = typeof entry === 'string' ? entry : entry.entity;
    const override = typeof entry === 'string' ? undefined : entry.name;
    const stateObj: HassEntity | undefined = this.hass!.states[id];
    if (!stateObj) return null;

    const domain = id.split('.')[0] ?? '';
    const attrs = stateObj.attributes;
    const rawState = stateObj.state;
    const { kind, label } = this._classifyState(rawState, lang);

    const avatar =
      (attrs.entity_picture as string | undefined) ??
      (attrs.entity_picture_local as string | undefined);

    const batteryRaw =
      attrs.battery_level ??
      attrs.battery ??
      this.hass!.states[`sensor.${id.split('.')[1]}_battery_level`]?.state;
    const battery =
      typeof batteryRaw === 'number'
        ? batteryRaw
        : typeof batteryRaw === 'string' && !isNaN(Number(batteryRaw))
          ? Number(batteryRaw)
          : undefined;

    return {
      entity_id: id,
      domain,
      name: override ?? (attrs.friendly_name as string | undefined) ?? id,
      avatar,
      rawState,
      stateLabel: label,
      stateKind: kind,
      battery,
      lastChanged: this._relativeTime(stateObj.last_changed, lang),
    };
  }

  private _classifyState(
    raw: string,
    lang: 'ko' | 'en',
  ): { kind: Row['stateKind']; label: string } {
    if (raw === 'home') {
      return { kind: 'home', label: t('family.state.home', lang) };
    }
    if (raw === 'not_home' || raw === 'away') {
      return { kind: 'away', label: t('family.state.not_home', lang) };
    }
    if (raw === 'unknown' || raw === 'unavailable' || raw === '') {
      return { kind: 'unknown', label: t('family.state.unknown', lang) };
    }
    return { kind: 'zone', label: raw };
  }

  private _renderRow(
    r: Row,
    lang: 'ko' | 'en',
    cfg: FamilyLocationCardConfig,
  ): TemplateResult {
    const showBattery = cfg.show_battery !== false && r.battery !== undefined;
    const showLast = cfg.show_last_changed !== false;
    const initial = (r.name.trim()[0] ?? '?').toUpperCase();

    return html`
      <div class="row">
        ${r.avatar
          ? html`<img class="avatar" src="${r.avatar}" alt="" />`
          : html`<div class="avatar">${initial}</div>`}
        <div>
          <div class="name">${r.name}</div>
          ${showLast
            ? html`<div class="last-seen">
                ${t('family.last_seen', lang)} ${r.lastChanged}
              </div>`
            : nothing}
        </div>
        <div class="right">
          <span class="state-badge ${r.stateKind}">${r.stateLabel}</span>
          ${showBattery
            ? html`<span
                class="battery ${r.battery! <= 20 ? 'low' : ''}"
              >
                🔋 ${r.battery}%
              </span>`
            : nothing}
        </div>
      </div>
    `;
  }

  private _relativeTime(iso: string, lang: 'ko' | 'en'): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '–';
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (diffSec < 60) return lang === 'ko' ? '방금' : 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return lang === 'ko' ? `${diffMin}분 전` : `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return lang === 'ko' ? `${diffH}시간 전` : `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return lang === 'ko' ? `${diffD}일 전` : `${diffD}d ago`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'family-location-card': FamilyLocationCard;
  }
}

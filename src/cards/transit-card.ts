import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type {
  HomeAssistant,
  LovelaceCardConfig,
  HassEntity,
} from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';

type EntityEntry = string | { entity: string; name?: string };

interface TransitCardConfig extends LovelaceCardConfig {
  type: 'custom:transit-card';
  entities: EntityEntry[];
  title?: string;
}

interface Row {
  entity_id: string;
  name: string;
  state: string;
  unit: string;
  vehicleType: 'bus' | 'subway' | 'generic';
  route?: string;
  direction?: string;
  nextArrival?: string;
  available: boolean;
}

/**
 * Multi-stop transit arrival card.
 *
 * Consumes `sensor.transit_*` style entities from `kr_component_kit`. The
 * card is deliberately attribute-tolerant: any of `route` / `route_no` /
 * `bus_no`, `direction` / `next_stop`, and `next_arrival_min` / `second_arrival`
 * are picked up if present, and the card still renders cleanly if they aren't.
 */
@customElement('transit-card')
export class TransitCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: TransitCardConfig;

  public setConfig(config: TransitCardConfig): void {
    if (!config || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error('transit-card: `entities` (non-empty array) is required');
    }
    this._config = config;
  }

  public getCardSize(): number {
    return Math.max(2, this._config?.entities.length ?? 2);
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('../editors/transit-editor');
    return document.createElement('transit-card-editor');
  }

  public static getStubConfig(): TransitCardConfig {
    return { type: 'custom:transit-card', entities: [] };
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
      gap: 4px;
    }
    .row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 8px 8px;
      border-radius: 8px;
    }
    .row:hover {
      background: var(--secondary-background-color);
    }
    .icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--secondary-background-color);
      font-size: 1.1rem;
    }
    .icon.bus {
      background: #2e7d32;
      color: white;
    }
    .icon.subway {
      background: #1565c0;
      color: white;
    }
    .name {
      font-weight: 500;
      line-height: 1.2;
    }
    .meta {
      font-size: 0.8rem;
      opacity: 0.7;
      line-height: 1.2;
    }
    .eta {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .eta-value {
      font-size: 1.2rem;
      font-weight: 600;
    }
    .eta-unit {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-left: 2px;
    }
    .eta-next {
      font-size: 0.75rem;
      opacity: 0.7;
    }
    .unavailable {
      opacity: 0.5;
      font-style: italic;
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const lang = pickLang(this.hass.language);
    const rows = this._config.entities.map((entry) => this._buildRow(entry, lang));

    return html`
      <ha-card>
        ${this._config.title
          ? html`<div class="title">${this._config.title}</div>`
          : html`<div class="title">${t('transit.title', lang)}</div>`}
        <div class="rows">
          ${rows.map((row) => this._renderRow(row, lang))}
        </div>
      </ha-card>
    `;
  }

  private _buildRow(entry: EntityEntry, lang: 'ko' | 'en'): Row {
    const id = typeof entry === 'string' ? entry : entry.entity;
    const override = typeof entry === 'string' ? undefined : entry.name;
    const stateObj: HassEntity | undefined = this.hass!.states[id];

    if (!stateObj) {
      return {
        entity_id: id,
        name: override ?? id,
        state: '',
        unit: '',
        vehicleType: 'generic',
        available: false,
      };
    }

    const attrs = stateObj.attributes;
    const vehicleType = this._guessVehicleType(id, attrs);
    const route = this._pickAttr(attrs, ['route', 'route_no', 'bus_no', 'line']);
    const direction = this._pickAttr(attrs, [
      'direction',
      'next_stop',
      'destination',
    ]);
    const nextArrival = this._pickAttr(attrs, [
      'second_arrival',
      'second_arrival_min',
      'next_arrival_min',
      'next_arrival',
    ]);
    const unit =
      (attrs.unit_of_measurement as string | undefined) ?? t('transit.minutes', lang);

    return {
      entity_id: id,
      name: override ?? (attrs.friendly_name as string | undefined) ?? id,
      state: stateObj.state,
      unit,
      vehicleType,
      route: route ? String(route) : undefined,
      direction: direction ? String(direction) : undefined,
      nextArrival: nextArrival !== undefined ? String(nextArrival) : undefined,
      available:
        stateObj.state !== 'unavailable' && stateObj.state !== 'unknown',
    };
  }

  private _renderRow(row: Row, lang: 'ko' | 'en'): TemplateResult {
    const iconChar = row.vehicleType === 'subway' ? '🚇' : row.vehicleType === 'bus' ? '🚌' : '🚏';
    const metaParts: string[] = [];
    if (row.route) metaParts.push(row.route);
    if (row.direction) metaParts.push(row.direction);

    if (!row.available) {
      return html`
        <div class="row unavailable">
          <span class="icon ${row.vehicleType}">${iconChar}</span>
          <span>
            <div class="name">${row.name}</div>
            <div class="meta">${t('transit.no_arrival', lang)}</div>
          </span>
          <span class="eta"></span>
        </div>
      `;
    }

    return html`
      <div class="row">
        <span class="icon ${row.vehicleType}">${iconChar}</span>
        <span>
          <div class="name">${row.name}</div>
          ${metaParts.length
            ? html`<div class="meta">${metaParts.join(' · ')}</div>`
            : nothing}
        </span>
        <span class="eta">
          <span class="eta-value">${row.state}</span>
          <span class="eta-unit">${row.unit}</span>
          ${row.nextArrival !== undefined
            ? html`<div class="eta-next">
                ${t('transit.next', lang)} ${row.nextArrival} ${row.unit}
              </div>`
            : nothing}
        </span>
      </div>
    `;
  }

  private _guessVehicleType(
    entityId: string,
    attrs: Record<string, unknown>,
  ): Row['vehicleType'] {
    const explicit = attrs.vehicle_type ?? attrs.transit_type;
    if (typeof explicit === 'string') {
      const v = explicit.toLowerCase();
      if (v.includes('subway') || v.includes('metro') || v.includes('지하철')) return 'subway';
      if (v.includes('bus') || v.includes('버스')) return 'bus';
    }
    const id = entityId.toLowerCase();
    if (id.includes('subway') || id.includes('metro')) return 'subway';
    if (id.includes('bus')) return 'bus';
    return 'generic';
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
}

declare global {
  interface HTMLElementTagNameMap {
    'transit-card': TransitCard;
  }
}

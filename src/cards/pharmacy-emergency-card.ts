import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type {
  HomeAssistant,
  LovelaceCardConfig,
  HassEntity,
} from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';

interface PharmacyEmergencyCardConfig extends LovelaceCardConfig {
  type: 'custom:pharmacy-emergency-card';
  pharmacy_entity?: string;
  alert_entities?: string[];
  title?: string;
  max_pharmacies?: number;
  max_alerts?: number;
}

interface PharmacyItem {
  name: string;
  address?: string;
  distance?: number;
  phone?: string;
  hoursToday?: string;
  openNow?: boolean;
}

interface AlertItem {
  entity_id: string;
  label: string;
  ts?: string;
  message?: string;
}

/**
 * Combined pharmacy list + disaster/safety/weather alert panel.
 *
 * Pharmacy data is read from a single sensor's attributes (typically the
 * Pharmacy integration in `kr_component_kit`). The card looks for the
 * pharmacy list under a few common attribute names (`pharmacies`, `list`,
 * `items`, `nearby`) — whichever exists wins. Per-item keys are also
 * tolerated across naming variants.
 *
 * Alerts are passed in as a list of `event.*` (or `sensor.*`) entity_ids;
 * the card shows the latest state + a short summary for each.
 */
@customElement('pharmacy-emergency-card')
export class PharmacyEmergencyCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: PharmacyEmergencyCardConfig;

  public setConfig(config: PharmacyEmergencyCardConfig): void {
    if (!config) {
      throw new Error('pharmacy-emergency-card: config is required');
    }
    if (!config.pharmacy_entity && !config.alert_entities?.length) {
      throw new Error(
        'pharmacy-emergency-card: at least one of `pharmacy_entity` or `alert_entities` is required',
      );
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 4;
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
    .section {
      padding: 4px 16px 12px;
    }
    .section-header {
      font-size: 0.8rem;
      opacity: 0.7;
      margin: 8px 0 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .empty {
      padding: 8px 0;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 0.85rem;
    }
    .pharmacy-row,
    .alert-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .pharmacy-row:last-child,
    .alert-row:last-child {
      border-bottom: none;
    }
    .name {
      font-weight: 500;
    }
    .meta {
      font-size: 0.8rem;
      opacity: 0.7;
      line-height: 1.3;
    }
    .badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 10px;
      align-self: start;
    }
    .badge.open {
      background: #4caf50;
      color: white;
    }
    .badge.closed {
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .alert-time {
      font-size: 0.75rem;
      opacity: 0.6;
      align-self: start;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .alert-message {
      font-size: 0.85rem;
      margin-top: 2px;
      opacity: 0.9;
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const lang = pickLang(this.hass.language);
    const cfg = this._config;

    const pharmacies = cfg.pharmacy_entity
      ? this._extractPharmacies(cfg.pharmacy_entity).slice(
          0,
          cfg.max_pharmacies ?? 5,
        )
      : [];
    const alerts = (cfg.alert_entities ?? [])
      .map((id) => this._extractAlert(id))
      .filter((a): a is AlertItem => a !== null)
      .slice(0, cfg.max_alerts ?? 3);

    return html`
      <ha-card>
        <div class="title">${cfg.title ?? t('pharmacy.title', lang)}</div>
        ${cfg.pharmacy_entity
          ? html`
              <div class="section">
                <div class="section-header">
                  ${t('pharmacy.section.pharmacy', lang)}
                </div>
                ${pharmacies.length === 0
                  ? html`<div class="empty">${t('pharmacy.no_data', lang)}</div>`
                  : pharmacies.map((p) => this._renderPharmacy(p, lang))}
              </div>
            `
          : nothing}
        ${cfg.alert_entities?.length
          ? html`
              <div class="section">
                <div class="section-header">
                  ${t('pharmacy.section.alerts', lang)}
                </div>
                ${alerts.length === 0
                  ? html`<div class="empty">
                      ${t('pharmacy.no_alerts', lang)}
                    </div>`
                  : alerts.map((a) => this._renderAlert(a))}
              </div>
            `
          : nothing}
      </ha-card>
    `;
  }

  private _renderPharmacy(p: PharmacyItem, lang: 'ko' | 'en'): TemplateResult {
    const distance =
      p.distance !== undefined
        ? `${p.distance.toFixed(1)} ${t('pharmacy.distance_km', lang)}`
        : '';
    const metaParts = [distance, p.hoursToday, p.phone].filter(Boolean);
    const badgeClass = p.openNow === false ? 'closed' : 'open';
    const badgeText =
      p.openNow === false
        ? t('pharmacy.closed', lang)
        : t('pharmacy.open_now', lang);

    return html`
      <div class="pharmacy-row">
        <div>
          <div class="name">${p.name}</div>
          ${p.address ? html`<div class="meta">${p.address}</div>` : nothing}
          ${metaParts.length
            ? html`<div class="meta">${metaParts.join(' · ')}</div>`
            : nothing}
        </div>
        ${p.openNow !== undefined
          ? html`<span class="badge ${badgeClass}">${badgeText}</span>`
          : nothing}
      </div>
    `;
  }

  private _renderAlert(a: AlertItem): TemplateResult {
    return html`
      <div class="alert-row">
        <div>
          <div class="name">${a.label}</div>
          ${a.message
            ? html`<div class="alert-message">${a.message}</div>`
            : nothing}
        </div>
        ${a.ts ? html`<span class="alert-time">${a.ts}</span>` : nothing}
      </div>
    `;
  }

  private _extractPharmacies(entityId: string): PharmacyItem[] {
    const stateObj: HassEntity | undefined = this.hass!.states[entityId];
    if (!stateObj) return [];

    const list = this._pickAttr(stateObj.attributes, [
      'pharmacies',
      'list',
      'items',
      'nearby',
    ]);
    if (!Array.isArray(list)) return [];

    return list
      .map((raw): PharmacyItem | null => {
        if (typeof raw !== 'object' || raw === null) return null;
        const obj = raw as Record<string, unknown>;
        const name = this._pickFromObj(obj, ['name', 'dutyName', 'title']);
        if (typeof name !== 'string') return null;
        const distRaw = this._pickFromObj(obj, ['distance', 'distance_km', 'dist']);
        const distance =
          typeof distRaw === 'number'
            ? distRaw
            : typeof distRaw === 'string' && !isNaN(Number(distRaw))
              ? Number(distRaw)
              : undefined;
        return {
          name,
          address: this._asString(
            this._pickFromObj(obj, ['address', 'dutyAddr', 'addr']),
          ),
          distance,
          phone: this._asString(
            this._pickFromObj(obj, ['phone', 'dutyTel1', 'tel']),
          ),
          hoursToday: this._asString(
            this._pickFromObj(obj, ['hours_today', 'hours', 'today_hours']),
          ),
          openNow:
            typeof obj.open_now === 'boolean'
              ? obj.open_now
              : typeof obj.openNow === 'boolean'
                ? obj.openNow
                : undefined,
        };
      })
      .filter((p): p is PharmacyItem => p !== null);
  }

  private _extractAlert(entityId: string): AlertItem | null {
    const stateObj: HassEntity | undefined = this.hass!.states[entityId];
    if (!stateObj) return null;
    if (stateObj.state === 'unavailable' || stateObj.state === 'unknown') {
      return null;
    }
    const message = this._asString(
      this._pickAttr(stateObj.attributes, [
        'message',
        'msg',
        'title',
        'description',
        'summary',
      ]),
    );
    const ts = this._formatTimestamp(stateObj.state) ?? stateObj.last_changed;

    return {
      entity_id: entityId,
      label:
        (stateObj.attributes.friendly_name as string | undefined) ?? entityId,
      ts: this._formatTimestamp(ts) ?? undefined,
      message: message ?? undefined,
    };
  }

  private _formatTimestamp(input: string | undefined): string | null {
    if (!input) return null;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    const now = Date.now();
    const diffMin = Math.floor((now - d.getTime()) / 60000);
    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`;
    return d.toLocaleDateString();
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

  private _pickFromObj(
    obj: Record<string, unknown>,
    keys: readonly string[],
  ): unknown {
    return this._pickAttr(obj, keys);
  }

  private _asString(v: unknown): string | undefined {
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'number') return String(v);
    return undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pharmacy-emergency-card': PharmacyEmergencyCard;
  }
}

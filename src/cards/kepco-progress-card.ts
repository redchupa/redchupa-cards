import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type {
  HomeAssistant,
  LovelaceCardConfig,
  HassEntity,
} from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';

interface KepcoProgressCardConfig extends LovelaceCardConfig {
  type: 'custom:kepco-progress-card';
  entity: string;
  name?: string;
  show_estimate?: boolean;
}

/**
 * KEPCO progressive-tier visualizer.
 *
 * Reads a numeric state (kWh usage this billing cycle) from a single sensor —
 * typically produced by the `kr_component_kit` KEPCO integration — and renders
 * it on a fixed 3-tier residential scale (200 / 400 kWh boundaries).
 *
 * Tier boundaries are residential rates published by KEPCO; the card itself
 * does not call any KEPCO API.
 */
@customElement('kepco-progress-card')
export class KepcoProgressCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: KepcoProgressCardConfig;

  // Korean residential progressive tier boundaries (kWh, summer baseline).
  // The card hard-codes these because they are public regulation, not
  // user-specific data. Edit here if KEPCO revises the schedule.
  private static readonly TIER_BOUNDS = [200, 400] as const;
  private static readonly TIER_MAX_DISPLAY = 600;

  public setConfig(config: KepcoProgressCardConfig): void {
    if (!config || !config.entity) {
      throw new Error('kepco-progress-card: `entity` is required');
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 3;
  }

  static styles = css`
    :host {
      display: block;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 12px 16px 4px;
    }
    .name {
      font-size: 1rem;
      font-weight: 500;
    }
    .value {
      font-size: 1.4rem;
      font-weight: 600;
    }
    .unit {
      font-size: 0.85rem;
      opacity: 0.7;
      margin-left: 4px;
    }
    .bar {
      position: relative;
      height: 14px;
      margin: 8px 16px 16px;
      background: var(--secondary-background-color);
      border-radius: 7px;
      overflow: hidden;
    }
    .fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }
    .tick {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--primary-text-color);
      opacity: 0.4;
    }
    .tier-1 {
      background: #4caf50;
    }
    .tier-2 {
      background: #ff9800;
    }
    .tier-3 {
      background: #f44336;
    }
    .empty {
      padding: 16px;
      color: var(--secondary-text-color);
      text-align: center;
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;

    const stateObj: HassEntity | undefined =
      this.hass.states[this._config.entity];
    const lang = pickLang(this.hass.language);

    if (!stateObj) {
      return html`
        <ha-card>
          <div class="empty">${t('common.entity_unavailable', lang)}</div>
        </ha-card>
      `;
    }

    const usage = Number(stateObj.state);
    const unit = stateObj.attributes.unit_of_measurement ?? 'kWh';
    const name =
      this._config.name ??
      stateObj.attributes.friendly_name ??
      t('kepco.title', lang);

    const max = KepcoProgressCard.TIER_MAX_DISPLAY;
    const pct = Number.isFinite(usage)
      ? Math.min(100, (usage / max) * 100)
      : 0;
    const tier = this._tierOf(usage);

    return html`
      <ha-card>
        <div class="header">
          <span class="name">${name}</span>
          <span>
            <span class="value">${Number.isFinite(usage) ? usage : '–'}</span>
            <span class="unit">${unit}</span>
          </span>
        </div>
        <div class="bar">
          <div
            class="fill tier-${tier}"
            style="width: ${pct}%"
          ></div>
          ${KepcoProgressCard.TIER_BOUNDS.map(
            (bound) => html`
              <div
                class="tick"
                style="left: ${(bound / max) * 100}%"
                title="${bound} ${unit}"
              ></div>
            `,
          )}
        </div>
      </ha-card>
    `;
  }

  private _tierOf(usage: number): 1 | 2 | 3 {
    if (!Number.isFinite(usage)) return 1;
    const [b1, b2] = KepcoProgressCard.TIER_BOUNDS;
    if (usage < b1) return 1;
    if (usage < b2) return 2;
    return 3;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kepco-progress-card': KepcoProgressCard;
  }
}

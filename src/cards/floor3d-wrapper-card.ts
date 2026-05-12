import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { HomeAssistant, LovelaceCardConfig } from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';

interface Floor3dWrapperCardConfig extends LovelaceCardConfig {
  type: 'custom:floor3d-wrapper-card';
  url: string;
  title?: string;
  alt?: string;
  auto_rotate?: boolean;
  camera_orbit?: string;
  height?: number;
}

/**
 * Thin wrapper around Google's <model-viewer> that loads a .glb floorplan
 * (typically produced by floor3d-toolkit) inline as an HA Lovelace card.
 *
 * The model-viewer library is heavy (~200KB gzip). It lives in its own
 * lazily-loaded chunk — the card triggers the import on first render so
 * users who never instantiate this card pay zero cost. The `url` itself is
 * fetched directly by <model-viewer> from the user's HA instance (e.g.
 * `/local/floor3d/home.glb`); the card never relays the model data through
 * any external service.
 */
@customElement('floor3d-wrapper-card')
export class Floor3dWrapperCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Floor3dWrapperCardConfig;
  @state() private _viewerReady = false;
  @state() private _viewerError: string | null = null;
  private _viewerLoadStarted = false;

  public setConfig(config: Floor3dWrapperCardConfig): void {
    if (!config) {
      throw new Error('floor3d-wrapper-card: config is required');
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 6;
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('../editors/floor3d-wrapper-editor');
    return document.createElement('floor3d-wrapper-card-editor');
  }

  public static getStubConfig(): Floor3dWrapperCardConfig {
    return { type: 'custom:floor3d-wrapper-card', url: '' };
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      overflow: hidden;
    }
    .title {
      padding: 12px 16px 4px;
      font-size: 1rem;
      font-weight: 500;
    }
    .viewer-wrap {
      width: 100%;
      background: var(--secondary-background-color);
    }
    model-viewer {
      width: 100%;
      display: block;
      background-color: transparent;
    }
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }
    .placeholder.error {
      color: var(--error-color, #d32f2f);
    }
  `;

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('_config') && this._config?.url && !this._viewerLoadStarted) {
      this._viewerLoadStarted = true;
      void this._loadViewer();
    }
  }

  private async _loadViewer(): Promise<void> {
    try {
      // Side-effect import: registers <model-viewer> as a custom element.
      await import('@google/model-viewer');
      this._viewerReady = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[floor3d-wrapper-card] viewer load failed:', err);
      this._viewerError = err instanceof Error ? err.message : String(err);
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const lang = pickLang(this.hass.language);
    const cfg = this._config;
    const height = cfg.height ?? 320;

    const body = !cfg.url
      ? html`<div class="placeholder" style="height: ${height}px">
          ${t('floor3d.no_url', lang)}
        </div>`
      : this._viewerError
        ? html`<div class="placeholder error" style="height: ${height}px">
            ${t('floor3d.error', lang)}: ${this._viewerError}
          </div>`
        : !this._viewerReady
          ? html`<div class="placeholder" style="height: ${height}px">
              ${t('floor3d.loading', lang)}
            </div>`
          : html`<div class="viewer-wrap" style="height: ${height}px">
              ${this._renderViewer(cfg)}
            </div>`;

    return html`
      <ha-card>
        ${cfg.title
          ? html`<div class="title">${cfg.title}</div>`
          : html`<div class="title">${t('floor3d.title', lang)}</div>`}
        ${body}
      </ha-card>
    `;
  }

  /**
   * Build the <model-viewer> element imperatively so we can set attributes
   * without TypeScript complaining about the custom-element JSX shape.
   * Lit re-evaluates this on each render, but model-viewer handles attribute
   * changes internally — no rebuild churn.
   */
  private _renderViewer(cfg: Floor3dWrapperCardConfig): TemplateResult {
    return html`
      <model-viewer
        src="${cfg.url}"
        alt="${cfg.alt ?? ''}"
        camera-controls
        touch-action="pan-y"
        ?auto-rotate=${cfg.auto_rotate === true}
        camera-orbit="${cfg.camera_orbit ?? '0deg 75deg 4m'}"
        style="height: 100%;"
        loading="lazy"
      ></model-viewer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'floor3d-wrapper-card': Floor3dWrapperCard;
  }
}

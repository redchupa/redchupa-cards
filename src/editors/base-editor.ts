import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { HomeAssistant, LovelaceCardConfig } from '../utils/ha-types';
import { pickLang, t } from '../utils/i18n';

export interface FormSchemaItem {
  name: string;
  required?: boolean;
  selector?: Record<string, unknown>;
  default?: unknown;
}

/**
 * Base for all card config editors. Subclasses set `_schema` and (optionally)
 * override `_normalizeIncoming` / `_serializeOutgoing` when the YAML form of
 * the config doesn't match the flat shape that `ha-form` understands.
 *
 * The actual form rendering is delegated to HA's built-in `<ha-form>` web
 * component, which is always present in any modern HA frontend — so this
 * editor adds zero runtime weight beyond the schema definitions.
 */
export abstract class BaseCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() protected _config?: LovelaceCardConfig;

  protected abstract _schema: FormSchemaItem[];

  public setConfig(config: LovelaceCardConfig): void {
    this._config = this._normalizeIncoming(config);
  }

  /** Subclasses override when config has nested shapes (e.g. entity objects). */
  protected _normalizeIncoming(config: LovelaceCardConfig): LovelaceCardConfig {
    return config;
  }

  /** Subclasses override to reshape before dispatching upstream. */
  protected _serializeOutgoing(
    value: Record<string, unknown>,
  ): LovelaceCardConfig {
    return value as LovelaceCardConfig;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema}
        .computeLabel=${this._computeLabel.bind(this)}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _computeLabel(schema: FormSchemaItem): string {
    if (!this.hass) return schema.name;
    const lang = pickLang(this.hass.language);
    return t(`editor.${schema.name}`, lang);
  }

  private _valueChanged = (ev: CustomEvent): void => {
    const value = ev.detail.value as Record<string, unknown>;
    const newConfig = this._serializeOutgoing(value);
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

/**
 * Helper: convert mixed `(string | {entity, name?})[]` to plain `string[]`
 * so ha-form's entity-multi-selector can edit it without choking on objects.
 * Loses per-entity `name` overrides — users who need those should YAML-edit.
 */
export function flattenEntityList(
  list: unknown,
): string[] | undefined {
  if (!Array.isArray(list)) return undefined;
  return list
    .map((e) => {
      if (typeof e === 'string') return e;
      if (e && typeof e === 'object' && typeof (e as { entity?: unknown }).entity === 'string') {
        return (e as { entity: string }).entity;
      }
      return null;
    })
    .filter((s): s is string => s !== null);
}

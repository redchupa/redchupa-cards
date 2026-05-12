import { customElement } from 'lit/decorators.js';
import {
  BaseCardEditor,
  flattenEntityList,
  type FormSchemaItem,
} from './base-editor';
import type { LovelaceCardConfig } from '../utils/ha-types';

const SCHEMA: FormSchemaItem[] = [
  { name: 'title', selector: { text: {} } },
  {
    name: 'pharmacy_entity',
    selector: { entity: { domain: 'sensor' } },
  },
  {
    name: 'alert_entities',
    selector: { entity: { multiple: true } },
  },
  {
    name: 'max_pharmacies',
    selector: { number: { min: 1, max: 20, mode: 'slider' } },
  },
  {
    name: 'max_alerts',
    selector: { number: { min: 1, max: 10, mode: 'slider' } },
  },
];

@customElement('pharmacy-emergency-card-editor')
export class PharmacyEmergencyCardEditor extends BaseCardEditor {
  protected _schema = SCHEMA;

  protected _normalizeIncoming(
    config: LovelaceCardConfig,
  ): LovelaceCardConfig {
    return {
      ...config,
      alert_entities: flattenEntityList(config.alert_entities) ?? [],
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pharmacy-emergency-card-editor': PharmacyEmergencyCardEditor;
  }
}

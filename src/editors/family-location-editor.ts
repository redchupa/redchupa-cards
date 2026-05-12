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
    name: 'entities',
    required: true,
    selector: {
      entity: { multiple: true, domain: ['person', 'device_tracker'] },
    },
  },
  { name: 'show_battery', selector: { boolean: {} } },
  { name: 'show_last_changed', selector: { boolean: {} } },
];

@customElement('family-location-card-editor')
export class FamilyLocationCardEditor extends BaseCardEditor {
  protected _schema = SCHEMA;

  protected _normalizeIncoming(
    config: LovelaceCardConfig,
  ): LovelaceCardConfig {
    return {
      ...config,
      entities: flattenEntityList(config.entities) ?? [],
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'family-location-card-editor': FamilyLocationCardEditor;
  }
}

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
    selector: { entity: { multiple: true, domain: 'sensor' } },
  },
];

@customElement('transit-card-editor')
export class TransitCardEditor extends BaseCardEditor {
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
    'transit-card-editor': TransitCardEditor;
  }
}

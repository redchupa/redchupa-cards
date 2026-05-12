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
    selector: { entity: { multiple: true } },
  },
  { name: 'show_thumbnails', selector: { boolean: {} } },
  { name: 'show_confidence', selector: { boolean: {} } },
  {
    name: 'max_rows',
    selector: { number: { min: 1, max: 50, mode: 'slider' } },
  },
];

@customElement('ai-alert-timeline-card-editor')
export class AiAlertTimelineCardEditor extends BaseCardEditor {
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
    'ai-alert-timeline-card-editor': AiAlertTimelineCardEditor;
  }
}

import { customElement } from 'lit/decorators.js';
import { BaseCardEditor, type FormSchemaItem } from './base-editor';

const SCHEMA: FormSchemaItem[] = [
  { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
  { name: 'name', selector: { text: {} } },
  { name: 'show_estimate', selector: { boolean: {} } },
];

@customElement('kepco-progress-card-editor')
export class KepcoProgressCardEditor extends BaseCardEditor {
  protected _schema = SCHEMA;
}

declare global {
  interface HTMLElementTagNameMap {
    'kepco-progress-card-editor': KepcoProgressCardEditor;
  }
}

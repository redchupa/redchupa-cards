import { customElement } from 'lit/decorators.js';
import { BaseCardEditor, type FormSchemaItem } from './base-editor';

const SCHEMA: FormSchemaItem[] = [
  { name: 'title', selector: { text: {} } },
  { name: 'url', required: true, selector: { text: {} } },
  { name: 'alt', selector: { text: {} } },
  { name: 'auto_rotate', selector: { boolean: {} } },
  { name: 'camera_orbit', selector: { text: {} } },
  {
    name: 'height',
    selector: { number: { min: 120, max: 800, mode: 'slider' } },
  },
];

@customElement('floor3d-wrapper-card-editor')
export class Floor3dWrapperCardEditor extends BaseCardEditor {
  protected _schema = SCHEMA;
}

declare global {
  interface HTMLElementTagNameMap {
    'floor3d-wrapper-card-editor': Floor3dWrapperCardEditor;
  }
}

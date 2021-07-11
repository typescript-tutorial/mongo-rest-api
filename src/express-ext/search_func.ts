import {ViewService} from './LoadController';
import {Attribute, Attributes} from './metadata';
import {buildMetadata, Metadata} from './search';

export function getMetadataFunc<T, ID>(viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), dates?: string[], numbers?: string[], keys?: Attributes|Attribute[]|string[]): Metadata {
  const m: Metadata = { dates, numbers };
  if (m.dates && m.dates.length > 0 || m.numbers && m.numbers.length > 0) {
    return m;
  }
  if (keys) {
    if (!Array.isArray(keys)) {
      return buildMetadata(keys);
    }
  }
  if (typeof viewService !== 'function' && viewService.metadata) {
    const metadata = viewService.metadata();
    if (metadata) {
      return buildMetadata(metadata);
    }
  }
  return undefined;
}

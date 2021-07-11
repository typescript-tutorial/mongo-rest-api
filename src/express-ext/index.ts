import {GenericController} from './GenericController';
import {GenericSearchController} from './GenericSearchController';
import {HealthController} from './HealthController';
import {LoadController} from './LoadController';
import {LoadSearchController} from './LoadSearchController';
import {SearchController} from './SearchController';

export {HealthController as HealthHandler};
export {LoadController as LoadHandler};
export {GenericController as GenericHandler};
export {SearchController as SearchHandler};
export {LoadSearchController as LoadSearchHandler};
export {GenericSearchController as GenericSearchHandler};

export * from './health';
export * from './HealthController';
export * from './metadata';
export * from './view';
export * from './response';
export * from './LoadController';
export * from './search';
export * from './SearchController';
export * from './LoadSearchController';
export * from './resources';
export * from './edit';
export * from './GenericController';
export * from './GenericSearchController';

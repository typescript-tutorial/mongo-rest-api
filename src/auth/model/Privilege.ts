export interface Privilege {
  id: string; // rename to id
  name: string;
  resource?: string;
  path: string;
  icon?: string;
  sequence?: number; // rename to sequence
  children?: Privilege[]; // rename to children
}

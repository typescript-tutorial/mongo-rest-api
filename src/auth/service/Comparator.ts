export interface Comparator {
  compare(v1: string, v2: string): Promise<boolean>;
}

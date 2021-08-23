import {Comparator} from '../Comparator';

export class BCryptComparator implements Comparator {
  constructor(protected bcrypt: any) {}
  async compare(v1: string, v2: string): Promise<boolean> {
    const match = await this.bcrypt.compare(v1, v2);
    return match;
  }
}

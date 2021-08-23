export interface TokenGenerator {
  generateToken(payload: any, secret: string, expiresIn: number): Promise<string>;
}

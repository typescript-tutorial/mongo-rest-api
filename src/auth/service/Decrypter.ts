export interface Decrypter {
  decrypt(cipherText: string, secretKey: string): string;
}

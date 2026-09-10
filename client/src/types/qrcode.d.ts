declare module 'qrcode' {
  export function toDataURL(text: string, opts?: any): Promise<string>;
  export default { toDataURL };
}

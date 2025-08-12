// Global type declarations for deployment compatibility
declare global {
  interface Window {
    [key: string]: any;
  }
}

declare module 'js-cookie' {
  const Cookies: any;
  export default Cookies;
}

declare module '@/endpoint' {
  const Endpoint: any;
  export default Endpoint;
}

declare module '@/tokenmanager' {
  export function getToken(name: string): any;
  export function set_token(token: string): void;
  export function set_token_and_role(token: string, role: string): void;
  export function deletetoken(name: string): void;
  export function deletetoken_and_role(): void;
  export function getRole(): any;
  export const tokenState: any;
}

export {};
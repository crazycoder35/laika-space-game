declare module 'glslify' {
  export function compile(source: string): string;
  export function file(path: string): string;
  export function require(path: string): string;
} 
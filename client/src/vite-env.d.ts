/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL?: string;
    VITE_API_URL?: string;
  }
}

declare var process: {
  env: {
    [key: string]: string | undefined;
  };
};``
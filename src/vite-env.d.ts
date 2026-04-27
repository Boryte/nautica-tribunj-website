/// <reference types="vite/client" />

declare global {
  interface Window {
    __REACT_QUERY_DEHYDRATED_STATE__?: unknown;
    __PRERENDER_DEHYDRATED_STATE__?: unknown;
  }
}

export {};

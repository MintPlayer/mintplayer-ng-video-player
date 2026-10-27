// A reference directive rather than an entry in tsconfig "types": typeRoots
// there is restricted to the player type folders, which hides vite/client.
/// <reference types="vite/client" />

declare module '*.vue' {
  import { defineComponent } from 'vue';
  const component: ReturnType<typeof defineComponent>;
  export default component;
}

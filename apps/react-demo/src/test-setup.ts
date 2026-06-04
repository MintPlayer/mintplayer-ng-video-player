// react-router 7 references TextEncoder/TextDecoder at module load, which jsdom
// does not provide. Polyfill from node's util before any test module imports it.
import { TextEncoder, TextDecoder } from 'util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

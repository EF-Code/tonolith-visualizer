import { Buffer } from "buffer";

if (typeof globalThis.Buffer === "undefined") {
  Object.assign(globalThis, { Buffer });
}

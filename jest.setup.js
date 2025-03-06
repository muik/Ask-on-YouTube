import fetch from "node-fetch";
import { TextDecoder, TextEncoder } from "util";

// Polyfill `fetch` in Node.js
global.fetch = fetch;

// Polyfill TextDecoder, TextEncoder for Node.js
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

global.chrome = {
    i18n: {
        getMessage: (message) => message,
    },
    runtime: {
        getManifest: () => ({
            version: "1.0.3"
        })
    }
};

// Root re-export for Vercel compatibility
// The actual server code lives in server/src/
import { app, startServer } from './src/index.js';

export { app, startServer };

# Runtime Configuration Setup

This setup allows you to manage environment variables through Google Cloud Run console instead of rebuilding the Docker image for each configuration change.

## How it works

1. **docker-entrypoint.sh** - Generates `config.js` at container startup with environment variables from Cloud Run
2. **index.html** - Loads `config.js` before the main application
3. **src/config/runtime.ts** - Provides helper functions to access runtime config with fallback to build-time env
4. **Dockerfile** - Uses the entrypoint script to inject variables at runtime

## Setting up in Cloud Run

1. Deploy the updated Docker image
2. Go to Cloud Run console
3. Edit the service and go to "Variables & Secrets" tab
4. Add your environment variables:
   - VITE_BACKEND_URL
   - VITE_APP_TITLE
   - VITE_IS_SIGNUP
   - etc.

## Updating your code

Replace direct `import.meta.env` usage with the runtime config:

```typescript
// Before:
const apiUrl = import.meta.env.VITE_BACKEND_URL;

// After:
import { config } from '@/config/runtime';
const apiUrl = config.BACKEND_URL;
```

## Default values

The `docker-entrypoint.sh` script includes default values that will be used if no environment variable is set in Cloud Run.

## Important notes

- Build-time env vars still work as fallback
- Boolean values should be strings: "true" or "false"
- Changes to env vars in Cloud Run require container restart (automatic on deploy)
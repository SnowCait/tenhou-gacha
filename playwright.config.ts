import { defineConfig } from '@playwright/test';

// Overrides the browser binary in environments where Playwright cannot
// download its own (e.g. sandboxed CI).
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testMatch: '**/*.e2e.{ts,js}',
	use: chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}
});

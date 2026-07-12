import { defineConfig } from '@playwright/test';

// Overrides the browser binary in environments where Playwright cannot
// download its own (e.g. sandboxed CI).
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

// Mirrors the GitHub Pages deployment, where the app is served from a
// repository sub-path. The build and preview both run with this BASE_PATH.
const basePath = '/tenhou-gacha';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: { BASE_PATH: basePath }
	},
	testMatch: '**/*.base.e2e.{ts,js}',
	use: {
		baseURL: `http://localhost:4173${basePath}/`,
		...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {})
	}
});

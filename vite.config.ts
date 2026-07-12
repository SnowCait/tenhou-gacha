import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// Overrides the browser binary in environments where Playwright cannot
// download its own (e.g. sandboxed CI).
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

// GitHub Pages serves the app from a repository sub-path (e.g. /tenhou-gacha).
// The base path is empty for local development and set by CI at build time.
// Normalize to SvelteKit's `paths.base` rules: empty when unset, otherwise
// leading `/` and no trailing `/`.
const rawBasePath = process.env.BASE_PATH ?? '';
const basePath: '' | `/${string}` =
	rawBasePath === '' ? '' : `/${rawBasePath.replace(/^\/+|\/+$/g, '')}`;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				fallback: '404.html'
			}),
			paths: {
				base: basePath
			}
		}),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'baseLocale'],
			// Teach Paraglide about the GitHub Pages base path so locale detection,
			// de-localization (reroute) and localized link generation all account
			// for it. Mirrors Paraglide's default pattern with basePath inserted
			// before the locale segment; basePath is empty for local development.
			urlPatterns: [
				{
					pattern: `:protocol://:domain(.*)::port?${basePath}/:path(.*)?`,
					localized: [
						['en', `:protocol://:domain(.*)::port?${basePath}/en/:path(.*)?`],
						['jp', `:protocol://:domain(.*)::port?${basePath}/:path(.*)?`]
					]
				}
			]
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(
							chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}
						),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

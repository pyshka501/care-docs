// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';

// Deploy base. GitHub Pages project site → '/care-docs'.
// Custom domain / Vercel / Netlify → set to '' and adjust `site`.
const base = '/care-docs';

/**
 * Prefix `base` onto root-absolute links/images authored in Markdown/MDX bodies.
 * Starlight already base-prefixes its own nav / sidebar / asset links, but NOT
 * links you write by hand in page content — without this they 404 under a base path.
 * Note: component props (e.g. `<LinkCard href>`) are not Markdown nodes, so the two
 * MDX splash pages set base-aware hrefs explicitly via `import.meta.env.BASE_URL`.
 */
function rehypeBaseLinks() {
	const isInternal = (v) =>
		typeof v === 'string' &&
		v.startsWith('/') &&
		!v.startsWith('//') &&
		v !== base &&
		!v.startsWith(base + '/');
	const walk = (/** @type {any} */ node) => {
		if (node.type === 'element' && node.properties) {
			if (isInternal(node.properties.href)) node.properties.href = base + node.properties.href;
			if (isInternal(node.properties.src)) node.properties.src = base + node.properties.src;
		}
		node.children?.forEach(walk);
	};
	return (/** @type {any} */ tree) => walk(tree);
}

/**
 * Turn ```mermaid fenced blocks into `<pre class="mermaid">…</pre>` at the mdast
 * stage — before Expressive Code sees them — so a client script can render them
 * as diagrams. Build-safe: no headless browser at build time (rendering is
 * client-side via the CDN module in `head`).
 */
function remarkMermaid() {
	const esc = (/** @type {string} */ s) =>
		s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const walk = (/** @type {any} */ node) => {
		if (!node || !Array.isArray(node.children)) return;
		node.children = node.children.map((/** @type {any} */ child) => {
			if (child.type === 'code' && child.lang === 'mermaid') {
				return { type: 'html', value: `<pre class="mermaid">${esc(child.value)}</pre>` };
			}
			walk(child);
			return child;
		});
	};
	return (/** @type {any} */ tree) => walk(tree);
}

// https://astro.build/config
export default defineConfig({
	site: 'https://pyshka501.github.io',
	base,
	markdown: { remarkPlugins: [remarkMermaid], rehypePlugins: [rehypeBaseLinks] },
	integrations: [
		starlight({
			title: 'CARE & CARL',
			favicon: '/favicon.png',
			customCss: ['./src/styles/custom.css'],
			// Client-side Mermaid rendering (build-safe; renders `<pre class="mermaid">`).
			head: [
				{
					tag: 'script',
					attrs: { type: 'module' },
					content: `
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
const render = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'loose', fontFamily: 'Manrope, sans-serif' });
  const nodes = document.querySelectorAll('pre.mermaid:not([data-processed])');
  if (nodes.length) mermaid.run({ nodes }).catch(() => {});
};
render();
document.addEventListener('astro:page-load', render);
`,
				},
			],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/pyshka501/care-docs',
				},
			],
			// EN is the root locale; RU lives under /ru.
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				ru: { label: 'Русский', lang: 'ru' },
			},
			plugins: [
				// Two independent products → two separate sidebars.
				starlightSidebarTopics([
					{
						label: 'CARE',
						link: '/care/getting-started/quick-start/',
						icon: 'laptop',
						items: [
							{
								label: 'Getting Started',
								translations: { ru: 'Начало работы' },
								items: [{ autogenerate: { directory: 'care/getting-started' } }],
							},
							{
								label: 'Concepts',
								translations: { ru: 'Концепции' },
								items: [{ autogenerate: { directory: 'care/concepts' } }],
							},
							{
								label: 'TUI',
								translations: { ru: 'TUI' },
								items: [{ autogenerate: { directory: 'care/tui' } }],
							},
							{
								label: 'Configuration',
								translations: { ru: 'Конфигурация' },
								items: [{ autogenerate: { directory: 'care/configuration' } }],
							},
							{
								label: 'CLI',
								items: [{ autogenerate: { directory: 'care/cli' } }],
							},
							{
								label: 'Slash Commands',
								translations: { ru: 'Slash-команды' },
								items: [{ autogenerate: { directory: 'care/slash-commands' } }],
							},
							{
								label: 'Capabilities',
								translations: { ru: 'Возможности' },
								items: [{ autogenerate: { directory: 'care/capabilities' } }],
							},
							{
								label: 'Examples',
								translations: { ru: 'Примеры' },
								items: [{ autogenerate: { directory: 'care/examples' } }],
							},
							{
								label: 'Reference',
								translations: { ru: 'Справочник' },
								items: [{ autogenerate: { directory: 'care/reference' } }],
							},
						],
					},
					{
						label: 'CARL',
						link: '/carl/getting-started/quick-start/',
						icon: 'open-book',
						items: [
							{
								label: 'Getting Started',
								translations: { ru: 'Начало работы' },
								items: [{ autogenerate: { directory: 'carl/getting-started' } }],
							},
							{
								label: 'Concepts',
								translations: { ru: 'Концепции' },
								items: [{ autogenerate: { directory: 'carl/concepts' } }],
							},
							{
								label: 'Steps',
								translations: { ru: 'Шаги' },
								items: [{ autogenerate: { directory: 'carl/steps' } }],
							},
							{
								label: 'Building Chains',
								translations: { ru: 'Построение цепочек' },
								items: [{ autogenerate: { directory: 'carl/chains' } }],
							},
							{
								label: 'Context & Search',
								translations: { ru: 'Контекст и поиск' },
								items: [{ autogenerate: { directory: 'carl/search' } }],
							},
							{
								label: 'Memory',
								translations: { ru: 'Память' },
								items: [{ autogenerate: { directory: 'carl/memory' } }],
							},
							{
								label: 'Async & Streaming',
								translations: { ru: 'Async и стриминг' },
								items: [{ autogenerate: { directory: 'carl/async' } }],
							},
							{
								label: 'RE-PLAN',
								translations: { ru: 'RE-PLAN' },
								items: [{ autogenerate: { directory: 'carl/replan' } }],
							},
							{
								label: 'Evaluation',
								translations: { ru: 'Оценка' },
								items: [{ autogenerate: { directory: 'carl/evaluation' } }],
							},
							{
								label: 'Evolution',
								translations: { ru: 'Эволюция' },
								items: [{ autogenerate: { directory: 'carl/evolution' } }],
							},
							{
								label: 'Tracing & Cost',
								translations: { ru: 'Трейсинг и стоимость' },
								items: [{ autogenerate: { directory: 'carl/tracing' } }],
							},
							{
								label: 'LLM Clients',
								translations: { ru: 'LLM-клиенты' },
								items: [{ autogenerate: { directory: 'carl/llm' } }],
							},
							{
								label: 'Orchestration',
								translations: { ru: 'Оркестрация' },
								items: [{ autogenerate: { directory: 'carl/orchestration' } }],
							},
							{
								label: 'AgentSkills',
								translations: { ru: 'AgentSkills' },
								items: [{ autogenerate: { directory: 'carl/skills' } }],
							},
							{
								label: 'MCP',
								translations: { ru: 'MCP' },
								items: [{ autogenerate: { directory: 'carl/mcp' } }],
							},
							{
								label: 'Serialization',
								translations: { ru: 'Сериализация' },
								items: [{ autogenerate: { directory: 'carl/serialization' } }],
							},
							{
								label: 'Cookbook',
								translations: { ru: 'Cookbook' },
								items: [{ autogenerate: { directory: 'carl/cookbook' } }],
							},
							{
								label: 'Reference',
								translations: { ru: 'Справочник' },
								items: [{ autogenerate: { directory: 'carl/reference' } }],
							},
						],
					},
				]),
			],
		}),
	],
});

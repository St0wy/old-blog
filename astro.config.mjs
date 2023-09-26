import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import { SITE } from "./src/config";
import { readFileSync } from "fs";

const nushellGrammar = JSON.parse(
	readFileSync("./src/utils/nushell.tmLanguage.json")
);
const nushellLanguage = {
	id: "nushell",
	scopeName: "source.nushell",
	grammar: nushellGrammar,
	aliases: ["nu"],
};

// https://astro.build/config
export default defineConfig({
	site: SITE.website,
	integrations: [
		tailwind({
			config: {
				applyBaseStyles: false,
			},
		}),
		react(),
		sitemap(),
		mdx(),
	],
	markdown: {
		remarkPlugins: [
			remarkToc,
			[
				remarkCollapse,
				{
					test: "Table of contents",
				},
			],
		],
		shikiConfig: {
			theme: "one-dark-pro",
			wrap: true,
			langs: [nushellLanguage],
		},
		extendDefaultPlugins: true,
	},
	vite: {
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
	},
});

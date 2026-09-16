import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@app": "./source/capp",
			"@core": "./source/core",
			"@tests": "./testing/utils",
		},
	},
	test: {
		include: ["testing/**/*.test.ts"],
	},
});

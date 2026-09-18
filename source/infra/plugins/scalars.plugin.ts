import { openapi } from "@elysia/openapi";
import { env } from "@env";

export const ScalarsPlugin = openapi({
	path: "/docs",
	documentation: {
		info: {
			title: env.SERVICE_NAME,
			version: env.SERVICE_VERSION,
		},
	},
});

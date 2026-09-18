import { cors } from "@elysia/cors";
import { env } from "@env";

export const OriginsPlugin = cors({
	origin: env.CORS_ORIGIN,
	methods: env.CORS_METHODS,
	allowedHeaders: ["Content-Type", "Authorization"],
});

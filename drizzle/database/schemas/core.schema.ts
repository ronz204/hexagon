import * as pg from "drizzle-orm/pg-core";
export const core = pg.pgSchema("core").existing();

import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import * as schema from "./schema";

export const runtime = "edge";

// Helper to lazily get the D1 binding
function getD1Binding(): D1Database {
    // 1. Try Cloudflare Request Context (Edge)
    try {
        const { env } = getRequestContext();
        if (env.DB) return env.DB;
    } catch (e) {
        // Ignore, likely not in request context or build time
    }

    // 2. Try process.env (Dev/Node)
    if (process.env.DB) {
        return (process.env as any).DB;
    }

    // 3. Fallback for build time or missing bindings
    console.warn("D1 binding not found. Returning mock binding for build/static analysis.");
    return {
        prepare: () => ({
            bind: () => ({
                all: async () => [],
                first: async () => null,
                run: async () => ({ success: true, meta: {} }),
            }),
        }),
        dump: async () => new ArrayBuffer(0),
        batch: async () => [],
        exec: async () => { },
    } as unknown as D1Database;
}

// Proxy the D1Database binding
const dbBindingProxy = new Proxy({} as D1Database, {
    get(_target, prop) {
        // Trap all property accesses on the binding
        // Drizzle only calls methods like prepare, dump, batch, exec
        return (...args: any[]) => {
            const db = getD1Binding();
            const value = db[prop as keyof D1Database];

            if (typeof value === "function") {
                return (value as Function).apply(db, args);
            }
            return value;
        };
    },
});

export function getDb() {
    // Initialize Drizzle with the proxy binding
    // This returns a valid Drizzle instance (BaseSQLiteDatabase) immediately
    // but the actual DB binding is only accessed when a query is run
    return drizzle(dbBindingProxy, { schema });
}

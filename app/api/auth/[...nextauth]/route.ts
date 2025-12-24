import { handlers } from "@/auth";

// Use Node.js runtime for better database connection performance
// Edge Runtime has cold starts and slower database connections
// Node.js runtime provides better connection pooling for NextAuth database adapter
// export const runtime = "edge";

export const { GET, POST } = handlers;

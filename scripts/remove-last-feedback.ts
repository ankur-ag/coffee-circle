import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { feedback, bookings } from "../lib/schema";
import * as schema from "../lib/schema";
import { eq, desc } from "drizzle-orm";

async function removeLastFeedback() {
    console.log("Removing feedback from the most recent past event...");

    const db = drizzle(sql, { schema });

    // Get all feedback ordered by creation date (most recent first)
    const allFeedback = await db
        .select()
        .from(feedback)
        .orderBy(desc(feedback.createdAt))
        .limit(1);

    if (allFeedback.length === 0) {
        console.log("No feedback found to remove.");
        process.exit(0);
    }

    const feedbackToRemove = allFeedback[0];
    console.log(`Found feedback ID: ${feedbackToRemove.id} for booking: ${feedbackToRemove.bookingId}`);

    // Delete the feedback
    await db.delete(feedback).where(eq(feedback.id, feedbackToRemove.id));

    console.log(`✓ Removed feedback for booking ${feedbackToRemove.bookingId}`);
    console.log("You can now test the redirect functionality!");
    process.exit(0);
}

removeLastFeedback().catch((err) => {
    console.error("Failed to remove feedback:", err);
    process.exit(1);
});

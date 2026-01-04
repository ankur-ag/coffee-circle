import { getDb } from "@/lib/db";
import { feedback, bookings, users, meetups, coffeeShops } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "edge";

async function getAllFeedback() {
    const db = getDb();

    // Get all feedback with related data
    const allFeedback = await db
        .select({
            feedbackId: feedback.id,
            rating: feedback.rating,
            comment: feedback.comment,
            feedbackCreatedAt: feedback.createdAt,
            bookingId: bookings.id,
            userName: users.name,
            userEmail: users.email,
            meetupDate: meetups.date,
            meetupTime: meetups.time,
            locationName: coffeeShops.name,
            locationCity: coffeeShops.city,
        })
        .from(feedback)
        .leftJoin(bookings, eq(feedback.bookingId, bookings.id))
        .leftJoin(users, eq(feedback.userId, users.id))
        .leftJoin(meetups, eq(bookings.meetupId, meetups.id))
        .leftJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id))
        .orderBy(desc(feedback.createdAt));

    return allFeedback;
}

function renderStars(rating: number) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`text-lg ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                    ★
                </span>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>
        </div>
    );
}

export default async function AdminFeedbackPage() {
    const allFeedback = await getAllFeedback();

    // Calculate statistics
    const totalFeedback = allFeedback.length;
    const averageRating =
        totalFeedback > 0
            ? (allFeedback.reduce((sum: number, f: typeof allFeedback[0]) => sum + (f.rating || 0), 0) / totalFeedback).toFixed(1)
            : "0.0";
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: allFeedback.filter((f: typeof allFeedback[0]) => f.rating === rating).length,
    }));

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Feedback & Ratings</h1>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card text-card-foreground rounded-lg shadow p-4">
                    <div className="text-sm text-muted-foreground">Total Feedback</div>
                    <div className="text-2xl font-bold">{totalFeedback}</div>
                </div>
                <div className="bg-card text-card-foreground rounded-lg shadow p-4">
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                    <div className="text-2xl font-bold">{averageRating}</div>
                </div>
                <div className="bg-card text-card-foreground rounded-lg shadow p-4">
                    <div className="text-sm text-muted-foreground">5 Stars</div>
                    <div className="text-2xl font-bold">{ratingDistribution[0].count}</div>
                </div>
                <div className="bg-card text-card-foreground rounded-lg shadow p-4">
                    <div className="text-sm text-muted-foreground">With Comments</div>
                    <div className="text-2xl font-bold">
                        {allFeedback.filter((f: typeof allFeedback[0]) => f.comment).length}
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-card text-card-foreground rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Rating Distribution</h2>
                <div className="space-y-2">
                    {ratingDistribution.map(({ rating, count }) => (
                        <div key={rating} className="flex items-center gap-3">
                            <div className="w-12 text-sm font-medium">{rating} ★</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                <div
                                    className="bg-yellow-400 h-4 rounded-full"
                                    style={{
                                        width: `${totalFeedback > 0 ? (count / totalFeedback) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <div className="w-12 text-sm text-muted-foreground/90 text-right">{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback List */}
            <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    User
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Rating
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Comment
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden md:table-cell">
                                    Event
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden lg:table-cell">
                                    Location
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden sm:table-cell">
                                    Submitted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card text-card-foreground divide-y divide-border">
                            {allFeedback.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                        No feedback submitted yet.
                                    </td>
                                </tr>
                            ) : (
                                allFeedback.map((item: typeof allFeedback[0]) => (
                                    <tr key={item.feedbackId} className="hover:bg-muted">
                                        <td className="px-3 sm:px-6 py-4">
                                            <div className="text-sm font-medium text-foreground">
                                                {item.userName || "Unknown"}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">{item.userEmail}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4">
                                            {renderStars(item.rating || 0)}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4">
                                            <div className="text-sm text-foreground max-w-xs sm:max-w-md">
                                                {item.comment ? (
                                                    <p className="whitespace-pre-wrap line-clamp-3">{item.comment}</p>
                                                ) : (
                                                    <span className="text-muted-foreground/70 italic">No comment</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm hidden md:table-cell">
                                            <div>{item.meetupDate || "N/A"}</div>
                                            <div className="text-muted-foreground/80">{item.meetupTime || "N/A"}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm hidden lg:table-cell">
                                            {item.locationName ? (
                                                <>
                                                    <div>{item.locationName}</div>
                                                    {item.locationCity && (
                                                        <div className="text-muted-foreground/80">{item.locationCity}</div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground/70">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                                            {item.feedbackCreatedAt
                                                ? new Date(item.feedbackCreatedAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                                : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


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
            <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
        </div>
    );
}

export default async function AdminFeedbackPage() {
    const allFeedback = await getAllFeedback();

    // Calculate statistics
    const totalFeedback = allFeedback.length;
    const averageRating =
        totalFeedback > 0
            ? (allFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback).toFixed(1)
            : "0.0";
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: allFeedback.filter((f) => f.rating === rating).length,
    }));

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Feedback & Ratings</h1>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600">Total Feedback</div>
                    <div className="text-2xl font-bold">{totalFeedback}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600">Average Rating</div>
                    <div className="text-2xl font-bold">{averageRating}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600">5 Stars</div>
                    <div className="text-2xl font-bold">{ratingDistribution[0].count}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600">With Comments</div>
                    <div className="text-2xl font-bold">
                        {allFeedback.filter((f) => f.comment).length}
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
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
                            <div className="w-12 text-sm text-gray-600 text-right">{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Rating
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Comment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Event
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Submitted
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allFeedback.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No feedback submitted yet.
                                </td>
                            </tr>
                        ) : (
                            allFeedback.map((item) => (
                                <tr key={item.feedbackId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.userName || "Unknown"}
                                        </div>
                                        <div className="text-sm text-gray-500">{item.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderStars(item.rating || 0)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-md">
                                            {item.comment ? (
                                                <p className="whitespace-pre-wrap">{item.comment}</p>
                                            ) : (
                                                <span className="text-gray-400 italic">No comment</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div>{item.meetupDate || "N/A"}</div>
                                        <div className="text-gray-500">{item.meetupTime || "N/A"}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {item.locationName ? (
                                            <>
                                                {item.locationName}
                                                {item.locationCity && (
                                                    <span className="text-gray-500"> ({item.locationCity})</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
    );
}


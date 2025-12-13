"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { submitFeedback } from "@/app/actions";
import { useRouter } from "next/navigation";

interface FeedbackFormProps {
    bookingId: string;
    existingFeedback?: {
        rating: number;
        comment: string | null;
    } | null;
}

export function FeedbackForm({ bookingId, existingFeedback }: FeedbackFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(existingFeedback?.rating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState(existingFeedback?.comment || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("bookingId", bookingId);
            formData.append("rating", rating.toString());
            formData.append("comment", comment);

            await submitFeedback(formData);
            
            // Navigate to dashboard on success
            router.push("/dashboard");
        } catch (err: any) {
            // Handle NEXT_REDIRECT error - it's actually a success case in Next.js
            // The redirect() function throws a special error that Next.js uses internally
            if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message?.includes("NEXT_REDIRECT")) {
                // This is actually success - navigate to dashboard
                router.push("/dashboard");
            } else {
                setError(err instanceof Error ? err.message : "Failed to submit feedback");
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars */}
            <div>
                <label className="block text-sm font-medium mb-3">Rating</label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`h-8 w-8 ${
                                    star <= (hoveredRating || rating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                }`}
                            />
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                            {rating} {rating === 1 ? "star" : "stars"}
                        </span>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div>
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                    Comment (optional)
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={6}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Share your thoughts about the event..."
                />
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full"
            >
                {isSubmitting ? "Submitting..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
            </Button>
        </form>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { submitFeedback } from "@/app/actions";

interface FeedbackFormProps {
    bookingId: string;
    existingFeedback: {
        id: string;
        rating: number;
        comment: string | null;
    } | null;
}

export function FeedbackForm({ bookingId, existingFeedback }: FeedbackFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState<number>(existingFeedback?.rating || 0);
    const [comment, setComment] = useState<string>(existingFeedback?.comment || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (rating === 0) {
            setError("Please select a rating");
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append("bookingId", bookingId);
        formData.append("rating", rating.toString());
        formData.append("comment", comment);

        try {
            await submitFeedback(formData);
            
            // Navigate to dashboard on success
            router.push("/dashboard");
        } catch (err: any) {
            // Handle NEXT_REDIRECT error - it's actually a success case in Next.js
            if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message?.includes("NEXT_REDIRECT")) {
                // This is actually success - navigate to dashboard
                router.push("/dashboard");
            } else {
                setIsSubmitting(false);
                setError(err instanceof Error ? err.message : "Failed to submit feedback. Please try again.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Star Rating */}
            <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                        >
                            <Star
                                className={`h-8 w-8 ${
                                    star <= rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                }`}
                            />
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                            {rating} / 5
                        </span>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div>
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                    Comment (Optional)
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Share your thoughts about the event..."
                />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
                {isSubmitting ? "Submitting..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
            </Button>
        </form>
    );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updateUserProfile } from "@/app/actions";

interface ProfileFormProps {
    field: "country" | "languagePreference";
    defaultValue?: string;
    children: React.ReactNode;
}

export function ProfileForm({ field, defaultValue, children }: ProfileFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            try {
                const result = await updateUserProfile(formData);
                if (result?.success) {
                    setMessage({ 
                        type: "success", 
                        text: field === "country" 
                            ? "Country saved successfully!" 
                            : "Language preference saved successfully!" 
                    });
                    // Clear message after 3 seconds and refresh
                    setTimeout(() => {
                        setMessage(null);
                        router.refresh();
                    }, 3000);
                }
            } catch (error: any) {
                // Handle NEXT_REDIRECT error - it's actually a success case in Next.js
                if (error?.digest?.startsWith("NEXT_REDIRECT") || error?.message?.includes("NEXT_REDIRECT")) {
                    setMessage({ 
                        type: "success", 
                        text: field === "country" 
                            ? "Country saved successfully!" 
                            : "Language preference saved successfully!" 
                    });
                    setTimeout(() => {
                        setMessage(null);
                        router.refresh();
                    }, 3000);
                } else {
                    setMessage({
                        type: "error",
                        text: error.message || "Failed to save settings. Please try again.",
                    });
                }
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                        message.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                >
                    {message.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}
            {children}
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : field === "country" ? "Save Country" : "Save Preferences"}
            </Button>
        </form>
    );
}

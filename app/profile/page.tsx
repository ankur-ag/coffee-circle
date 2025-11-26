import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUserProfile } from "@/app/actions";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    // Fetch user data from database
    const db = getDb();
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    return (
        <main className="container mx-auto max-w-2xl px-4 py-12 md:px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences</p>
            </div>

            <div className="space-y-6">
                {/* Profile Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your basic account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                <AvatarFallback className="text-lg">{session.user.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-lg">{session.user.name}</p>
                                <p className="text-sm text-muted-foreground">{session.user.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Country/Ethnicity Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Country of Origin</CardTitle>
                        <CardDescription>Share where you're from to connect with others</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={updateUserProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="country" className="text-sm font-medium">Country</label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    defaultValue={user?.country || ""}
                                    placeholder="e.g., United States, Taiwan, Japan"
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Save Country
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Language Preference Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Language Preference</CardTitle>
                        <CardDescription>Choose your preferred language for meetups</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={updateUserProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Preferred Language</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            type="radio"
                                            name="languagePreference"
                                            value="en"
                                            defaultChecked={user?.languagePreference === "en" || !user?.languagePreference}
                                            className="h-4 w-4"
                                        />
                                        <div>
                                            <p className="font-medium">🇬🇧 English</p>
                                            <p className="text-xs text-muted-foreground">Sunday meetups</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            type="radio"
                                            name="languagePreference"
                                            value="zh"
                                            defaultChecked={user?.languagePreference === "zh"}
                                            className="h-4 w-4"
                                        />
                                        <div>
                                            <p className="font-medium">🇨🇳 中文</p>
                                            <p className="text-xs text-muted-foreground">Saturday meetups</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                Save Preferences
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

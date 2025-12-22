import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { ProfileForm } from "@/components/features/profile-form";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    // Fetch user data from database (Edge Runtime compatible)
    const db = getDb();
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
    const user = userResult.length > 0 ? userResult[0] : null;

    return (
        <main className="container mx-auto max-w-2xl px-5 py-12 md:px-6">
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
                        <ProfileForm field="country" defaultValue={user?.country || ""}>
                            <div className="space-y-2">
                                <label htmlFor="country" className="text-sm font-medium">Country</label>
                                <Select
                                    id="country"
                                    name="country"
                                    defaultValue={user?.country || ""}
                                >
                                    <option value="">Select a country...</option>
                                    <option value="Afghanistan">Afghanistan</option>
                                    <option value="Albania">Albania</option>
                                    <option value="Algeria">Algeria</option>
                                    <option value="Argentina">Argentina</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Austria">Austria</option>
                                    <option value="Bangladesh">Bangladesh</option>
                                    <option value="Belgium">Belgium</option>
                                    <option value="Brazil">Brazil</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Chile">Chile</option>
                                    <option value="China">China</option>
                                    <option value="Colombia">Colombia</option>
                                    <option value="Denmark">Denmark</option>
                                    <option value="Egypt">Egypt</option>
                                    <option value="Finland">Finland</option>
                                    <option value="France">France</option>
                                    <option value="Germany">Germany</option>
                                    <option value="Greece">Greece</option>
                                    <option value="Hong Kong">Hong Kong</option>
                                    <option value="India">India</option>
                                    <option value="Indonesia">Indonesia</option>
                                    <option value="Ireland">Ireland</option>
                                    <option value="Israel">Israel</option>
                                    <option value="Italy">Italy</option>
                                    <option value="Japan">Japan</option>
                                    <option value="Malaysia">Malaysia</option>
                                    <option value="Mexico">Mexico</option>
                                    <option value="Netherlands">Netherlands</option>
                                    <option value="New Zealand">New Zealand</option>
                                    <option value="Norway">Norway</option>
                                    <option value="Philippines">Philippines</option>
                                    <option value="Poland">Poland</option>
                                    <option value="Portugal">Portugal</option>
                                    <option value="Russia">Russia</option>
                                    <option value="Singapore">Singapore</option>
                                    <option value="South Korea">South Korea</option>
                                    <option value="Spain">Spain</option>
                                    <option value="Sweden">Sweden</option>
                                    <option value="Switzerland">Switzerland</option>
                                    <option value="Taiwan">Taiwan</option>
                                    <option value="Thailand">Thailand</option>
                                    <option value="Turkey">Turkey</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="United States">United States</option>
                                    <option value="Vietnam">Vietnam</option>
                                </Select>
                            </div>
                        </ProfileForm>
                    </CardContent>
                </Card>

                {/* Language Preference Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Language Preference</CardTitle>
                        <CardDescription>Choose your preferred language for meetups</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm field="languagePreference" defaultValue={user?.languagePreference || "en"}>
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
                        </ProfileForm>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

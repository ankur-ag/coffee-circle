import { getDb } from "@/lib/db";
import { meetups, coffeeShops } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateMeetup } from "@/app/admin/actions";

export const runtime = "edge";

async function getMeetup(id: string) {
    const db = getDb();
    const [meetup] = await db
        .select({
            id: meetups.id,
            date: meetups.date,
            time: meetups.time,
            locationId: meetups.locationId,
            status: meetups.status,
            language: meetups.language,
            capacity: meetups.capacity,
        })
        .from(meetups)
        .where(eq(meetups.id, id))
        .limit(1);

    if (!meetup) {
        notFound();
    }

    return meetup;
}

async function getLocations() {
    const db = getDb();
    return await db.select().from(coffeeShops);
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const meetup = await getMeetup(id);
    const locations = await getLocations();

    if (!meetup) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

            <form action={updateMeetup} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                <input type="hidden" name="id" value={meetup.id} />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        name="date"
                        defaultValue={meetup.date}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                        type="time"
                        name="time"
                        defaultValue={meetup.time}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                        name="locationId"
                        defaultValue={meetup.locationId || ""}
                        required
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="">Select a location</option>
                        {locations.map((loc: typeof locations[0]) => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.city})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                        name="language"
                        defaultValue={meetup.language}
                        required
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="en">English</option>
                        <option value="zh">Chinese</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        name="status"
                        defaultValue={meetup.status}
                        required
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="open">Open</option>
                        <option value="full">Full</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="past">Past</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                        type="number"
                        name="capacity"
                        min="1"
                        defaultValue={meetup.capacity ?? 6}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of attendees</p>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <a
                        href="/admin/events"
                        className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </a>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

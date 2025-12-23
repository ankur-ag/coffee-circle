import { getDb } from "@/lib/db";
import { coffeeShops } from "@/lib/schema";
import { createMeetup } from "@/app/admin/actions";

export const runtime = "edge";

async function getLocations() {
    const db = getDb();
    return await db.select().from(coffeeShops);
}

export default async function NewEventPage() {
    const locations = await getLocations();

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

            <form action={createMeetup} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        name="date"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                        type="time"
                        name="time"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                        name="locationId"
                        required
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="">Select a location</option>
                        {locations.map((loc) => (
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
                        defaultValue="en"
                        required
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="en">English</option>
                        <option value="zh">Chinese</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                        type="number"
                        name="capacity"
                        min="1"
                        defaultValue="6"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of attendees (default: 6)</p>
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
                        Create Event
                    </button>
                </div>
            </form>
        </div>
    );
}

import { getDb } from "@/lib/db";
import { coffeeShops } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateCoffeeShop } from "@/app/admin/actions";

export const runtime = "edge";

async function getLocation(id: string) {
    const db = getDb();
    const [location] = await db
        .select()
        .from(coffeeShops)
        .where(eq(coffeeShops.id, id))
        .limit(1);

    return location;
}

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const location = await getLocation(id);

    if (!location) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Location</h1>

            <form action={updateCoffeeShop} className="bg-white p-6 rounded-lg shadow space-y-4">
                <input type="hidden" name="id" value={location.id} />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        defaultValue={location.name}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                        type="text"
                        name="city"
                        defaultValue={location.city}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
                    <input
                        type="text"
                        name="location"
                        defaultValue={location.location}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        defaultValue={location.description}
                        required
                        rows={3}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                        type="url"
                        name="image"
                        defaultValue={location.image}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-50)</label>
                    <input
                        type="number"
                        name="rating"
                        defaultValue={location.rating}
                        required
                        min="0"
                        max="50"
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Features (JSON)</label>
                    <textarea
                        name="features"
                        defaultValue={location.features}
                        required
                        rows={3}
                        className="w-full border rounded px-3 py-2 font-mono text-sm"
                    />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <a
                        href="/admin/locations"
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

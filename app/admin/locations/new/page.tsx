import { createCoffeeShop } from "@/app/admin/actions";

export const runtime = "edge";

export default function NewLocationPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add New Location</h1>

            <form action={createCoffeeShop} className="bg-white p-6 rounded-lg shadow space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g. Starbucks Xinyi"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                        type="text"
                        name="city"
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g. Taipei"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
                    <input
                        type="text"
                        name="location"
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g. No. 123, Xinyi Rd, Sec 5"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        required
                        rows={3}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Brief description of the venue..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                        type="url"
                        name="image"
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-50)</label>
                    <input
                        type="number"
                        name="rating"
                        required
                        min="0"
                        max="50"
                        className="w-full border rounded px-3 py-2"
                        placeholder="45 for 4.5 stars"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 45 for 4.5 stars</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Features (JSON)</label>
                    <textarea
                        name="features"
                        required
                        rows={3}
                        defaultValue='["WiFi", "Power Outlets", "Quiet"]'
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
                        Add Location
                    </button>
                </div>
            </form>
        </div>
    );
}

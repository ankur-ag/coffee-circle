export const runtime = "edge";

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">12</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">48</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Locations</h3>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">6</p>
                </div>
            </div>
        </div>
    );
}

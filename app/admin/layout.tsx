import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    if (session.user.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white p-6">
                <h2 className="text-2xl font-bold mb-8">Admin Portal</h2>
                <nav className="space-y-2">
                    <Link
                        href="/admin"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/events"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition"
                    >
                        Events
                    </Link>
                    <Link
                        href="/admin/locations"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition"
                    >
                        Locations
                    </Link>
                    <Link
                        href="/admin/bookings"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition"
                    >
                        Reservations
                    </Link>
                    <Link
                        href="/admin/users"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition"
                    >
                        Users
                    </Link>
                    <Link
                        href="/admin/feedback"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition"
                    >
                        Feedback & Ratings
                    </Link>
                    <Link
                        href="/"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition mt-8 text-gray-400"
                    >
                        ← Back to Site
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-gray-50">
                {children}
            </main>
        </div>
    );
}

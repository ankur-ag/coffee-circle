import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
            {/* Collapsible Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 w-full min-w-0 p-4 md:p-8 bg-background">
                <div className="md:hidden h-16" />
                {children}
            </main>
        </div>
    );
}

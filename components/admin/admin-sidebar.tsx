"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/locations", label: "Locations" },
    { href: "/admin/bookings", label: "Reservations" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/feedback", label: "Feedback & Ratings" },
];

export function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Menu Button - Fixed below header */}
            <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b shadow-sm">
                <div className="px-5 py-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <Menu className="h-4 w-4" />
                            <span>Admin Menu</span>
                        </span>
                        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Sidebar - Hidden on mobile by default, always visible on desktop */}
            <aside
                className={`
                    fixed md:static top-0 md:top-auto left-0 bottom-0 md:bottom-auto
                    z-50 md:z-auto
                    w-64 bg-gray-900 text-white
                    transform transition-transform duration-300 ease-in-out
                    md:transform-none md:translate-x-0
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    overflow-y-auto
                `}
                style={{ top: "8rem" }} // Below header + mobile menu button
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8 md:block">
                        <h2 className="text-2xl font-bold">Admin Portal</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="md:hidden text-white hover:bg-gray-800"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <nav className="space-y-2">
                        {adminLinks.map((link) => {
                            const isActive = pathname === link.href || 
                                (link.href !== "/admin" && pathname?.startsWith(link.href));
                            
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-2 rounded transition ${
                                        isActive
                                            ? "bg-gray-800 text-white"
                                            : "hover:bg-gray-800 text-gray-300"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-2 rounded hover:bg-gray-800 transition mt-8 text-gray-400"
                        >
                            ← Back to Site
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                    style={{ top: "8rem" }}
                />
            )}
        </>
    );
}

"use client";

import { updateUserRole } from "@/app/admin/actions";
import { useState } from "react";

export function UpdateRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
    const [role, setRole] = useState(currentRole);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("role", role);
        await updateUserRole(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-border rounded px-2 py-1 text-sm"
            >
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
            <button
                type="submit"
                className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90"
            >
                Update
            </button>
        </form>
    );
}

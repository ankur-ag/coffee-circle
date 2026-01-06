import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { UpdateRoleForm } from "./update-role-form";

export const runtime = "edge";

async function getUsers() {
    const db = getDb();
    const allUsers = await db.select().from(users);
    return allUsers;
}

export default async function AdminUsersPage() {
    const allUsers = await getUsers();

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Users Management</h1>

            <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Name
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Email
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Role
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden sm:table-cell">
                                    Language
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {allUsers.map((user: typeof allUsers[0]) => (
                                <tr key={user.id} className="hover:bg-muted/50">
                                    <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                                        <div className="text-sm font-medium text-foreground">{user.name || "Unnamed User"}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${user.role === "admin"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-secondary text-secondary-foreground text-foreground"
                                                }`}
                                        >
                                            {user.role || "user"}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                                        {user.languagePreference}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm">
                                        <UpdateRoleForm userId={user.id} currentRole={user.role || "user"} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

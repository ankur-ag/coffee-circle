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

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Email
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Role
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                                Language
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                                    {user.name}
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm">
                                    <div className="truncate max-w-[150px] sm:max-w-none">{user.email}</div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${user.role === "admin"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {user.role || "user"}
                                    </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm hidden sm:table-cell">
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

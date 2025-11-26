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
            <h1 className="text-3xl font-bold mb-6">Users Management</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Language
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {user.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${user.role === "admin"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {user.role || "user"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.languagePreference}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <UpdateRoleForm userId={user.id} currentRole={user.role || "user"} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

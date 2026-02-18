import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserManagementList } from '@/components/user-management-list';

export const metadata = {
  title: 'User Management | MGOS-AIOS',
  description: 'Manage system users, roles, and permissions',
};

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only admin can access user management
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage system users, assign roles, and control access permissions
        </p>
      </div>

      <div className="flex justify-end">
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold">
          + Add User
        </button>
      </div>

      <UserManagementList />
    </div>
  );
}

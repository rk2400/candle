'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getAdminUsers, updateAdminUserLock } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (error: any) {
      if (error.message.includes('Unauthorized') || error.message.includes('Admin')) {
        router.push('/admin/login');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">All Users</h1>
        
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No users found.</p>
          </div>
        ) : (
          <div className="card p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Registration Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{user.name || 'N/A'}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.phone || 'N/A'}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${user.locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.locked ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        className={`btn ${user.locked ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={async () => {
                          try {
                            await updateAdminUserLock(user._id, !user.locked);
                            toast.success(user.locked ? 'User unlocked' : 'User locked');
                            loadUsers();
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to update user');
                          }
                        }}
                      >
                        {user.locked ? 'Unlock' : 'Lock'}
                      </button>
                      <Link
                        href={`/admin/users/${user._id}/orders`}
                        className="btn btn-secondary ml-2"
                      >
                        View Orders
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

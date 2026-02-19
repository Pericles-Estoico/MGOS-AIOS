'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'executor' | 'head' | 'admin' | 'qa';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function UserManagementList() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
      });

      if (filterRole) params.append('filter_role', filterRole);
      if (filterStatus) params.append('filter_status', filterStatus);
      if (search) params.append('search', search);

      const response = await fetch(`/api/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterRole, filterStatus, sortBy, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleRoleFilter = (role: string) => {
    setFilterRole(role);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    setPage(1);
  };

  const startEdit = (user: User) => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      setEditLoading(true);

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          status: editStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const updated = await response.json();
      setSelectedUser(updated);
      setEditMode(false);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      toast.success('User updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setEditLoading(true);

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'head':
        return 'bg-teal-100 text-teal-800';
      case 'qa':
        return 'bg-cyan-100 text-cyan-800';
      case 'executor':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <div className="text-red-600">
          <p className="font-semibold">Error loading users</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="p-12 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 border rounded-lg bg-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Search</label>
            <input
              type="text"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Role</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filterRole}
              onChange={(e) => handleRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="head">Head</option>
              <option value="qa">QA</option>
              <option value="executor">Executor</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filterStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Sort By</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages} (
            {pagination.total} total users)
          </p>
          <div className="space-x-2">
            <button
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white max-w-md w-full mx-4 p-6 space-y-4 rounded-lg border">
            {!editMode ? (
              <>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Role:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Created:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Updated:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(selectedUser.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={editLoading}
                  >
                    Delete
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700"
                    onClick={() => startEdit(selectedUser)}
                  >
                    Edit
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">Edit User</h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="executor">Executor</option>
                      <option value="head">Head</option>
                      <option value="qa">QA</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                    onClick={() => setEditMode(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

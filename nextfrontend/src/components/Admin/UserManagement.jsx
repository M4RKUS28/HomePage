// frontend/src/components/Admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../UI/Spinner';
import Modal from '../UI/Modal';
import { 
  Shield, ShieldOff, Lock, Trash2, UserX, UserCheck, RefreshCw 
} from 'lucide-react';
import { getUsersApi, updateUserApi, deleteUserApi } from '../../api/users';
import { useAuth } from '../../hooks/useAuth';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsersApi();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSetAdmin = async (userId, makeAdmin) => {
    // Don't allow demoting yourself if you're the only admin
    if (!makeAdmin && userId === currentUser.id) {
      const adminCount = users.filter(user => user.is_admin).length;
      if (adminCount <= 1) {
        showToast({ 
          type: 'error', 
          message: 'Cannot remove the last admin. Promote another user first.'
        });
        return;
      }
    }

    setActionLoading(true);
    try {
      const updatedUser = await updateUserApi(userId, { is_admin: makeAdmin });
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      showToast({ 
        type: 'success', 
        message: `User ${makeAdmin ? 'promoted to admin' : 'demoted from admin'} successfully`
      });
    } catch (err) {
      console.error("Error updating admin status:", err);
      showToast({ 
        type: 'error', 
        message: err.response?.data?.detail || 'Failed to update user status'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (userId, makeActive) => {
    // Don't allow deactivating yourself
    if (!makeActive && userId === currentUser.id) {
      showToast({ 
        type: 'error', 
        message: 'Cannot deactivate your own account'
      });
      return;
    }

    setActionLoading(true);
    try {
      const updatedUser = await updateUserApi(userId, { is_active: makeActive });
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      showToast({ 
        type: 'success', 
        message: `User ${makeActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (err) {
      console.error("Error updating active status:", err);
      showToast({ 
        type: 'error', 
        message: err.response?.data?.detail || 'Failed to update user status'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    // Don't allow deleting yourself
    if (userId === currentUser.id) {
      showToast({ 
        type: 'error', 
        message: 'Cannot delete your own account'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteUserApi(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      showToast({ 
        type: 'success', 
        message: 'User deleted successfully'
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast({ 
        type: 'error', 
        message: err.response?.data?.detail || 'Failed to delete user'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 3) { // Match backend validation (MIN_PASSWORD_LENGTH)
      setPasswordError('Password must be at least 3 characters long');
      return;
    }

    setActionLoading(true);
    try {
      const updatedUser = await updateUserApi(selectedUser.id, { password: newPassword });
      setUsers(prev => prev.map(user => user.id === selectedUser.id ? updatedUser : user));
      showToast({ 
        type: 'success', 
        message: `Password updated successfully for ${selectedUser.username}`
      });
      setShowPasswordModal(false);
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-4 rounded-lg text-center">
        <p>{error}</p>
        <button 
          onClick={fetchUsers} 
          className="mt-2 px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-md transition-colors flex items-center mx-auto"
        >
          <RefreshCw size={16} className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-mode-primary">User Management</h2>
        <button 
          onClick={fetchUsers} 
          className="btn btn-sm btn-secondary flex items-center"
          disabled={loading}
        >
          {loading ? <Spinner size="h-4 w-4" /> : <RefreshCw size={16} className="mr-1" />}
          Refresh
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <AnimatePresence>
                {users.map(user => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`${user.id === currentUser.id ? 'bg-gray-700/30' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-white">
                          {user.username}
                          {user.id === currentUser.id && (
                            <span className="ml-2 text-xs text-primary">(you)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.is_admin ? (
                        <span className="text-yellow-500 flex items-center">
                          <Shield size={16} className="mr-1" /> Admin
                        </span>
                      ) : (
                        <span>User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openPasswordModal(user)}
                          disabled={actionLoading}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          title="Change Password"
                        >
                          <Lock size={18} />
                        </button>
                        
                        {user.is_active ? (
                          <button
                            onClick={() => handleToggleActive(user.id, false)}
                            disabled={actionLoading}
                            className="text-yellow-500 hover:text-yellow-400 transition-colors"
                            title="Deactivate User"
                          >
                            <UserX size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(user.id, true)}
                            disabled={actionLoading}
                            className="text-green-500 hover:text-green-400 transition-colors"
                            title="Activate User"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        
                        {user.is_admin ? (
                          <button
                            onClick={() => handleSetAdmin(user.id, false)}
                            disabled={actionLoading}
                            className="text-yellow-500 hover:text-yellow-400 transition-colors"
                            title="Remove Admin"
                          >
                            <ShieldOff size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetAdmin(user.id, true)}
                            disabled={actionLoading}
                            className="text-green-500 hover:text-green-400 transition-colors"
                            title="Make Admin"
                          >
                            <Shield size={18} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={actionLoading || user.id === currentUser.id}
                          className={`text-red-500 hover:text-red-400 transition-colors ${
                            user.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={user.id === currentUser.id ? "Cannot delete your own account" : "Delete User"}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <Modal 
          title={`Change Password for ${selectedUser.username}`} 
          onClose={() => setShowPasswordModal(false)}
        >
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md">
                {passwordError}
              </div>
            )}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field mt-1"
                required
                minLength={3}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="input-field mt-1"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="btn text-gray-300 bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? <Spinner size="h-5 w-5" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
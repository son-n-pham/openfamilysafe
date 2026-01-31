import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  getPendingParentRequests, 
  approveParentRequest, 
  rejectParentRequest, 
  getAllUsers, 
  suspendUser,
  updateUserProfile
} from '../services/userService';
import { useAuth } from '../services/authContext';
import { UserProfile, UserRole, ApprovalStatus } from '../types';
import { Card, Button, Badge, Input } from '../components/UI';

// Simple Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}> = ({ isOpen, title, onClose, onSubmit, isLoading, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onSubmit} isLoading={isLoading}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { userProfile, isSuperAdmin, loading: authLoading } = useAuth();
  
  // State
  const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [modalType, setModalType] = useState<'reject' | 'suspend' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [pending, users] = await Promise.all([
        getPendingParentRequests(),
        getAllUsers()
      ]);
      setPendingRequests(pending);
      // Sort users by creation date desc
      setAllUsers(users.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error fetching admin data:", error);
      showNotification('error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Actions
  const handleApprove = async (parentUid: string) => {
    if (!userProfile?.uid) return;
    try {
      setActionLoading(parentUid);
      await approveParentRequest(userProfile.uid, parentUid);
      showNotification('success', 'Parent approved successfully');
      await fetchData(); // Refresh list
    } catch (error) {
      console.error("Error approving parent:", error);
      showNotification('error', 'Failed to approve parent');
    } finally {
      setActionLoading(null);
    }
  };

  const openActionModal = (type: 'reject' | 'suspend', user: UserProfile) => {
    setModalType(type);
    setSelectedUser(user);
    setReason('');
  };

  const handleModalSubmit = async () => {
    if (!selectedUser || !userProfile?.uid || !modalType) return;
    if (!reason.trim()) {
      showNotification('error', 'Please provide a reason');
      return;
    }

    try {
      setModalLoading(true);
      if (modalType === 'reject') {
        await rejectParentRequest(userProfile.uid, selectedUser.uid, reason);
        showNotification('success', 'Request rejected');
      } else {
        await suspendUser(userProfile.uid, selectedUser.uid, reason);
        showNotification('success', 'User suspended');
      }
      setModalType(null);
      await fetchData();
    } catch (error) {
      console.error(`Error ${modalType}ing user:`, error);
      showNotification('error', `Failed to ${modalType} user`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnsuspend = async (uid: string) => {
    try {
      setActionLoading(uid);
      // Restore to APPROVED status. 
      // NOTE: If they were never approved (e.g. suspended while pending), this might be incorrect, 
      // but simpler for now. Ideally we'd revert to previous status.
      await updateUserProfile(uid, { approvalStatus: ApprovalStatus.APPROVED });
      showNotification('success', 'User unsuspended');
      await fetchData();
    } catch (error) {
      console.error("Error unsuspending user:", error);
      showNotification('error', 'Failed to unsuspend user');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) return <div className="p-8 flex justify-center">Loading...</div>;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Console
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage approvals and user accounts.
          </p>
        </div>
        {notification && (
          <div className={`mt-4 md:mt-0 p-3 rounded-md md:w-1/3 ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`${
              activeTab === 'pending'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-brand-100 text-brand-600 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`${
              activeTab === 'all'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Users
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : activeTab === 'pending' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-10">No pending requests.</p>
          ) : (
            pendingRequests.map((req) => (
              <Card key={req.uid} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 truncate" title={req.email}>
                      {req.displayName || 'Unnamed User'}
                    </h3>
                    <Badge color="yellow">Pending</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 mb-4">{req.email}</p>
                  <dl className="text-xs text-gray-500 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <dt>Registered:</dt>
                      <dd>{new Date(req.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex space-x-3 mt-4">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleApprove(req.uid)}
                    isLoading={actionLoading === req.uid}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => openActionModal('reject', req)}
                    disabled={actionLoading === req.uid}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Input 
            placeholder="Search by email or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-0">
                            <div className="text-sm font-medium text-gray-900">{user.displayName || 'No Name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.approvalStatus === ApprovalStatus.APPROVED ? 'bg-green-100 text-green-800' :
                          user.approvalStatus === ApprovalStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                          user.approvalStatus === ApprovalStatus.REJECTED ? 'bg-red-100 text-red-800' :
                          user.approvalStatus === ApprovalStatus.SUSPENDED ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.familyId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {user.approvalStatus === ApprovalStatus.SUSPENDED ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUnsuspend(user.uid)}
                            isLoading={actionLoading === user.uid}
                            className="text-green-600 hover:text-green-900"
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openActionModal('suspend', user)}
                            disabled={user.role === UserRole.SUPER_ADMIN} // Can't suspend other super admins easily here
                            className="text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={!!modalType}
        title={modalType === 'reject' ? 'Reject Request' : 'Suspend User'}
        onClose={() => setModalType(null)}
        onSubmit={handleModalSubmit}
        isLoading={modalLoading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {modalType === 'reject' 
              ? `Are you sure you want to reject the request for ${selectedUser?.email}?`
              : `Are you sure you want to suspend ${selectedUser?.email}? This will prevent them from logging in.`
            }
          </p>
          <Input
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={modalType === 'reject' ? "Reason for rejection..." : "Reason for suspension..."}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Admin;

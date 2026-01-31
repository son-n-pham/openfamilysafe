import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/authContext';
import {
  getPendingChildRequestsForParent,
  approveChildRequest,
  rejectChildRequest,
  suspendUser,
  updateUserProfile
} from '../services/userService';
import {
  getFamilyByParent,
  getApprovedChildrenForParent,
  generateFamilyInviteCode,
  updateFamilySettings,
  getFamilyChildren
} from '../services/familyService';
import { UserProfile, Family, FilterLevel, ApprovalStatus, UserRole } from '../types';
import { Button, Card, Input, Badge } from '../components/UI';

const FamilyManagement: React.FC = () => {
  const { user, userProfile, isParent, isApproved } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [pendingChildren, setPendingChildren] = useState<UserProfile[]>([]);
  const [familyChildren, setFamilyChildren] = useState<UserProfile[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  // Modal state for rejection
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [childToReject, setChildToReject] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Filter level update state
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    if (user && isParent && isApproved) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, isParent, isApproved]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get Pending Requests
      const pending = await getPendingChildRequestsForParent(user.uid);
      setPendingChildren(pending);

      // 2. Get Family and Children
      const fam = await getFamilyByParent(user.uid);
      setFamily(fam);
      
      if (fam) {
        // Use getFamilyChildren instead of getApprovedChildrenForParent to see suspended children too
        const children = await getFamilyChildren(fam.id);
        setFamilyChildren(children);
      } else {
        // Fallback if family not found/created yet (shouldn't happen for approved parent)
        const children = await getApprovedChildrenForParent(user.uid);
        setFamilyChildren(children);
      }

    } catch (err: any) {
      console.error("Error loading family data:", err);
      setError("Failed to load family data.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (childUid: string) => {
    if (!user) return;
    try {
      await approveChildRequest(user.uid, childUid);
      setSuccess("Child approved successfully");
      loadData();
    } catch (err) {
      console.error("Error approving child:", err);
      setError("Failed to approve child request.");
    }
  };

  const openRejectModal = (childUid: string) => {
    setChildToReject(childUid);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!user || !childToReject) return;
    
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    setIsRejecting(true);
    try {
      await rejectChildRequest(user.uid, childToReject, rejectReason);
      setSuccess("Child request rejected");
      setRejectModalOpen(false);
      setChildToReject(null);
      loadData();
    } catch (err) {
      console.error("Error rejecting child:", err);
      setError("Failed to reject child request.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSuspend = async (childUid: string) => {
    if (!user) return;
    // Confirm suspension
    if (!window.confirm("Are you sure you want to suspend this child's account?")) {
      return;
    }

    try {
      await suspendUser(user.uid, childUid, "Suspended by parent");
      setSuccess("Child account suspended");
      loadData();
    } catch (err) {
      console.error("Error suspending child:", err);
      setError("Failed to suspend child.");
    }
  };

  const handleUnsuspend = async (childUid: string) => {
    if (!user) return;
    try {
      // We essentially re-approve/reactivate the user
      // Using updateUserProfile to set status back to APPROVED
      await updateUserProfile(childUid, {
        approvalStatus: ApprovalStatus.APPROVED,
        rejectedReason: '', // Clear rejection/suspension reason
      });
      setSuccess("Child account reactivated");
      loadData();
    } catch (err) {
      console.error("Error unsuspending child:", err);
      setError("Failed to reactivate child.");
    }
  };

  const handleGenerateInvite = async () => {
    if (!family) return;
    setIsGeneratingCode(true);
    try {
      const code = await generateFamilyInviteCode(family.id);
      setInviteCode(code);
    } catch (err) {
      console.error("Error generating code:", err);
      setError("Failed to generate invite code.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleUpdateFilterLevel = async (level: FilterLevel) => {
    if (!family) return;
    setIsUpdatingSettings(true);
    try {
      await updateFamilySettings(family.id, { filterLevel: level });
      // Update local state without full reload
      setFamily(prev => prev ? { ...prev, settings: { ...prev.settings, filterLevel: level } } : null);
      setSuccess(`Family default filter set to ${level}`);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update family settings.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Access Control
  if (!user) {
    return <div className="p-8 text-center">Please log in to manage your family.</div>;
  }

  if (isParent && !isApproved) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600">
            Your parent account is currently pending approval by an administrator. 
            Once approved, you will be able to access the dashboard and manage your family.
          </p>
        </Card>
      </div>
    );
  }

  if (!isParent && isApproved) {
     return <div className="p-8 text-center">Access Denied: Only parents can access this page.</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Family Management</h1>
        <p className="text-gray-600">Manage your children's access and family settings.</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>
                  {/* X Icon */}
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Children Lists */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Requests Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Pending Requests</h2>
              {pendingChildren.length > 0 && <Badge color="yellow">{pendingChildren.length} Pending</Badge>}
            </div>
            
            {pendingChildren.length === 0 ? (
              <Card className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-100">
                No pending requests at this time.
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingChildren.map((child) => (
                  <Card key={child.uid} className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <h3 className="text-md font-medium text-gray-900">{child.displayName || 'No Name'}</h3>
                        <p className="text-sm text-gray-500">{child.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Registered: {new Date(child.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex space-x-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openRejectModal(child.uid)}
                        >
                          Reject
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleApprove(child.uid)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Approved Children Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Your Children</h2>
              <Badge color="blue">{familyChildren.length} Total</Badge>
            </div>

            {familyChildren.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">You haven't added any children yet.</p>
                <Button variant="secondary" onClick={() => document.getElementById('invite-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Setup Child Device
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {familyChildren.map((child) => (
                  <Card key={child.uid} className={`p-4 ${child.approvalStatus === ApprovalStatus.SUSPENDED ? 'bg-red-50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <Badge 
                        color={
                          child.approvalStatus === ApprovalStatus.APPROVED ? 'green' : 
                          child.approvalStatus === ApprovalStatus.SUSPENDED ? 'red' : 'yellow'
                        }
                      >
                        {child.approvalStatus}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        Level: {child.filterLevel}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 truncate">{child.displayName || 'Child'}</h3>
                      <p className="text-sm text-gray-500 truncate">{child.email}</p>
                    </div>

                    <div className="border-t pt-3 flex justify-end">
                      {child.approvalStatus === ApprovalStatus.SUSPENDED ? (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleUnsuspend(child.uid)}
                        >
                          Unsuspend
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleSuspend(child.uid)}
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Family Settings */}
        <div className="space-y-8">
          
          {/* Invite Section */}
          <section id="invite-section">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invite Children</h2>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Ask your child to register using your email address:
                <br/>
                <strong className="text-gray-800">{userProfile?.email}</strong>
              </p>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR USE CODE</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="mt-4 text-center">
                {inviteCode ? (
                  <div className="mb-4">
                    <div className="text-3xl font-mono font-bold text-brand-600 tracking-wider mb-2">
                      {inviteCode}
                    </div>
                    <p className="text-xs text-brand-500">
                      Valid for 48 hours
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 text-gray-400 text-sm italic">
                    No active code generated
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateInvite} 
                  isLoading={isGeneratingCode}
                  variant="secondary"
                  className="w-full"
                >
                  {inviteCode ? 'Generate New Code' : 'Generate Invite Code'}
                </Button>
              </div>
            </Card>
          </section>

          {/* Settings Section */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Family Settings</h2>
            <Card className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family ID
                </label>
                <code className="block w-full bg-gray-50 px-3 py-2 rounded border border-gray-200 text-xs text-gray-600">
                  {family?.id || '...'}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Filter Level
                </label>
                <div className="space-y-2">
                  {[FilterLevel.STRICT, FilterLevel.MODERATE, FilterLevel.NONE].map((level) => (
                    <div key={level} className="flex items-center">
                      <input
                        id={`filter-${level}`}
                        name="filterLevel"
                        type="radio"
                        checked={family?.settings?.filterLevel === level}
                        onChange={() => handleUpdateFilterLevel(level)}
                        disabled={isUpdatingSettings}
                        className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                      />
                      <label htmlFor={`filter-${level}`} className="ml-3 block text-sm font-medium text-gray-700 capitalize">
                        {level.toLowerCase()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* Modal panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Reject Child Request
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Please provide a reason for rejecting this request.
                      </p>
                      <Input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection (e.g. Unknown email)"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="danger"
                  onClick={handleRejectConfirm}
                  isLoading={isRejecting}
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isRejecting}
                  className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FamilyManagement;

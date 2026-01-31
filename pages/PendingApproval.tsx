import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { Button, Card } from '../components/UI';
import { UserRole, ApprovalStatus } from '../types';

const PendingApproval: React.FC = () => {
  const { userProfile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Auto-redirect if approved
    if (userProfile?.approvalStatus === ApprovalStatus.APPROVED) {
      if (userProfile.role === UserRole.SUPER_ADMIN) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [userProfile, navigate]);

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const handleCheckStatus = async () => {
    setIsChecking(true);
    await refreshProfile();
    // Use a small delay to make the "Checking" state perceptible if the network is too fast, user feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsChecking(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplay = () => {
    if (userProfile.role === UserRole.PENDING_PARENT) return 'Parent';
    if (userProfile.role === UserRole.PENDING_CHILD) return 'Child';
    return userProfile.role; // Fallback
  };

  const renderContent = () => {
    const { approvalStatus } = userProfile;

    if (approvalStatus === ApprovalStatus.REJECTED) {
      return (
        <Card className="max-w-md w-full mx-auto">
          <div className="bg-red-50 px-4 py-5 border-b border-red-100 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-red-800">
              Access Denied
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Your Request Was Not Approved</h3>
              
              {userProfile.rejectedReason && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-left">
                  <p className="text-sm font-medium text-gray-500 mb-1">Reason:</p>
                  <p className="text-sm text-gray-700">{userProfile.rejectedReason}</p>
                </div>
              )}
              
              <p className="mt-4 text-sm text-gray-500">
                If you believe this is an error, please contact support.
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-5">
              <Button 
                variant="secondary" 
                className="w-full justify-center"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (approvalStatus === ApprovalStatus.SUSPENDED) {
      return (
        <Card className="max-w-md w-full mx-auto">
           <div className="bg-red-50 px-4 py-5 border-b border-red-100 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-red-800">
              Account Suspended
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Your Account is Suspended</h3>
              
               {userProfile.rejectedReason && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-left">
                  <p className="text-sm font-medium text-gray-500 mb-1">Reason:</p>
                  <p className="text-sm text-gray-700">{userProfile.rejectedReason}</p>
                </div>
              )}

              <p className="mt-4 text-sm text-gray-500">
                Please contact support for more information.
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-5">
              <Button 
                variant="secondary" 
                className="w-full justify-center"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    // Default: PENDING
    const isParentPending = userProfile.role === UserRole.PENDING_PARENT;
    
    return (
      <Card className="max-w-md w-full mx-auto">
        <div className="bg-yellow-50 px-4 py-5 border-b border-yellow-100 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-yellow-800 flex items-center">
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Approval (Pending Phase 9)
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{userProfile.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900">{getRoleDisplay()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(userProfile.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md bg-blue-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  {isParentPending 
                    ? "Your registration is pending admin approval. You will receive access once the administrator reviews your request."
                    : "Your registration is pending parent approval. Ask your parent to approve your account from their Family Management page."
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Button
              onClick={handleCheckStatus}
              isLoading={isChecking}
              className="w-full sm:w-auto"
            >
              Check Status
            </Button>
            <Button
              variant="secondary"
              onClick={() => signOut()}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          OpenFamilySafe
        </h2>
      </div>
      {renderContent()}
    </div>
  );
};

export default PendingApproval;

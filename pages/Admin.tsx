import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { UserRole, FilterLevel, UserProfile } from '../types';
import { useAuth } from '../services/authContext';
import { Navigate } from 'react-router-dom';

// Mock data generator for admin view
const MOCK_USERS: UserProfile[] = [
  { uid: '1', email: 'child1@family.net', displayName: 'Sarah', role: UserRole.CHILD, filterLevel: FilterLevel.STRICT, createdAt: Date.now() },
  { uid: '2', email: 'child2@family.net', displayName: 'Mike', role: UserRole.CHILD, filterLevel: FilterLevel.MODERATE, createdAt: Date.now() },
  { uid: '3', email: 'cousin@guest.net', displayName: 'Guest User', role: UserRole.PENDING, filterLevel: FilterLevel.STRICT, createdAt: Date.now() },
];

const Admin: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" />;

  const handleApprove = (uid: string) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: UserRole.CHILD } : u));
    // In real app: await updateDoc(doc(db, "users", uid), { role: UserRole.CHILD });
  };

  const handleReject = (uid: string) => {
    setUsers(prev => prev.filter(u => u.uid !== uid));
    // In real app: await deleteDoc(doc(db, "users", uid));
  };

  const toggleStrictness = (uid: string) => {
    setUsers(prev => prev.map(u => {
        if (u.uid !== uid) return u;
        const newLevel = u.filterLevel === FilterLevel.STRICT ? FilterLevel.MODERATE : FilterLevel.STRICT;
        return { ...u, filterLevel: newLevel };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Console
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage family access requests and filter levels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stats */}
        <Card className="p-5 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-brand-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </div>
            <div className="ml-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Total Users</h3>
                <p className="text-2xl font-bold text-gray-700">{users.length}</p>
            </div>
        </Card>
        
        <Card className="p-5 flex items-center">
             <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="ml-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Requests</h3>
                <p className="text-2xl font-bold text-gray-700">
                    {users.filter(u => u.role === UserRole.PENDING).length}
                </p>
            </div>
        </Card>
      </div>

      <Card className="shadow overflow-hidden border-b border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition duration-150 ease-in-out">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                    {user.displayName ? user.displayName[0] : user.email[0].toUpperCase()}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-brand-600 truncate">{user.displayName || 'No Name'}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                {user.role === UserRole.PENDING ? (
                    <>
                        <Badge color="yellow">Pending Approval</Badge>
                        <div className="flex gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleApprove(user.uid)}>Approve</Button>
                            <Button size="sm" variant="secondary" onClick={() => handleReject(user.uid)}>Reject</Button>
                        </div>
                    </>
                ) : (
                    <>
                         <div className="flex flex-col items-end mr-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Filter Level</span>
                            <button 
                                onClick={() => toggleStrictness(user.uid)}
                                className={`mt-1 text-xs font-bold px-2 py-1 rounded cursor-pointer ${user.filterLevel === FilterLevel.STRICT ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                            >
                                {user.filterLevel}
                            </button>
                        </div>
                         <Badge color="blue">Active Child</Badge>
                    </>
                )}
              </div>
            </li>
          ))}
          {users.length === 0 && (
              <li className="p-8 text-center text-gray-500">No users found.</li>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default Admin;
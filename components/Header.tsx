
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Header: React.FC = () => {
  const { currentUser, setCurrentUserRole } = useAuth();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentUserRole(e.target.value as UserRole);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 ml-3">AI Invoice Processing</h1>
          </div>
          <div className="flex items-center">
             <div className="text-right mr-4">
                <div className="text-sm font-medium text-gray-800">{currentUser?.name}</div>
                <div className="text-xs text-gray-500">{currentUser?.role}</div>
            </div>
            <div>
              <label htmlFor="role-switcher" className="sr-only">Switch Role</label>
              <select
                id="role-switcher"
                value={currentUser?.role}
                onChange={handleRoleChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

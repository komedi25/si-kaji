
import { useState } from 'react';
import { AppRole } from '@/types/auth';
import { AllUserData } from '@/types/user';

export const useUserFilters = (allUsers: AllUserData[]) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');

  // Filter users based on search term, tab, and role filter
  const filteredUsers = allUsers.filter(userData => {
    const matchesSearch = userData.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userData.nis && userData.nis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userData.nip && userData.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userData.email && userData.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'staff' && userData.user_type === 'staff') ||
      (activeTab === 'students' && userData.user_type === 'student');

    const matchesRole = roleFilter === 'all' || userData.roles.includes(roleFilter);

    return matchesSearch && matchesTab && matchesRole;
  });

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    filteredUsers
  };
};

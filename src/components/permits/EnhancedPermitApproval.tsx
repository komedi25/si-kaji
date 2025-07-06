
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermitApprovalWorkflow } from './PermitApprovalWorkflow';
import { PermitNotifications } from './PermitNotifications';
import { useAuth } from '@/hooks/useAuth';

export const EnhancedPermitApproval = () => {
  const { hasRole } = useAuth();

  const canApprove = hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('waka_kesiswaan') || hasRole('admin');

  if (!canApprove) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Anda tidak memiliki akses untuk mengelola persetujuan izin</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="approvals" className="w-full">
        <TabsList>
          <TabsTrigger value="approvals">Persetujuan</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="approvals">
          <PermitApprovalWorkflow />
        </TabsContent>
        
        <TabsContent value="notifications">
          <PermitNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
};

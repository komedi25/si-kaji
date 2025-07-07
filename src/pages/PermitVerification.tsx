import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PermitVerification } from '@/components/permits/PermitVerification';

const PermitVerificationPage = () => {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Verifikasi Izin Siswa</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Verifikasi keabsahan izin siswa menggunakan ID permit atau QR code
          </p>
        </div>

        <PermitVerification />
      </div>
    </AppLayout>
  );
};

export default PermitVerificationPage;
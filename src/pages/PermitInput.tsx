
import { AppLayout } from '@/components/layout/AppLayout';
import { PermitInputForm } from '@/components/permits/PermitInputForm';

const PermitInput = () => {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pengajuan Izin</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Ajukan izin ketidakhadiran untuk persetujuan sekolah
          </p>
        </div>
        <PermitInputForm />
      </div>
    </AppLayout>
  );
};

export default PermitInput;


import { AppLayout } from '@/components/layout/AppLayout';
import { ViolationInputForm } from '@/components/violations/ViolationInputForm';

const ViolationInput = () => {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Input Pelanggaran Siswa</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Catat pelanggaran siswa untuk sistem poin disiplin
          </p>
        </div>
        <ViolationInputForm />
      </div>
    </AppLayout>
  );
};

export default ViolationInput;

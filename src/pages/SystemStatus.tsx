
import { AppLayout } from '@/components/layout/AppLayout';
import { SystemAnalysis } from '@/components/admin/SystemAnalysis';

const SystemStatus = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Status Sistem</h1>
          <p className="text-gray-600">Analisis kelengkapan dan progress pengembangan sistem</p>
        </div>
        <SystemAnalysis />
      </div>
    </AppLayout>
  );
};

export default SystemStatus;

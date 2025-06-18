
import { Button } from '@/components/ui/button';
import { Plus, Upload, RefreshCw, Users, FileText, Download } from 'lucide-react';

interface UserActionsProps {
  onAddUser: () => void;
  onBulkImport: () => void;
  onRefresh: () => void;
  onExportData: () => void;
  onGenerateReport: () => void;
}

export const UserActions = ({
  onAddUser,
  onBulkImport,
  onRefresh,
  onExportData,
  onGenerateReport
}: UserActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button onClick={onExportData} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export Data
      </Button>
      <Button onClick={onGenerateReport} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Laporan
      </Button>
      <Button onClick={onBulkImport} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import Excel
      </Button>
      <Button onClick={onAddUser} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Tambah Pengguna
      </Button>
    </div>
  );
};

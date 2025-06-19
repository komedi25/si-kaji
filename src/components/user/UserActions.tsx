
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Upload, Download, RefreshCw, FileText, MoreHorizontal, Users } from 'lucide-react';

interface UserActionsProps {
  onAddUser: () => void;
  onBulkImport: () => void;
  onBulkStudentImport: () => void;
  onRefresh: () => void;
  onExportData: () => void;
  onGenerateReport: () => void;
}

export const UserActions = ({ 
  onAddUser, 
  onBulkImport, 
  onBulkStudentImport,
  onRefresh, 
  onExportData, 
  onGenerateReport 
}: UserActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah/Import
            <MoreHorizontal className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah User Manual
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onBulkImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import User dari CSV
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onBulkStudentImport}>
            <Users className="h-4 w-4 mr-2" />
            Import Data Siswa CSV
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Laporan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

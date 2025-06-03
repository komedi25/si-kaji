
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, File, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  existingFiles?: string[];
  maxFiles?: number;
  accept?: string;
  folder?: string;
}

export const FileUpload = ({ 
  onFilesUploaded, 
  existingFiles = [], 
  maxFiles = 5,
  accept = 'image/*,.pdf,.doc,.docx',
  folder = 'general'
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(existingFiles);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maksimal ${maxFiles} file`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      const allFiles = [...uploadedFiles, ...newUrls];
      setUploadedFiles(allFiles);
      onFilesUploaded(allFiles);
      toast.success(`${acceptedFiles.length} file berhasil diupload`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Gagal upload file');
    } finally {
      setUploading(false);
    }
  }, [uploadedFiles, maxFiles, onFilesUploaded, folder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  });

  const removeFile = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('documents') + 1).join('/');
      
      await supabase.storage
        .from('documents')
        .remove([filePath]);

      const newFiles = uploadedFiles.filter(f => f !== url);
      setUploadedFiles(newFiles);
      onFilesUploaded(newFiles);
      toast.success('File berhasil dihapus');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Gagal menghapus file');
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].split('-').slice(1).join('-');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Mengupload file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop file di sini...' : 'Drag & drop file atau klik untuk pilih'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, atau gambar. Maksimal 10MB per file.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">File yang diupload:</h4>
          {uploadedFiles.map((url, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{getFileName(url)}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(url)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

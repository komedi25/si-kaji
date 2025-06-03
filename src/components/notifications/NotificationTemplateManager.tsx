
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

export const NotificationTemplateManager = () => {
  const { templates, channels, createTemplate, updateTemplate } = useNotificationSystem();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title_template: '',
    message_template: '',
    type: 'info',
    channels: ['app'],
    variables: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTemplate) {
        await updateTemplate(selectedTemplate.id, formData);
      } else {
        await createTemplate({
          ...formData,
          is_active: true
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title_template: '',
      message_template: '',
      type: 'info',
      channels: ['app'],
      variables: []
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      title_template: template.title_template,
      message_template: template.message_template,
      type: template.type,
      channels: template.channels,
      variables: template.variables
    });
    setIsDialogOpen(true);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'info': 'bg-blue-100 text-blue-700',
      'success': 'bg-green-100 text-green-700',
      'warning': 'bg-yellow-100 text-yellow-700',
      'error': 'bg-red-100 text-red-700'
    };
    return colors[type] || colors.info;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Template Notifikasi</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? 'Edit Template' : 'Tambah Template Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., student_violation"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="title_template">Template Judul</Label>
                  <Input
                    id="title_template"
                    value={formData.title_template}
                    onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                    placeholder="e.g., Pelanggaran {{student_name}}"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message_template">Template Pesan</Label>
                  <Textarea
                    id="message_template"
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    placeholder="e.g., Siswa {{student_name}} melakukan pelanggaran {{violation_type}} pada {{date}}"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipe Notifikasi</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Channel Default</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['app', 'email', 'whatsapp', 'sms'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox
                          id={channel}
                          checked={formData.channels.includes(channel)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                channels: [...formData.channels, channel]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                channels: formData.channels.filter(c => c !== channel)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={channel} className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedTemplate ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Template Judul</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{template.title_template}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

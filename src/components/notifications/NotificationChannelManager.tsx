
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Settings } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

export const NotificationChannelManager = () => {
  const { channels, createOrUpdateChannel } = useNotificationSystem();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    config: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrUpdateChannel({
        ...formData,
        is_active: true,
        id: selectedChannel?.id
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving channel:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      config: {}
    });
    setSelectedChannel(null);
  };

  const handleEdit = (channel: any) => {
    setSelectedChannel(channel);
    setFormData({
      name: channel.name,
      type: channel.type,
      config: channel.config
    });
    setIsDialogOpen(true);
  };

  const renderConfigFields = () => {
    const { type } = formData;
    
    switch (type) {
      case 'email':
        return (
          <div className="space-y-3">
            <div>
              <Label>SMTP Host</Label>
              <Input
                value={formData.config.smtp_host || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, smtp_host: e.target.value }
                })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label>SMTP Port</Label>
              <Input
                type="number"
                value={formData.config.smtp_port || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, smtp_port: parseInt(e.target.value) }
                })}
                placeholder="587"
              />
            </div>
            <div>
              <Label>Use TLS</Label>
              <Select
                value={formData.config.use_tls ? 'true' : 'false'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, use_tls: value === 'true' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ya</SelectItem>
                  <SelectItem value="false">Tidak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'whatsapp':
        return (
          <div className="space-y-3">
            <div>
              <Label>API URL</Label>
              <Input
                value={formData.config.api_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_url: e.target.value }
                })}
                placeholder="https://api.whatsapp.com/send"
              />
            </div>
            <div>
              <Label>Business Number</Label>
              <Input
                value={formData.config.business_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, business_number: e.target.value }
                })}
                placeholder="+62xxx"
              />
            </div>
          </div>
        );
      
      case 'sms':
        return (
          <div className="space-y-3">
            <div>
              <Label>Provider</Label>
              <Select
                value={formData.config.provider || 'twilio'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, provider: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="nexmo">Nexmo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.config.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value }
                })}
                placeholder="API Key"
              />
            </div>
          </div>
        );
      
      case 'push':
        return (
          <div className="space-y-3">
            <div>
              <Label>FCM Server Key</Label>
              <Input
                type="password"
                value={formData.config.fcm_server_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, fcm_server_key: e.target.value }
                })}
                placeholder="FCM Server Key"
              />
            </div>
            <div>
              <Label>VAPID Public Key</Label>
              <Input
                value={formData.config.vapid_public_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, vapid_public_key: e.target.value }
                })}
                placeholder="VAPID Public Key"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'email': 'bg-blue-100 text-blue-700',
      'whatsapp': 'bg-green-100 text-green-700',
      'sms': 'bg-yellow-100 text-yellow-700',
      'push': 'bg-purple-100 text-purple-700'
    };
    return colors[type] || colors.email;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Channel Notifikasi</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedChannel ? 'Edit Channel' : 'Tambah Channel Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Channel</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Gmail SMTP"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipe Channel</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, config: {} })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderConfigFields()}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedChannel ? 'Update' : 'Simpan'}
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
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(channel.type)}>
                      {channel.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={channel.is_active ? "default" : "secondary"}>
                      {channel.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(channel)}>
                        <Settings className="w-3 h-3" />
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

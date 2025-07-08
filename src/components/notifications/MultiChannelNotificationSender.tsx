import React, { useState } from 'react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Users, User, MessageSquare } from 'lucide-react';

export const MultiChannelNotificationSender = () => {
  const { templates, sendNotificationFromTemplate, notifyByRole, createNotification } = useNotificationSystem();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    type: 'direct', // direct, role, template
    selectedTemplate: '',
    targetRole: '',
    targetUserId: '',
    title: '',
    message: '',
    notificationType: 'info' as 'info' | 'success' | 'warning' | 'error',
    channels: ['app'],
    variables: {}
  });

  const [loading, setLoading] = useState(false);

  const roles = [
    'admin', 'siswa', 'orang_tua', 'wali_kelas', 'guru_bk', 
    'waka_kesiswaan', 'tppk', 'arps', 'p4gn', 'koordinator_eskul', 'pelatih_eskul'
  ];

  const channels = ['app', 'email', 'whatsapp', 'sms', 'push'];

  const handleSendNotification = async () => {
    setLoading(true);
    try {
      if (formData.type === 'template' && formData.selectedTemplate) {
        if (formData.targetRole) {
          // Send template-based notification to role
          await notifyByRole(
            formData.targetRole,
            formData.title || 'Template Notification',
            formData.message || 'Template-based message',
            formData.notificationType
          );
        } else if (formData.targetUserId) {
          // Send template-based notification to specific user
          await sendNotificationFromTemplate(
            formData.selectedTemplate,
            formData.targetUserId,
            formData.variables
          );
        }
      } else if (formData.type === 'role' && formData.targetRole) {
        await notifyByRole(
          formData.targetRole,
          formData.title,
          formData.message,
          formData.notificationType
        );
      } else if (formData.type === 'direct' && formData.targetUserId) {
        await createNotification(
          formData.targetUserId,
          formData.title,
          formData.message,
          formData.notificationType
        );
      }

      toast({
        title: "Notifikasi Terkirim",
        description: "Notifikasi berhasil dikirim ke target yang dipilih"
      });

      // Reset form
      setFormData({
        type: 'direct',
        selectedTemplate: '',
        targetRole: '',
        targetUserId: '',
        title: '',
        message: '',
        notificationType: 'info',
        channels: ['app'],
        variables: {}
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim notifikasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrator',
      siswa: 'Siswa',
      orang_tua: 'Orang Tua',
      wali_kelas: 'Wali Kelas',
      guru_bk: 'Guru BK',
      waka_kesiswaan: 'Waka Kesiswaan',
      tppk: 'TPPK',
      arps: 'ARPS',
      p4gn: 'P4GN',
      koordinator_eskul: 'Koordinator Ekstrakurikuler',
      pelatih_eskul: 'Pelatih Ekstrakurikuler'
    };
    return labels[role] || role;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Kirim Notifikasi Multi-Channel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Type */}
        <div>
          <Label className="text-sm font-medium">Tipe Pengiriman</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <Button
              variant={formData.type === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData({ ...formData, type: 'direct' })}
              className="justify-start"
            >
              <User className="h-4 w-4 mr-2" />
              Langsung
            </Button>
            <Button
              variant={formData.type === 'role' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData({ ...formData, type: 'role' })}
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Berdasarkan Role
            </Button>
            <Button
              variant={formData.type === 'template' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData({ ...formData, type: 'template' })}
              className="justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
        </div>

        {/* Target Selection */}
        {formData.type === 'role' && (
          <div>
            <Label htmlFor="targetRole">Target Role</Label>
            <Select value={formData.targetRole} onValueChange={(value) => setFormData({ ...formData, targetRole: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih role target" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.type === 'direct' && (
          <div>
            <Label htmlFor="targetUserId">Target User ID</Label>
            <Input
              id="targetUserId"
              value={formData.targetUserId}
              onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
              placeholder="Masukkan User ID"
            />
          </div>
        )}

        {formData.type === 'template' && (
          <div>
            <Label htmlFor="template">Template Notifikasi</Label>
            <Select value={formData.selectedTemplate} onValueChange={(value) => setFormData({ ...formData, selectedTemplate: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.name}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge className={getTypeColor(template.type)} variant="outline">
                        {template.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Message Content */}
        {formData.type !== 'template' && (
          <>
            <div>
              <Label htmlFor="title">Judul Notifikasi</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul notifikasi"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Masukkan pesan notifikasi"
                required
              />
            </div>

            <div>
              <Label htmlFor="notificationType">Tipe Notifikasi</Label>
              <Select 
                value={formData.notificationType} 
                onValueChange={(value: any) => setFormData({ ...formData, notificationType: value })}
              >
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
          </>
        )}

        {/* Channel Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Channel Pengiriman</Label>
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
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
                <Label htmlFor={channel} className="capitalize text-sm">
                  {channel}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendNotification} 
          disabled={loading || !formData.title || (!formData.targetRole && !formData.targetUserId)}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
        </Button>
      </CardContent>
    </Card>
  );
};
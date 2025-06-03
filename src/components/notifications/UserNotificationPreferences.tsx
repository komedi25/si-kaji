
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

export const UserNotificationPreferences = () => {
  const { preferences, updatePreference, templates } = useNotificationSystem();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState({
    channels: [] as string[],
    quietHoursStart: '',
    quietHoursEnd: ''
  });

  const notificationTypes = [
    'student_violation',
    'achievement_recorded', 
    'permit_approved',
    'attendance_reminder',
    'proposal_needs_approval'
  ];

  const availableChannels = ['app', 'email', 'whatsapp', 'sms'];

  const getPreferenceForType = (type: string) => {
    return preferences.find(p => p.notification_type === type);
  };

  const handleEdit = (type: string) => {
    const pref = getPreferenceForType(type);
    setTempSettings({
      channels: pref?.channels || ['app'],
      quietHoursStart: pref?.quiet_hours_start || '',
      quietHoursEnd: pref?.quiet_hours_end || ''
    });
    setEditingType(type);
  };

  const handleSave = async (type: string) => {
    try {
      await updatePreference(
        type,
        tempSettings.channels,
        true,
        tempSettings.quietHoursStart || undefined,
        tempSettings.quietHoursEnd || undefined
      );
      setEditingType(null);
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handleToggleEnabled = async (type: string, enabled: boolean) => {
    const pref = getPreferenceForType(type);
    await updatePreference(
      type,
      pref?.channels || ['app'],
      enabled,
      pref?.quiet_hours_start,
      pref?.quiet_hours_end
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'student_violation': 'Pelanggaran Siswa',
      'achievement_recorded': 'Prestasi Dicatat',
      'permit_approved': 'Izin Disetujui',
      'attendance_reminder': 'Pengingat Presensi',
      'proposal_needs_approval': 'Persetujuan Proposal'
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Preferensi Notifikasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const pref = getPreferenceForType(type);
            const isEditing = editingType === type;
            
            return (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={pref?.is_enabled ?? true}
                      onCheckedChange={(checked) => handleToggleEnabled(type, checked)}
                    />
                    <div>
                      <Label className="font-medium">{getTypeLabel(type)}</Label>
                      <p className="text-sm text-muted-foreground">
                        {templates.find(t => t.name === type)?.title_template}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => isEditing ? handleSave(type) : handleEdit(type)}
                  >
                    {isEditing ? 'Simpan' : <Settings className="w-4 h-4" />}
                  </Button>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Channel Notifikasi</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableChannels.map((channel) => (
                          <div key={channel} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${type}-${channel}`}
                              checked={tempSettings.channels.includes(channel)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTempSettings({
                                    ...tempSettings,
                                    channels: [...tempSettings.channels, channel]
                                  });
                                } else {
                                  setTempSettings({
                                    ...tempSettings,
                                    channels: tempSettings.channels.filter(c => c !== channel)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`${type}-${channel}`} className="capitalize text-sm">
                              {channel}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`${type}-start`} className="text-sm">Jam Tenang Mulai</Label>
                        <Input
                          id={`${type}-start`}
                          type="time"
                          value={tempSettings.quietHoursStart}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            quietHoursStart: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${type}-end`} className="text-sm">Jam Tenang Selesai</Label>
                        <Input
                          id={`${type}-end`}
                          type="time"
                          value={tempSettings.quietHoursEnd}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            quietHoursEnd: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Channel: </span>
                      <div className="inline-flex gap-1">
                        {(pref?.channels || ['app']).map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {pref?.quiet_hours_start && pref?.quiet_hours_end && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Jam Tenang: {pref.quiet_hours_start} - {pref.quiet_hours_end}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

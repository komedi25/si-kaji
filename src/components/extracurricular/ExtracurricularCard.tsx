
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, MapPin, User, Plus, Eye } from 'lucide-react';
import { ExtracurricularDetails, StudentOption } from './types';

interface ExtracurricularCardProps {
  extracurricular: ExtracurricularDetails;
  students: StudentOption[];
  selectedStudent: string;
  onStudentSelect: (studentId: string) => void;
  onEnroll: (extracurricularId: string) => void;
  canManage: boolean;
}

export const ExtracurricularCard: React.FC<ExtracurricularCardProps> = ({
  extracurricular,
  students,
  selectedStudent,
  onStudentSelect,
  onEnroll,
  canManage
}) => {
  return (
    <Card key={extracurricular.id}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{extracurricular.name}</span>
          <Badge variant={
            extracurricular.max_participants && extracurricular.current_participants >= extracurricular.max_participants 
              ? 'destructive' : 'default'
          }>
            {extracurricular.current_participants}
            {extracurricular.max_participants && `/${extracurricular.max_participants}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {extracurricular.description && (
          <p className="text-sm text-muted-foreground">{extracurricular.description}</p>
        )}
        
        <div className="space-y-2 text-sm">
          {extracurricular.schedule_day && extracurricular.schedule_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{extracurricular.schedule_day}, {extracurricular.schedule_time}</span>
            </div>
          )}
          
          {extracurricular.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{extracurricular.location}</span>
            </div>
          )}

          {extracurricular.coach_name && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{extracurricular.coach_name}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {canManage && (
            <div className="space-y-2">
              <Select value={selectedStudent} onValueChange={onStudentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa untuk didaftarkan" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(student => !extracurricular.enrollments.some(e => e.student_nis === student.nis))
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.nis})
                        {student.class_name && ` - ${student.class_name}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => onEnroll(extracurricular.id)}
                disabled={!selectedStudent || (extracurricular.max_participants ? extracurricular.current_participants >= extracurricular.max_participants : false)}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Daftarkan Siswa
              </Button>
            </div>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Lihat Anggota ({extracurricular.current_participants})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Anggota {extracurricular.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {extracurricular.enrollments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada anggota terdaftar
                  </p>
                ) : (
                  extracurricular.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{enrollment.student_name}</div>
                        <div className="text-sm text-muted-foreground">
                          NIS: {enrollment.student_nis}
                          {enrollment.student_class && ` • ${enrollment.student_class}`}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(enrollment.enrollment_date).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Star } from 'lucide-react';

const mockStudents = [
  { id: '1', nis: '2024001', name: 'Ahmad Rizki Pratama', currentRating: 4 },
  { id: '2', nis: '2024002', name: 'Siti Nurhaliza', currentRating: 5 },
  { id: '3', nis: '2024003', name: 'Budi Santoso', currentRating: 3 },
  { id: '4', nis: '2024004', name: 'Dewi Sartika', currentRating: 4 },
  { id: '5', nis: '2024005', name: 'Eko Prasetyo', currentRating: 2 }
];

interface StudentEntry {
  studentId: string;
  individualNotes: string;
  behaviorRating: number;
  academicProgress: string;
  specialNotes: string;
}

export const StudentEntryForm = () => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [entries, setEntries] = useState<Record<string, StudentEntry>>({});

  const handleStudentEntryChange = (studentId: string, field: keyof StudentEntry, value: string | number) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        [field]: value
      }
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSaveAll = () => {
    console.log('Saving student entries:', entries);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Catatan Individual Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Siswa untuk Menambah Catatan</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa..." />
                </SelectTrigger>
                <SelectContent>
                  {mockStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{student.nis} - {student.name}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <Star className={`w-3 h-3 ${getRatingColor(student.currentRating)}`} />
                          <span className={`text-xs ${getRatingColor(student.currentRating)}`}>
                            {student.currentRating}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {mockStudents.find(s => s.id === selectedStudent)?.name}
                  </h3>
                  <Badge variant="outline">
                    NIS: {mockStudents.find(s => s.id === selectedStudent)?.nis}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rating Perilaku</Label>
                    <Select 
                      value={entries[selectedStudent]?.behaviorRating?.toString() || ''} 
                      onValueChange={(value) => handleStudentEntryChange(selectedStudent, 'behaviorRating', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih rating..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Sangat Kurang</SelectItem>
                        <SelectItem value="2">2 - Kurang</SelectItem>
                        <SelectItem value="3">3 - Cukup</SelectItem>
                        <SelectItem value="4">4 - Baik</SelectItem>
                        <SelectItem value="5">5 - Sangat Baik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kemajuan Akademik</Label>
                    <Textarea
                      placeholder="Catat kemajuan akademik siswa..."
                      value={entries[selectedStudent]?.academicProgress || ''}
                      onChange={(e) => handleStudentEntryChange(selectedStudent, 'academicProgress', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan Individual</Label>
                  <Textarea
                    placeholder="Catatan khusus untuk siswa ini..."
                    value={entries[selectedStudent]?.individualNotes || ''}
                    onChange={(e) => handleStudentEntryChange(selectedStudent, 'individualNotes', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catatan Khusus</Label>
                  <Textarea
                    placeholder="Catatan khusus atau hal yang perlu diperhatikan..."
                    value={entries[selectedStudent]?.specialNotes || ''}
                    onChange={(e) => handleStudentEntryChange(selectedStudent, 'specialNotes', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {Object.keys(entries).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Catatan Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.values(entries).map((entry) => {
                const student = mockStudents.find(s => s.id === entry.studentId);
                return (
                  <div key={entry.studentId} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{student?.name}</span>
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${getRatingColor(entry.behaviorRating)}`} />
                        <span className={getRatingColor(entry.behaviorRating)}>
                          {entry.behaviorRating}/5
                        </span>
                      </div>
                    </div>
                    {entry.individualNotes && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Catatan:</strong> {entry.individualNotes}
                      </p>
                    )}
                    {entry.academicProgress && (
                      <p className="text-sm text-gray-600">
                        <strong>Akademik:</strong> {entry.academicProgress}
                      </p>
                    )}
                  </div>
                );
              })}
              <Button onClick={handleSaveAll} className="w-full">
                Simpan Semua Catatan Siswa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

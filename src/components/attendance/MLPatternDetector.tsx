
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface AttendancePattern {
  studentId: string;
  patterns: {
    timePattern: {
      averageCheckIn: string;
      variance: number;
      isAbnormal: boolean;
      confidence: number;
    };
    locationPattern: {
      commonLocations: Array<{lat: number, lng: number, count: number}>;
      locationVariance: number;
      isAbnormal: boolean;
      confidence: number;
    };
    devicePattern: {
      deviceFingerprints: string[];
      uniqueDevices: number;
      isAbnormal: boolean;
      confidence: number;
    };
    behaviorPattern: {
      attendanceRate: number;
      lateFrequency: number;
      weekdayPattern: number[];
      isAbnormal: boolean;
      confidence: number;
    };
  };
  overallRisk: {
    score: number;
    level: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export class MLPatternDetector {
  private static instance: MLPatternDetector;

  static getInstance(): MLPatternDetector {
    if (!MLPatternDetector.instance) {
      MLPatternDetector.instance = new MLPatternDetector();
    }
    return MLPatternDetector.instance;
  }

  async analyzeStudentPattern(studentId: string, timeframe: number = 30): Promise<AttendancePattern> {
    try {
      // Fetch student's attendance data for analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeframe);

      const { data: attendanceData, error } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .gte('attendance_date', startDate.toISOString().split('T')[0])
        .lte('attendance_date', endDate.toISOString().split('T')[0])
        .order('attendance_date', { ascending: true });

      if (error) throw error;

      const patterns = {
        timePattern: this.analyzeTimePattern(attendanceData || []),
        locationPattern: this.analyzeLocationPattern(attendanceData || []),
        devicePattern: this.analyzeDevicePattern(attendanceData || []),
        behaviorPattern: this.analyzeBehaviorPattern(attendanceData || [])
      };

      const overallRisk = this.calculateOverallRisk(patterns);

      return {
        studentId,
        patterns,
        overallRisk
      };
    } catch (error) {
      console.error('Error analyzing pattern:', error);
      throw error;
    }
  }

  private analyzeTimePattern(data: any[]): AttendancePattern['patterns']['timePattern'] {
    if (data.length === 0) {
      return {
        averageCheckIn: '00:00:00',
        variance: 0,
        isAbnormal: false,
        confidence: 0
      };
    }

    const checkInTimes = data
      .filter(record => record.check_in_time)
      .map(record => this.timeToMinutes(record.check_in_time));

    if (checkInTimes.length === 0) {
      return {
        averageCheckIn: '00:00:00',
        variance: 0,
        isAbnormal: false,
        confidence: 0
      };
    }

    const average = checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length;
    const variance = checkInTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / checkInTimes.length;
    
    // Abnormal if variance is too high (more than 30 minutes standard deviation)
    const isAbnormal = Math.sqrt(variance) > 30;
    const confidence = Math.min(100, checkInTimes.length * 10); // More data = higher confidence

    return {
      averageCheckIn: this.minutesToTime(average),
      variance: Math.sqrt(variance),
      isAbnormal,
      confidence
    };
  }

  private analyzeLocationPattern(data: any[]): AttendancePattern['patterns']['locationPattern'] {
    const locations = data
      .filter(record => record.check_in_latitude && record.check_in_longitude)
      .map(record => ({
        lat: parseFloat(record.check_in_latitude),
        lng: parseFloat(record.check_in_longitude)
      }));

    if (locations.length === 0) {
      return {
        commonLocations: [],
        locationVariance: 0,
        isAbnormal: false,
        confidence: 0
      };
    }

    // Group similar locations (within 10 meters)
    const locationClusters = this.clusterLocations(locations, 10);
    const locationVariance = this.calculateLocationVariance(locations);
    
    // Abnormal if too many different locations or high variance
    const isAbnormal = locationClusters.length > 3 || locationVariance > 50;
    const confidence = Math.min(100, locations.length * 5);

    return {
      commonLocations: locationClusters,
      locationVariance,
      isAbnormal,
      confidence
    };
  }

  private analyzeDevicePattern(data: any[]): AttendancePattern['patterns']['devicePattern'] {
    const devices = data
      .filter(record => record.device_fingerprint)
      .map(record => record.device_fingerprint);

    const uniqueDevices = [...new Set(devices)];
    
    // Abnormal if using too many different devices
    const isAbnormal = uniqueDevices.length > 2;
    const confidence = Math.min(100, devices.length * 3);

    return {
      deviceFingerprints: uniqueDevices,
      uniqueDevices: uniqueDevices.length,
      isAbnormal,
      confidence
    };
  }

  private analyzeBehaviorPattern(data: any[]): AttendancePattern['patterns']['behaviorPattern'] {
    if (data.length === 0) {
      return {
        attendanceRate: 0,
        lateFrequency: 0,
        weekdayPattern: [0, 0, 0, 0, 0, 0, 0],
        isAbnormal: false,
        confidence: 0
      };
    }

    const totalDays = data.length;
    const lateDays = data.filter(record => record.violation_created).length;
    const attendanceRate = (totalDays / 30) * 100; // Assuming 30 day period
    const lateFrequency = (lateDays / totalDays) * 100;

    // Analyze weekday patterns
    const weekdayPattern = [0, 0, 0, 0, 0, 0, 0];
    data.forEach(record => {
      const date = new Date(record.attendance_date);
      const dayOfWeek = date.getDay();
      weekdayPattern[dayOfWeek]++;
    });

    // Abnormal if attendance rate too low or late frequency too high
    const isAbnormal = attendanceRate < 80 || lateFrequency > 20;
    const confidence = Math.min(100, totalDays * 5);

    return {
      attendanceRate,
      lateFrequency,
      weekdayPattern,
      isAbnormal,
      confidence
    };
  }

  private calculateOverallRisk(patterns: AttendancePattern['patterns']): AttendancePattern['overallRisk'] {
    const risks = [
      patterns.timePattern.isAbnormal,
      patterns.locationPattern.isAbnormal,
      patterns.devicePattern.isAbnormal,
      patterns.behaviorPattern.isAbnormal
    ];

    const riskCount = risks.filter(Boolean).length;
    const score = (riskCount / 4) * 100;
    
    let level: 'low' | 'medium' | 'high';
    if (score < 30) level = 'low';
    else if (score < 70) level = 'medium';
    else level = 'high';

    const recommendations = this.generateRecommendations(patterns);

    return { score, level, recommendations };
  }

  private generateRecommendations(patterns: AttendancePattern['patterns']): string[] {
    const recommendations: string[] = [];

    if (patterns.timePattern.isAbnormal) {
      recommendations.push('Pola waktu check-in tidak konsisten - perlu pemantauan lebih lanjut');
    }

    if (patterns.locationPattern.isAbnormal) {
      recommendations.push('Lokasi check-in bervariasi - verifikasi manual diperlukan');
    }

    if (patterns.devicePattern.isAbnormal) {
      recommendations.push('Menggunakan multiple device - kemungkinan titip presensi');
    }

    if (patterns.behaviorPattern.isAbnormal) {
      recommendations.push('Pola kehadiran abnormal - konseling atau tindakan disipliner diperlukan');
    }

    if (recommendations.length === 0) {
      recommendations.push('Pola presensi normal - tidak ada tindakan khusus diperlukan');
    }

    return recommendations;
  }

  // Helper methods
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  private clusterLocations(locations: Array<{lat: number, lng: number}>, radiusMeters: number) {
    const clusters: Array<{lat: number, lng: number, count: number}> = [];
    
    locations.forEach(location => {
      let added = false;
      for (const cluster of clusters) {
        const distance = this.calculateDistance(location.lat, location.lng, cluster.lat, cluster.lng);
        if (distance <= radiusMeters) {
          cluster.count++;
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push({ ...location, count: 1 });
      }
    });

    return clusters.sort((a, b) => b.count - a.count);
  }

  private calculateLocationVariance(locations: Array<{lat: number, lng: number}>): number {
    if (locations.length < 2) return 0;

    const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

    const distances = locations.map(loc => 
      this.calculateDistance(loc.lat, loc.lng, centerLat, centerLng)
    );

    const variance = distances.reduce((sum, dist) => sum + Math.pow(dist, 2), 0) / distances.length;
    return Math.sqrt(variance);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

interface MLPatternDetectorProps {
  studentId: string;
  onPatternAnalyzed?: (pattern: AttendancePattern) => void;
}

export const MLPatternDetectorComponent: React.FC<MLPatternDetectorProps> = ({
  studentId,
  onPatternAnalyzed
}) => {
  const [pattern, setPattern] = useState<AttendancePattern | null>(null);
  const [loading, setLoading] = useState(false);

  const detector = MLPatternDetector.getInstance();

  const analyzePattern = async () => {
    setLoading(true);
    try {
      const result = await detector.analyzeStudentPattern(studentId);
      setPattern(result);
      onPatternAnalyzed?.(result);
    } catch (error) {
      console.error('Pattern analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      analyzePattern();
    }
  }, [studentId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ML Pattern Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          onClick={analyzePattern}
          disabled={loading || !studentId}
          className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Menganalisis...' : 'Analisis Pola ML'}
        </button>

        {pattern && (
          <div className="space-y-4">
            {/* Overall Risk */}
            <div className="text-center">
              <Badge className={getRiskColor(pattern.overallRisk.level)}>
                Risk Level: {pattern.overallRisk.level.toUpperCase()} ({pattern.overallRisk.score.toFixed(1)}%)
              </Badge>
            </div>

            {/* Time Pattern */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Time Pattern</span>
                {getConfidenceIcon(pattern.patterns.timePattern.confidence)}
                <span className="text-sm text-gray-500">
                  {pattern.patterns.timePattern.confidence.toFixed(0)}% confidence
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>Rata-rata check-in: {pattern.patterns.timePattern.averageCheckIn}</div>
                <div>Variance: ±{pattern.patterns.timePattern.variance.toFixed(1)} menit</div>
                {pattern.patterns.timePattern.isAbnormal && (
                  <div className="text-red-600">⚠ Pola waktu tidak konsisten</div>
                )}
              </div>
            </div>

            {/* Location Pattern */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location Pattern</span>
                {getConfidenceIcon(pattern.patterns.locationPattern.confidence)}
                <span className="text-sm text-gray-500">
                  {pattern.patterns.locationPattern.confidence.toFixed(0)}% confidence
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>Lokasi umum: {pattern.patterns.locationPattern.commonLocations.length}</div>
                <div>Variance: {pattern.patterns.locationPattern.locationVariance.toFixed(1)}m</div>
                {pattern.patterns.locationPattern.isAbnormal && (
                  <div className="text-red-600">⚠ Lokasi terlalu bervariasi</div>
                )}
              </div>
            </div>

            {/* Device Pattern */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Device Pattern</span>
                {getConfidenceIcon(pattern.patterns.devicePattern.confidence)}
                <span className="text-sm text-gray-500">
                  {pattern.patterns.devicePattern.confidence.toFixed(0)}% confidence
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>Unique devices: {pattern.patterns.devicePattern.uniqueDevices}</div>
                {pattern.patterns.devicePattern.isAbnormal && (
                  <div className="text-red-600">⚠ Menggunakan terlalu banyak device</div>
                )}
              </div>
            </div>

            {/* Behavior Pattern */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4" />
                <span className="font-medium">Behavior Pattern</span>
                {getConfidenceIcon(pattern.patterns.behaviorPattern.confidence)}
                <span className="text-sm text-gray-500">
                  {pattern.patterns.behaviorPattern.confidence.toFixed(0)}% confidence
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>Attendance rate: {pattern.patterns.behaviorPattern.attendanceRate.toFixed(1)}%</div>
                <div>Late frequency: {pattern.patterns.behaviorPattern.lateFrequency.toFixed(1)}%</div>
                {pattern.patterns.behaviorPattern.isAbnormal && (
                  <div className="text-red-600">⚠ Pola kehadiran abnormal</div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {pattern.overallRisk.recommendations.length > 0 && (
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Rekomendasi AI:</div>
                  <ul className="text-sm space-y-1">
                    {pattern.overallRisk.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const mlPatternDetector = MLPatternDetector.getInstance();

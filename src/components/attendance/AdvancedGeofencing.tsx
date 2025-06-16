
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Wifi, Bluetooth, Signal, Shield, AlertTriangle } from 'lucide-react';

interface GeofenceValidation {
  gps: {
    isValid: boolean;
    accuracy: number;
    confidence: number;
  };
  wifi: {
    networks: string[];
    schoolNetworks: number;
    confidence: number;
  };
  bluetooth: {
    devices: string[];
    knownDevices: number;
    confidence: number;
  };
  cellular: {
    towers: string[];
    expectedTowers: number;
    confidence: number;
  };
  overall: {
    score: number;
    isValid: boolean;
    risks: string[];
  };
}

export class AdvancedGeofenceValidator {
  private static instance: AdvancedGeofenceValidator;
  
  // Known school infrastructure
  private schoolWifiNetworks = [
    'SMKN1KENDAL-STAFF',
    'SMKN1KENDAL-SISWA',
    'SMKN1KENDAL-GUEST',
    'SMKN1KENDAL-LAB'
  ];
  
  private schoolBluetoothDevices = [
    'SMKN1-PRINTER-01',
    'SMKN1-SPEAKER-AULA',
    'SMKN1-PROYEKTOR-01'
  ];
  
  private schoolCellTowers = [
    '510-10-12345',
    '510-10-12346',
    '510-10-12347'
  ];

  static getInstance(): AdvancedGeofenceValidator {
    if (!AdvancedGeofenceValidator.instance) {
      AdvancedGeofenceValidator.instance = new AdvancedGeofenceValidator();
    }
    return AdvancedGeofenceValidator.instance;
  }

  async validateLocation(latitude: number, longitude: number): Promise<GeofenceValidation> {
    const validation: GeofenceValidation = {
      gps: await this.validateGPS(latitude, longitude),
      wifi: await this.validateWifi(),
      bluetooth: await this.validateBluetooth(),
      cellular: await this.validateCellular(),
      overall: { score: 0, isValid: false, risks: [] }
    };

    // Calculate overall score
    validation.overall.score = this.calculateOverallScore(validation);
    validation.overall.isValid = validation.overall.score >= 70;
    validation.overall.risks = this.identifyRisks(validation);

    return validation;
  }

  private async validateGPS(lat: number, lng: number): Promise<GeofenceValidation['gps']> {
    // School coordinates
    const schoolLat = -6.9174639;
    const schoolLng = 110.2024914;
    const schoolRadius = 100; // meters
    
    const distance = this.calculateDistance(lat, lng, schoolLat, schoolLng);
    
    return {
      isValid: distance <= schoolRadius,
      accuracy: distance,
      confidence: distance <= schoolRadius ? 100 : Math.max(0, 100 - (distance - schoolRadius))
    };
  }

  private async validateWifi(): Promise<GeofenceValidation['wifi']> {
    try {
      // Note: Web API doesn't allow WiFi scanning for security reasons
      // In a real implementation, this would be done via a mobile app
      // For demo, we'll simulate detection
      const detectedNetworks = this.simulateWifiScan();
      const schoolNetworks = detectedNetworks.filter(network => 
        this.schoolWifiNetworks.some(school => network.includes(school))
      ).length;

      return {
        networks: detectedNetworks,
        schoolNetworks,
        confidence: Math.min(100, schoolNetworks * 25)
      };
    } catch (error) {
      return {
        networks: [],
        schoolNetworks: 0,
        confidence: 0
      };
    }
  }

  private async validateBluetooth(): Promise<GeofenceValidation['bluetooth']> {
    try {
      // Note: Web Bluetooth API requires user interaction
      // In a real implementation, this would be handled differently
      const detectedDevices = this.simulateBluetoothScan();
      const knownDevices = detectedDevices.filter(device =>
        this.schoolBluetoothDevices.some(school => device.includes(school))
      ).length;

      return {
        devices: detectedDevices,
        knownDevices,
        confidence: Math.min(100, knownDevices * 33)
      };
    } catch (error) {
      return {
        devices: [],
        knownDevices: 0,
        confidence: 0
      };
    }
  }

  private async validateCellular(): Promise<GeofenceValidation['cellular']> {
    try {
      // Note: Web API doesn't expose cellular tower information
      // In a real implementation, this would be done via native app
      const detectedTowers = this.simulateCellularScan();
      const expectedTowers = detectedTowers.filter(tower =>
        this.schoolCellTowers.includes(tower)
      ).length;

      return {
        towers: detectedTowers,
        expectedTowers,
        confidence: Math.min(100, expectedTowers * 33)
      };
    } catch (error) {
      return {
        towers: [],
        expectedTowers: 0,
        confidence: 0
      };
    }
  }

  private calculateOverallScore(validation: GeofenceValidation): number {
    const weights = {
      gps: 0.4,      // 40% - Primary location verification
      wifi: 0.25,    // 25% - Strong indicator of being in building
      bluetooth: 0.2, // 20% - Confirms proximity to school devices
      cellular: 0.15  // 15% - Additional verification layer
    };

    return Math.round(
      validation.gps.confidence * weights.gps +
      validation.wifi.confidence * weights.wifi +
      validation.bluetooth.confidence * weights.bluetooth +
      validation.cellular.confidence * weights.cellular
    );
  }

  private identifyRisks(validation: GeofenceValidation): string[] {
    const risks: string[] = [];

    if (!validation.gps.isValid) {
      risks.push('Lokasi GPS di luar area sekolah');
    }

    if (validation.gps.accuracy < 5) {
      risks.push('Akurasi GPS terlalu tinggi (kemungkinan fake GPS)');
    }

    if (validation.wifi.schoolNetworks === 0) {
      risks.push('Tidak terdeteksi jaringan WiFi sekolah');
    }

    if (validation.bluetooth.knownDevices === 0) {
      risks.push('Tidak terdeteksi perangkat Bluetooth sekolah');
    }

    if (validation.cellular.expectedTowers === 0) {
      risks.push('Tower seluler tidak sesuai dengan area sekolah');
    }

    if (validation.overall.score < 50) {
      risks.push('Skor validasi lokasi rendah');
    }

    return risks;
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

  // Simulation methods (replace with real implementations in production)
  private simulateWifiScan(): string[] {
    const random = Math.random();
    if (random > 0.7) {
      return ['SMKN1KENDAL-SISWA', 'SMKN1KENDAL-STAFF', 'WiFi-Tetangga', 'Home-WiFi'];
    } else if (random > 0.4) {
      return ['SMKN1KENDAL-SISWA', 'WiFi-Lain'];
    } else {
      return ['WiFi-Rumah', 'WiFi-Warnet'];
    }
  }

  private simulateBluetoothScan(): string[] {
    const random = Math.random();
    if (random > 0.8) {
      return ['SMKN1-PRINTER-01', 'SMKN1-SPEAKER-AULA', 'Device-Lain'];
    } else if (random > 0.5) {
      return ['SMKN1-PRINTER-01'];
    } else {
      return ['Earbuds-Pribadi', 'Speaker-Rumah'];
    }
  }

  private simulateCellularScan(): string[] {
    const random = Math.random();
    if (random > 0.7) {
      return ['510-10-12345', '510-10-12346'];
    } else {
      return ['510-10-99999', '510-10-88888'];
    }
  }
}

interface AdvancedGeofencingProps {
  onValidation?: (validation: GeofenceValidation) => void;
}

export const AdvancedGeofencing: React.FC<AdvancedGeofencingProps> = ({ onValidation }) => {
  const [validation, setValidation] = useState<GeofenceValidation | null>(null);
  const [loading, setLoading] = useState(false);

  const validator = AdvancedGeofenceValidator.getInstance();

  const performValidation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation tidak didukung');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await validator.validateLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setValidation(result);
          onValidation?.(result);
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error('Validation error:', error);
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Advanced Geofencing Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          onClick={performValidation}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Memvalidasi...' : 'Validasi Lokasi Multi-Layer'}
        </button>

        {validation && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <Badge className={getScoreColor(validation.overall.score)}>
                Skor Validasi: {validation.overall.score}/100
              </Badge>
              <div className="text-sm mt-1">
                {validation.overall.isValid ? 
                  <span className="text-green-600">✓ Lokasi Valid</span> : 
                  <span className="text-red-600">✗ Lokasi Tidak Valid</span>
                }
              </div>
            </div>

            {/* GPS Validation */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">GPS Location</span>
                <span className={getConfidenceColor(validation.gps.confidence)}>
                  {validation.gps.confidence}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Akurasi: {validation.gps.accuracy.toFixed(1)}m
              </div>
            </div>

            {/* WiFi Validation */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4" />
                <span className="font-medium">WiFi Networks</span>
                <span className={getConfidenceColor(validation.wifi.confidence)}>
                  {validation.wifi.confidence}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Jaringan sekolah: {validation.wifi.schoolNetworks}/{validation.wifi.networks.length}
              </div>
            </div>

            {/* Bluetooth Validation */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bluetooth className="h-4 w-4" />
                <span className="font-medium">Bluetooth Devices</span>
                <span className={getConfidenceColor(validation.bluetooth.confidence)}>
                  {validation.bluetooth.confidence}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Perangkat sekolah: {validation.bluetooth.knownDevices}/{validation.bluetooth.devices.length}
              </div>
            </div>

            {/* Cellular Validation */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Signal className="h-4 w-4" />
                <span className="font-medium">Cellular Towers</span>
                <span className={getConfidenceColor(validation.cellular.confidence)}>
                  {validation.cellular.confidence}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Tower sekolah: {validation.cellular.expectedTowers}/{validation.cellular.towers.length}
              </div>
            </div>

            {/* Risk Alerts */}
            {validation.overall.risks.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Risiko Terdeteksi:</div>
                  <ul className="text-sm space-y-1">
                    {validation.overall.risks.map((risk, index) => (
                      <li key={index}>• {risk}</li>
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

export const advancedGeofenceValidator = AdvancedGeofenceValidator.getInstance();

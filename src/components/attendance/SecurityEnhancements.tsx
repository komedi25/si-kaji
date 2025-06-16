
import React from 'react';

interface LocationValidation {
  isValid: boolean;
  confidence: number;
  reasons: string[];
}

export class AttendanceSecurityManager {
  private static instance: AttendanceSecurityManager;
  private locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number;
  }> = [];

  static getInstance(): AttendanceSecurityManager {
    if (!AttendanceSecurityManager.instance) {
      AttendanceSecurityManager.instance = new AttendanceSecurityManager();
    }
    return AttendanceSecurityManager.instance;
  }

  // Anti Fake GPS Detection
  validateLocation(latitude: number, longitude: number, accuracy: number): LocationValidation {
    const validation: LocationValidation = {
      isValid: true,
      confidence: 100,
      reasons: []
    };

    // Check accuracy - fake GPS often has perfect accuracy
    if (accuracy < 5) {
      validation.confidence -= 20;
      validation.reasons.push('Akurasi GPS terlalu tinggi (kemungkinan fake GPS)');
    }

    // Check location jump (teleportation detection)
    if (this.locationHistory.length > 0) {
      const lastLocation = this.locationHistory[this.locationHistory.length - 1];
      const distance = this.calculateDistance(
        latitude, longitude,
        lastLocation.latitude, lastLocation.longitude
      );
      const timeDiff = (Date.now() - lastLocation.timestamp) / 1000; // seconds
      const speed = distance / timeDiff; // m/s

      // If speed > 50 m/s (180 km/h), likely fake
      if (speed > 50) {
        validation.confidence -= 40;
        validation.reasons.push('Perpindahan lokasi tidak wajar (teleportasi)');
      }
    }

    // Check for suspicious patterns
    if (this.detectSuspiciousPattern(latitude, longitude)) {
      validation.confidence -= 30;
      validation.reasons.push('Pola lokasi mencurigakan terdeteksi');
    }

    // Store location history
    this.locationHistory.push({
      latitude,
      longitude,
      timestamp: Date.now(),
      accuracy
    });

    // Keep only last 10 locations
    if (this.locationHistory.length > 10) {
      this.locationHistory.shift();
    }

    validation.isValid = validation.confidence >= 60;
    return validation;
  }

  // Device fingerprinting for anti-titip presensi
  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      memory: (navigator as any).deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      timestamp: Date.now()
    };

    return btoa(JSON.stringify(fingerprint));
  }

  // Rate limiting untuk prevent abuse
  private lastAttendanceAttempt: number = 0;
  private attendanceAttempts: number = 0;

  checkRateLimit(): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttendanceAttempt;

    // Reset counter if more than 1 hour has passed
    if (timeSinceLastAttempt > 3600000) {
      this.attendanceAttempts = 0;
    }

    // Allow max 5 attempts per hour
    if (this.attendanceAttempts >= 5) {
      return {
        allowed: false,
        reason: 'Terlalu banyak percobaan presensi. Coba lagi dalam 1 jam.'
      };
    }

    // Minimum 30 seconds between attempts
    if (timeSinceLastAttempt < 30000) {
      return {
        allowed: false,
        reason: 'Tunggu 30 detik sebelum mencoba presensi lagi.'
      };
    }

    this.lastAttendanceAttempt = now;
    this.attendanceAttempts++;
    return { allowed: true };
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

  private detectSuspiciousPattern(lat: number, lng: number): boolean {
    // Check if coordinates are too perfect (fake GPS often uses exact coordinates)
    const latStr = lat.toString();
    const lngStr = lng.toString();
    
    // Perfect coordinates with many zeros
    if (latStr.includes('00000') || lngStr.includes('00000')) {
      return true;
    }

    // Check for commonly used fake coordinates
    const commonFakeCoords = [
      { lat: 0, lng: 0 },
      { lat: -6.9174639, lng: 110.2024914 }, // SMKN 1 Kendal exact coordinates
    ];

    for (const coord of commonFakeCoords) {
      const distance = this.calculateDistance(lat, lng, coord.lat, coord.lng);
      if (distance < 1) { // Within 1 meter of exact coordinate
        return true;
      }
    }

    return false;
  }
}

export const attendanceSecurityManager = AttendanceSecurityManager.getInstance();

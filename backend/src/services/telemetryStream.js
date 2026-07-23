// backend/src/services/telemetryStream.js
import { getIO } from '../socket.js';

// Base coordinates (Bengaluru metropolitan area for realistic Indian fleet rendering)
const BASE_VEHICLES = [
  { id: 'V-101', name: 'Tata Prima 5530.S Heavy Truck', lat: 12.9716, lng: 77.5946, speed: 62, fuel: 84, battery: 98, status: 'active', dtc: null },
  { id: 'V-102', name: 'Tata Nexon EV Fleet Edition', lat: 12.9352, lng: 77.6245, speed: 45, fuel: 100, battery: 72, status: 'active', dtc: null },
  { id: 'V-103', name: 'Mahindra Bolero Maxi Truck HD', lat: 12.9784, lng: 77.6408, speed: 0, fuel: 45, battery: 88, status: 'maintenance', dtc: 'P0300 - Engine Misfire' },
  { id: 'V-104', name: 'Ashok Leyland AVTR 2820 Rigid', lat: 12.9698, lng: 77.7499, speed: 58, fuel: 68, battery: 91, status: 'active', dtc: null },
  { id: 'V-105', name: 'Hyundai Tucson Hybrid', lat: 12.8452, lng: 77.6602, speed: 38, fuel: 52, battery: 64, status: 'active', dtc: 'P0171 - System Too Lean' },
  { id: 'V-106', name: 'Eicher Pro 3019 Commercial Van', lat: 13.0358, lng: 77.5970, speed: 50, fuel: 90, battery: 95, status: 'active', dtc: null }
];

let stateVehicles = [...BASE_VEHICLES];
let intervalId = null;

export function startTelemetryStream() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    try {
      const io = getIO();
      if (!io) return;

      // Update positions with small random delta to simulate driving along a route
      stateVehicles = stateVehicles.map(v => {
        if (v.status === 'maintenance') return v;

        const deltaLat = (Math.random() - 0.48) * 0.0015;
        const deltaLng = (Math.random() - 0.48) * 0.0015;
        const speedDelta = Math.floor((Math.random() - 0.5) * 6);
        const newSpeed = Math.max(20, Math.min(85, v.speed + speedDelta));
        const fuelDecay = Math.max(5, v.fuel - (Math.random() * 0.05));
        const batteryDecay = Math.max(10, v.battery - (Math.random() * 0.03));

        return {
          ...v,
          lat: v.lat + deltaLat,
          lng: v.lng + deltaLng,
          speed: newSpeed,
          fuel: Number(fuelDecay.toFixed(1)),
          battery: Number(batteryDecay.toFixed(1)),
          timestamp: new Date().toISOString()
        };
      });

      io.emit('telemetry:update', {
        timestamp: new Date().toISOString(),
        vehicles: stateVehicles
      });
    } catch (err) {
      // Socket might not be connected yet
    }
  }, 2500);

  console.log('⚡ Real-time Telemetry Stream service started');
}

export function stopTelemetryStream() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

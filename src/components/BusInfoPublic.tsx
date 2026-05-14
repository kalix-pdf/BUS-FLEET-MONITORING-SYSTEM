import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Bus,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Bus as BusType } from '../types';
import { busAPI, passengerAPI, tripAPI } from '../utils/api';
import { MapView } from './MapView';

interface BusInfoPublicProps {
  busId: string;
  busqrCodeId?: boolean;
  onClose?: () => void;
}

export function BusInfoPublic({ busId, busqrCodeId, onClose }: BusInfoPublicProps) {
  const [busData, setBusData] = useState<BusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [busStatus, setBusStatus] = useState<'on-time' | 'delayed' | 'emergency' | 'stopped'>('on-time');
  const [statusMessage, setStatusMessage] = useState('');
  const [currentPassengers, setCurrentPassengers] = useState(0);

  useEffect(() => {
    loadBusData();

    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      loadBusData();
    }, 10000);

    return () => clearInterval(interval);
  }, [busId]);

  const loadBusData = async () => {
    try {
      if (!busId) return;
      // Fetch bus data
      const busResponse = await busAPI.getById(busId);
      const bus = busResponse.data;

      if (!bus) {
        setLoading(false);
        return;
      }

      // Fetch active trip for this bus
      const tripsResponse = await tripAPI.getOngoing();
      const activeTrip = tripsResponse.data.find((trip: any) => trip.busId === busId);
      
      let passengerCount = 0;
      if (activeTrip) {
        // Fetch passengers for this trip
        // const passengersResponse = await passengerAPI.getByTrip(activeTrip.id);
        passengerCount = activeTrip?.passengersBoarded;
      }

      // Check for bus alerts
      try {
        const alertResponse = await busAPI.getAlert(busId);
        if (alertResponse.data) {
          setBusStatus(alertResponse.data.status);
          setStatusMessage(alertResponse.data.message || '');
        }
      } catch (error) {
        // No alert is fine, default to on-time
        setBusStatus('on-time');
      }

      // Convert to BusType format
      const busTypeData: BusType = {
        id: bus.id,
        plateNumber: bus.plateNumber,
        driver: bus.driver,
        route: bus.route,
        status: bus.status,
        currentPassengers: passengerCount,
        maxCapacity: bus.maxCapacity,
        location: {
          lat: bus.location?.lat || 14.5995,
          lng: bus.location?.lng || 120.9842,
          lastUpdated: bus.location?.lastUpdated ? new Date(bus.location.lastUpdated) : new Date(),
        },
        currentTrip: activeTrip?.id || undefined,
        qrCodeId: bus.qrCodeId,
      };

      setBusData(busTypeData);
      setCurrentPassengers(passengerCount);
      setLoading(false);
    } catch (error) {
      console.error('Error loading bus data:', error);
      toast.error('Failed to load bus information');
      setLoading(false);
    }
  };

  // const calculateETA = () => {
  //   return Math.floor(Math.random() * 10) + 3;
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bus information...</p>
        </motion.div>
      </div>
    );
  }

  if (!busData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">Bus Not Found</h3>
          <p className="text-gray-600">The requested bus information could not be found.</p>
          {onClose && (
            <>
              {!busqrCodeId && (
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Back to Portal{' '}
                </button>
              )}
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const occupancyPercentage = (currentPassengers / busData.maxCapacity) * 100;
  const isNearlyFull = occupancyPercentage >= 80;
  const isFilling = occupancyPercentage >= 50 && occupancyPercentage < 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        {onClose && (
          <>
            {!busqrCodeId && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onClose}
                className="mb-3 sm:mb-4 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-indigo-600 text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">
                  Back to Portal{' '}
                </button>
              </motion.button>
            )}
          </>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl px-3 sm:px-4 py-2 rounded-full shadow-lg mb-3 sm:mb-4">
            <Bus className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <span className="text-gray-600 text-xs sm:text-sm md:text-base">Real-time Bus Information</span>
          </div>
          <h2 className="text-gray-900 mb-1 sm:mb-2">{busData.plateNumber}</h2>
          <p className="text-gray-600 text-sm sm:text-base">{busData.route}</p>
        </motion.div>

        {/* Status Banner */}
        <AnimatePresence>
          {busStatus !== 'on-time' && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div
                className={`p-4 rounded-xl border-2 flex items-start gap-3 shadow-lg ${
                  busStatus === 'emergency'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : busStatus === 'delayed'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                <div
                  className={`p-2 rounded-full flex-shrink-0 ${
                    busStatus === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {busStatus === 'emergency' ? (
                    <AlertOctagon className="w-6 h-6 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {busStatus === 'emergency' ? 'EMERGENCY ALERT' : 'Trip Delayed'}
                  </h3>
                  <p className="text-sm opacity-90 font-medium">
                    {statusMessage ||
                      (busStatus === 'emergency'
                        ? 'This bus is experiencing an emergency.'
                        : 'This trip is currently delayed.')}
                  </p>
                  <p className="text-xs mt-1 opacity-75">
                    Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h3 className="text-gray-900 mb-1 sm:mb-2 text-base sm:text-lg">Bus Status</h3>
                  <p className="text-gray-600 text-sm capitalize">Driver: {busData.driver}</p> 
                  {/* {busStatus === 'on-time' && (<p className="text-gray-600 text-sm">ETA: {calculateETA()} mins</p>)} */}
                  <p className="text-gray-600 text-sm capitalize">Bus Status: {busStatus}</p>
                </div>
                <div
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 ${
                    busData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {busData.status === 'active' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Inactive</span>
                    </>
                  )}
                </div>
              </div>

              {/* Passenger Count */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      <span className="text-gray-700 text-sm sm:text-base">Passenger Load</span>
                    </div>
                    <span className="text-lg sm:text-xl text-gray-900">
                      {currentPassengers}/{busData.maxCapacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyPercentage}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className={`h-full rounded-full transition-colors ${
                        isNearlyFull ? 'bg-red-500' : isFilling ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                    <span className="text-xs text-gray-600">Available</span>
                    <span
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${
                        isNearlyFull
                          ? 'bg-red-100 text-red-700'
                          : isFilling
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {isNearlyFull ? 'Almost Full' : isFilling ? 'Filling Up' : 'Seats Available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                <h3 className="text-gray-900">Route Information</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start sm:items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm sm:text-base">Bus Route</span>
                  <span className="text-gray-900 text-right text-sm sm:text-base">{busData.route}</span>
                </div>
                {/* <div className="flex items-start sm:items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm sm:text-base">Bus Direction</span>
                  <span className="text-gray-900 text-sm sm:text-base">Northbound</span>
                </div> */}
                <div className="flex items-start sm:items-center justify-between py-2 sm:py-3">
                  <span className="text-gray-600 text-sm sm:text-base">Base Fare</span>
                  <span className="text-lg sm:text-xl text-indigo-600">₱15</span>
                </div>
                <div className="flex items-start sm:items-center justify-between py-2 sm:py-3">
                  <span className="text-gray-600 text-sm sm:text-base">20% Discount (Student / Senior / PWD)</span>
                  <span className="text-lg sm:text-xl text-indigo-600">₱12</span>
                </div>
              </div>
            </div>

            {/* Live Map Tracking */}
            {busData.status === 'active' && (
              <div className="bg-white rounded-xl overflow-hidden border-2 border-indigo-200">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <h4 className="text-gray-900 text-sm sm:text-base">Live GPS Tracking</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">Real-time location on map</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-700">Live</span>
                    </div>
                  </div>
                </div>
                <div className="h-[250px] sm:h-[300px] md:h-[350px]">
                  <MapView buses={[busData]} selectedBus={busData} onBusSelect={() => {}} height="100%" />
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Last updated: {busData.location.lastUpdated.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-gray-600 truncate max-w-full sm:max-w-none">
                      <span>
                        {busData.location.lat.toFixed(4)}, {busData.location.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Last Update - Removed since it's now in the map section */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

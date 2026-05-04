import { AlertTriangle, Bus, Clock, Loader2, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { BusInfo, Location } from "../../types/conductor";

interface TripCardProps {
  busInfo: BusInfo;
  isActive: boolean;
  passengerCount: number;
  isLoading: boolean;
  gpsGranted: boolean;
  currentLocation: Location | null;
  onStartTrip: () => void;
  onEndTrip: () => void;
  onEnableGPS: () => void;
}

export function TripCard({
  busInfo,
  isActive,
  passengerCount,
  isLoading,
  gpsGranted,
  currentLocation,
  onStartTrip,
  onEndTrip,
  onEnableGPS,
}: TripCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-4 sm:p-6 md:p-8 mb-4 md:mb-6 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
        <button
          onClick={isActive ? onEndTrip : onStartTrip}
          disabled={isLoading}
          className={`cursor-pointer px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 ${
            isActive
              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
              : "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              <span>{isActive ? "Ending Trip..." : "Starting Trip..."}</span>
            </>
          ) : isActive ? (
            <>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>End Trip</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Start Trip</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full sm:w-auto">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center flex-shrink-0">
            <Bus className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 md:mb-2 text-white text-xl sm:text-2xl">{busInfo.plateNumber}</h3>
            <p className="text-indigo-100 text-sm sm:text-base md:text-lg truncate">{busInfo.route}</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 md:mt-3">
              {/* <div className="flex items-center gap-2 text-indigo-100 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>
                  {passengerCount}/{busInfo.capacity} passengers
                </span>
              </div> */}
              <div className="flex flex-row gap-3">
                {isActive && (
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs sm:text-sm">Trip Active</span>
                  </div>
                )}
                {gpsGranted && currentLocation && (
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs sm:text-sm">GPS Active</span>
                  </div>
                )}
              </div>
              {!gpsGranted && (
                <button
                  onClick={onEnableGPS}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-yellow-500/20 rounded-full hover:bg-yellow-500/30 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                  <span className="text-yellow-100 text-xs sm:text-sm">Enable GPS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

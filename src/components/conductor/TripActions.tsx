import { AlertTriangle, CheckCircle, Package, Plus, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { BusInfo } from "../../types/conductor";

interface TripActionsProps {
  totalRevenue: number;
  passengerCount: number;
  busInfo: BusInfo;
  onIssueTicket: () => void;
  onUpdateStatus: () => void;
  onReportLostItem: () => void;
}

export function TripActions({
  passengerCount,
  busInfo,
  totalRevenue,
  onIssueTicket,
  onUpdateStatus,
  onReportLostItem,
}: TripActionsProps) {
  const capacity = busInfo.capacity || 0;
  const remainingSeats = Math.max(0, capacity - passengerCount);
  const capacityPercent = capacity > 0 ? Math.min(100, Math.round((passengerCount / capacity) * 100)) : 0;

  const isFull = capacity > 0 && passengerCount >= capacity;
  const isAlmostFull = !isFull && capacityPercent >= 80;

  const capacityStatus = isFull ? "Bus is full" : isAlmostFull ? "Almost full" : "Seats available";

  const capacityStatusIcon = isFull ? (
    <AlertTriangle className="w-4 h-4 text-red-600" />
  ) : isAlmostFull ? (
    <AlertTriangle className="w-4 h-4 text-orange-600" />
  ) : (
    <CheckCircle className="w-4 h-4 text-green-600" />
  );

  const progressBarColor = isFull ? "bg-red-500" : isAlmostFull ? "bg-orange-500" : "bg-green-500";

  return (
    <>
      {/* Capacity Overview */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`mb-4 md:mb-6 rounded-2xl border p-4 sm:p-5 shadow-lg ${
          isFull
            ? "border-red-200 bg-red-50"
            : isAlmostFull
              ? "border-orange-200 bg-orange-50"
              : "border-green-200 bg-green-50"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {capacityStatusIcon}
              <h3
                className={`font-semibold ${
                  isFull ? "text-red-900" : isAlmostFull ? "text-orange-900" : "text-green-900"
                }`}
              >
                {capacityStatus}
              </h3>
            </div>

            <p className={`text-sm ${isFull ? "text-red-700" : isAlmostFull ? "text-orange-700" : "text-green-700"}`}>
              {isFull
                ? "Maximum bus capacity has been reached. Ticket issuing is disabled."
                : `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining before reaching maximum capacity.`}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {passengerCount}/{capacity}
            </div>
            <div className="text-sm text-gray-600">Passenger Capacity</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600">Capacity Usage</span>
            <span className="text-xs sm:text-sm font-medium text-gray-800">{capacityPercent}%</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-white/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${capacityPercent}%` }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className={`h-full rounded-full ${progressBarColor}`}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6">
        {/* Issue Ticket Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={onIssueTicket}
          disabled={isFull}
          className={`col-span-1 sm:col-span-2 lg:col-span-2 w-full rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl transition-all active:scale-[0.98] group ${
            isFull
              ? "cursor-not-allowed bg-gray-300 text-gray-500 shadow-none opacity-80"
              : "cursor-pointer bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-3xl sm:hover:scale-[1.02]"
          }`}
        >
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-transform flex-shrink-0 ${
                isFull ? "bg-white/50" : "bg-white/20 group-hover:scale-110"
              }`}
            >
              {isFull ? (
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-500" />
              ) : (
                <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              )}
            </div>

            <div className="text-left">
              <h3
                className={`text-lg sm:text-xl md:text-2xl mb-0.5 sm:mb-1 ${isFull ? "text-gray-600" : "text-white"}`}
              >
                {isFull ? "Bus Capacity Full" : "Issue New Ticket"}
              </h3>

              <p className={`text-sm sm:text-base md:text-lg ${isFull ? "text-gray-500" : "text-green-100"}`}>
                {isFull
                  ? "No more seats available"
                  : `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining`}
              </p>
            </div>
          </div>
        </motion.button>

        {/* Stats Cards */}
        {/* <StatCard
          icon={<Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />}
          value={passengerCount}
          label="Total Passengers"
          delay={0.2}
        /> */}

        <StatCard
          icon={<Ticket className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />}
          value={`₱${totalRevenue}`}
          label="Total Revenue"
          delay={0.3}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 md:mb-6">
        <ActionButton
          icon={<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          label="Update Status"
          gradient="from-yellow-500 to-orange-500"
          onClick={onUpdateStatus}
          delay={0.4}
        />

        <ActionButton
          icon={<Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          label="Report Lost Item"
          gradient="from-purple-500 to-indigo-500"
          onClick={onReportLostItem}
          delay={0.5}
        />
      </div>
    </>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl text-gray-900 mb-1">{value}</div>
      <div className="text-gray-600 text-sm sm:text-base">{label}</div>
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
  delay: number;
}

function ActionButton({ icon, label, gradient, onClick, delay }: ActionButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2 sm:gap-3 active:scale-[0.98]"
    >
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}
      >
        {icon}
      </div>

      <span className="text-gray-900 text-sm sm:text-base font-medium text-center">{label}</span>
    </motion.button>
  );
}

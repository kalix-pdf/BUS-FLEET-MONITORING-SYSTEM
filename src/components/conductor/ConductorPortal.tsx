import { LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Hooks
import { useBusSelection, useBusStatus } from "../../hooks/useBusManagement";
import { useTripManagement } from "../../hooks/useTripManagement";

// Components
import { BusSelectionScreen } from "./BusSelectionScreen";
import { GPSPermissionModal } from "./GPSPermissionModal";
import { LostItemFormModal } from "./LostItemFormModal";
import { PassengerList } from "./PassengerList";
import { StatusUpdateModal } from "./StatusUpdateModal";
import { TicketFormData, TicketFormModal } from "./TicketFormModal";
import { TripActions } from "./TripActions";
import { TripCard } from "./TripCard";

// Types
import { STORAGE_KEYS } from "../../constants/conductor";
import { useGPSTracking } from "../../hooks/useGPSTracking";
import { BusPrinter } from "../../plugins/printer";
import { BusStatus, LostItem } from "../../types/conductor";
import { lostItemAPI } from "../../utils/api";
import { getPublicBusTrackingUrl } from "../../utils/publicUrl";

export function ConductorPortal() {
  const { busInfo, busNumberInput, isValidating, setBusNumberInput, validateBus, loadSavedBus, clearBus } =
    useBusSelection();

  const {
    isGranted: gpsGranted,
    currentLocation,
    isRequesting: isRequestingGps,
    requestPermission: requestGpsPermission,
    skipPermission: skipGps,
  } = useGPSTracking(busInfo?.id || null);

  const {
    isActive: tripActive,
    passengers,
    isLoading,
    loadActiveTrip,
    startTrip,
    endTrip,
    addPassenger,
    removePassenger,
    getTotalRevenue,
    getTotalPassengers,
  } = useTripManagement(busInfo);

  const { currentStatus, updateStatus } = useBusStatus(busInfo);

  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLostItemForm, setShowLostItemForm] = useState(false);
  const [busSelected, setBusSelected] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BusStatus | null>(null);

  const [isIssuingTicket, setIsIssuingTicket] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [lastReceiptText, setLastReceiptText] = useState<string | null>(null);
  const [lastReceiptQrText, setLastReceiptQrText] = useState<string | null>(null);

  useEffect(() => {
    const savedBus = loadSavedBus();

    if (savedBus) {
      setBusSelected(true);
      const alreadyHandled = ["true", "skipped"].includes(localStorage.getItem(STORAGE_KEYS.GPS_GRANTED) ?? "");
      setShowGpsModal(!alreadyHandled);
      loadActiveTrip(savedBus.id);
    }
  }, [loadSavedBus, loadActiveTrip]);

  const handleValidateBus = async () => {
    const bus = await validateBus();

    if (bus) {
      setBusSelected(true);
      setShowGpsModal(!gpsGranted);
      await loadActiveTrip(bus.id);
    }
  };

  const getTrackingQrText = () => {
    if (!busInfo?.id) return null;

    const trackingUrl = getPublicBusTrackingUrl(busInfo.id);
    return trackingUrl || null;
  };

  const formatReceipt = (ticketData: TicketFormData) => {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const passengerCount = Math.max(1, Number(ticketData.passengerCount || 1));
    const totalFare = Number(ticketData.fare);
    const unitFare = typeof ticketData.unitFare === "number" ? Number(ticketData.unitFare) : totalFare / passengerCount;

    const label = (key: string, value: string) => `${key.padEnd(11, " ")}: ${value}`;

    return `
${label("Date", date)}
${label("Time", time)}

${label("Ticket No.", ticketData.ticketNumber)}

${label("Driver Name", busInfo?.driver ?? "N/A")}
${label("Bus No.", busInfo?.plateNumber ?? "N/A")}
${label("Seat Cap.", String(busInfo?.capacity ?? "N/A"))}
${label("From", ticketData.boardingPoint)}
${label("To", ticketData.destination)}

${label("Pass. Type", ticketData.type.toUpperCase())}
${label("Pass. No.", String(passengerCount))}
${label("Pass. Fare", `PHP ${unitFare.toFixed(2)}`)}
${label("Total Fare", `PHP ${totalFare.toFixed(2)}`)}
${label("Payment", ticketData.paymentMethod.toUpperCase())}
  `.trim();
  };

  const handleIssueTicket = async (ticketData: TicketFormData) => {
    setIsIssuingTicket(true);

    try {
      const success = await addPassenger(ticketData);

      if (!success) {
        return false;
      }

      const receiptText = formatReceipt(ticketData);
      const qrText = getTrackingQrText();

      setLastReceiptText(receiptText);
      setLastReceiptQrText(qrText);

      toast.success("Ticket issued successfully");
      getTotalRevenue();

      setIsPrintingReceipt(true);
      try {
        await BusPrinter.printReceipt({
          text: receiptText,
          headerLines: [
            "DVDOTS COOPERATIVE",
            "Dasmariñas Van Drivers",
            "Operators Transport",
            "Service Cooperative",
            "Luisa Bldg. 3rd Floor,",
            "Camerino Ave. Zone 4",
            "Dasmariñas City, Cavite",
            "Tel no: +639945539286",
          ],
          footerLines: ["Thank you, have a safe trip"],
          ...(qrText ? { qrText, enableQr: true } : {}),
        });
        toast.success("Receipt sent to printer");
      } catch (error) {
        console.error("Print failed:", error);
        toast.error("Ticket issued, but printing failed.");
      } finally {
        setIsPrintingReceipt(false);
      }

      return true;
    } catch (error) {
      console.error("Issue ticket failed:", error);
      toast.error("Failed to issue ticket. Please try again.");
      return false;
    } finally {
      setIsIssuingTicket(false);
    }
  };

  const handleReprintLastReceipt = async () => {
    if (!lastReceiptText) {
      toast.error("No receipt available to reprint.");
      return;
    }

    try {
      setIsPrintingReceipt(true);

      await BusPrinter.printReceipt({
        text: lastReceiptText,
        headerLines: [
          "DVDOTS COOPERATIVE",
          "Dasmariñas Van Drivers",
          "Operators",
          "Transport Service Cooperative",
          "Luisa Bldg. 3rd Floor,",
          "Camerino Ave",
          "Zone 4 Dasmariñas City, Cavite",
          "Tel no: +639945539286",
        ],
        footerLines: ["Thank you, have a safe trip"],
        ...(lastReceiptQrText ? { qrText: lastReceiptQrText, enableQr: true } : {}),
      });

      toast.success("Receipt sent to printer");
    } catch (error) {
      console.error("Reprint failed:", error);
      toast.error("Failed to reprint receipt.");
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const handleChangeBus = () => {
    if (tripActive) {
      toast.error("Please end the current trip before changing bus.");
      return;
    }

    clearBus();
    setBusSelected(false);
  };

  const handleUpdateStatus = async (status: BusStatus, message: string = "") => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    setPendingStatus(status);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const startedAt = Date.now();

    try {
      const success = await updateStatus(status, message);

      const elapsed = Date.now() - startedAt;
      const minimumVisibleMs = 500;

      if (elapsed < minimumVisibleMs) {
        await new Promise((resolve) => setTimeout(resolve, minimumVisibleMs - elapsed));
      }

      if (success) {
        setShowStatusModal(false);
      }
    } finally {
      setIsUpdatingStatus(false);
      setPendingStatus(null);
    }
  };

  const handleReportLostItem = async (item: LostItem) => {
    if (!busInfo) return false;

    try {
      const itemId = `lf_${Date.now()}`;

      await lostItemAPI.create({
        id: itemId,
        ...item,
        busPlateNumber: busInfo.plateNumber,
        route: busInfo.route,
        foundBy: busInfo.driver,
      });

      toast.success("Lost item reported successfully!");
      return true;
    } catch (error) {
      console.error("Error reporting lost item:", error);
      toast.error("Failed to report lost item. Please try again.");
      return false;
    }
  };

  const handleGpsRequest = async () => {
    const granted = await requestGpsPermission();
    if (granted) {
      setShowGpsModal(false);
    }
  };

  const handleGpsSkip = () => {
    skipGps();
    setShowGpsModal(false);
  };

  if (!busSelected || !busInfo) {
    return (
      <BusSelectionScreen
        busNumberInput={busNumberInput}
        isValidating={isValidating}
        onBusNumberChange={setBusNumberInput}
        onValidate={handleValidateBus}
      />
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto w-full max-w-7xl px-2.5 py-2.5 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mb-3 md:mb-5"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur-sm sm:p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">Conductor Dashboard</h2>
              <p className="mt-0.5 text-xs text-gray-600 sm:text-sm md:text-base">Issue tickets and manage your trip</p>
            </div>

            <button
              disabled={isLoading || isIssuingTicket || isPrintingReceipt}
              onClick={handleChangeBus}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              <span>Change Bus</span>
            </button>
          </div>
        </motion.div>

        <div className="space-y-3 md:space-y-5">
          <TripCard
            busInfo={busInfo}
            isActive={tripActive}
            passengerCount={getTotalPassengers()}
            isLoading={isLoading}
            gpsGranted={gpsGranted}
            currentLocation={currentLocation}
            onStartTrip={startTrip}
            onEndTrip={endTrip}
            onEnableGPS={() => setShowGpsModal(true)}
          />

          {tripActive ? (
            <>
              <TripActions
                busInfo={busInfo}
                passengerCount={getTotalPassengers()}
                totalRevenue={getTotalRevenue()}
                onIssueTicket={() => setShowTicketForm(true)}
                onUpdateStatus={() => setShowStatusModal(true)}
                onReportLostItem={() => setShowLostItemForm(true)}
              />

              <PassengerList passengers={passengers} onRemovePassenger={removePassenger} />
            </>
          ) : (
            <NoActiveTripPlaceholder busPlateNumber={busInfo.plateNumber} />
          )}
        </div>

        <GPSPermissionModal
          isOpen={showGpsModal}
          currentLocation={currentLocation}
          isRequesting={isRequestingGps}
          onRequestPermission={handleGpsRequest}
          onSkip={handleGpsSkip}
        />

        <TicketFormModal
          busInfo={busInfo}
          passengerCount={getTotalPassengers()}
          isOpen={showTicketForm}
          isIssuingTicket={isIssuingTicket}
          isPrintingReceipt={isPrintingReceipt}
          onClose={() => setShowTicketForm(false)}
          onIssueTicket={handleIssueTicket}
          onReprintLastReceipt={handleReprintLastReceipt}
        />

        <StatusUpdateModal
          isOpen={showStatusModal}
          currentStatus={currentStatus}
          isUpdatingStatus={isUpdatingStatus}
          pendingStatus={pendingStatus}
          onClose={() => setShowStatusModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />

        <LostItemFormModal
          isOpen={showLostItemForm}
          isLoading={isLoading}
          onClose={() => setShowLostItemForm(false)}
          onReportItem={handleReportLostItem}
        />
      </div>
    </div>
  );
}

interface NoActiveTripPlaceholderProps {
  busPlateNumber: string;
}

function NoActiveTripPlaceholder({ busPlateNumber }: NoActiveTripPlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-lg sm:p-7 md:p-9"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 sm:h-18 sm:w-18 md:h-20 md:w-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-2xl sm:text-3xl md:text-4xl"
        >
          ⏱️
        </motion.div>
      </div>

      <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg md:text-xl">No Active Trip</h3>

      <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
        Click “Start Trip” to begin accepting passengers and issuing tickets.
      </p>

      <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
        <span>🚌</span>
        <span className="break-all sm:break-normal">Bus: {busPlateNumber}</span>
      </div>
    </motion.div>
  );
}

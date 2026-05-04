import { AlertTriangle, CheckCircle, PhilippinePeso, Printer, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { BOARDING_POINTS, COMMON_ROUTES, DESTINATIONS } from "../../constants/conductor";
import { BusInfo } from "../../types/conductor";

interface TicketFormModalProps {
  isOpen: boolean;
  isIssuingTicket: boolean;
  isPrintingReceipt: boolean;
  passengerCount: number;

  busInfo: BusInfo;
  onClose: () => void;
  onIssueTicket: (ticket: TicketFormData) => Promise<boolean>;
  onReprintLastReceipt?: () => Promise<void> | void;
}

export interface TicketFormData {
  ticketNumber: string;
  boardingPoint: string;
  destination: string;
  fare: number; // total fare
  unitFare?: number; // per-passenger fare
  paymentMethod: "cash" | "digital";
  type: string;
  passengerCount: number; // passengers added by this ticket
}

export function TicketFormModal({
  isOpen,
  isIssuingTicket,
  isPrintingReceipt,
  passengerCount: currentPassengerCount,
  busInfo,
  onClose,
  onIssueTicket,
  onReprintLastReceipt,
}: TicketFormModalProps) {
  const [boardingPoint, setBoardingPoint] = useState<string>(BOARDING_POINTS[0]);
  const [destination, setDestination] = useState<string>(DESTINATIONS[0]);

  // String states allow the user to erase and replace values smoothly.
  const [fare, setFare] = useState("45");
  const [ticketPassengerCount, setTicketPassengerCount] = useState("1");

  const [passengerType, setPassengerType] = useState<string>("regular");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "digital">("cash");

  const [boardingPointIsOther, setBoardingPointIsOther] = useState(false);
  const [destinationIsOther, setDestinationIsOther] = useState(false);
  const [boardingPointCustom, setBoardingPointCustom] = useState("");
  const [destinationCustom, setDestinationCustom] = useState("");

  const isBusy = isIssuingTicket || isPrintingReceipt;

  const effectiveBoardingPoint = boardingPointIsOther ? boardingPointCustom : boardingPoint;

  const effectiveDestination = destinationIsOther ? destinationCustom : destination;

  const capacity = busInfo.capacity || 0;
  const availableSeats = Math.max(0, capacity - currentPassengerCount);

  const safeFare = Math.max(0, Number(fare) || 0);
  const safeTicketPassengerCount = Math.max(1, Number(ticketPassengerCount) || 1);

  const isBusFull = capacity > 0 && currentPassengerCount >= capacity;

  const wouldExceedCapacity = capacity > 0 && safeTicketPassengerCount > availableSeats;

  const canIssueTicket = !isBusy && !isBusFull && !wouldExceedCapacity;

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((dest) => dest !== boardingPoint);
  }, [boardingPoint]);

  const calculateFare = (from: string, to: string) => {
    const route = COMMON_ROUTES.find((r) => r.from === from && r.to === to);
    return route?.fare ?? 45;
  };

  const getDefaultDestination = () => DESTINATIONS[0];

  const decreaseFare = () => {
    setFare((prev) => {
      const currentValue = Math.max(0, Number(prev) || 0);
      return String(Math.max(0, currentValue - 1));
    });
  };

  const increaseFare = () => {
    setFare((prev) => {
      const currentValue = Math.max(0, Number(prev) || 0);
      return String(currentValue + 1);
    });
  };

  const decreaseTicketPassengerCount = () => {
    setTicketPassengerCount((prev) => {
      const currentValue = Math.max(1, Number(prev) || 1);
      return String(Math.max(1, currentValue - 1));
    });
  };

  const increaseTicketPassengerCount = () => {
    setTicketPassengerCount((prev) => {
      const currentValue = Math.max(0, Number(prev) || 0);
      return String(currentValue + 1);
    });
  };

  const handleBoardingPointChange = (newBoardingPoint: string) => {
    if (newBoardingPoint === "__other__") {
      setBoardingPointIsOther(true);
      setBoardingPointCustom("");
      setFare("45");
      return;
    }

    setBoardingPointIsOther(false);
    setBoardingPoint(newBoardingPoint);

    const nextDestination = destination === newBoardingPoint ? getDefaultDestination() : destination;

    setDestination(nextDestination);
    setFare(String(calculateFare(newBoardingPoint, nextDestination)));
  };

  const handleDestinationChange = (newDestination: string) => {
    if (newDestination === "__other__") {
      setDestinationIsOther(true);
      setDestinationCustom("");
      setFare("45");
      return;
    }

    setDestinationIsOther(false);
    setDestination(newDestination);
    setFare(String(calculateFare(boardingPoint, newDestination)));
  };

  const resetForm = () => {
    const defaultBoardingPoint = BOARDING_POINTS[0];
    const defaultDestination = getDefaultDestination();

    setBoardingPoint(defaultBoardingPoint);
    setDestination(defaultDestination);
    setFare(String(calculateFare(defaultBoardingPoint, defaultDestination)));
    setPaymentMethod("cash");
    setPassengerType("regular");
    setBoardingPointIsOther(false);
    setDestinationIsOther(false);
    setBoardingPointCustom("");
    setDestinationCustom("");
    setTicketPassengerCount("1");
  };

  const handleSubmit = async () => {
    if (!canIssueTicket) return;

    const totalFare = safeFare * safeTicketPassengerCount;

    const ticketData: TicketFormData = {
      ticketNumber: `${Math.floor(100000 + Math.random() * 900000)}`,
      boardingPoint: effectiveBoardingPoint,
      destination: effectiveDestination,
      fare: totalFare,
      unitFare: safeFare,
      paymentMethod,
      type: passengerType,
      passengerCount: safeTicketPassengerCount,
    };

    const success = await onIssueTicket(ticketData);

    if (success) {
      resetForm();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isBusy && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 text-lg sm:text-xl font-semibold">Issue New Ticket</h3>

              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Capacity Warning */}
            {(isBusFull || wouldExceedCapacity) && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />

                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {isBusFull ? "Bus is already full" : "Exceeds bus capacity"}
                    </p>

                    <p className="text-sm text-red-700 mt-1">
                      {isBusFull
                        ? `Current passengers: ${currentPassengerCount}/${capacity}. No more tickets can be issued.`
                        : `Only ${availableSeats} seat${
                            availableSeats === 1 ? "" : "s"
                          } remaining, but this ticket adds ${safeTicketPassengerCount} passenger${
                            safeTicketPassengerCount === 1 ? "" : "s"
                          }.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isBusFull && !wouldExceedCapacity && capacity > 0 && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm text-green-900">
                  <span className="font-medium">{availableSeats}</span> seat{availableSeats === 1 ? "" : "s"} remaining.
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {/* Boarding Point */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Boarding Point</label>

                <select
                  value={boardingPointIsOther ? "__other__" : boardingPoint}
                  onChange={(e) => handleBoardingPointChange(e.target.value)}
                  disabled={isBusy}
                  className="cursor-pointer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {BOARDING_POINTS.map((point) => (
                    <option key={point} value={point}>
                      {point}
                    </option>
                  ))}

                  <option value="__other__">Other (type manually)</option>
                </select>

                <AnimatePresence>
                  {boardingPointIsOther && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={boardingPointCustom}
                        onChange={(e) => setBoardingPointCustom(e.target.value)}
                        placeholder="Enter boarding point..."
                        disabled={isBusy}
                        autoFocus
                        className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Destination</label>

                <select
                  value={destinationIsOther ? "__other__" : destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  disabled={isBusy}
                  className="cursor-pointer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {filteredDestinations.map((dest) => (
                    <option key={dest} value={dest}>
                      {dest}
                    </option>
                  ))}

                  <option value="__other__">Other (type manually)</option>
                </select>

                <AnimatePresence>
                  {destinationIsOther && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={destinationCustom}
                        onChange={(e) => setDestinationCustom(e.target.value)}
                        placeholder="Enter destination..."
                        disabled={isBusy}
                        autoFocus
                        className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                {/* Fare */}
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Fare</label>

                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-600">
                    <button
                      type="button"
                      onClick={decreaseFare}
                      disabled={isBusy || safeFare <= 0}
                      className="cursor-pointer px-3 py-3 bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200"
                    >
                      -
                    </button>

                    <div className="relative flex-1 min-w-0">
                      <div className="absolute inset-y-0 left-2 flex items-center text-gray-500 pointer-events-none">
                        <PhilippinePeso className="w-4 h-4" />
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={fare}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setFare(value);
                        }}
                        onBlur={() => {
                          if (fare === "" || Number(fare) < 0) {
                            setFare("0");
                          }
                        }}
                        disabled={isBusy}
                        className="w-full min-w-0 pl-7 pr-2 py-3 text-center focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={increaseFare}
                      disabled={isBusy}
                      className="cursor-pointer px-3 py-3 bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Number of Passengers */}
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Number of Passengers</label>

                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-600">
                    <button
                      type="button"
                      onClick={decreaseTicketPassengerCount}
                      disabled={isBusy || safeTicketPassengerCount <= 1}
                      className="cursor-pointer px-4 py-3 bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200"
                    >
                      -
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={ticketPassengerCount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setTicketPassengerCount(value);
                      }}
                      onBlur={() => {
                        if (ticketPassengerCount === "" || Number(ticketPassengerCount) < 1) {
                          setTicketPassengerCount("1");
                        }
                      }}
                      disabled={isBusy || isBusFull}
                      className="w-full min-w-0 px-2 py-3 text-center focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    <button
                      type="button"
                      onClick={increaseTicketPassengerCount}
                      disabled={isBusy || isBusFull}
                      className="cursor-pointer px-4 py-3 bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Payment Method</label>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "cash" | "digital")}
                  disabled={isBusy}
                  className="cursor-pointer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="cash">Cash</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Passenger Type</label>

                <select
                  value={passengerType}
                  onChange={(e) => setPassengerType(e.target.value)}
                  disabled={isBusy}
                  className="cursor-pointer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="regular">Regular</option>
                  <option value="student">Student</option>
                  <option value="pwd">PWD</option>
                  <option value="senior">Senior Citizen</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canIssueTicket}
              className={`w-full px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                canIssueTicket
                  ? "cursor-pointer bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                  : "cursor-not-allowed bg-gray-300 text-gray-600"
              }`}
            >
              {isBusFull ? (
                <>
                  <X className="w-5 h-5" />
                  Bus Full
                </>
              ) : wouldExceedCapacity ? (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Exceeds Capacity
                </>
              ) : isIssuingTicket ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Issuing ticket...
                </>
              ) : isPrintingReceipt ? (
                <>
                  <Printer className="w-5 h-5" />
                  Opening printer...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Issue Ticket
                </>
              )}
            </button>

            {isPrintingReceipt && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-900 leading-relaxed">
                  Ticket saved successfully. Opening printer service for receipt printing...
                </p>
              </div>
            )}

            {!isBusy && onReprintLastReceipt && (
              <button
                type="button"
                onClick={() => onReprintLastReceipt()}
                className="cursor-pointer mt-3 w-full px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Reprint Last Receipt
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

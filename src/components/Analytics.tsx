import { ArrowDownRight, ArrowUpRight, Bus, Calendar, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { busAPI, tripAPI } from '../utils/api';

interface Trip {
  id: string;
  busId: string;
  busPlateNumber: string;
  driver: string;
  route: string;
  status: 'ongoing' | 'completed';
  startTime: string;
  endTime?: string;
  passengers: any[];
  totalFare: number;
  passengersBoarded: number;
  regular: number;
  student: number;
  senior: number;
  pwd: number;
}

export function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  // const [selectedRange, setSelectedRange] = useState('7 Days');

  // const timeRanges = ['Today', '7 Days', '30 Days', 'Year'];

  useEffect(() => {
    loadAnalyticsData();

    // Refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const [tripsResponse, busesResponse] = await Promise.all([tripAPI.getAll(), busAPI.getAll()]);

      setAllTrips(tripsResponse.data || []);
      setBuses(busesResponse.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      if (allTrips.length === 0) {
        // Only show error if we don't have any cached data
        toast.error('Failed to load analytics data');
      }
      setIsLoading(false);
    }
  };

  // Calculate metrics from real data
  const calculateMetrics = () => {
    const completedTrips = allTrips.filter((trip) => trip.status === 'completed');
    const ongoingTrips = allTrips.filter((trip) => trip.status === 'ongoing');

    // Total trips
    const totalTrips = completedTrips.length;

    // Total passengers and revenue from trip data (more efficient)
    let totalPassengers = 0;
    let totalRevenue = 0;

    allTrips.forEach((trip) => {
      // Use the totalFare and passengersBoarded fields that are already tracked
      totalRevenue += trip.totalFare || 0;
      totalPassengers += trip.passengersBoarded || 0;
    });

    // Calculate average trip duration for completed trips
    let totalDuration = 0;
    let tripCount = 0;

    completedTrips.forEach((trip) => {
      if (trip.startTime && trip.endTime) {
        const start = new Date(trip.startTime).getTime();
        const end = new Date(trip.endTime).getTime();
        const duration = (end - start) / (1000 * 60); // minutes
        if (duration > 0 && duration < 300) {
          // Filter out invalid durations
          totalDuration += duration;
          tripCount++;
        }
      }
    });

    const avgDuration = tripCount > 0 ? Math.round(totalDuration / tripCount) : 0;

    return {
      totalRevenue,
      totalTrips: totalTrips + ongoingTrips.length,
      totalPassengers,
      avgDuration,
    };
  };

  // Calculate trip volume by hour
  const calculateTripVolume = () => {
    const hourlyData: { [key: string]: { trips: number; passengers: number } } = {};

    // Initialize all hours
    for (let i = 6; i <= 19; i++) {
      const hour = i <= 11 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
      hourlyData[hour] = { trips: 0, passengers: 0 };
    }

    // Aggregate data
    allTrips.forEach((trip) => {
      const startTime = new Date(trip.startTime);
      const hour = startTime.getHours();
      const hourLabel = hour <= 11 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

      if (hourlyData[hourLabel]) {
        hourlyData[hourLabel].trips++;
        hourlyData[hourLabel].passengers += (trip.passengers || []).length;
      }
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour,
      trips: data.trips,
      passengers: data.passengers,
    }));
  };

  // Calculate bus performance
  const calculateBusPerformance = () => {
    const busStats: { [key: string]: any } = {};

    allTrips.forEach((trip) => {
      if (!busStats[trip.busId]) {
        busStats[trip.busId] = {
          plate: trip.busPlateNumber,
          trips: 0,
          passengers: 0,
          revenue: 0,
          regular: 0,
          student: 0,
          pwd: 0,
          senior: 0
        };
      }

      busStats[trip.busId].trips++;
      // Use the tracked totalFare and passengersBoarded from the trip
      busStats[trip.busId].passengers += trip.passengersBoarded || 0;
      busStats[trip.busId].revenue += trip.totalFare || 0;
      busStats[trip.busId].regular += trip.regular || 0;
      busStats[trip.busId].student += trip.student || 0;
      busStats[trip.busId].pwd += trip.pwd || 0;
      busStats[trip.busId].senior += trip.senior || 0;
    });

    // Calculate efficiency (avg passengers per trip vs capacity)
    const busPerformance = Object.values(busStats).map((stat: any) => {
      const bus = buses.find((b) => b.id === stat.busId || b.plateNumber === stat.plate);
      const capacity = bus?.maxCapacity || 18;
      const avgPassengers = stat.trips > 0 ? stat.passengers / stat.trips : 0;
      const efficiency = Math.round((avgPassengers / capacity) * 100);

      return {
        ...stat,
        efficiency: Math.min(efficiency, 100),
      };
    });

    // Sort by trips and return top 4
    return busPerformance.sort((a, b) => b.trips - a.trips).slice(0, 4);
  };

  // Calculate revenue by route
  const calculateRevenueByRoute = () => {
    const routeStats: { [key: string]: { trips: number; revenue: number } } = {};

    allTrips.forEach((trip) => {
      if (!routeStats[trip.route]) {
        routeStats[trip.route] = { trips: 0, revenue: 0 };
      }

      routeStats[trip.route].trips++;
      // Use the totalFare that's already tracked in the trip
      routeStats[trip.route].revenue += trip.totalFare || 0;
    });

    const totalRevenue = Object.values(routeStats).reduce((sum, stat) => sum + stat.revenue, 0);

    return Object.entries(routeStats)
      .map(([route, stats]) => ({
        route,
        trips: stats.trips,
        revenue: stats.revenue,
        percentage: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const tripVolumeData = calculateTripVolume();
  const busPerformance = calculateBusPerformance();
  const revenueByRoute = calculateRevenueByRoute();

  const maxTrips = Math.max(...tripVolumeData.map((d) => d.trips), 1);
  const maxPassengers = Math.max(...tripVolumeData.map((d) => d.passengers), 1);

  const metricsDisplay = [
    {
      label: 'Total Revenue',
      value: `₱${metrics.totalRevenue.toLocaleString()}`,
      change: metrics.totalRevenue > 0 ? '+' : '0%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Total Trips',
      value: metrics.totalTrips.toString(),
      change: metrics.totalTrips > 0 ? '+' : '0%',
      trend: 'up' as const,
      icon: Bus,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Total Passengers',
      value: metrics.totalPassengers.toLocaleString(),
      change: metrics.totalPassengers > 0 ? '+' : '0%',
      trend: 'up' as const,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Avg Trip Duration',
      value: `${metrics.avgDuration} min`,
      change: metrics.avgDuration > 0 ? '-' : '0%',
      trend: 'down' as const,
      icon: Clock,
      color: 'from-orange-500 to-red-600',
    },
  ];

  // Calculate insights
  const peakHours = tripVolumeData
    .filter((d) => d.trips > 0)
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 2)
    .map((d) => d.hour)
    .join(' & ');

  const avgPassengersPerTrip = metrics.totalTrips > 0 ? (metrics.totalPassengers / metrics.totalTrips).toFixed(1) : '0';

  const avgCapacity = buses.length > 0 ? buses.reduce((sum, b) => sum + (b.maxCapacity || 0), 0) / buses.length : 18;

  const capacityUtilization =
    avgCapacity > 0 ? ((parseFloat(avgPassengersPerTrip) / avgCapacity) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-gray-900 mb-2">Analytics & Insights</h2>
              <p className="text-gray-600">Comprehensive performance metrics from real data</p>
            </div>

            {/* Time Range Selector */}
            {/* <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-lg">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedRange === range
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div> */}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {metricsDisplay.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 1, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.1 * index,
                  duration: 0.1,
                  ease: 'easeOut',
                }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className={`p-6 bg-gradient-to-r ${metric.color} text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-8 h-8" />
                    {metric.change !== '0%' && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          metric.trend === 'up' ? 'bg-white/20' : 'bg-black/20'
                        }`}
                      >
                        <TrendIcon className="w-3 h-3" />
                        {metric.change}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl mb-1">{metric.value}</div>
                  <div className="text-sm opacity-90">{metric.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Trip Volume Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-1">Trip Volume by Hour</h3>
                <p className="text-gray-600 text-sm">Hourly distribution of trips</p>
              </div>
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>

            {tripVolumeData.some((d) => d.trips > 0) ? (
              <div className="space-y-2">
                {tripVolumeData.map((data, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{data.hour}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-600">{data.trips} trips</span>
                        <span className="text-purple-600">{data.passengers} pax</span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.trips / maxTrips) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + index * 0.05 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.passengers / maxPassengers) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + index * 0.05 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500/40 to-pink-500/40 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No trip data available yet</p>
              </div>
            )}
          </motion.div>

          {/* Revenue by Route */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-1">Revenue by Route</h3>
                <p className="text-gray-600 text-sm">Route performance comparison</p>
              </div>
              <DollarSign className="w-6 h-6 text-gray-400" />
            </div>

            {revenueByRoute.length > 0 ? (
              <div className="space-y-6">
                {revenueByRoute.slice(0, 3).map((route, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-gray-900">{route.route}</h4>
                        <p className="text-gray-600 text-sm">{route.trips} trips completed</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl text-gray-900">₱{route.revenue.toLocaleString()}</div>
                        <div className="text-green-600 text-sm">{route.percentage}% of total</div>
                      </div>
                    </div>

                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${route.percentage}%` }}
                        transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          index === 0
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                            : index === 1
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}

                {/* Total */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Total Revenue</span>
                    <span className="text-2xl text-gray-900">₱{metrics.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No revenue data available yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bus Performance Table */}
        {busPerformance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">Individual Bus Performance</h3>
                  <p className="text-gray-600 text-sm">Top performing vehicles</p>
                </div>
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-600">Rank</th>
                    <th className="text-left py-4 px-6 text-gray-600">Plate Number</th>
                    <th className="text-left py-4 px-6 text-gray-600">Trips</th>
                    <th className="text-left py-4 px-6 text-gray-600">Passengers</th>
                    <th className="text-left py-4 px-6 text-gray-600">Regular</th>
                    <th className="text-left py-4 px-6 text-gray-600">Student</th>
                    <th className="text-left py-4 px-6 text-gray-600">PWD</th>
                    <th className="text-left py-4 px-6 text-gray-600">Senior Citizen</th>
                    <th className="text-left py-4 px-6 text-gray-600">Revenue</th>
                    <th className="text-left py-4 px-6 text-gray-600">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {busPerformance.map((bus, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                              : index === 1
                                ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                                : index === 2
                                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white'
                                  : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Bus className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-gray-900">{bus.plate}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900">{bus.trips}</td>
                      <td className="py-4 px-6 text-gray-900">{bus.passengers}</td>
                      <td className="py-4 px-6 text-gray-900">{bus.regular}</td>
                      <td className="py-4 px-6 text-gray-900">{bus.student}</td>
                      <td className="py-4 px-6 text-gray-900">{bus.pwd}</td>
                      <td className="py-4 px-6 text-gray-900">{bus.senior}</td>
                      <td className="py-4 px-6 text-gray-900">₱{bus.revenue.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bus.efficiency}%` }}
                              transition={{ duration: 1, delay: 1.2 + index * 0.1 }}
                              className={`h-2 rounded-full ${
                                bus.efficiency >= 90
                                  ? 'bg-green-500'
                                  : bus.efficiency >= 80
                                    ? 'bg-yellow-500'
                                    : 'bg-orange-500'
                              }`}
                            />
                          </div>
                          <span className="text-gray-900 text-sm">{bus.efficiency}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Insights Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg"
          >
            <TrendingUp className="w-10 h-10 mb-4" />
            <h4 className="mb-2">Peak Performance</h4>
            <p className="text-green-100 text-sm">
              {peakHours ? `Best hours: ${peakHours}` : 'No trip data to analyze yet'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl p-6 shadow-lg"
          >
            <Users className="w-10 h-10 mb-4" />
            <h4 className="mb-2">Avg Passengers</h4>
            <p className="text-blue-100 text-sm">
              {avgPassengersPerTrip} passengers per trip, {capacityUtilization}% capacity utilization
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6 shadow-lg"
          >
            <DollarSign className="w-10 h-10 mb-4" />
            <h4 className="mb-2">Total Revenue</h4>
            <p className="text-purple-100 text-sm">
              ₱{metrics.totalRevenue.toLocaleString()} from {metrics.totalTrips} trips
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

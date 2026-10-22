import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { MapPin, Loader2 } from "lucide-react";

interface TrackedDelivery {
  id: number;
  trackingNumber: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  driver?: {
    id: number;
    name: string;
  };
  assignments?: {
    id: number;
    assignmentType: "PICKUP" | "TRANSIT" | "CUSTOMER";
    assignedAt: string;
    driver?: { id: number; name: string };
  }[];
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export default function CompanyTracking() {
  const [deliveries, setDeliveries] = useState<TrackedDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<TrackedDelivery | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tracking/company/deliveries");
      setDeliveries(res.data || []);
    } catch (error) {
      console.error("Failed to load deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "PICKED_UP":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Track My Deliveries
          </h1>
          <button
            onClick={loadDeliveries}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deliveries List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              My Deliveries
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : deliveries.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(delivery)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition ${
                      selectedDelivery?.id === delivery.id
                        ? "border-blue-500 bg-blue-50 dark:bg-slate-800"
                        : "border-gray-200 dark:border-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <p className="font-bold text-sm text-gray-800 dark:text-white">
                      {delivery.trackingNumber}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {delivery.customerName}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStatusColor(
                        delivery.status
                      )}`}
                    >
                      {delivery.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No deliveries</p>
            )}
          </div>

          {/* Selected Delivery Details */}
          {selectedDelivery && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Delivery Details
                </h3>
              </div>

              <div className="space-y-4">
                {/* Tracking Info */}
                <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold mb-2">
                    Tracking Number
                  </p>
                  <p className="font-mono text-lg text-gray-800 dark:text-white">
                    {selectedDelivery.trackingNumber}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-full font-bold ${getStatusColor(
                      selectedDelivery.status
                    )}`}
                  >
                    {selectedDelivery.status}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer Name</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedDelivery.customerName}
                    </p>
                  </div>
                  {selectedDelivery.driver && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Driver</p>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {selectedDelivery.driver.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Addresses */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pickup Address</p>
                  <p className="text-gray-800 dark:text-white">
                    {selectedDelivery.pickupAddress}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dropoff Address</p>
                  <p className="text-gray-800 dark:text-white">
                    {selectedDelivery.dropoffAddress}
                  </p>
                </div>

                {/* Current Location */}
                {selectedDelivery.currentLocation && (
                  <div className="p-4 bg-green-50 dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-600">
                    <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-3 flex items-center gap-2">
                      <MapPin size={16} />
                      Live Location
                    </p>
                    <div className="space-y-2 text-sm mb-3">
                      <p>
                        <span className="text-gray-600 dark:text-gray-400">Latitude:</span>{" "}
                        <span className="font-mono font-bold">
                          {selectedDelivery.currentLocation.latitude.toFixed(6)}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600 dark:text-gray-400">Longitude:</span>{" "}
                        <span className="font-mono font-bold">
                          {selectedDelivery.currentLocation.longitude.toFixed(6)}
                        </span>
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedDelivery.currentLocation.latitude},${selectedDelivery.currentLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold text-sm block text-center"
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}

                {selectedDelivery.assignments && selectedDelivery.assignments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Driver history</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-800 dark:text-white">
                      {selectedDelivery.assignments.map((assignment) => (
                        <p key={assignment.id}>
                          <span className="font-semibold">{assignment.assignmentType}</span>{" "}
                          {assignment.driver?.name || "Driver"} - {new Date(assignment.assignedAt).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
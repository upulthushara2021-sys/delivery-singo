import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import api from "../api/axios";

interface DeliveryTracking {
  id: number;
  trackingNumber: string;
  customerName: string;
  customerMobile: string;
  dropoffAddress: string;
  pickupDistrict?: string;
  pickupBranch?: string;
  currentDistrict?: string;
  currentBranch?: string;
  dropoffDistrict?: string;
  dropoffBranch?: string;
  amount: number;
  deliveryCharge: number;
  paymentType: string;
  status: string;
  driver?: {
    id: number;
    name: string;
    mobile: string;
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

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return 0;
};

export default function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [delivery, setDelivery] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDelivery = async () => {
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/tracking/by-number/${trackingNumber}`);
      setDelivery(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Delivery not found");
      setDelivery(null);
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
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Track Your Delivery
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your tracking number to see real-time delivery status
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchDelivery()}
              placeholder="Enter tracking number (e.g., TRK-1234567-ABC)"
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-lg"
            />
            <button
              onClick={searchDelivery}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
              {loading ? "Searching..." : "Track"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Tracking Results */}
        {delivery && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Tracking Number
                  </p>
                  <p className="font-mono text-2xl font-bold text-gray-800 dark:text-white">
                    {delivery.trackingNumber}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(
                    delivery.status
                  )}`}
                >
                  {delivery.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Customer Name
                  </p>
                  <p className="text-gray-800 dark:text-white font-semibold text-lg">
                    {delivery.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Customer Mobile
                  </p>
                  <p className="text-gray-800 dark:text-white font-semibold text-lg">
                    {delivery.customerMobile}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-slate-800 rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pickup Branch</p>
                  <p className="text-gray-800 dark:text-white font-semibold">
                    {delivery.pickupBranch || delivery.pickupDistrict || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-blue-400 text-sm mb-1">Current Branch</p>
                  <p className="text-gray-800 dark:text-white font-bold">
                    {delivery.currentBranch || delivery.currentDistrict || "In transit"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Dropoff Branch</p>
                  <p className="text-gray-800 dark:text-white font-semibold">
                    {delivery.dropoffBranch || delivery.dropoffDistrict || "Not assigned"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            {delivery.currentLocation && (
              <div className="bg-green-50 dark:bg-slate-800 border-2 border-green-200 dark:border-green-600 rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="text-green-600" size={24} />
                  <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                    Current Location
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                      Latitude
                    </p>
                    <p className="font-mono text-lg font-bold text-gray-800 dark:text-white">
                      {delivery.currentLocation.latitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                      Longitude
                    </p>
                    <p className="font-mono text-lg font-bold text-gray-800 dark:text-white">
                      {delivery.currentLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps?q=${delivery.currentLocation.latitude},${delivery.currentLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
                >
                  View on Google Maps
                </a>
              </div>
            )}

            {/* Delivery Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Delivery Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Dropoff Address
                  </p>
                  <p className="text-gray-800 dark:text-white">
                    {delivery.dropoffAddress}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Amount
                  </p>
                  <p className="text-gray-800 dark:text-white font-bold text-lg">
                    Rs.{toNumber(delivery.amount).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Delivery Charge
                  </p>
                  <p className="text-gray-800 dark:text-white font-bold text-lg">
                    Rs.{toNumber(delivery.deliveryCharge).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Payment Type
                  </p>
                  <p
                    className={`font-bold text-lg ${
                      delivery.paymentType === "COD"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {delivery.paymentType}
                  </p>
                </div>

                {delivery.driver && (
                  <>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        Assigned Driver
                      </p>
                      <p className="text-gray-800 dark:text-white font-semibold">
                        {delivery.driver.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        Driver Mobile
                      </p>
                      <p className="text-gray-800 dark:text-white font-semibold">
                        {delivery.driver.mobile}
                      </p>
                    </div>
                  </>
                )}

                {delivery.assignments && delivery.assignments.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      Driver history
                    </p>
                    <div className="space-y-1 text-gray-800 dark:text-white">
                      {delivery.assignments.map((assignment) => (
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
          </div>
        )}

        {/* Empty State */}
        {!loading && !delivery && !error && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Enter a tracking number above to track your delivery
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
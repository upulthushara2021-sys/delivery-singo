import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../api/axios";

let socket: any = null;

type DriverLocation = {
  driverId: number;
  lat: number;
  lng: number;
};

type LocationState = {
  [key: number]: DriverLocation;
};

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = {
  lat: 7.8731,
  lng: 80.7718,
};

export default function LiveMap() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "",
  });

  const [locations, setLocations] = useState<LocationState>({});
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection only once
    if (!socket) {
      socket = io(API_BASE_URL);
    }

    // Only emit location if user is a DRIVER
    if (user?.role === "DRIVER") {
      const watchId = navigator.geolocation.watchPosition((position) => {
        const data = {
          driverId: user.id,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        socket.emit("sendLocation", data);
      });

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }

    // Listen for location updates
    socket.on("driverLocation", (data: DriverLocation) => {
      setLocations((prev: LocationState) => ({
        ...prev,
        [data.driverId]: data,
      }));
    });

    return () => {
      socket.off("driverLocation");
    };
  }, [user]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={8}>
      {Object.values(locations).map((d) => (
        <Marker
          key={d.driverId}
          position={{ lat: d.lat, lng: d.lng }}
          label={`Driver ${d.driverId}`}
        />
      ))}
    </GoogleMap>
  );
}
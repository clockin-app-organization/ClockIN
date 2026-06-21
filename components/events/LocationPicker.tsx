'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon
const defaultIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: Props) {
  const [marker, setMarker] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [search, setSearch] = useState('');
  const [center, setCenter] = useState<[number, number] | null>(marker ?? [8.4844, -13.2344]); // default Freetown

  const handleSearch = async () => {
    if (!search.trim()) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
    );
    const data = await res.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      setMarker([parseFloat(lat), parseFloat(lon)]);
      setCenter([parseFloat(lat), parseFloat(lon)]);
      onLocationSelect(parseFloat(lat), parseFloat(lon));
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMarker([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base flex-1"
        />
        <button type="button" onClick={handleSearch} className="btn-secondary">
          Search
        </button>
      </div>
      <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={center ?? [8.4844, -13.2344]}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {marker && <Marker position={marker} icon={defaultIcon} />}
          <MapClickHandler onClick={handleMapClick} />
          <MapCenterUpdater center={center} />
        </MapContainer>
      </div>
    </div>
  );
}
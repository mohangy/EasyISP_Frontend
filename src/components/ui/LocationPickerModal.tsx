import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { X, MapPin, Loader2, Navigation, Check, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const selectedIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const currentLocationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to recenter map
function MapRecenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export function LocationPickerModal({
    isOpen,
    onClose,
    onSelect,
    initialLat,
    initialLng,
}: LocationPickerModalProps) {
    // Default to Mombasa, Kenya
    const defaultCenter: [number, number] = [-4.0435, 39.6682];

    const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );
    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : defaultCenter
    );
    const [loading, setLoading] = useState(true);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [address, setAddress] = useState<string>("");
    const [fetchingAddress, setFetchingAddress] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Get current GPS location when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setGpsError(null);

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
                        setCurrentPosition(pos);
                        // Only center on GPS if no initial position provided
                        if (!initialLat && !initialLng) {
                            setMapCenter(pos);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error("GPS error:", error);
                        setGpsError("Could not get GPS location. Click on the map to select location.");
                        setLoading(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            } else {
                setGpsError("GPS not available in this browser");
                setLoading(false);
            }
        }
    }, [isOpen, initialLat, initialLng]);

    // Reverse geocode to get address
    const fetchAddress = async (lat: number, lng: number) => {
        setFetchingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { "User-Agent": "EasyISP/1.0" } }
            );
            if (response.ok) {
                const data = await response.json();
                setAddress(data.display_name || "");
            }
        } catch (error) {
            console.error("Failed to fetch address:", error);
        } finally {
            setFetchingAddress(false);
        }
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setSelectedPosition([lat, lng]);
        fetchAddress(lat, lng);
    };

    const handleConfirm = () => {
        if (selectedPosition) {
            onSelect(selectedPosition[0], selectedPosition[1], address);
            onClose();
        }
    };

    const handleUseCurrentLocation = () => {
        if (currentPosition) {
            setSelectedPosition(currentPosition);
            setMapCenter(currentPosition);
            fetchAddress(currentPosition[0], currentPosition[1]);
        }
    };

    // Search for location using OpenStreetMap Nominatim
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setShowResults(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
                { headers: { "User-Agent": "EasyISP/1.0" } }
            );
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Navigate to search result
    const handleSelectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setMapCenter([lat, lng]);
        setSelectedPosition([lat, lng]);
        setAddress(result.display_name);
        setShowResults(false);
        setSearchQuery("");
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Location</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search location (e.g., Nyali, Mombasa)"
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searching || !searchQuery.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Search
                            </button>
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectSearchResult(result)}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                    >
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{result.display_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showResults && !searching && searchResults.length === 0 && searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-sm text-slate-500">
                                No locations found
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Container */}
                <div className="relative h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Getting your location...</p>
                            </div>
                        </div>
                    ) : (
                        <MapContainer
                            center={mapCenter}
                            zoom={15}
                            style={{ height: "100%", width: "100%" }}
                            className="z-0"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapClickHandler onLocationSelect={handleLocationSelect} />
                            <MapRecenter center={mapCenter} />

                            {/* Current location marker (blue) */}
                            {currentPosition && (
                                <Marker position={currentPosition} icon={currentLocationIcon} />
                            )}

                            {/* Selected location marker (red) */}
                            {selectedPosition && (
                                <Marker position={selectedPosition} icon={selectedIcon} />
                            )}
                        </MapContainer>
                    )}

                    {/* GPS Error */}
                    {gpsError && (
                        <div className="absolute top-2 left-2 right-2 bg-amber-50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg text-sm">
                            {gpsError}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-3">
                    {/* Selected coordinates & address */}
                    {selectedPosition && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span className="font-mono">
                                    {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                                </span>
                            </div>
                            {fetchingAddress ? (
                                <p className="text-xs text-slate-400 mt-1">Loading address...</p>
                            ) : address ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{address}</p>
                            ) : null}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={!currentPosition}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Navigation className="w-4 h-4" />
                            Use My Location
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedPosition}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check className="w-4 h-4" />
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

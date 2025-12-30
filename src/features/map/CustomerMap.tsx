import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, Polyline } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import { Search, Loader2, X, Server, Users, Wifi, WifiOff, MapPinned, RefreshCw, Link2, ExternalLink } from "lucide-react";
import { customerApi, type Customer } from "../../services/customerService";
import api from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions"; // Added permission hook
import { PERMISSIONS } from "../../lib/permissions"; // Added permissions constant
import "leaflet/dist/leaflet.css";

// Router/NAS interface
interface Router {
    id: string;
    name: string;
    identity?: string; // Pulled directly from router
    model?: string;
    ipAddress?: string;
    vpnIpAddress?: string; // Assigned VPN IP
    location?: string;
    latitude?: number;
    longitude?: number;
    status: "ONLINE" | "OFFLINE" | "UNKNOWN";
    uptime?: string; // e.g., "5d 12h 30m"
    lastSeen?: string;
    type: "ROUTER";
    customersCount?: number;
    pppoeActiveCount?: number; // Active PPPoE sessions
    hotspotActiveCount?: number; // Active Hotspot sessions
    webfigUrl?: string;
    winboxPort?: number;
}

// Location search result
interface LocationResult {
    id: string;
    name: string;
    displayName: string;
    latitude: number;
    longitude: number;
    type: "LOCATION";
    location?: string;
}

// Extended Customer with session info for map display
interface MapCustomer extends Customer {
    sessionUptime?: string; // e.g., "2h 30m 15s" - for online users
    lastSeenAgo?: string;   // e.g., "15m ago" - for offline users
}

// Combined search result
type SearchResult = (MapCustomer & { type: "CUSTOMER" }) | Router | LocationResult;

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Customer marker icon (circle with glow effect)
const createCustomerIcon = (isOnline: boolean) => {
    // Deep vibrant colors
    const color = isOnline ? "#00C853" : "#FF6D00"; // Deep green / Deep orange
    return L.divIcon({
        className: "", // Empty to prevent Leaflet default styles
        html: `
            <div style="
                width: 24px;
                height: 24px;
                background-color: ${color};
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5), 0 0 0 2px ${color}40;
            "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

// Router marker icon (larger square with wifi icon)
const createRouterIcon = (status: string) => {
    // Deep blue for online, deep red for offline
    const color = status === "ONLINE" ? "#1565C0" : "#D32F2F";
    return L.divIcon({
        className: "", // Empty to prevent Leaflet default styles
        html: `
            <div style="
                width: 40px;
                height: 40px;
                background-color: ${color};
                border: 3px solid #ffffff;
                border-radius: 8px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.5), 0 0 0 2px ${color}40;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <circle cx="12" cy="12" r="2" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

// Default center (Mombasa, Kenya)
const defaultCenter: [number, number] = [-4.0435, 39.6682];

// Component to fly to location
function FlyToLocation({ position, zoom }: { position: [number, number] | null; zoom?: number }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, zoom || 15, { duration: 1 });
        }
    }, [position, zoom, map]);

    return null;
}

export function CustomerMap() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [routers, setRouters] = useState<Router[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
    const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const [searchParams] = useSearchParams();

    // Handle initial location from URL params
    useEffect(() => {
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");
        if (lat && lng) {
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);
            if (!isNaN(latNum) && !isNaN(lngNum)) {
                // Small delay to ensure map is ready
                setTimeout(() => {
                    setFlyToPosition([latNum, lngNum]);
                }, 500);
            }
        }
    }, [searchParams]);

    // Filter states
    const [showOnlineRouters, setShowOnlineRouters] = useState(true);
    const [showOfflineRouters, setShowOfflineRouters] = useState(true);
    const [showOnlineUsers, setShowOnlineUsers] = useState(true);
    const [showOfflineUsers, setShowOfflineUsers] = useState(true);
    const [showConnectionLines, setShowConnectionLines] = useState(false);
    const [refreshingRouter, setRefreshingRouter] = useState<string | null>(null);
    const [refreshingCustomer, setRefreshingCustomer] = useState<string | null>(null);

    // RBAC: Get permission checker
    const { can } = usePermissions();

    useEffect(() => {
        loadData();
    }, []);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load map data from API (customers and routers with coordinates)
            const { data } = await api.get('/map/data');

            // Transform customers from API response
            const mappedCustomers = data.customers.map((c: any) => ({
                id: c.id,
                username: c.username,
                name: c.name,
                connectionType: c.connectionType?.toUpperCase() || "PPPOE",
                status: c.status?.toUpperCase() || "ACTIVE",
                isOnline: c.status === 'active',
                location: c.location,
                latitude: c.latitude,
                longitude: c.longitude,
                ipAddress: c.ipAddress || null,
                package: c.package || null,
                expiresAt: c.expiresAt || null,
                createdAt: "",
                updatedAt: "",
            }));
            setCustomers(mappedCustomers);

            // Transform routers from API response
            const mappedRouters: Router[] = data.routers.map((r: any) => ({
                id: r.id,
                name: r.name,
                ipAddress: r.ipAddress,
                status: r.status?.toUpperCase() || "UNKNOWN",
                type: "ROUTER" as const,
                latitude: r.latitude,
                longitude: r.longitude,
                location: r.location,
                customersCount: r.customerCount || 0,
            }));
            setRouters(mappedRouters);
        } catch (error) {
            console.error("Failed to load map data:", error);
            // Show empty state on error - no mock data
            setCustomers([]);
            setRouters([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter by coordinates
    const customersWithCoords = customers.filter(c => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude));
    const routersWithCoords = routers.filter(r => r.latitude && r.longitude);

    // Apply visibility filters
    const visibleRouters = routersWithCoords.filter(r =>
        (r.status === "ONLINE" && showOnlineRouters) ||
        (r.status !== "ONLINE" && showOfflineRouters)
    );
    const visibleCustomers = customersWithCoords.filter(c =>
        (c.isOnline && showOnlineUsers) ||
        (!c.isOnline && showOfflineUsers)
    );

    // Refresh single router data
    const refreshRouter = async (routerId: string) => {
        setRefreshingRouter(routerId);
        try {
            // TODO: Call API to get live router data
            // const routerData = await nasApi.getRouterLiveStatus(routerId);
            // For now, simulate refresh with mock data
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update router in state with fresh data (mock)
            setRouters(prev => prev.map(r => {
                if (r.id === routerId) {
                    return {
                        ...r,
                        pppoeActiveCount: Math.floor(Math.random() * 50),
                        hotspotActiveCount: Math.floor(Math.random() * 20),
                    };
                }
                return r;
            }));

            // Also update selectedItem if it's the same router
            if (selectedItem?.type === "ROUTER" && selectedItem.id === routerId) {
                setSelectedItem(prev => {
                    if (prev?.type === "ROUTER") {
                        return {
                            ...prev,
                            pppoeActiveCount: Math.floor(Math.random() * 50),
                            hotspotActiveCount: Math.floor(Math.random() * 20),
                        };
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Failed to refresh router:", error);
        } finally {
            setRefreshingRouter(null);
        }
    };

    // Refresh single customer status from live MikroTik/RADIUS data
    const refreshCustomer = async (customerId: string) => {
        setRefreshingCustomer(customerId);
        try {
            // Call API to get real customer live status
            const liveStatus = await customerApi.getLiveStatus(customerId);

            // Update customer in the list
            setCustomers(prev => prev.map(c => {
                if (c.id === customerId) {
                    return {
                        ...c,
                        isOnline: liveStatus.isOnline,
                        ipAddress: liveStatus.ipAddress || c.ipAddress,
                        sessionUptime: liveStatus.uptime,
                        lastSeenAgo: liveStatus.lastSeenAgo
                    };
                }
                return c;
            }));

            // Also update selectedItem if it's the same customer
            if (selectedItem?.type === "CUSTOMER" && (selectedItem as MapCustomer).id === customerId) {
                setSelectedItem(prev => {
                    if (prev?.type === "CUSTOMER") {
                        return {
                            ...prev,
                            isOnline: liveStatus.isOnline,
                            ipAddress: liveStatus.ipAddress || (prev as MapCustomer).ipAddress,
                            sessionUptime: liveStatus.uptime,
                            lastSeenAgo: liveStatus.lastSeenAgo
                        };
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Failed to refresh customer status:", error);
        } finally {
            setRefreshingCustomer(null);
        }
    };

    // Search handler
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const lowerQuery = query.toLowerCase();

        // Search customers
        const customerResults: SearchResult[] = customers
            .filter(c =>
                c.name?.toLowerCase().includes(lowerQuery) ||
                c.username?.toLowerCase().includes(lowerQuery) ||
                c.phone?.toLowerCase().includes(lowerQuery) ||
                c.location?.toLowerCase().includes(lowerQuery) ||
                c.ipAddress?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5)
            .map(c => ({ ...c, type: "CUSTOMER" as const }));

        // Search routers
        const routerResults: SearchResult[] = routers
            .filter(r =>
                r.name?.toLowerCase().includes(lowerQuery) ||
                r.location?.toLowerCase().includes(lowerQuery) ||
                r.ipAddress?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5);

        setSearchResults([...routerResults, ...customerResults]);
        setShowResults(true);

        // If no local results, search for location
        if (routerResults.length === 0 && customerResults.length === 0 && query.length >= 3) {
            searchLocation(query);
        }
    };

    // Geocoding search using OpenStreetMap Nominatim
    const searchLocation = async (query: string) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await response.json();

            const locationResults: LocationResult[] = data.map((item: any, index: number) => ({
                id: `loc-${index}`,
                name: item.name || item.display_name.split(",")[0],
                displayName: item.display_name,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                type: "LOCATION" as const
            }));

            setSearchResults(prev => [...prev, ...locationResults]);
        } catch (error) {
            console.error("Location search failed:", error);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        setShowResults(false);
        setSearchQuery("");

        // Handle location result differently
        if (result.type === "LOCATION") {
            const locResult = result as LocationResult;
            setFlyToPosition([locResult.latitude, locResult.longitude]);
            setSelectedItem(null); // Don't select location as item
            return;
        }

        setSelectedItem(result);
        if (result.latitude && result.longitude) {
            setFlyToPosition([result.latitude, result.longitude]);
        }
    };

    const clearSelection = () => {
        setSelectedItem(null);
        setFlyToPosition(null);
    };

    const onlineCustomers = customersWithCoords.filter(c => c.isOnline).length;
    const offlineCustomers = customersWithCoords.filter(c => !c.isOnline).length;

    return (
        <div className="relative h-[calc(100vh-120px)] min-h-[500px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
            {/* Search Bar Overlay */}
            <div className="absolute top-4 left-4 right-4 z-30" ref={searchRef}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-auto sm:flex-1 max-w-none sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search PPPoE clients or routers..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-cyan-500 shadow-lg"
                        />

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            {result.type === "LOCATION" ? (
                                                <MapPinned className="w-5 h-5 text-purple-400" />
                                            ) : result.type === "ROUTER" ? (
                                                <Server className="w-5 h-5 text-blue-400" />
                                            ) : (
                                                <Users className="w-5 h-5 text-cyan-400" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">
                                                    {result.type === "LOCATION"
                                                        ? (result as LocationResult).name
                                                        : result.type === "ROUTER"
                                                            ? result.name
                                                            : (result as Customer).name || (result as Customer).username}
                                                </div>
                                                <div className="text-xs text-slate-400 truncate">
                                                    {result.type === "LOCATION"
                                                        ? (result as LocationResult).displayName
                                                        : result.type === "ROUTER"
                                                            ? (result as Router).location || (result as Router).ipAddress || "No location"
                                                            : (result as Customer).location || (result as Customer).ipAddress || "No location"}
                                                </div>
                                            </div>
                                            {result.type === "LOCATION" ? (
                                                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                                                    Location
                                                </span>
                                            ) : (
                                                <span className={`text-xs px-2 py-1 rounded-full ${result.type === "ROUTER"
                                                    ? (result.status === "ONLINE" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400")
                                                    : ((result as Customer).isOnline ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400")
                                                    }`}>
                                                    {result.type === "ROUTER" ? result.status : ((result as Customer).isOnline ? "Online" : "Offline")}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats Pills - now clickable filters */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                        <button
                            onClick={() => setShowOnlineRouters(!showOnlineRouters)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all flex-shrink-0 ${showOnlineRouters
                                ? "bg-blue-600 border-blue-400 text-white"
                                : "bg-slate-800/90 border-slate-600 text-slate-400 opacity-70"
                                }`}
                        >
                            <Server className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">{routersWithCoords.filter(r => r.status === "ONLINE").length}</span>
                        </button>
                        <button
                            onClick={() => setShowOfflineRouters(!showOfflineRouters)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all flex-shrink-0 ${showOfflineRouters
                                ? "bg-red-600 border-red-400 text-white"
                                : "bg-slate-800/90 border-slate-600 text-slate-400 opacity-70"
                                }`}
                        >
                            <Server className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">{routersWithCoords.filter(r => r.status !== "ONLINE").length}</span>
                        </button>
                        <button
                            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all flex-shrink-0 ${showOnlineUsers
                                ? "bg-green-600 border-green-400 text-white"
                                : "bg-slate-800/90 border-slate-600 text-slate-400 opacity-70"
                                }`}
                        >
                            <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">{onlineCustomers}</span>
                        </button>
                        <button
                            onClick={() => setShowOfflineUsers(!showOfflineUsers)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all flex-shrink-0 ${showOfflineUsers
                                ? "bg-orange-500 border-orange-400 text-white"
                                : "bg-slate-800/90 border-slate-600 text-slate-400 opacity-70"
                                }`}
                        >
                            <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">{offlineCustomers}</span>
                        </button>
                        <button
                            onClick={() => loadData()}
                            disabled={loading}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all bg-slate-700 border-slate-500 text-white hover:bg-slate-600 flex-shrink-0"
                            title="Refresh live status"
                        >
                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowConnectionLines(!showConnectionLines)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all flex-shrink-0 ${showConnectionLines
                                ? "bg-purple-600 border-purple-400 text-white"
                                : "bg-slate-800/90 border-slate-600 text-slate-400 opacity-70"
                                }`}
                            title="Show connection lines"
                        >
                            <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Selected Item Info Panel */}
            {selectedItem && (
                <div className="absolute bottom-4 left-4 z-30 max-w-sm">
                    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {selectedItem.type === "ROUTER" ? (
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Server className="w-5 h-5 text-blue-400" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-cyan-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-white">
                                        {selectedItem.type === "ROUTER" ? selectedItem.name : (selectedItem as Customer).name || (selectedItem as Customer).username}
                                    </h3>
                                    <p className="text-xs text-slate-400">{selectedItem.type === "ROUTER" ? "MikroTik Router" : "PPPoE Client"}</p>
                                </div>
                            </div>
                            <button onClick={clearSelection} className="p-1 hover:bg-slate-700 rounded transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                            {selectedItem.type === "ROUTER" && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Location:</span>
                                        <span className="text-slate-200">{selectedItem.location || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">IP Address:</span>
                                        <span className="text-slate-200 font-mono text-xs">{selectedItem.ipAddress || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Status:</span>
                                        <span className={`font-medium ${selectedItem.status === "ONLINE" ? "text-green-400" : "text-red-400"}`}>
                                            {`${selectedItem.status}${selectedItem.status === "ONLINE" && (selectedItem as Router).uptime ? ` (${(selectedItem as Router).uptime})` : selectedItem.status === "OFFLINE" && (selectedItem as Router).lastSeen ? ` (Down ${(selectedItem as Router).lastSeen})` : ''}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Identity:</span>
                                        <span className="text-slate-200 font-mono text-xs">{(selectedItem as Router).identity || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Model:</span>
                                        <span className="text-slate-200 text-xs">{(selectedItem as Router).model || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">VPN IP:</span>
                                        <span className="text-slate-200 font-mono text-xs">{(selectedItem as Router).vpnIpAddress || "-"}</span>
                                    </div>

                                    {/* Active Sessions Breakdown */}
                                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-400 text-xs font-medium">Active Sessions</span>
                                            {can(PERMISSIONS.ROUTERS_VIEW) && (
                                                <button
                                                    onClick={() => refreshRouter((selectedItem as Router).id)}
                                                    disabled={refreshingRouter === (selectedItem as Router).id}
                                                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                    title="Refresh router data"
                                                >
                                                    <RefreshCw className={`w-3 h-3 text-slate-400 ${refreshingRouter === (selectedItem as Router).id ? 'animate-spin' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                                                <div className="text-lg font-bold text-blue-400">{(selectedItem as Router).pppoeActiveCount ?? 0}</div>
                                                <div className="text-xs text-slate-400">PPPoE</div>
                                            </div>
                                            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                                                <div className="text-lg font-bold text-orange-400">{(selectedItem as Router).hotspotActiveCount ?? 0}</div>
                                                <div className="text-xs text-slate-400">Hotspot</div>
                                            </div>
                                        </div>
                                        <div className="text-center mt-2 text-xs text-slate-500">
                                            Total: {((selectedItem as Router).pppoeActiveCount ?? 0) + ((selectedItem as Router).hotspotActiveCount ?? 0)} / {(selectedItem as Router).customersCount ?? 0}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                                        {(selectedItem as Router).webfigUrl && (
                                            <a
                                                href={(selectedItem as Router).webfigUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                WebFig
                                            </a>
                                        )}
                                        {(selectedItem as Router).winboxPort && (
                                            <a
                                                href={`winbox://${(selectedItem as Router).vpnIpAddress || (selectedItem as Router).ipAddress}:${(selectedItem as Router).winboxPort}`}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-lg transition-colors"
                                            >
                                                <Server className="w-3 h-3" />
                                                Winbox
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                            {selectedItem.type === "CUSTOMER" && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Location:</span>
                                        <span className="text-slate-200">{(selectedItem as Customer).location || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">IP Address:</span>
                                        <span className="text-slate-200 font-mono text-xs">{(selectedItem as Customer).ipAddress || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Status:</span>
                                        <span className={`font-medium ${(selectedItem as MapCustomer).isOnline ? "text-green-400" : "text-orange-400"}`}>
                                            {(selectedItem as MapCustomer).isOnline
                                                ? `Online${(selectedItem as MapCustomer).sessionUptime ? ` (${(selectedItem as MapCustomer).sessionUptime})` : ''}`
                                                : `Offline${(selectedItem as MapCustomer).lastSeenAgo ? ` (${(selectedItem as MapCustomer).lastSeenAgo})` : ''}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Package:</span>
                                        <span className="text-slate-200">{(selectedItem as Customer).package?.name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Expiry:</span>
                                        <span className={`text-xs ${(selectedItem as Customer).expiresAt && new Date((selectedItem as Customer).expiresAt!) < new Date() ? "text-red-400" : "text-slate-200"}`}>
                                            {(selectedItem as Customer).expiresAt
                                                ? new Date((selectedItem as Customer).expiresAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : "-"}
                                        </span>
                                    </div>
                                    {can(PERMISSIONS.PPPOE_DETAILS_VIEW) && (
                                        <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-700/50">
                                            <button
                                                onClick={() => refreshCustomer((selectedItem as Customer).id)}
                                                disabled={refreshingCustomer === (selectedItem as Customer).id}
                                                className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
                                                title="Refresh customer status"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${refreshingCustomer === (selectedItem as Customer).id ? 'animate-spin' : ''}`} />
                                                Refresh Status
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 right-4 z-30">
                <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                                <Server className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-slate-300">Router</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-300">Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-slate-300">Offline</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                        <p className="text-slate-400">Loading map data...</p>
                    </div>
                </div>
            )}

            {/* Map */}
            <MapContainer
                center={defaultCenter}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Fly to selected position */}
                <FlyToLocation position={flyToPosition} />

                {/* Router Markers */}
                {visibleRouters.map(router => (
                    <Marker
                        key={router.id}
                        position={[router.latitude!, router.longitude!]}
                        icon={createRouterIcon(router.status)}
                        eventHandlers={{
                            click: () => {
                                setSelectedItem(router);
                                setFlyToPosition([router.latitude!, router.longitude!]);
                            }
                        }}
                    />
                ))}

                {/* Customer Markers (smaller dots) */}
                {visibleCustomers.map(customer => (
                    <Marker
                        key={customer.id}
                        position={[customer.latitude!, customer.longitude!]}
                        icon={createCustomerIcon(customer.isOnline || false)}
                        eventHandlers={{
                            click: () => {
                                setSelectedItem({ ...customer, type: "CUSTOMER" });
                                setFlyToPosition([customer.latitude!, customer.longitude!]);
                            }
                        }}
                    />
                ))}

                {/* Connection Lines between Customers and their Routers */}
                {showConnectionLines && visibleCustomers.map(customer => {
                    // Find the router for this customer
                    const router = customer.nasId
                        ? routersWithCoords.find(r => r.id === customer.nasId)
                        : routersWithCoords[0]; // Default to first router if no nasId

                    if (!router || !customer.latitude || !customer.longitude || !router.latitude || !router.longitude) {
                        return null;
                    }

                    return (
                        <Polyline
                            key={`line-${customer.id}`}
                            positions={[
                                [customer.latitude, customer.longitude],
                                [router.latitude, router.longitude]
                            ]}
                            pathOptions={{
                                color: customer.isOnline ? '#22c55e' : '#f97316',
                                weight: 2,
                                opacity: 0.6,
                                dashArray: customer.isOnline ? undefined : '5, 10'
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

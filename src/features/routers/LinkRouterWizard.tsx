import { useState } from "react";
import { createPortal } from "react-dom";
import {
    Server,
    Copy,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Terminal,
    Key,
    X,
    RefreshCw,
    Cpu,
    HardDrive,
    Clock,
    Wifi,
    Radio,
    Settings
} from "lucide-react";
import { nasApi } from "../../services/nasService";
import toast from "react-hot-toast";

interface LinkRouterWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Wizard steps
type WizardStep = "intro" | "script" | "verify" | "info" | "services" | "complete";

interface RouterInterface {
    id: string;
    name: string;
    type: string;
    macAddress: string;
    running: boolean;
    disabled: boolean;
    comment: string;
    isWan: boolean;
}

interface SystemInfo {
    uptime: string;
    version: string;
    boardName: string;
    platform: string;
    cpu: string;
    cpuLoad: number;
    freeMemory: number;
    totalMemory: number;
    freeHddSpace: number;
    totalHddSpace: number;
    architectureName: string;
}

export function LinkRouterWizard({ isOpen, onClose, onSuccess }: LinkRouterWizardProps) {
    const [step, setStep] = useState<WizardStep>("intro");
    const [loading, setLoading] = useState(false);
    const [routerName, setRouterName] = useState("");
    const [routerId, setRouterId] = useState<string | null>(null);
    const [provisionCommand, setProvisionCommand] = useState("");
    const [secret, setSecret] = useState("");
    const [copied, setCopied] = useState(false);

    // New state for enhanced wizard
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [interfaces, setInterfaces] = useState<RouterInterface[]>([]);
    const [wanInterface, setWanInterface] = useState<string | null>(null);
    const [serviceType, setServiceType] = useState<"hotspot" | "pppoe" | "both">("both");
    const [selectedHotspotInterfaces, setSelectedHotspotInterfaces] = useState<string[]>([]);
    const [selectedPppoeInterfaces, setSelectedPppoeInterfaces] = useState<string[]>([]);
    const [configuring, setConfiguring] = useState(false);
    const [configResults, setConfigResults] = useState<string[]>([]);

    // Start the wizard - get provision command from backend
    const handleStart = async () => {
        if (!routerName.trim()) {
            toast.error("Please enter a router name");
            return;
        }

        setLoading(true);
        try {
            const result = await nasApi.startWizard(routerName.trim());
            setRouterId(result.routerId);
            setProvisionCommand(result.provisionCommand);
            setSecret(result.secret);
            setStep("script");
            toast.success("Provision command generated!");
        } catch (err: unknown) {
            console.error("Failed to start wizard:", err);
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to create router. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Copy command to clipboard
    const handleCopyCommand = async () => {
        try {
            await navigator.clipboard.writeText(provisionCommand);
            setCopied(true);
            toast.success("Command copied to clipboard!");
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error("Failed to copy command");
        }
    };

    // Verify router is online and API reachable
    const handleVerify = async () => {
        if (!routerId) return;

        setLoading(true);
        try {
            const result = await nasApi.verifyRouter(routerId);
            if (result.online && result.apiReachable) {
                toast.success(result.message);
                // Fetch system info and proceed
                const info = await nasApi.getSystemInfo(routerId);
                setSystemInfo(info);
                setStep("info");
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            console.error("Verification failed:", err);
            toast.error("Could not verify router. Make sure you've run the command on your MikroTik.");
        } finally {
            setLoading(false);
        }
    };

    // Proceed to services step - fetch interfaces
    const handleProceedToServices = async () => {
        if (!routerId) return;

        setLoading(true);
        try {
            const result = await nasApi.getRouterInterfaces(routerId);
            setInterfaces(result.interfaces);
            setWanInterface(result.wanInterface);
            setStep("services");
            toast.success(`Found ${result.interfaces.length} interfaces`);
        } catch (err) {
            console.error("Failed to get interfaces:", err);
            toast.error("Could not fetch router interfaces");
        } finally {
            setLoading(false);
        }
    };

    // Toggle interface selection
    const toggleInterface = (name: string, type: "hotspot" | "pppoe") => {
        if (type === "hotspot") {
            setSelectedHotspotInterfaces(prev =>
                prev.includes(name)
                    ? prev.filter(i => i !== name)
                    : [...prev, name]
            );
        } else {
            setSelectedPppoeInterfaces(prev =>
                prev.includes(name)
                    ? prev.filter(i => i !== name)
                    : [...prev, name]
            );
        }
    };

    // Apply configuration
    const handleApplyConfig = async () => {
        if (!routerId) return;

        // Validate selections
        if ((serviceType === "hotspot" || serviceType === "both") && selectedHotspotInterfaces.length === 0) {
            toast.error("Please select at least one interface for Hotspot");
            return;
        }
        if ((serviceType === "pppoe" || serviceType === "both") && selectedPppoeInterfaces.length === 0) {
            toast.error("Please select at least one interface for PPPoE");
            return;
        }

        setConfiguring(true);
        try {
            const config: Parameters<typeof nasApi.configureRouterServices>[1] = {
                serviceType,
                wanInterface: wanInterface || undefined,
                createBackup: true,
                configureFirewall: true,
            };

            if (serviceType === "hotspot" || serviceType === "both") {
                config.hotspotConfig = {
                    interfaces: selectedHotspotInterfaces,
                };
            }

            if (serviceType === "pppoe" || serviceType === "both") {
                config.pppoeConfig = {
                    interfaces: selectedPppoeInterfaces,
                };
            }

            const result = await nasApi.configureRouterServices(routerId, config);

            if (result.success) {
                setConfigResults(result.results);
                setStep("complete");
                toast.success("Configuration applied successfully!");
            } else {
                toast.error(result.message || "Configuration failed");
            }
        } catch (err) {
            console.error("Configuration failed:", err);
            toast.error("Failed to apply configuration");
        } finally {
            setConfiguring(false);
        }
    };

    // Handle completion
    const handleComplete = () => {
        onSuccess();
        resetWizard();
        onClose();
    };

    // Reset wizard state
    const resetWizard = () => {
        setStep("intro");
        setRouterName("");
        setRouterId(null);
        setProvisionCommand("");
        setSecret("");
        setCopied(false);
        setSystemInfo(null);
        setInterfaces([]);
        setWanInterface(null);
        setServiceType("both");
        setSelectedHotspotInterfaces([]);
        setSelectedPppoeInterfaces([]);
        setConfigResults([]);
    };

    // Handle close
    const handleClose = () => {
        resetWizard();
        onClose();
    };

    // Format bytes to readable size
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // Get non-WAN interfaces for selection
    const selectableInterfaces = interfaces.filter(i => !i.isWan && !i.disabled);

    if (!isOpen) return null;

    const allSteps = [
        { key: "intro", label: "Name", icon: Server },
        { key: "script", label: "Script", icon: Terminal },
        { key: "verify", label: "Verify", icon: RefreshCw },
        { key: "info", label: "Info", icon: Cpu },
        { key: "services", label: "Config", icon: Settings },
        { key: "complete", label: "Done", icon: CheckCircle2 },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-3xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <Server className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Link a MikroTik Router</h2>
                            <p className="text-sm text-slate-400">Zero-touch provisioning</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center px-6 py-3 bg-slate-900/50 gap-2 overflow-x-auto">
                    {allSteps.map((s, index) => {
                        const stepOrder = allSteps.map(x => x.key);
                        const currentIndex = stepOrder.indexOf(step);
                        const stepIndex = stepOrder.indexOf(s.key);
                        const isActive = step === s.key;
                        const isCompleted = stepIndex < currentIndex;
                        const IconComponent = s.icon;

                        return (
                            <div key={s.key} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive
                                            ? "bg-orange-600 text-white"
                                            : isCompleted
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-700 text-slate-400"
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <IconComponent className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 ${isActive ? "text-white" : "text-slate-500"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {index < allSteps.length - 1 && (
                                    <div
                                        className={`w-8 h-0.5 mx-1 ${stepIndex < currentIndex ? "bg-emerald-600" : "bg-slate-700"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
                    {/* Step 1: Router Name */}
                    {step === "intro" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Add a New MikroTik Router
                                </h3>
                                <p className="text-slate-400">
                                    Enter a name for your router. You'll get a command to paste in your MikroTik terminal.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Router Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={routerName}
                                        onChange={(e) => setRouterName(e.target.value)}
                                        placeholder="e.g., Main Office Router"
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    />
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <h4 className="text-sm font-semibold text-white mb-3">What happens next:</h4>
                                    <ul className="space-y-2 text-sm text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Run a single command on your MikroTik</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Verify the router is connected</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Choose PPPoE, Hotspot, or Both</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Select interfaces and apply configuration</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Script */}
                    {step === "script" && (
                        <div className="space-y-5">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Run This Command on Your Router
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Open Winbox → New Terminal → Paste this command
                                </p>
                            </div>

                            {/* Provision Command */}
                            <div className="relative">
                                <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 pr-24">
                                    <code className="text-sm text-emerald-400 font-mono break-all">
                                        {provisionCommand}
                                    </code>
                                </div>
                                <button
                                    onClick={handleCopyCommand}
                                    className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${copied
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* RADIUS Secret */}
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium text-white">RADIUS Secret</span>
                                </div>
                                <code className="text-sm text-orange-400 font-mono">{secret}</code>
                            </div>

                            {/* Instructions */}
                            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
                                <p className="text-amber-400 text-sm">
                                    <strong>After running the command:</strong> Click "Check Router" below to verify the router is connected.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Verify */}
                    {step === "verify" && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-600/20 flex items-center justify-center">
                                <RefreshCw className={`w-8 h-8 text-amber-500 ${loading ? 'animate-spin' : ''}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Verifying Router Connection
                            </h3>
                            <p className="text-slate-400">
                                Checking if the router is online and API is reachable...
                            </p>
                        </div>
                    )}

                    {/* Step 4: System Info */}
                    {step === "info" && systemInfo && (
                        <div className="space-y-5">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Router Connected!
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {routerName} is online and ready for configuration
                                </p>
                            </div>

                            {/* System Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HardDrive className="w-4 h-4 text-cyan-500" />
                                        <span className="text-sm text-slate-400">Board</span>
                                    </div>
                                    <p className="text-white font-medium">{systemInfo.boardName}</p>
                                    <p className="text-xs text-slate-500">{systemInfo.architectureName}</p>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Settings className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm text-slate-400">RouterOS</span>
                                    </div>
                                    <p className="text-white font-medium">{systemInfo.version}</p>
                                    <p className="text-xs text-slate-500">{systemInfo.platform}</p>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-slate-400">Uptime</span>
                                    </div>
                                    <p className="text-white font-medium">{systemInfo.uptime}</p>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Cpu className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm text-slate-400">CPU</span>
                                    </div>
                                    <p className="text-white font-medium">{systemInfo.cpuLoad}% Load</p>
                                    <p className="text-xs text-slate-500">{systemInfo.cpu}</p>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 col-span-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HardDrive className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm text-slate-400">Memory</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="h-2 bg-slate-700 rounded-full">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-white text-sm">
                                            {formatBytes(systemInfo.totalMemory - systemInfo.freeMemory)} / {formatBytes(systemInfo.totalMemory)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Services */}
                    {step === "services" && (
                        <div className="space-y-5">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Configure Services
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Select the service type and interfaces to configure
                                </p>
                            </div>

                            {/* Service Type Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-400">Service Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: "hotspot", label: "Hotspot", icon: Wifi, desc: "Captive portal" },
                                        { value: "pppoe", label: "PPPoE", icon: Radio, desc: "Point-to-point" },
                                        { value: "both", label: "Both", icon: Settings, desc: "Full setup" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setServiceType(opt.value as typeof serviceType)}
                                            className={`p-4 rounded-xl border transition-all ${serviceType === opt.value
                                                ? "bg-orange-600/20 border-orange-600 text-white"
                                                : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
                                                }`}
                                        >
                                            <opt.icon className="w-6 h-6 mx-auto mb-2" />
                                            <div className="font-medium">{opt.label}</div>
                                            <div className="text-xs text-slate-500">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hotspot Interfaces */}
                            {(serviceType === "hotspot" || serviceType === "both") && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-400">
                                        Hotspot Interfaces
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {selectableInterfaces.map((iface) => (
                                            <label
                                                key={`hotspot-${iface.name}`}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedHotspotInterfaces.includes(iface.name)
                                                    ? "bg-cyan-600/20 border-cyan-600"
                                                    : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedHotspotInterfaces.includes(iface.name)}
                                                    onChange={() => toggleInterface(iface.name, "hotspot")}
                                                    className="sr-only"
                                                />
                                                <div className={`w-3 h-3 rounded-full ${iface.running ? "bg-emerald-500" : "bg-slate-600"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white font-medium truncate">{iface.name}</div>
                                                    <div className="text-xs text-slate-500">{iface.type} • {iface.macAddress}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PPPoE Interfaces */}
                            {(serviceType === "pppoe" || serviceType === "both") && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-400">
                                        PPPoE Interfaces
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {selectableInterfaces.map((iface) => (
                                            <label
                                                key={`pppoe-${iface.name}`}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPppoeInterfaces.includes(iface.name)
                                                    ? "bg-purple-600/20 border-purple-600"
                                                    : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPppoeInterfaces.includes(iface.name)}
                                                    onChange={() => toggleInterface(iface.name, "pppoe")}
                                                    className="sr-only"
                                                />
                                                <div className={`w-3 h-3 rounded-full ${iface.running ? "bg-emerald-500" : "bg-slate-600"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white font-medium truncate">{iface.name}</div>
                                                    <div className="text-xs text-slate-500">{iface.type} • {iface.macAddress}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* WAN Info */}
                            {wanInterface && (
                                <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-3">
                                    <p className="text-emerald-400 text-sm">
                                        <strong>WAN Interface:</strong> {wanInterface} (auto-detected, will be used for NAT)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 6: Complete */}
                    {step === "complete" && (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Configuration Complete!
                            </h3>
                            <p className="text-slate-400 mb-4">
                                <strong className="text-white">{routerName}</strong> has been fully configured.
                            </p>

                            {configResults.length > 0 && (
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-left mb-4">
                                    <h4 className="text-sm font-semibold text-white mb-2">Configuration Results:</h4>
                                    <ul className="space-y-1 text-sm text-slate-400">
                                        {configResults.map((result, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                {result}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-left">
                                <h4 className="text-sm font-semibold text-white mb-2">Next steps:</h4>
                                <ul className="space-y-1 text-sm text-slate-400">
                                    <li>• Create packages for users</li>
                                    <li>• Add customers and assign them to this router</li>
                                    <li>• Monitor sessions in real-time</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900/30">
                    {step === "intro" && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStart}
                                disabled={loading || !routerName.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Get Command
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "script" && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Check Router
                            </button>
                        </>
                    )}

                    {step === "info" && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleProceedToServices}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Configure Services
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "services" && (
                        <>
                            <button
                                onClick={() => setStep("info")}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleApplyConfig}
                                disabled={configuring}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {configuring ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Settings className="w-4 h-4" />
                                        Apply Configuration
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "complete" && (
                        <div className="w-full flex justify-center">
                            <button
                                onClick={handleComplete}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Go to Routers
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

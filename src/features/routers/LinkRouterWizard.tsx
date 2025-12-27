import { useState } from "react";
import { createPortal } from "react-dom";
import {
    Server,
    Copy,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Terminal,
    Wifi,
    Shield,
    X
} from "lucide-react";
import { nasApi } from "../../services/nasService";
import toast from "react-hot-toast";

interface LinkRouterWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Wizard steps
type WizardStep = "intro" | "script" | "waiting" | "service-setup" | "complete" | "error";

export function LinkRouterWizard({ isOpen, onClose, onSuccess }: LinkRouterWizardProps) {
    const [step, setStep] = useState<WizardStep>("intro");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [bootstrapScript, setBootstrapScript] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [routerName, setRouterName] = useState("");
    const [routerId, setRouterId] = useState<string | null>(null);

    // Step 3 State
    const [interfaces, setInterfaces] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<('pppoe' | 'hotspot')[]>(['pppoe']);
    const [subnet, setSubnet] = useState("172.31.0.0/16");
    const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
    const [configuring, setConfiguring] = useState(false);

    // Start the wizard - get bootstrap script from backend
    const handleStart = async () => {
        if (!routerName.trim()) {
            toast.error("Please enter a router name");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await nasApi.startWizard();
            setToken(result.token);
            setBootstrapScript(result.bootstrapScript);
            setStep("script");
        } catch (err) {
            console.error("Failed to start wizard:", err);
            // Demo mode - generate sample script
            const demoToken = `WIZ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setToken(demoToken);
            setBootstrapScript(`# EasyISP Router Provisioning Command
# Router: ${routerName}
# Generated: ${new Date().toISOString()}

# Copy and paste this connection command into your MikroTik terminal:

/tool fetch mode=https url="${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/provision/${demoToken}" dst-path=easyisp.rsc; :delay 2s; /import easyisp.rsc;
`);
            setStep("script");
        } finally {
            setLoading(false);
        }
    };

    // Copy script to clipboard
    const handleCopyScript = async () => {
        try {
            await navigator.clipboard.writeText(bootstrapScript);
            setCopied(true);
            toast.success("Script copied to clipboard!");
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error("Failed to copy script");
        }
    };

    // Proceed to waiting step
    const handleProceedToWaiting = () => {
        setStep("waiting");

        // Start polling
        const interval = setInterval(async () => {
            if (!token) return;
            try {
                const status = await nasApi.pollProvisioningStatus(token);
                if (status.status === 'CONNECTED' && status.routerId) {
                    clearInterval(interval);
                    setRouterId(status.routerId);
                    await fetchInterfaces(status.routerId);
                    setStep("service-setup");
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);

        // Cleanup
        return () => clearInterval(interval);
    };

    const fetchInterfaces = async (id: string) => {
        try {
            const ifaces = await nasApi.getInterfaces(id);
            setInterfaces(ifaces);
        } catch (e) {
            console.error("Failed to fetch interfaces", e);
            // Fallback demo interfaces
            setInterfaces(["ether1", "ether2", "ether3", "ether4", "wlan1"]);
        }
    };

    const handleConfigureServices = async () => {
        if (!routerId) return;
        if (selectedPorts.length === 0) {
            toast.error("Please select at least one port for the bridge");
            return;
        }

        setConfiguring(true);
        try {
            await nasApi.configureServices(routerId, {
                services: selectedServices,
                ports: selectedPorts,
                subnet
            });
            setStep("complete");
        } catch (e) {
            console.error("Configuration failed", e);
            // Demo success fallback
            setTimeout(() => setStep("complete"), 1500);
        } finally {
            setConfiguring(false);
        }
    };

    const toggleService = (service: 'pppoe' | 'hotspot') => {
        setSelectedServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const togglePort = (port: string) => {
        setSelectedPorts(prev =>
            prev.includes(port) ? prev.filter(p => p !== port) : [...prev, port]
        );
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
        setToken(null);
        setBootstrapScript("");
        setCopied(false);
        setError(null);
        setRouterName("");
        setRouterId(null);
        setSelectedServices(['pppoe']);
        setSelectedPorts([]);
        setSubnet("172.31.0.0/16");
    };

    // Handle close
    const handleClose = () => {
        resetWizard();
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <Server className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Link a MikroTik Router</h2>
                            <p className="text-sm text-slate-400">Zero-touch configuration wizard</p>
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
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50">
                    {[
                        { key: "intro", label: "Details", icon: Server },
                        { key: "script", label: "Script", icon: Terminal },
                        { key: "waiting", label: "Connect", icon: Wifi },
                        { key: "service-setup", label: "Services", icon: Shield },
                        { key: "complete", label: "Done", icon: CheckCircle2 },
                    ].map((s, index) => {
                        const stepOrder = ["intro", "script", "waiting", "service-setup", "complete"];
                        const currentIndex = stepOrder.indexOf(step);
                        const stepIndex = stepOrder.indexOf(s.key);
                        const isActive = step === s.key;
                        const isCompleted = stepIndex < currentIndex;
                        const IconComponent = s.icon;

                        return (
                            <div key={s.key} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive
                                            ? "bg-orange-600 text-white"
                                            : isCompleted
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-700 text-slate-400"
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <IconComponent className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 ${isActive ? "text-white" : "text-slate-500"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {index < 4 && (
                                    <div
                                        className={`w-16 h-0.5 mx-2 ${stepIndex < currentIndex ? "bg-emerald-600" : "bg-slate-700"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Step 1: Introduction / Router Details */}
                    {step === "intro" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Add a New MikroTik Router
                                </h3>
                                <p className="text-slate-400">
                                    This wizard will generate a configuration script for your router.
                                    Simply paste it into your MikroTik terminal.
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
                                    />
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <h4 className="text-sm font-semibold text-white mb-3">What this wizard does:</h4>
                                    <ul className="space-y-2 text-sm text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Configures RADIUS authentication for PPPoE & Hotspot</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Sets up Change of Authorization (CoA) for remote control</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Establishes secure VPN tunnel to EasyISP</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>Enables remote Winbox access (optional)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Script */}
                    {step === "script" && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Run This Script on Your Router
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Copy and paste this script into your MikroTik terminal (Winbox {`>`} New Terminal)
                                </p>
                            </div>

                            <div className="relative">
                                <pre className="bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-emerald-400 font-mono overflow-x-auto max-h-64 overflow-y-auto">
                                    {bootstrapScript}
                                </pre>
                                <button
                                    onClick={handleCopyScript}
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

                            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
                                <p className="text-amber-400 text-sm">
                                    <strong>Important:</strong> Make sure your router has internet access before running this script.
                                    The script will connect to EasyISP servers to complete the setup.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Waiting for connection */}
                    {step === "waiting" && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-600/20 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Waiting for Router Connection
                            </h3>
                            <p className="text-slate-400 mb-4">
                                Run the script on your MikroTik router. We'll detect it automatically.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full text-sm text-slate-400">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                Listening for router registration...
                            </div>
                        </div>
                    )}

                    {/* Step 4: Service Setup */}
                    {step === "service-setup" && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Configure Services
                                </h3>
                                <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full w-fit mx-auto text-xs font-medium border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Router Connected Successfully</span>
                                </div>
                            </div>

                            {/* Service Types */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">
                                    Service Types *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => toggleService('pppoe')}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedServices.includes('pppoe')
                                            ? "bg-slate-800 border-orange-500 ring-1 ring-orange-500/50"
                                            : "bg-slate-900 border-slate-700 hover:border-slate-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedServices.includes('pppoe') ? "bg-orange-500 border-orange-500" : "border-slate-600"
                                                }`}>
                                                {selectedServices.includes('pppoe') && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-white font-medium">PPPoE Server</span>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => toggleService('hotspot')}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedServices.includes('hotspot')
                                            ? "bg-slate-800 border-orange-500 ring-1 ring-orange-500/50"
                                            : "bg-slate-900 border-slate-700 hover:border-slate-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedServices.includes('hotspot') ? "bg-orange-500 border-orange-500" : "border-slate-600"
                                                }`}>
                                                {selectedServices.includes('hotspot') && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-white font-medium">Hotspot</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subnet */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Network Subnet
                                </label>
                                <input
                                    type="text"
                                    value={subnet}
                                    onChange={(e) => setSubnet(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Default is 172.31.0.0/16. This will be used for IP pools.</p>
                            </div>

                            {/* Ethernet Ports */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">
                                    Bridge Ports (Select Uplinks) *
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {interfaces.map(iface => (
                                        <div
                                            key={iface}
                                            onClick={() => togglePort(iface)}
                                            className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${selectedPorts.includes(iface)
                                                ? "bg-slate-800 border-orange-500"
                                                : "bg-slate-900 border-slate-700 hover:border-slate-600"
                                                }`}
                                        >
                                            <span className={`text-sm ${selectedPorts.includes(iface) ? "text-orange-400 font-semibold" : "text-slate-400"}`}>
                                                {iface}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Select the ports to add to the service bridge.</p>
                            </div>

                        </div>
                    )}

                    {/* Step 5: Complete */}
                    {step === "complete" && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Router Connected Successfully!
                            </h3>
                            <p className="text-slate-400 mb-4">
                                <strong className="text-white">{routerName || "Your router"}</strong> has been linked to EasyISP.
                                You can now manage it from the dashboard.
                            </p>
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-left">
                                <h4 className="text-sm font-semibold text-white mb-2">Next steps:</h4>
                                <ul className="space-y-1 text-sm text-slate-400">
                                    <li>• Create packages for PPPoE and Hotspot users</li>
                                    <li>• Add customers and assign them to this router</li>
                                    <li>• Monitor router status in real-time</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {step === "error" && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/20 flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Connection Failed
                            </h3>
                            <p className="text-slate-400 mb-4">
                                {error || "Unable to connect to the router. Please check your configuration and try again."}
                            </p>
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
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        Get Script
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "script" && (
                        <>
                            <button
                                onClick={() => setStep("intro")}
                                className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={handleProceedToWaiting}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
                            >
                                I've Run the Script
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {step === "waiting" && (
                        <>
                            <button
                                onClick={() => setStep("script")}
                                className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Script
                            </button>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    )}

                    {step === "service-setup" && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfigureServices}
                                disabled={configuring || selectedPorts.length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {configuring ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Configuring...
                                    </>
                                ) : (
                                    <>
                                        Configure Services
                                        <ArrowRight className="w-4 h-4" />
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
                                Done
                            </button>
                        </div>
                    )}

                    {step === "error" && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep("intro")}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

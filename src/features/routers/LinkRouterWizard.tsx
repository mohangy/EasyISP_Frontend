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
    RefreshCw
} from "lucide-react";
import { nasApi } from "../../services/nasService";
import toast from "react-hot-toast";

interface LinkRouterWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Wizard steps
type WizardStep = "intro" | "script" | "complete";

export function LinkRouterWizard({ isOpen, onClose, onSuccess }: LinkRouterWizardProps) {
    const [step, setStep] = useState<WizardStep>("intro");
    const [loading, setLoading] = useState(false);
    const [routerName, setRouterName] = useState("");
    const [routerId, setRouterId] = useState<string | null>(null);
    const [provisionCommand, setProvisionCommand] = useState("");
    const [secret, setSecret] = useState("");
    const [copied, setCopied] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

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

    // Check if router has completed provisioning
    const handleCheckStatus = async () => {
        if (!routerId) return;

        setCheckingStatus(true);
        try {
            const status = await nasApi.getLiveStatus(routerId);
            if (status.status === "ONLINE") {
                setStep("complete");
                toast.success("Router is online!");
            } else {
                toast.error("Router is not online yet. Make sure you've run the command on your MikroTik.");
            }
        } catch (err) {
            console.error("Status check failed:", err);
            toast.error("Could not check router status");
        } finally {
            setCheckingStatus(false);
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
                <div className="flex items-center justify-center px-6 py-4 bg-slate-900/50 gap-4">
                    {[
                        { key: "intro", label: "Router Name", icon: Server },
                        { key: "script", label: "Run Command", icon: Terminal },
                        { key: "complete", label: "Done", icon: CheckCircle2 },
                    ].map((s, index) => {
                        const stepOrder = ["intro", "script", "complete"];
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
                                {index < 2 && (
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
                                            <span>A RADIUS secret is auto-generated for this router</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>You get a single command to run on your MikroTik</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span>The router auto-configures RADIUS for PPPoE & Hotspot</span>
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
                                <p className="text-xs text-slate-500 mt-2">
                                    This secret is automatically configured on the router. Save it for reference.
                                </p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
                                <p className="text-amber-400 text-sm">
                                    <strong>Important:</strong> Your router must have internet access to fetch the configuration script.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Complete */}
                    {step === "complete" && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Router Connected Successfully!
                            </h3>
                            <p className="text-slate-400 mb-4">
                                <strong className="text-white">{routerName}</strong> has been linked to EasyISP.
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
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCheckStatus}
                                    disabled={checkingStatus}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
                                >
                                    {checkingStatus ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Check Status
                                </button>
                                <button
                                    onClick={() => setStep("complete")}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done
                                </button>
                            </div>
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

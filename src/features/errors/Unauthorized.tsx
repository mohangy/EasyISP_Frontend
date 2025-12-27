import { Link } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";

/**
 * Unauthorized access page shown when user lacks permission to view a route.
 */
export function Unauthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Access Denied
                </h1>

                {/* Description */}
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    You don't have permission to view this page.
                    Contact your administrator if you believe this is an error.
                </p>

                {/* Action */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}

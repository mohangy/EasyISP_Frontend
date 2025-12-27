import { BarChart3, PieChart, FileText, ArrowRight } from "lucide-react";

export function Reports() {
    const reports = [
        {
            title: "Income Statement",
            description: "Revenue, expenses, and net profit over time",
            icon: BarChart3,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
        },
        {
            title: "Balance Sheet",
            description: "Assets, liabilities, and equity overview",
            icon: PieChart,
            color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
        },
        {
            title: "Cash Flow",
            description: "Inflows and outflows of cash",
            icon: FileText,
            color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
        },
        {
            title: "Aged Receivables",
            description: "Outstanding invoices by age",
            icon: FileText,
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
        },
        {
            title: "Tax Report",
            description: "VAT and other tax liabilities",
            icon: FileText,
            color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
        },
        {
            title: "Expense Breakdown",
            description: "Detailed analysis of expense categories",
            icon: PieChart,
            color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400"
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Generate and view detailed financial statements
                </p>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report, index) => (
                    <div
                        key={index}
                        className="group bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${report.color}`}>
                                <report.icon className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {report.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {report.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-300">Report Generation</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        Reports are generated in real-time based on the transactions in the General Ledger.
                        You can export any report to PDF or Excel format.
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { FolderOpen, Plus, Search, Edit2, Trash2, FolderPlus, FileText } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import toast from "react-hot-toast";

interface Account {
    id: string;
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    balance: number;
    description?: string;
    isSystem: boolean; // System accounts cannot be deleted
}


export function ChartOfAccounts() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("All");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [accounts, _setAccounts] = useState<Account[]>([]);  // Will fetch from API

    // Filter logic
    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.code.includes(searchQuery);
        const matchesType = filterType === "All" || acc.type === filterType;
        return matchesSearch && matchesType;
    }).sort((a, b) => a.code.localeCompare(b.code));

    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreateModalOpen(false);
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Creating account...',
                success: 'Account created successfully',
                error: 'Failed to create account'
            }
        );
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Asset': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            case 'Liability': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
            case 'Equity': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Revenue': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'Expense': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chart of Accounts</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage your financial accounts and ledger structure
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Account
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${filterType === type
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accounts List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-24">Code</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Account Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Balance (KES)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredAccounts.map((account) => (
                            <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{account.code}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${getTypeColor(account.type).split(' ')[1]}`}>
                                            {account.type === 'Asset' || account.type === 'Liability' || account.type === 'Equity'
                                                ? <FolderOpen className={`w-4 h-4 ${getTypeColor(account.type).split(' ')[0]}`} />
                                                : <FileText className={`w-4 h-4 ${getTypeColor(account.type).split(' ')[0]}`} />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{account.name}</p>
                                            {account.description && (
                                                <p className="text-xs text-slate-500">{account.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}>
                                        {account.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(account.balance)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {!account.isSystem && (
                                            <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAccounts.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <FolderPlus className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No accounts found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Try adjusting your search or filters
                        </p>
                        <button
                            onClick={() => { setSearchQuery(""); setFilterType("All"); }}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Create Account Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add New Account"
                className="max-w-md"
            >
                <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Petty Cash"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Code</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 1005"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Asset">Asset</option>
                                <option value="Liability">Liability</option>
                                <option value="Equity">Equity</option>
                                <option value="Revenue">Revenue</option>
                                <option value="Expense">Expense</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                            placeholder="Optional description..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Create Account
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

// ============ CONFIRM DIALOG ============
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'info',
    isLoading = false,
}: ConfirmDialogProps) {
    const icons = {
        danger: <XCircle className="w-12 h-12 text-red-500" />,
        warning: <AlertTriangle className="w-12 h-12 text-amber-500" />,
        info: <Info className="w-12 h-12 text-blue-500" />,
    };

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        info: 'bg-blue-600 hover:bg-blue-700',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    {icons[variant]}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 whitespace-pre-line">
                    {message}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={onClose} className="bg-slate-500 hover:bg-slate-600" disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button onClick={onConfirm} className={buttonColors[variant]} isLoading={isLoading}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ============ INPUT DIALOG ============
interface InputDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    message?: string;
    placeholder?: string;
    inputType?: 'text' | 'number' | 'password' | 'email';
    submitText?: string;
    cancelText?: string;
    defaultValue?: string;
    isLoading?: boolean;
    validation?: (value: string) => string | null;
}

export function InputDialog({
    isOpen,
    onClose,
    onSubmit,
    title,
    message,
    placeholder = "",
    inputType = "text",
    submitText = "Submit",
    cancelText = "Cancel",
    defaultValue = "",
    isLoading = false,
    validation,
}: InputDialogProps) {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (validation) {
            const validationError = validation(value);
            if (validationError) {
                setError(validationError);
                return;
            }
        }
        setError(null);
        onSubmit(value);
    };

    const handleClose = () => {
        setValue(defaultValue);
        setError(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div>
                {message && (
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        {message}
                    </p>
                )}
                <input
                    type={inputType}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError(null);
                    }}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
                <div className="flex gap-3 justify-end mt-6">
                    <Button onClick={handleClose} className="bg-slate-500 hover:bg-slate-600" disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" isLoading={isLoading}>
                        {submitText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ============ ALERT DIALOG ============
interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
}

export function AlertDialog({
    isOpen,
    onClose,
    title,
    message,
    variant = 'info',
}: AlertDialogProps) {
    const icons = {
        success: <CheckCircle className="w-12 h-12 text-green-500" />,
        error: <XCircle className="w-12 h-12 text-red-500" />,
        warning: <AlertTriangle className="w-12 h-12 text-amber-500" />,
        info: <Info className="w-12 h-12 text-blue-500" />,
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    {icons[variant]}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {message}
                </p>
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                    OK
                </Button>
            </div>
        </Modal>
    );
}

// ============ DATE TIME DIALOG ============
interface DateTimeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (date: Date) => void;
    title: string;
    message?: string;
    submitText?: string;
    cancelText?: string;
    defaultValue?: Date;
    isLoading?: boolean;
    minDate?: Date;
}

export function DateTimeDialog({
    isOpen,
    onClose,
    onSubmit,
    title,
    message,
    submitText = "Submit",
    cancelText = "Cancel",
    defaultValue,
    isLoading = false,
    minDate = new Date(),
}: DateTimeDialogProps) {
    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [value, setValue] = useState(formatDateForInput(defaultValue || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))); // Default to 30 days from now
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        const selectedDate = new Date(value);
        if (selectedDate <= minDate) {
            setError('Please select a future date');
            return;
        }
        setError(null);
        onSubmit(selectedDate);
    };

    const handleClose = () => {
        setValue(formatDateForInput(defaultValue || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
        setError(null);
        onClose();
    };

    // Quick presets
    const addMonths = (months: number) => {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        setValue(formatDateForInput(date));
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div>
                {message && (
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        {message}
                    </p>
                )}

                {/* Quick preset buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => addMonths(1)} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        +1 Month
                    </button>
                    <button onClick={() => addMonths(3)} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        +3 Months
                    </button>
                    <button onClick={() => addMonths(6)} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        +6 Months
                    </button>
                    <button onClick={() => addMonths(12)} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        +1 Year
                    </button>
                </div>

                <input
                    type="datetime-local"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError(null);
                    }}
                    min={formatDateForInput(minDate)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
                <div className="flex gap-3 justify-end mt-6">
                    <Button onClick={handleClose} className="bg-slate-500 hover:bg-slate-600" disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" isLoading={isLoading}>
                        {submitText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

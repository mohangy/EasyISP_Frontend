import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Wifi, Eye, EyeOff, Building2, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react";
import { authApi } from "../../services/authService";

export function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        phone: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
        // Clear field-specific error on change
        if (validationErrors[id]) {
            setValidationErrors({ ...validationErrors, [id]: "" });
        }
        if (error) setError("");
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Name validation
        if (formData.name.trim().length < 2) {
            errors.name = "Name must be at least 2 characters";
        }

        // Business name validation
        if (formData.businessName.trim().length < 2) {
            errors.businessName = "Business name must be at least 2 characters";
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        // Password validation
        if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        // Password strength check
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);

        if (formData.password.length >= 6 && (!hasUpperCase || !hasLowerCase || !hasNumber)) {
            errors.password = "Password should contain uppercase, lowercase, and numbers";
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                businessName: formData.businessName,
                phone: formData.phone || undefined,
            });

            login(response.user, response.token);
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Registration failed:", error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                "Registration failed. Please try again.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Wifi className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            EasyISP
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700/50">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Create your account
                            </h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                Start managing your ISP in minutes
                            </p>
                        </div>

                        {/* General Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <Input
                                    id="name"
                                    label="Your Name"
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                {validationErrors.name && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <Input
                                    id="businessName"
                                    label="Business Name"
                                    type="text"
                                    required
                                    placeholder="Your ISP Company"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                />
                                {validationErrors.businessName && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.businessName}</p>
                                )}
                            </div>

                            <div>
                                <Input
                                    id="email"
                                    label="Email address"
                                    type="email"
                                    required
                                    placeholder="admin@yourcompany.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {validationErrors.email && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <Input
                                    id="phone"
                                    label="Phone Number (Optional)"
                                    type="tel"
                                    placeholder="+254712345678"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                                {validationErrors.phone && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.phone}</p>
                                )}
                            </div>

                            <div className="relative">
                                <Input
                                    id="password"
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                                {validationErrors.password && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.password}</p>
                                )}
                                {formData.password && !validationErrors.password && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <p className="text-xs text-green-600 dark:text-green-400">Password strength: Good</p>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    label="Confirm Password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                                {validationErrors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.confirmPassword}</p>
                                )}
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <p className="text-xs text-green-600 dark:text-green-400">Passwords match</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    required
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    I agree to the{" "}
                                    <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                                    {" "}and{" "}
                                    <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                                </span>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                                isLoading={isLoading}
                            >
                                Create Account
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{" "}
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Wifi className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-white">EasyISP</span>
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                        Everything you need to
                        <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            run your ISP
                        </span>
                    </h1>

                    <div className="space-y-6 mt-8">
                        {[
                            { icon: Building2, text: "Multi-tenant architecture for scalability" },
                            { icon: Wifi, text: "MikroTik router integration" },
                            { icon: Mail, text: "Automated billing & notifications" },
                            { icon: Lock, text: "Secure RADIUS authentication" },
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <feature.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-slate-300">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

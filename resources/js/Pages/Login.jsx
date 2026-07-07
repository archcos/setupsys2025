import { useState, useEffect } from "react";
import { useForm, Link, Head, usePage, router } from "@inertiajs/react";
import {
    Eye,
    EyeOff,
    User,
    Lock,
    AlertCircle,
    Shield,
    CheckCircle,
    AlertTriangle,
    X,
    Megaphone,
    ChevronRight,
    Calendar,
} from "lucide-react";
import logo from "../../assets/logo.webp";
import setupLogo from "../../assets/SETUP_logo.webp";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authSuccess, setAuthSuccess] = useState(false);
    const [announcementsOpen, setAnnouncementsOpen] = useState(true); // Open by default
    const [announcementsMinimized, setAnnouncementsMinimized] = useState(false);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [pendingCredentials, setPendingCredentials] = useState(null);
    const { props } = usePage();
    const announcements = props.announcements || [];
    const flash = props.flash || {};

    const { data, setData, post, processing, errors, reset } = useForm({
        login: "",
        password: "",
        force_login: "false",
    });

    // Auto-open announcements if there are any
    useEffect(() => {
        if (announcements.length > 0) {
            setAnnouncementsOpen(true);
            setAnnouncementsMinimized(false);
        }
    }, [announcements]);

    // Check for session warning in flash data
    useEffect(() => {
        if (flash?.active_session_warning) {
            setShowSessionWarning(true);
            setIsAuthenticating(false);
            setAuthSuccess(false);
        }
    }, [flash]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        setPendingCredentials({
            login: data.login,
            password: data.password
        });
        
        setIsAuthenticating(true);
        setAuthSuccess(false);
        
        post("/signin", {
            data: {
                login: data.login,
                password: data.password,
                force_login: "false",
            },
            onSuccess: (page) => {
                if (page.props?.flash?.active_session_warning) {
                    setShowSessionWarning(true);
                    setIsAuthenticating(false);
                    setAuthSuccess(false);
                    return;
                }
                
                setAuthSuccess(true);
                setShowSessionWarning(false);
            },
            onError: (errors) => {
                setIsAuthenticating(false);
                setAuthSuccess(false);
                
                if (errors.active_session) {
                    setShowSessionWarning(true);
                    return;
                }
                
                if (errors.message && (
                    errors.message.includes('already logged in') ||
                    errors.message.includes('another device')
                )) {
                    setShowSessionWarning(true);
                    return;
                }
                
                // REMOVE THIS ENTIRE BLOCK - it's causing the CSRF token mismatch
                // if (errors.message?.includes('419')) {
                //     router.reload({...});
                //     return;
                // }
            },
        });
    };

    const handleForceLogin = () => {
        setIsAuthenticating(true);
        setShowSessionWarning(false);
        setAuthSuccess(false);
        
        router.post("/signin", {
            login: pendingCredentials?.login || data.login,
            password: pendingCredentials?.password || data.password,
            force_login: "true",
        }, {
            onSuccess: (page) => {
                if (page.props?.flash?.active_session_warning) {
                    setShowSessionWarning(true);
                    setIsAuthenticating(false);
                    setAuthSuccess(false);
                    return;
                }
                
                setAuthSuccess(true);
                setShowSessionWarning(false);
            },
            onError: (errors) => {
                setIsAuthenticating(false);
                setAuthSuccess(false);
                setShowSessionWarning(false);
            },
        });
    };

    const handleCancelForceLogin = () => {
        setShowSessionWarning(false);
        setPendingCredentials(null);
        setIsAuthenticating(false);
        setAuthSuccess(false);
        reset('force_login');
    };

    const toggleAnnouncements = () => {
        if (announcementsMinimized) {
            setAnnouncementsMinimized(false);
            setAnnouncementsOpen(true);
        } else {
            setAnnouncementsOpen(!announcementsOpen);
        }
    };

    return (
        <>
            <Head title="SIMS LOGIN" />

            <style>{`
                @keyframes fillBar {
                    0%   { width: 0%; }
                    40%  { width: 72%; }
                    70%  { width: 88%; }
                    90%  { width: 95%; }
                    100% { width: 98%; }
                }
                @keyframes fillBarComplete {
                    0%   { width: 98%; }
                    100% { width: 100%; }
                }
                @keyframes stepFadeIn {
                    from { opacity: 0; transform: translateX(-6px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes successPop {
                    0%   { transform: scale(0.5); opacity: 0; }
                    70%  { transform: scale(1.12); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes successFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes shieldFly {
                    0%   { transform: translate(0, 0) scale(1); opacity: 1; }
                    60%  { transform: translate(50px, -40px) scale(0.8); opacity: 0.7; }
                    100% { transform: translate(100px, -80px) scale(0.3); opacity: 0; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                .fill-bar { animation: fillBar 5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .fill-bar-complete { animation: fillBarComplete 0.35s ease-in forwards; }
                .step-item { opacity: 0; animation: stepFadeIn 0.4s ease forwards; }
                .success-pop { animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .success-fade { animation: successFadeIn 0.4s ease 0.25s both; }
                .shield-fly { animation: shieldFly 0.8s cubic-bezier(0.4, 0, 1, 1) forwards; }
                .modal-slide { animation: modalSlideIn 0.3s ease-out forwards; }
                .slide-in-right { animation: slideInRight 0.3s ease-out forwards; }
                .fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>

            {/* Session Active Warning Modal */}
            {showSessionWarning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="modal-slide bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle size={24} className="text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Active Session Detected
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    This account is currently logged in on another device. 
                                    Continuing will log out the other session. Do you want to proceed?
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                onClick={handleCancelForceLogin}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleForceLogin}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl"
                            >
                                Continue & Log Out Other Session
                            </button>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-3 text-center">
                            For security, you may want to change your password if this wasn't you.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Loading / Success Overlay ── */}
            {isAuthenticating && !showSessionWarning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-xs w-full mx-4 relative overflow-hidden">
                        {!authSuccess && (
                            <div className="flex flex-col items-center gap-5">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-blue-50" />
                                    <div className="relative z-10 flex items-center justify-center">
                                        <Shield size={52} className="text-blue-600" />
                                        <img
                                            src={logo}
                                            alt="DOST Logo"
                                            className="absolute w-6 h-6 object-contain"
                                            style={{
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -58%)",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="w-full">
                                    <p className="text-sm font-semibold text-gray-800 mb-3 text-center">
                                        Authenticating your account...
                                    </p>

                                    <div className="space-y-2 mb-4">
                                        {[
                                            "Verifying credentials",
                                            "Checking active sessions",
                                            "Preparing dashboard",
                                        ].map((label, i) => (
                                            <div
                                                key={i}
                                                className="step-item flex items-center gap-2 text-xs text-gray-600"
                                                style={{ animationDelay: `${i * 0.8}s` }}
                                            >
                                                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                {label}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 fill-bar" />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 text-center">
                                        Please wait while we authenticate your account
                                    </p>
                                </div>
                            </div>
                        )}

                        {authSuccess && (
                            <div className="flex flex-col items-center gap-4 py-2">
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    <div className="shield-fly absolute flex items-center justify-center">
                                        <Shield size={30} className="text-blue-500" />
                                        <img
                                            src={logo}
                                            alt="DOST Logo"
                                            className="absolute w-3.5 h-3.5 object-contain"
                                            style={{
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -58%)",
                                            }}
                                        />
                                    </div>
                                    <div className="success-pop">
                                        <CheckCircle size={56} className="text-green-500" />
                                    </div>
                                </div>

                                <div className="success-fade text-center">
                                    <p className="text-base font-semibold text-gray-900">
                                        Authenticated!
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Redirecting you to your dashboard...
                                    </p>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 fill-bar-complete" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Enhanced Announcements Panel ── */}
            {announcements.length > 0 && (
                <>
                    {/* Backdrop when panel is open on mobile */}
                    {announcementsOpen && !announcementsMinimized && (
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden fade-in"
                            onClick={() => setAnnouncementsOpen(false)}
                        />
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={toggleAnnouncements}
                        className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
                            announcementsOpen && !announcementsMinimized
                                ? "right-[380px] lg:right-[420px]"
                                : "right-0"
                        }`}
                    >
                        <div className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-l-2xl shadow-2xl p-4 flex flex-col items-center gap-2 transition-all duration-200 group">
                            <Megaphone size={20} className="group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider">News</span>
                                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                                    {announcements.length}
                                </span>
                            </div>
                            <ChevronRight 
                                size={14} 
                                className={`transition-transform duration-300 ${
                                    announcementsOpen && !announcementsMinimized ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                    </button>

                    {/* Sliding Panel */}
                    <div
                        className={`fixed top-0 right-0 h-full z-40 transition-all duration-300 ease-in-out ${
                            announcementsOpen && !announcementsMinimized
                                ? "translate-x-0 opacity-100"
                                : "translate-x-full opacity-0"
                        }`}
                    >
                        <div className="h-full w-[380px] lg:w-[420px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
                            {/* Panel Header */}
                            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <Megaphone size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-white font-bold text-lg">Announcements</h2>
                                            <p className="text-blue-200 text-xs">Stay updated with the latest news</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAnnouncementsOpen(false)}
                                        className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                                        aria-label="Close announcements"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                                        {announcements.length} {announcements.length === 1 ? 'Announcement' : 'Announcements'}
                                    </span>
                                    <span className="text-blue-200 text-xs">
                                        • Updated recently
                                    </span>
                                </div>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                <div className="p-4 space-y-3">
                                    {announcements.map((announcement, index) => (
                                        <div
                                            key={announcement.announce_id}
                                            className="slide-in-right group cursor-pointer"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                            onClick={() => router.visit("/announcements/view")}
                                        >
                                            <div className="bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg">
                                                {/* Office Badge */}
                                                {announcement.office?.office_name && (
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                            {announcement.office.office_name}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Title */}
                                                <h3 className="text-[15px] font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-snug">
                                                    {announcement.title}
                                                </h3>

                                                {/* Details */}
                                                {announcement.details && (
                                                    <p className="text-[13px] text-gray-600 leading-relaxed mb-4 line-clamp-2">
                                                        {announcement.details}
                                                    </p>
                                                )}

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                    {announcement.created_at && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                            <Calendar size={12} />
                                                            <span>
                                                                {new Date(announcement.created_at).toLocaleString("en-PH", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                    hour: "numeric",
                                                                    minute: "2-digit",
                                                                    hour12: true,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                                                        Read more
                                                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Panel Footer */}
                            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4">
                                <button
                                    onClick={() => router.visit("/announcements/view")}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    View All Announcements
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    onClick={() => setAnnouncementsOpen(false)}
                                    className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                                >
                                    Close Panel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Main Page ── */}
            <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-sm">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-4">
                        {/* Header */}
                        <div className="flex flex-col items-center justify-center gap-2 mb-5">
                            <div className="flex items-center justify-center gap-3">
                                <img
                                    src={logo}
                                    alt="DOST Logo"
                                    className="w-9 h-9 object-contain"
                                />
                                <img
                                    src={setupLogo}
                                    alt="SETUP Logo"
                                    className="h-9 object-contain"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                                    DOST - Northern Mindanao
                                </h2>
                                <h3 className="text-xs text-gray-500 font-medium leading-relaxed">
                                    Small Enterprise Technology Upgrading
                                    Program <br />
                                    Information Management System
                                </h3>
                            </div>
                        </div>

                        <div className="text-center mb-3">
                            <p className="text-sm text-gray-600">
                                Sign in to your SIMS account
                            </p>
                        </div>

                        {/* Flash Messages */}
                        {(flash.success || flash.message) && !showSessionWarning && (
                            <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                                <span>{flash.success || flash.message}</span>
                            </div>
                        )}

                        {/* Error Messages */}
                        {errors.message && !showSessionWarning && !errors.active_session && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                                <span>{errors.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="login" className="block text-xs font-medium text-gray-700 mb-1">
                                    Username or Email
                                </label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        id="login"
                                        type="text"
                                        value={data.login}
                                        onChange={(e) => setData("login", e.target.value)}
                                        placeholder="Enter your username or email"
                                        disabled={processing || isAuthenticating}
                                        autoComplete="username"
                                        className={`w-full border pl-9 pr-4 py-2.5 rounded-xl text-sm transition-colors ${
                                            errors.login
                                                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                                        required
                                    />
                                </div>
                                {errors.login && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                                        {errors.login}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        placeholder="Enter your password"
                                        disabled={processing || isAuthenticating}
                                        autoComplete="current-password"
                                        className={`w-full border pl-9 pr-10 py-2.5 rounded-xl text-sm transition-colors ${
                                            errors.password
                                                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={processing || isAuthenticating}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none disabled:cursor-not-allowed"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Link
                                    href={route("password.request")}
                                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                                >
                                    Forgot your password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || isAuthenticating}
                                className={`w-full ${
                                    processing || isAuthenticating
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
                                } text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
                            >
                                {processing || isAuthenticating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing In...
                                    </span>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    href="/register"
                                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                                >
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-500">
                        <p>
                            Have Inquiries?{" "}
                            <Link
                                href="/contact"
                                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                                Contact Us
                            </Link>
                        </p>
                        <br />
                        <p>
                            © {new Date().getFullYear()} DOST Northern Mindanao.
                            All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

LoginPage.layout = null;
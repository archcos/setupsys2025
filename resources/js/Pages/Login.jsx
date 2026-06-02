import { useState } from "react";
import { useForm, Link, Head, usePage, router } from "@inertiajs/react";
import {
    Eye,
    EyeOff,
    User,
    Lock,
    AlertCircle,
    Mail,
    Shield,
    CheckCircle,
} from "lucide-react";
import logo from "../../assets/logo.webp";
import setupLogo from "../../assets/SETUP_logo.webp";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authSuccess, setAuthSuccess] = useState(false);
    const [announcementsOpen, setAnnouncementsOpen] = useState(false);
    const { props } = usePage();
    const announcements = props.announcements || [];
    const flash = props.flash || {};

    const { data, setData, post, processing, errors } = useForm({
        login: "",
        password: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsAuthenticating(true);
        post("/signin", {
            onSuccess: (page) => {
                setAuthSuccess(true);
                setIsAuthenticating(false);
                // hold the success screen for 1.5s before Inertia navigates
                setTimeout(() => {
                    router.visit(page.url || "/dashboard");
                }, 1500);
            },
            onError: () => {
                setIsAuthenticating(false);
                setAuthSuccess(false);
            },
        });
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
                .fill-bar { animation: fillBar 5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .fill-bar-complete { animation: fillBarComplete 0.35s ease-in forwards; }
                .step-item { opacity: 0; animation: stepFadeIn 0.4s ease forwards; }
                .success-pop { animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .success-fade { animation: successFadeIn 0.4s ease 0.25s both; }
                .shield-fly { animation: shieldFly 0.8s cubic-bezier(0.4, 0, 1, 1) forwards; }
            `}</style>

            {/* ── Loading / Success Overlay ── */}
            {(isAuthenticating || authSuccess) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-xs w-full mx-4 relative overflow-hidden">
                        {/* AUTHENTICATING STATE */}
                        {!authSuccess && (
                            <div className="flex flex-col items-center gap-5">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-blue-50" />
                                    <div className="relative z-10 flex items-center justify-center">
                                        <Shield
                                            size={52}
                                            className="text-blue-600"
                                        />
                                        <img
                                            src={logo}
                                            alt="DOST Logo"
                                            className="absolute w-6 h-6 object-contain"
                                            style={{
                                                top: "50%",
                                                left: "50%",
                                                transform:
                                                    "translate(-50%, -58%)",
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
                                            "Generating OTP code",
                                            "Sending email",
                                        ].map((label, i) => (
                                            <div
                                                key={i}
                                                className="step-item flex items-center gap-2 text-xs text-gray-600"
                                                style={{
                                                    animationDelay: `${i * 0.8}s`,
                                                }}
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
                                        Please wait while we authenticate your
                                        account
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SUCCESS STATE */}
                        {authSuccess && (
                            <div className="flex flex-col items-center gap-4 py-2">
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    <div className="shield-fly absolute flex items-center justify-center">
                                        <Shield
                                            size={30}
                                            className="text-blue-500"
                                        />
                                        <img
                                            src={logo}
                                            alt="DOST Logo"
                                            className="absolute w-3.5 h-3.5 object-contain"
                                            style={{
                                                top: "50%",
                                                left: "50%",
                                                transform:
                                                    "translate(-50%, -58%)",
                                            }}
                                        />
                                    </div>
                                    <div className="success-pop">
                                        <CheckCircle
                                            size={56}
                                            className="text-green-500"
                                        />
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

            {/* ── Announcements Side Bookmark ── */}
            {announcements.length > 0 && (
                <>
                    {announcementsOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setAnnouncementsOpen(false)}
                        />
                    )}
                    <div className="fixed top-0 right-0 h-full z-50 flex items-center pointer-events-none">
                        <div className="flex items-center pointer-events-auto">
                            <button
                                onClick={() =>
                                    setAnnouncementsOpen(!announcementsOpen)
                                }
                                className="select-none focus:outline-none flex flex-col items-center gap-1 py-5 px-2.5 text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-colors duration-150 rounded-l-xl shadow-xl"
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    className="flex-shrink-0 mb-1"
                                >
                                    <path
                                        d="M2 2h12v12l-6-3-6 3V2z"
                                        stroke="white"
                                        strokeWidth="1.8"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {"ANNOUNCEMENTS".split("").map((char, i) => (
                                    <span
                                        key={i}
                                        className="text-[11px] font-bold leading-none uppercase"
                                    >
                                        {char}
                                    </span>
                                ))}
                                <span className="mt-1.5 flex-shrink-0 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none">
                                    {announcements.length}
                                </span>
                            </button>

                            <div
                                className={`flex flex-col bg-white shadow-2xl border-l border-slate-200 overflow-hidden transition-all duration-300 ease-in-out ${
                                    announcementsOpen
                                        ? "w-80 opacity-100 rounded-l-2xl"
                                        : "w-0 opacity-0 pointer-events-none"
                                }`}
                                style={{ maxHeight: "min(580px, 85vh)" }}
                            >
                                <div className="flex-shrink-0 bg-blue-700 px-5 py-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            className="flex-shrink-0"
                                        >
                                            <path
                                                d="M2 2h12v12l-6-3-6 3V2z"
                                                stroke="white"
                                                strokeWidth="1.6"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span className="text-white text-sm font-semibold tracking-wide whitespace-nowrap">
                                            Announcements
                                        </span>
                                        <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {announcements.length} new
                                        </span>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setAnnouncementsOpen(false)
                                        }
                                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 text-white text-sm flex items-center justify-center transition-colors focus:outline-none"
                                        aria-label="Close announcements"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2 min-w-[320px]">
                                    {announcements.map((a) => (
                                        <button
                                            key={a.announce_id}
                                            onClick={() =>
                                                router.visit(
                                                    "/announcements/view",
                                                )
                                            }
                                            className="w-full text-left group bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-3 transition-all duration-150 shadow-sm hover:shadow-md"
                                        >
                                            {a.office?.office_name && (
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 group-hover:text-blue-700 mb-1 transition-colors">
                                                    {a.office.office_name}
                                                </p>
                                            )}
                                            <p className="text-[13px] font-semibold text-slate-800 leading-snug mb-1.5">
                                                {a.title}
                                            </p>
                                            {a.details && (
                                                <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-2.5">
                                                    {a.details}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                {a.created_at && (
                                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                        <svg
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 16 16"
                                                            fill="none"
                                                        >
                                                            <rect
                                                                x="2"
                                                                y="3"
                                                                width="12"
                                                                height="11"
                                                                rx="2"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                            />
                                                            <path
                                                                d="M5 2v2M11 2v2M2 7h12"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                        {new Date(
                                                            a.created_at,
                                                        ).toLocaleString(
                                                            "en-PH",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                                hour12: true,
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-semibold text-blue-500 group-hover:text-blue-700 transition-colors ml-auto flex items-center gap-0.5">
                                                    Read more
                                                    <svg
                                                        width="10"
                                                        height="10"
                                                        viewBox="0 0 16 16"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M3 8h10M9 4l4 4-4 4"
                                                            stroke="currentColor"
                                                            strokeWidth="1.6"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3">
                                    <button
                                        onClick={() =>
                                            router.visit("/announcements/view")
                                        }
                                        className="w-full text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors text-center"
                                    >
                                        View all announcements →
                                    </button>
                                </div>
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

                        {(flash.success || flash.message) && (
                            <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-sm">
                                <CheckCircle
                                    size={16}
                                    className="text-green-600 flex-shrink-0"
                                />
                                <span>{flash.success || flash.message}</span>
                            </div>
                        )}

                        {errors.message && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-sm">
                                <AlertCircle
                                    size={16}
                                    className="text-red-600 flex-shrink-0"
                                />
                                <span>{errors.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="login"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Username or Email
                                </label>
                                <div className="relative">
                                    <User
                                        size={15}
                                        className="absolute left-3 top-3 text-gray-400"
                                    />
                                    <input
                                        id="login"
                                        type="text"
                                        value={data.login}
                                        onChange={(e) =>
                                            setData("login", e.target.value)
                                        }
                                        placeholder="Enter your username or email"
                                        disabled={
                                            processing || isAuthenticating
                                        }
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
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock
                                        size={15}
                                        className="absolute left-3 top-3 text-gray-400"
                                    />
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        disabled={
                                            processing || isAuthenticating
                                        }
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
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        disabled={
                                            processing || isAuthenticating
                                        }
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none disabled:cursor-not-allowed"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
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
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
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

import { useState, useEffect, useRef } from "react";
import { useForm, Head, Link, usePage } from "@inertiajs/react";
import {
    Send,
    Mail,
    Clock,
    MessageCircle,
    User,
    CheckCircle,
    BookMarked,
    ArrowLeft,
    MapPin,
    Phone,
} from "lucide-react";
import logo from "../../assets/logo.webp";
import setupLogo from "../../assets/SETUP_logo.webp";

export default function ContactUs() {
    const [successMessage, setSuccessMessage] = useState("");
    const [rateLimitMessage, setRateLimitMessage] = useState("");
    const [rateLimitTimer, setRateLimitTimer] = useState(0);
    const [localErrors, setLocalErrors] = useState({});
    const [showProcessing, setShowProcessing] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);

    const { flash, errors: pageErrors } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setShowProcessing(false);
            setSendSuccess(true);
            setTimeout(() => {
                setSendSuccess(false);
                setSuccessMessage("");
            }, 3500);
        }
        if (flash?.rate_limit) {
            setRateLimitMessage(flash.rate_limit);
            setRateLimitTimer(flash?.rate_seconds || 60);
            setShowProcessing(false);
        }
    }, [flash]);

    useEffect(() => {
        if (rateLimitTimer <= 0) return;
        const interval = setInterval(() => {
            setRateLimitTimer((prev) => {
                if (prev <= 1) {
                    setRateLimitMessage("");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [rateLimitTimer]);

    const validatePhoneNumber = (phone) => {
        if (!phone) return "";
        return /^09\d{9}$/.test(phone)
            ? ""
            : "Phone number must start with 09 and contain 11 digits (Philippine format)";
    };

    const validateEmail = (email) => {
        if (!email) return "";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ? ""
            : "Please enter a valid email address";
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        phone: "",
        website: "",
    });

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setData("phone", value);
        if (localErrors.phone && value && !validatePhoneNumber(value))
            setLocalErrors((prev) => ({ ...prev, phone: "" }));
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setData("email", value);
        if (localErrors.email && value && !validateEmail(value))
            setLocalErrors((prev) => ({ ...prev, email: "" }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        const phoneError = validatePhoneNumber(data.phone);
        if (data.phone && phoneError) newErrors.phone = phoneError;
        const emailError = validateEmail(data.email);
        if (emailError) newErrors.email = emailError;
        if (Object.keys(newErrors).length > 0) {
            setLocalErrors(newErrors);
            return;
        }

        setLocalErrors({});
        setShowProcessing(true);
        post("/contact", {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setLocalErrors({});
            },
            onError: (submitErrors) => {
                if (submitErrors.rate_seconds || submitErrors.rate_limit) {
                    setRateLimitMessage(
                        submitErrors.rate_limit ||
                            "Please wait before sending another message.",
                    );
                    setRateLimitTimer(submitErrors.rate_seconds || 60);
                }
            },
            onFinish: () => setTimeout(() => setShowProcessing(false), 500),
        });
    };

    const InputError = ({ error }) =>
        error ? (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {error}
            </p>
        ) : null;

    const isDisabled = rateLimitTimer > 0 || showProcessing;

    const steps = [
        { label: "Validating message", icon: "✓" },
        { label: "Processing request", icon: "✓" },
        { label: "Sending email", icon: "✓" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4">
            <Head title="Contact Us - DOST SETUP" />

            <style>{`
                @keyframes fillBar {
                    0%   { width: 0%; }
                    40%  { width: 70%; }
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
                @keyframes flyEmail {
                    0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
                    60%  { transform: translate(60px, -50px) rotate(-20deg) scale(0.8); opacity: 0.8; }
                    100% { transform: translate(120px, -100px) rotate(-35deg) scale(0.3); opacity: 0; }
                }
                @keyframes successPop {
                    0%   { transform: scale(0.5); opacity: 0; }
                    70%  { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes successFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes confettiFall {
                    0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
                }
                .fill-bar { animation: fillBar 4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .fill-bar-complete { animation: fillBarComplete 0.4s ease-in forwards; }
                .step-item { opacity: 0; animation: stepFadeIn 0.4s ease forwards; }
                .fly-email { animation: flyEmail 0.9s cubic-bezier(0.4, 0, 1, 1) forwards; }
                .success-pop { animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .success-fade { animation: successFadeIn 0.4s ease 0.3s both; }
                .confetti-1 { animation: confettiFall 1.2s ease 0.1s forwards; }
                .confetti-2 { animation: confettiFall 1.0s ease 0.2s forwards; }
                .confetti-3 { animation: confettiFall 1.4s ease 0.0s forwards; }
                .confetti-4 { animation: confettiFall 1.1s ease 0.3s forwards; }
                .confetti-5 { animation: confettiFall 1.3s ease 0.15s forwards; }
            `}</style>

            <button
                onClick={() => window.history.back()}
                className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>

            {/* Processing / Success overlay */}
            {(showProcessing || sendSuccess) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-xs w-full mx-4 relative overflow-hidden">
                        {/* SENDING STATE */}
                        {!sendSuccess && (
                            <div className="flex flex-col items-center gap-5">
                                {/* Icon */}
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-blue-50" />
                                    <Send
                                        size={28}
                                        className="text-blue-600 relative z-10"
                                    />
                                </div>

                                <div className="w-full">
                                    <p className="text-sm font-semibold text-gray-800 mb-3 text-center">
                                        Sending your message...
                                    </p>

                                    {/* Steps */}
                                    <div className="space-y-2 mb-4">
                                        {steps.map((step, i) => (
                                            <div
                                                key={i}
                                                className="step-item flex items-center gap-2 text-xs text-gray-600"
                                                style={{
                                                    animationDelay: `${i * 0.7}s`,
                                                }}
                                            >
                                                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                {step.label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 fill-bar`}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 text-center">
                                        Please wait while we send your message
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SUCCESS STATE */}
                        {sendSuccess && (
                            <div className="flex flex-col items-center gap-4 py-2">
                                {/* Confetti dots */}
                                <div className="absolute top-4 left-0 right-0 flex justify-around px-4 pointer-events-none">
                                    <span className="confetti-1 w-2 h-2 rounded-full bg-blue-400 block" />
                                    <span className="confetti-2 w-2 h-2 rounded-sm bg-indigo-400 block" />
                                    <span className="confetti-3 w-1.5 h-1.5 rounded-full bg-green-400 block" />
                                    <span className="confetti-4 w-2 h-2 rounded-sm bg-yellow-400 block" />
                                    <span className="confetti-5 w-1.5 h-1.5 rounded-full bg-pink-400 block" />
                                </div>

                                {/* Flying email + check */}
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    {/* Sent envelope flying away */}
                                    <Mail
                                        size={32}
                                        className="fly-email absolute text-blue-500"
                                    />
                                    {/* Check circle pops in */}
                                    <div className="success-pop">
                                        <CheckCircle
                                            size={56}
                                            className="text-green-500"
                                        />
                                    </div>
                                </div>

                                <div className="success-fade text-center">
                                    <p className="text-base font-semibold text-gray-900">
                                        Message sent!
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        We'll get back to you as soon as
                                        possible.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/">
                        <div className="flex items-center justify-center gap-3 mb-4">
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
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Get In Touch
                    </h1>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto">
                        Have questions about SETUP programs or need assistance?
                        We're here to help.
                    </p>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map */}
                    <div className="order-2 lg:order-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px]">
                        <iframe
                            width="100%"
                            height="100%"
                            className="w-full h-full min-h-[500px]"
                            style={{ border: 0, display: "block" }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d488.1071438316753!2d124.62752!3d8.48229!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32fff8a9bb6d97ab%3A0x56a9a2c7b8df1d76!2sDOST%20Regional%20Office%20X!5e0!3m2!1sen!2sph!4v1713177938456!5m2!1sen!2sph"
                            title="DOST Regional Office X Map"
                        />
                    </div>

                    {/* Form */}
                    <div className="order-1 lg:order-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Send className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Send Us a Message
                            </h2>
                        </div>

                        {/* Rate limit banner */}
                        {rateLimitTimer > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-3 rounded-xl mb-4 flex items-center gap-3 animate-pulse">
                                <svg
                                    className="w-5 h-5 text-yellow-600 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">
                                        Rate Limit Reached!
                                    </p>
                                    <p className="text-xs mt-0.5">
                                        {rateLimitMessage}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center bg-yellow-100 px-4 py-2 rounded-lg">
                                    <div className="relative w-14 h-14">
                                        <svg
                                            className="w-14 h-14 transform -rotate-90"
                                            viewBox="0 0 100 100"
                                        >
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke="#fecaca"
                                                strokeWidth="5"
                                                opacity="0.5"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke="#dc2626"
                                                strokeWidth="5"
                                                strokeDasharray={`${(rateLimitTimer / 60) * 282.7} 282.7`}
                                                strokeLinecap="round"
                                                style={{
                                                    transition:
                                                        "stroke-dasharray 1s linear",
                                                }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-xl font-bold text-red-700">
                                                {rateLimitTimer}
                                            </span>
                                            <span className="text-xs text-red-600 font-semibold">
                                                sec
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error banner */}
                        {(pageErrors?.message ||
                            Object.keys(errors).length > 0 ||
                            Object.keys(localErrors).length > 0) && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-3 rounded-xl mb-4 flex items-start gap-2">
                                <svg
                                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div>
                                    <p className="font-semibold text-sm">
                                        Unable to send message
                                    </p>
                                    {pageErrors?.message && (
                                        <p className="text-xs mt-0.5">
                                            {pageErrors.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Full Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                            disabled={isDisabled}
                                            className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                    <InputError error={errors.name} />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Email Address{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={handleEmailChange}
                                            disabled={isDisabled}
                                            className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                    <InputError
                                        error={
                                            localErrors.email || errors.email
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Phone{" "}
                                        <span className="text-gray-400 font-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <Phone
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="tel"
                                            value={data.phone}
                                            onChange={handlePhoneChange}
                                            disabled={isDisabled}
                                            className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="09XXXXXXXXX"
                                            maxLength="11"
                                        />
                                    </div>
                                    <InputError
                                        error={
                                            localErrors.phone || errors.phone
                                        }
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        09 followed by 9 digits
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Subject{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <BookMarked
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={data.subject}
                                            onChange={(e) =>
                                                setData(
                                                    "subject",
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isDisabled}
                                            className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="What's this about?"
                                            required
                                        />
                                    </div>
                                    <InputError error={errors.subject} />
                                </div>
                            </div>

                            {/* Honeypot */}
                            <div style={{ display: "none" }}>
                                <input
                                    type="text"
                                    name="website"
                                    value={data.website || ""}
                                    onChange={(e) =>
                                        setData("website", e.target.value)
                                    }
                                    autoComplete="off"
                                    tabIndex="-1"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Message{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <MessageCircle
                                        size={15}
                                        className="absolute left-3 top-2.5 text-gray-400"
                                    />
                                    <textarea
                                        value={data.message}
                                        onChange={(e) =>
                                            setData("message", e.target.value)
                                        }
                                        disabled={isDisabled}
                                        rows={6}
                                        className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        placeholder="Describe your inquiry in detail..."
                                        required
                                    />
                                </div>
                                <InputError error={errors.message} />
                                <p className="text-xs text-gray-400 mt-1">
                                    More detail helps us assist you faster.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isDisabled}
                                    className={`inline-flex items-center gap-2 px-6 py-2 text-sm ${
                                        isDisabled
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
                                    } text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg`}
                                >
                                    {showProcessing ? (
                                        <>
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
                                            Sending...
                                        </>
                                    ) : rateLimitTimer > 0 ? (
                                        <>
                                            <Clock className="w-4 h-4" /> Wait{" "}
                                            {rateLimitTimer}s
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" /> Send
                                            Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Contact info bar */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            {
                                icon: (
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                ),
                                label: "Address",
                                value: (
                                    <>
                                        DOST Regional Office X<br />
                                        J.V. Seriña, Cagayan De Oro City
                                    </>
                                ),
                            },
                            {
                                icon: (
                                    <Phone className="w-4 h-4 text-blue-600" />
                                ),
                                label: "Phone",
                                value: "0888 583 931",
                            },
                            {
                                icon: (
                                    <Mail className="w-4 h-4 text-blue-600" />
                                ),
                                label: "Email",
                                value: (
                                    <>
                                        setup@region10.dost.gov.ph
                                        <br />
                                        info@region10.dost.gov.ph
                                    </>
                                ),
                            },
                            {
                                icon: (
                                    <Clock className="w-4 h-4 text-blue-600" />
                                ),
                                label: "Office Hours",
                                value: (
                                    <>
                                        Mon–Fri: 8:00 AM – 5:00 PM
                                        <br />
                                        Sat–Sun: Closed
                                    </>
                                ),
                            },
                        ].map(({ icon, label, value }) => (
                            <div
                                key={label}
                                className="flex items-start gap-2.5 p-3 rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
                                    {icon}
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-900">
                                        {label}
                                    </h4>
                                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

ContactUs.layout = null;

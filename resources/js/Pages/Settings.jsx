import { useState, useEffect } from "react";
import { useForm, Link, Head, usePage } from "@inertiajs/react";
import {
    Save,
    ArrowLeft,
    User,
    Mail,
    Lock,
    Building2,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Settings,
    Shield,
    X,
    Check,
    XCircle,
} from "lucide-react";

export default function SettingsPage({ user, offices }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showModalCurrentPassword, setShowModalCurrentPassword] =
        useState(false);
    const [showCurrentPasswordModal, setShowCurrentPasswordModal] =
        useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', or null
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors, reset, clearErrors } =
        useForm({
            first_name: user.first_name || "",
            middle_name: user.middle_name || "",
            last_name: user.last_name || "",
            username: user.username || "",
            email: user.email || "",
            current_password: "",
            password: "",
            password_confirmation: "",
            office_id: user.office_id || "",
        });

    // Auto-reset save status after 3 seconds
    useEffect(() => {
        if (saveStatus) {
            const timer = setTimeout(() => {
                setSaveStatus(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    // Check if user is trying to change password
    const isChangingPassword = data.password || data.password_confirmation;

    function handleSubmit(e) {
        e.preventDefault();

        // Only require current password if actually changing password
        if (isChangingPassword) {
            if (!data.current_password) {
                setShowCurrentPasswordModal(true);
                return;
            }
        }

        submitForm();
    }

    function submitForm() {
        put(route("users.update", user.user_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset("password", "password_confirmation", "current_password");
                setShowCurrentPasswordModal(false);
                setShowCurrentPassword(false);
                setShowModalCurrentPassword(false);
                setSaveStatus("success");
            },
            onError: () => {
                setSaveStatus("error");
            },
        });
    }

    function handleModalSubmit(e) {
        e.preventDefault();
        submitForm();
    }

    const InputError = ({ error }) =>
        error ? (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={13} className="flex-shrink-0" />
                {error}
            </p>
        ) : null;

    const inputClass = (hasError) =>
        `w-full border ${hasError ? "border-red-500" : "border-gray-300"} pl-9 pr-10 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`;

    return (
        <div className="min-h-screen">
            <Head title="Account Settings" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-xl">
                            <Settings className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Account Settings
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage your profile information
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("user.dashboard")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    <form onSubmit={handleSubmit}>
                        {/* Personal Information */}
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-blue-600" />
                                <h2 className="text-base font-semibold text-gray-900">
                                    Personal Information
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <User
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    "first_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full border border-gray-300 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="First name"
                                        />
                                    </div>
                                    <InputError error={errors.first_name} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Middle Name{" "}
                                        <span className="text-gray-400 font-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <User
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={data.middle_name}
                                            onChange={(e) =>
                                                setData(
                                                    "middle_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full border border-gray-300 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Middle name"
                                        />
                                    </div>
                                    <InputError error={errors.middle_name} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <User
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    "last_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full border border-gray-300 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Last name"
                                        />
                                    </div>
                                    <InputError error={errors.last_name} />
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <h2 className="text-base font-semibold text-gray-900">
                                    Account Information
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <User
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={data.username}
                                            onChange={(e) =>
                                                setData(
                                                    "username",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full border border-gray-300 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <InputError error={errors.username} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            className="w-full border border-gray-300 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Email address"
                                        />
                                    </div>
                                    <InputError error={errors.email} />
                                </div>
                            </div>
                        </div>

                        {/* Office Information */}
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <h2 className="text-base font-semibold text-gray-900">
                                    Office Information
                                </h2>
                            </div>
                            <div className="max-w-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Office
                                </label>
                                <div className="relative">
                                    <Building2
                                        size={15}
                                        className="absolute left-3 top-2.5 text-gray-400 z-10"
                                    />
                                    <select
                                        value={data.office_id}
                                        onChange={(e) =>
                                            setData("office_id", e.target.value)
                                        }
                                        className="w-full border border-gray-300 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                                    >
                                        <option value="">
                                            Select your office
                                        </option>
                                        {offices.map((office) => (
                                            <option
                                                key={office.office_id}
                                                value={office.office_id}
                                            >
                                                {office.office_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError error={errors.office_id} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Lock className="w-4 h-4 text-blue-600" />
                                <h2 className="text-base font-semibold text-gray-900">
                                    Change Password
                                </h2>
                                <span className="text-sm text-gray-400">
                                    (leave blank to keep current)
                                </span>
                            </div>

                            {/* Current password field - only shown when changing password */}
                            {isChangingPassword && (
                                <div className="mb-4 max-w-sm">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Current Password{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Shield
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type={
                                                showCurrentPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.current_password}
                                            onChange={(e) =>
                                                setData(
                                                    "current_password",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass(
                                                errors.current_password,
                                            )}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCurrentPassword(
                                                    !showCurrentPassword,
                                                )
                                            }
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <InputError
                                        error={errors.current_password}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            className={`${inputClass(errors.password)}`}
                                            placeholder="New password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <InputError error={errors.password} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    "password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                            className={`${inputClass(errors.password_confirmation)}`}
                                            placeholder="Confirm password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword,
                                                )
                                            }
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <InputError
                                        error={errors.password_confirmation}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
                            <Link
                                href={route("user.dashboard")}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm min-w-[160px] ${
                                    saveStatus === "success"
                                        ? "bg-green-500 text-white"
                                        : saveStatus === "error"
                                          ? "bg-red-500 text-white"
                                          : processing
                                            ? "bg-blue-400 cursor-not-allowed text-white"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white hover:shadow-md"
                                }`}
                            >
                                {saveStatus === "success" ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Settings Saved!
                                    </>
                                ) : saveStatus === "error" ? (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Save Failed
                                    </>
                                ) : processing ? (
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
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Current Password Modal - only shown when changing password without entering current password */}
            {showCurrentPasswordModal && isChangingPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-100 p-2 rounded-lg">
                                        <Shield className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Verify Current Password
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCurrentPasswordModal(false)
                                    }
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                For security reasons, please enter your current
                                password to change to a new one.
                            </p>

                            <form onSubmit={handleModalSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            size={15}
                                            className="absolute left-3 top-2.5 text-gray-400"
                                        />
                                        <input
                                            type={
                                                showModalCurrentPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.current_password}
                                            onChange={(e) =>
                                                setData(
                                                    "current_password",
                                                    e.target.value,
                                                )
                                            }
                                            className={`${inputClass(errors.current_password)} pl-10`}
                                            placeholder="Enter your current password"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowModalCurrentPassword(
                                                    !showModalCurrentPassword,
                                                )
                                            }
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showModalCurrentPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <InputError
                                        error={errors.current_password}
                                    />
                                </div>

                                {errors.current_password && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
                                        <AlertCircle
                                            size={16}
                                            className="text-red-600 flex-shrink-0"
                                        />
                                        {errors.current_password}
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrentPasswordModal(false)
                                        }
                                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-4 py-2 min-w-[120px] ${
                                            processing
                                                ? "bg-blue-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        } text-white rounded-xl text-sm font-medium transition-colors`}
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
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
                                                Verifying...
                                            </span>
                                        ) : (
                                            "Verify & Save"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

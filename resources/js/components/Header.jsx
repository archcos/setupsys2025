import { useState, useEffect, useRef } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";
import profile from "../../assets/profile.png";
import ProfileDropdown from "./ProfileDropdown";

export default function Header({ sidebarOpen, toggleSidebar }) {
    const { darkMode, setDarkMode } = useTheme();
    const [displayText, setDisplayText] = useState("");
    const [showCursor, setShowCursor] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [screenSize, setScreenSize] = useState("mobile");
    
    // Use refs to track intervals and current text
    const typingIntervalRef = useRef(null);
    const isTypingRef = useRef(false);

    // Removed leading spaces
    const fullText = "Small Enterprise Technology Upgrading Program Information Management System";
    const mediumText = "SETUP Information Management System";
    const shortText = "SIMS";

    const { auth } = usePage().props;

    const fullName = auth?.user
        ? `${auth.user.first_name} ${auth.user.last_name}`
        : "User";

    // Get text based on screen size
    const getTextForScreenSize = (size) => {
        if (size === "desktop") return fullText;
        if (size === "tablet") return mediumText;
        return shortText;
    };

    // Handle window resize to detect screen size
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let newSize;
            if (width < 640) {
                newSize = "mobile";
            } else if (width < 1500) {
                newSize = "tablet";
            } else {
                newSize = "desktop";
            }
            
            // Only update if size actually changed
            if (newSize !== screenSize) {
                setScreenSize(newSize);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [screenSize]);

    // Typing animation - properly cleanup on screen size change
    useEffect(() => {
        // Clear any existing typing interval
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }

        const textToUse = getTextForScreenSize(screenSize);
        
        // Reset display text immediately when screen size changes
        setDisplayText("");
        isTypingRef.current = true;
        let i = 0;

        typingIntervalRef.current = setInterval(() => {
            if (i <= textToUse.length) {
                setDisplayText(textToUse.substring(0, i));
                i++;
                if (i > textToUse.length) {
                    clearInterval(typingIntervalRef.current);
                    isTypingRef.current = false;
                }
            }
        }, 25);

        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
            isTypingRef.current = false;
        };
    }, [screenSize]);

    // Cursor blink
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);
        return () => clearInterval(blinkInterval);
    }, []);

    const handleToggleProfile = () => {
        setDropdownOpen(!dropdownOpen);
        setNotifOpen(false);
    };

    return (
        <header
            className={`border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40 transition-all duration-300 ${
                darkMode
                    ? "bg-slate-900 border-slate-700"
                    : "bg-blue-100 border-gray-200"
            }`}
        >
            {/* Left Section - Menu Button + Title */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                {/* Menu Button — hidden only when sidebar is permanently visible (xl+) */}
                <button
                    onClick={toggleSidebar}
                    className={`xl:hidden p-2 rounded-lg transition flex-shrink-0 ${
                        darkMode
                            ? "hover:bg-slate-700 text-slate-300"
                            : "hover:bg-blue-200 text-gray-700"
                    }`}
                    aria-label="Toggle menu"
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Title with Typing Animation */}
                <h1
                    className={`text-xs sm:text-sm md:text-base lg:text-xl font-semibold font-mono truncate whitespace-nowrap ${
                        darkMode ? "text-slate-100" : "text-gray-800"
                    }`}
                >
                    <span>{displayText}</span>
                    {showCursor && <span className="animate-pulse ml-0.5">|</span>}
                </h1>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 relative flex-shrink-0">
                {/* Dark / Light Mode Toggle */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    aria-label="Toggle dark mode"
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                        darkMode ? "bg-slate-600" : "bg-blue-300"
                    }`}
                >
                    {/* Track icons */}
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-yellow-300 pointer-events-none">
                        <Sun size={13} />
                    </span>
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                        <Moon size={13} />
                    </span>

                    {/* Thumb */}
                    <span
                        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                            darkMode
                                ? "translate-x-7 bg-slate-900"
                                : "translate-x-0.5 bg-white"
                        }`}
                    >
                        {darkMode ? (
                            <Moon size={13} className="text-blue-300" />
                        ) : (
                            <Sun size={13} className="text-yellow-500" />
                        )}
                    </span>
                </button>

                <ProfileDropdown
                    dropdownOpen={dropdownOpen}
                    onToggle={handleToggleProfile}
                    fullName={fullName}
                    profile={profile}
                    auth={auth}
                />
            </div>
        </header>
    );
}
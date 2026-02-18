import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";
import profile from '../../assets/profile.png';
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

export default function Header({ sidebarOpen, toggleSidebar }) {
  const { darkMode, setDarkMode } = useTheme();
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('mobile');

  const fullText = "  Small Enterprise Technology Upgrading Program Information Management System";
  const mediumText = "  SETUP Information Management System";
  const shortText = "  SIMS";

  const { auth, notifications = [] } = usePage().props;

  const fullName = auth?.user
    ? `${auth.user.first_name} ${auth.user.last_name}`
    : 'User';

  // Handle window resize to detect screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Typing animation
  useEffect(() => {
    let textToUse = shortText;
    if (screenSize === 'desktop') {
      textToUse = fullText;
    } else if (screenSize === 'tablet') {
      textToUse = mediumText;
    }

    let i = 0;
    setDisplayText('');

    const typingInterval = setInterval(() => {
      setDisplayText((prev) => prev + textToUse.charAt(i));
      i++;
      if (i === textToUse.length) clearInterval(typingInterval);
    }, 25);

    return () => clearInterval(typingInterval);
  }, [screenSize]);

  // Cursor blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Check notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/check');
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Failed to check notifications:', error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotification = () => {
    setNotifOpen(!notifOpen);
    setDropdownOpen(false);
  };

  const handleToggleProfile = () => {
    setDropdownOpen(!dropdownOpen);
    setNotifOpen(false);
  };

  return (
    <header className={`border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40 transition-all duration-300 ${
      darkMode
        ? 'bg-slate-900 border-slate-700'
        : 'bg-blue-100 border-gray-200'
    }`}>
      {/* Left Section - Menu Button + Title */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
        {/* Menu Button - Mobile and Tablet */}
        <button
          onClick={toggleSidebar}
          className={`lg:hidden p-2 rounded-lg transition flex-shrink-0 ${
            darkMode
              ? 'hover:bg-slate-700 text-slate-300'
              : 'hover:bg-blue-200 text-gray-700'
          }`}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Title with Typing Animation */}
        <h1 className={`text-xs sm:text-sm md:text-base lg:text-xl font-semibold font-mono truncate whitespace-nowrap ${
          darkMode ? 'text-slate-100' : 'text-gray-800'
        }`}>
          {displayText}
          {showCursor && <span className="animate-pulse">|</span>}
        </h1>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 relative flex-shrink-0">

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${
            darkMode ? 'bg-slate-600' : 'bg-blue-300'
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
                ? 'translate-x-7 bg-slate-900'
                : 'translate-x-0.5 bg-white'
            }`}
          >
            {darkMode
              ? <Moon size={13} className="text-blue-300" />
              : <Sun size={13} className="text-yellow-500" />
            }
          </span>
        </button>

        {/* <NotificationDropdown
          notifOpen={notifOpen}
          onToggle={handleToggleNotification}
          notifications={notifications}
        /> */}

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
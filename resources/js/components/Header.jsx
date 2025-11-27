import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePage } from "@inertiajs/react";
import profile from '../../assets/profile.png';
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

export default function Header({ sidebarOpen, toggleSidebar }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('mobile');

  const fullText = "  Small Enterprise Technology Upgrading Program Digital System";
  const mediumText = "  SETUP Digital System";
  const shortText = "  SETUP";
  
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
    <header className={`bg-blue-100 border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40 transition-all duration-300 ${
      sidebarOpen ? 'sm:ml-0' : 'sm:ml-0'
    }`}>
      {/* Left Section - Menu Button + Title */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
        {/* Menu Button - Mobile and Tablet */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-blue-200 rounded-lg transition flex-shrink-0"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Title with Typing Animation */}
        <h1 className="text-xs sm:text-sm md:text-base lg:text-xl font-semibold text-gray-800 font-mono truncate whitespace-nowrap">
          {displayText}
          {showCursor && <span className="animate-pulse">|</span>}
        </h1>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 relative flex-shrink-0">
        <NotificationDropdown 
          notifOpen={notifOpen}
          onToggle={handleToggleNotification}
          notifications={notifications}
        />

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
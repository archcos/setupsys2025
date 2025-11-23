// components/NotificationDropdown.jsx
import { router } from "@inertiajs/react";
import DOMPurify from 'dompurify';

export default function NotificationDropdown({ notifOpen, onToggle, notifications }) {
  const hasUnread = notifications.some((notif) => !notif.is_read);

  const handleNotificationClick = (notif) => {
    router.post(`/notifications/read/${notif.notification_id}`, {}, {
      onSuccess: () => {
        if (notif.title === 'MOA Generated') {
          router.visit('/moa');
        } else if (notif.title === 'Company Project Updated') {
          router.visit(`/draft-moa?company_id=${notif.company_id}`);
        }
      }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none hover:bg-gray-200 rounded transition"
      >
        <svg
          className="w-5 h-5 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {hasUnread && (
          <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-600 rounded-full"></span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 mt-2 w-72 max-w-xs bg-white rounded-lg shadow-lg border z-50">
          <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">
            Notifications
          </div>
          <ul className="text-sm text-gray-600 max-h-60 overflow-y-auto divide-y">
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <li
                  key={index}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    !notif.is_read ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        {notif.title}
                        {!notif.is_read ? (
                          <span className="text-red-500 text-xs font-medium">● Unread</span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">Read</span>
                        )}
                      </div>
                      <div
                        className="text-xs text-gray-500"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notif.message) }}
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500 text-sm">No new notifications</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
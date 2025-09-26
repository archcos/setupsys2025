// FlashMessage.jsx
import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const FlashMessage = ({ 
  message, 
  type = 'info', 
  onDismiss = null,
  dismissible = false,
  className = '',
  showIcon = true,
  duration = null // Auto-dismiss after duration (in ms)
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  // Auto-dismiss functionality
  React.useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          setTimeout(onDismiss, 300); // Wait for fade animation
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300); // Wait for fade animation
    }
  };

  if (!isVisible || !message) return null;

  // Configuration for different message types
  const typeConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      icon: CheckCircle,
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      icon: XCircle,
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      icon: AlertCircle,
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      icon: Info,
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border px-6 py-4 rounded-xl flex items-start gap-3 
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
        ${className}
      `}
    >
      {/* Icon */}
      {showIcon && (
        <IconComponent className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {typeof message === 'string' ? (
          <div 
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        ) : (
          <div className="text-sm">{message}</div>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`
            ${config.iconColor} hover:opacity-75 flex-shrink-0 ml-2
            transition-opacity duration-200 focus:outline-none focus:ring-2 
            focus:ring-offset-1 focus:ring-current rounded-sm
          `}
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Hook for managing flash messages programmatically
export const useFlashMessage = () => {
  const [customMessages, setCustomMessages] = React.useState([]);

  const addMessage = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const newMessage = {
      id,
      message,
      type,
      ...options,
    };
    
    setCustomMessages(prev => [...prev, newMessage]);

    // Auto-remove after duration if specified
    if (options.duration) {
      setTimeout(() => {
        removeMessage(id);
      }, options.duration);
    }
  };

  const removeMessage = (id) => {
    setCustomMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return {
    messages: customMessages,
    addMessage,
    removeMessage,
    clearAll: () => setCustomMessages([]),
  };
};

// Container component for displaying multiple flash messages
export const FlashMessageContainer = ({ 
  flashMessages = {}, 
  customMessages = [],
  position = 'top',
  className = '' 
}) => {
  // Debug logging
  console.log('FlashMessageContainer - flashMessages:', flashMessages);
  console.log('FlashMessageContainer - customMessages:', customMessages);

  // Convert flash props to array format
  const flashArray = Object.entries(flashMessages)
    .filter(([_, message]) => {
      console.log('Filtering message:', _, message);
      return message && message !== null && message !== '';
    })
    .map(([type, message]) => {
      console.log('Creating message object:', { type, message, id: type });
      return { type, message, id: type };
    });

  console.log('Final flashArray:', flashArray);

  const allMessages = [...flashArray, ...customMessages];
  console.log('All messages to render:', allMessages);

  if (allMessages.length === 0) {
    console.log('No messages to display');
    return null;
  }

  const positionClasses = {
    top: 'space-y-4 mb-6',
    bottom: 'space-y-4 mt-6',
    fixed: 'fixed top-4 right-4 z-50 space-y-2 max-w-md',
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      {allMessages.map((msg, index) => (
        <FlashMessage
          key={msg.id || index}
          message={msg.message}
          type={msg.type}
          dismissible={msg.dismissible !== false}
          duration={msg.duration}
          onDismiss={msg.onDismiss}
          showIcon={msg.showIcon !== false}
        />
      ))}
    </div>
  );
};

export default FlashMessage;
import React, { useEffect, useState, useCallback } from 'react';

const SESSION_STORAGE_KEY = 'welcome_notification_shown';

export interface WelcomeNotificationProps {
  message?: string;
  autoShowDelay?: number;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'center';
}

export const WelcomeNotification: React.FC<WelcomeNotificationProps> = ({
  message = "Welcome to ATO-System-B!",
  autoShowDelay = 3000,
  autoHideDelay = 5000,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isShown, setIsShown] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // 세션 중 이미 표시된 적이 있는지 확인
    const hasBeenShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (hasBeenShown) {
      return;
    }

    // autoShowDelay 후 표시
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsShown(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }, autoShowDelay);

    return () => clearTimeout(showTimer);
  }, [autoShowDelay]);

  useEffect(() => {
    if (!isVisible || !isShown) return;

    // autoHideDelay 후 자동 숨김
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(hideTimer);
  }, [isVisible, isShown, autoHideDelay]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed ${positionClasses[position]} z-50 max-w-sm p-4 bg-blue-500 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
        <button
          type="button"
          className="ml-4 inline-flex text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
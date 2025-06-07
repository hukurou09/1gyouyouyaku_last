import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const InformationCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);


const Toast = ({ toastInfo, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toastInfo) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for exit animation before calling onDismiss
        setTimeout(() => {
          if (onDismiss) onDismiss(toastInfo.id);
        }, 350); // Should match framer-motion exit animation duration
      }, toastInfo.duration || 3000);

      return () => clearTimeout(timer);
    } else {
      // If toastInfo becomes null (e.g. dismissed by parent), ensure isVisible is false
      setIsVisible(false);
    }
  }, [toastInfo, onDismiss]);

  if (!toastInfo && !isVisible) {
    return null;
  }

  let IconComponent, bgColor, iconColor;

  switch (toastInfo?.type) {
    case 'info':
      IconComponent = InformationCircleIcon;
      bgColor = 'bg-sky-500 dark:bg-sky-600';
      iconColor = 'text-white';
      break;
    case 'success':
      IconComponent = CheckCircleIcon;
      bgColor = 'bg-green-500 dark:bg-green-600';
      iconColor = 'text-white';
      break;
    case 'error':
    default:
      IconComponent = XCircleIcon;
      bgColor = 'bg-red-500 dark:bg-red-600';
      iconColor = 'text-white';
      break;
  }

  return (
    <AnimatePresence>
      {isVisible && toastInfo && (
        <motion.div
          key={toastInfo.id}
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%", transition: { duration: 0.3 } }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white ${bgColor} flex items-start space-x-3 max-w-md z-[100]`}
          role="alert"
          aria-live="assertive"
        >
          {IconComponent && <IconComponent className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />}
          <span className="flex-grow text-sm sm:text-base">{toastInfo.message}</span>
          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => { if (onDismiss) onDismiss(toastInfo.id); }, 300);
            }} 
            className="ml-auto -mr-1 -mt-1 p-1 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

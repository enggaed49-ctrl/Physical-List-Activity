import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeScreenTitle?: string;
  isDarkMode?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isDarkMode = false }) => {
  const [currentTime, setCurrentTime] = useState('9:41');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900/90 py-0 sm:py-6 px-0 sm:px-4 flex flex-col items-center justify-center font-sans antialiased text-slate-800">
      {/* Top Bar for Desktop View Controls */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-medium text-slate-300">Android Mobile Simulation</span>
        </div>
        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          title="Toggle view frame"
        >
          {isPhoneFrame ? (
            <>
              <Monitor className="w-3.5 h-3.5" />
              <span>Full View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container / Android Device Mockup */}
      <div
        className={`w-full ${isDarkMode ? 'dark' : ''} bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col overflow-hidden relative transition-all duration-300 ${
          isPhoneFrame
            ? 'sm:max-w-[420px] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[42px] sm:shadow-2xl sm:ring-8 sm:ring-slate-800 dark:sm:ring-slate-950 sm:border-4 sm:border-slate-700 dark:sm:border-slate-800'
            : 'max-w-xl min-h-screen sm:min-h-[880px] sm:rounded-3xl sm:shadow-2xl'
        }`}
      >
        {/* Android Status Bar */}
        <div className="w-full bg-white dark:bg-slate-900 shrink-0 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 select-none border-b border-slate-100/60 dark:border-slate-800 z-30 transition-colors">
          <div className="flex items-center gap-2">
            <span>{currentTime}</span>
          </div>

          {/* Front Camera Punch-Hole for realistic Android look */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 ring-2 ring-slate-200 dark:ring-slate-800"></div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-slate-700 dark:fill-slate-300" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/50 dark:bg-slate-950 transition-colors">
          {children}
        </div>

        {/* Android Gesture Bar */}
        <div className="w-full py-1.5 shrink-0 bg-white dark:bg-slate-900 flex justify-center items-center z-30 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

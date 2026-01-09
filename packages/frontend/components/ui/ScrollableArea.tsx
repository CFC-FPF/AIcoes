import React, { useRef, useState, useEffect } from 'react';

interface ScrollableAreaProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ScrollableArea - A scrollable container with fade gradient indicators
 * Shows dynamic top/bottom gradients when content is scrollable
 * Includes custom styled scrollbar
 */
const ScrollableArea: React.FC<ScrollableAreaProps> = ({ children, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopGradient, setShowTopGradient] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

      // Show top gradient if scrolled down
      setShowTopGradient(scrollTop > 10);

      // Show bottom gradient if there's more content below
      setShowBottomGradient(scrollTop + clientHeight < scrollHeight - 10);
    }
  };

  useEffect(() => {
    checkScroll();

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      // Check on resize as well
      window.addEventListener('resize', checkScroll);

      // Initial check after content loads
      const timeoutId = setTimeout(checkScroll, 100);

      return () => {
        scrollElement.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [children]);

  return (
    <div className="relative h-full">
      {/* Top fade gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-12 pointer-events-none z-10 transition-opacity duration-300 ${
          showTopGradient ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'linear-gradient(to bottom, rgba(10, 22, 40, 1) 0%, rgba(10, 22, 40, 0) 100%)',
        }}
      />

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={`h-full overflow-y-auto pr-2 ${className}`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 transparent',
        }}
      >
        {children}
      </div>

      {/* Bottom fade gradient */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10 transition-opacity duration-300 ${
          showBottomGradient ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'linear-gradient(to top, rgba(10, 22, 40, 1) 0%, rgba(10, 22, 40, 0) 100%)',
        }}
      />

      {/* Custom scrollbar styles for WebKit browsers */}
      <style>{`
        .h-full.overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .h-full.overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }

        .h-full.overflow-y-auto::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
          transition: background 0.2s;
        }

        .h-full.overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default ScrollableArea;

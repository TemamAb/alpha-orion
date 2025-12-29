import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const handleMouseEnter = () => {
    const id = window.setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) window.clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  return (
    <div 
      className="relative w-full h-fit"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[500] px-4 py-3 text-[10px] font-medium text-[#D4AF37] bg-[#020204]/95 border border-[#D4AF37]/20 rounded-xl whitespace-normal min-w-[200px] shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-none transition-all duration-300 transform scale-100 opacity-100 ${positionClasses[position]}`}>
          <div className="relative z-10 leading-relaxed uppercase tracking-wider italic">
            <span className="text-[#D4AF37]/40 mr-1">//</span> {content}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl pointer-events-none"></div>
          
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-[#020204] border-[#D4AF37]/20 border-b border-r rotate-45 pointer-events-none ${
            position === 'top' ? 'left-1/2 -translate-x-1/2 -bottom-1' :
            position === 'bottom' ? 'left-1/2 -translate-x-1/2 -top-1 rotate-[225deg]' :
            position === 'left' ? 'top-1/2 -translate-y-1/2 -right-1 rotate-[315deg]' :
            'top-1/2 -translate-y-1/2 -left-1 rotate-[135deg]'
          }`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
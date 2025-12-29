import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48, color }) => {
  const brandColor = color || '#0075FF';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 244 244" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} filter drop-shadow-2xl transition-all duration-500`}
    >
      {/* Outer Hexagon Shell */}
      <path 
        d="M122 10L218.98 66V178L122 234L25.02 178V66L122 10Z" 
        fill="url(#logo_grad_main)" 
      />
      
      {/* 3D Depth Overlays */}
      <path 
        d="M122 10L122 122L218.98 66V178L122 234V122L25.02 178V66L122 10Z" 
        fill="black" 
        fillOpacity="0.25" 
      />

      {/* Internal Geometric Core - Left Side */}
      <path 
        d="M70 80V150L122 180V110L70 80Z" 
        fill="url(#logo_grad_accent_left)" 
      />

      {/* Internal Geometric Core - Right Side */}
      <path 
        d="M174 95V165L122 195V125L174 95Z" 
        fill="url(#logo_grad_accent_right)" 
      />

      {/* Top Face Glow */}
      <path 
        d="M122 10L218.98 66L122 122L25.02 66L122 10Z" 
        fill="white" 
        fillOpacity="0.05" 
      />

      <defs>
        <linearGradient id="logo_grad_main" x1="25.02" y1="10" x2="218.98" y2="234" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E0FF" />
          <stop offset="0.5" stopColor={brandColor} />
          <stop offset="1" stopColor="#0038FF" />
        </linearGradient>
        <linearGradient id="logo_grad_accent_left" x1="70" y1="80" x2="122" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#70D6FF" />
          <stop offset="1" stopColor={brandColor} />
        </linearGradient>
        <linearGradient id="logo_grad_accent_right" x1="174" y1="95" x2="122" y2="195" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C2FF" />
          <stop offset="1" stopColor={brandColor} />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;

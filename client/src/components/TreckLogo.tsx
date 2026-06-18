import React, { useState } from 'react';

interface TreckLogoProps {
  className?: string;
}

export default function TreckLogo({ className = "h-8 w-auto" }: TreckLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState('https://i.ibb.co/hR5TTZvz/logo.jpg');

  const handleImageError = () => {
    if (imgSrc === 'https://i.ibb.co/hR5TTZvz/logo.jpg') {
      // Try older known backup URL if any
      setImgSrc('https://i.ibb.co/RpnJJBW/logo.png');
    } else {
      // Fallback to high-preservation custom SVG logo
      setImgError(true);
    }
  };

  if (!imgError) {
    return (
      <img 
        src={imgSrc} 
        alt="Treck Motors Logo" 
        className={`${className} object-contain`} 
        onError={handleImageError}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg 
      className={className} 
      viewBox="0 0 350 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Red Slanted Badge with stylized 't' logo in Cuba sucursal style */}
      <g transform="translate(8, 4)">
        {/* Slanted red background with rounded corners */}
        <path 
          d="M 14 0 L 74 0 C 80 0, 84 4, 82 11 L 68 64 C 67 69, 62 72, 57 72 L 3 72 C -3 72, -7 68, -5 61 L 7 11 C 8 5, 11 0, 17 0 Z" 
          fill="#FF0505" 
        />
        
        {/* Black sweep shape on upper part of the logo */}
        <path 
          d="M 12 18 L 38 4 C 41 2, 45 2, 48 4 L 40 22 C 37 25, 33 26, 28 26 L 10 26 C 9 26, 11 21, 12 18 Z" 
          fill="#1C1917" 
        />

        {/* White stylized letter 't' split */}
        {/* Horizontal stroke */}
        <rect 
          x="18" 
          y="34" 
          width="40" 
          height="8.5" 
          rx="4.25" 
          fill="#FFFFFF" 
          transform="skewX(-14)"
        />
        {/* Stem of 't' with a tail curving to the right */}
        <path 
          d="M 37.5 16 C 39.5 16, 41 18, 40 22 L 32.5 50 C 31 56, 33.5 59.5, 39.5 59.5 C 44.5 59.5, 49.5 56, 53.5 51 C 54.5 50, 56 50.5, 55.5 52 C 51.5 58.5, 45 64, 38 64 C 29 64, 25 58, 27 50 L 34.5 22 C 35.5 18, 34 16, 31 16 C 30 16, 30.5 15, 31.5 14 L 37.5 16 Z" 
          fill="#FFFFFF" 
        />
      </g>

      {/* 2. Text Brand "TRECK" in heavy italic sans-serif */}
      <text 
        x="105" 
        y="53" 
        fill="#FFFFFF" 
        fontFamily="'Space Grotesk', 'Inter', sans-serif" 
        fontWeight="900" 
        fontStyle="italic" 
        fontSize="52" 
        letterSpacing="-2"
      >
        TRECK
      </text>

      {/* 3. Text brand "motors" styled as in the original image: thin, lower-case, outlined */}
      <text 
        x="244" 
        y="71" 
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        opacity="0.85"
        fontFamily="'Space Grotesk', 'Inter', sans-serif" 
        fontWeight="800" 
        fontStyle="italic" 
        fontSize="17.5" 
        letterSpacing="0.5"
      >
        motors
      </text>
    </svg>
  );
}

import React from 'react';
import logoSrc from '../../assets/branding/gc-home-logo.png';

export interface GCLogoProps {
  size?: number;
  width?: number;
  height?: number;
  compact?: boolean;
  className?: string;
  alt?: string;
}

export const GCLogo: React.FC<GCLogoProps> = ({
  size = 40,
  width,
  height,
  compact = false,
  className = '',
  alt = 'GC HOME+ Official Brand Logo',
}) => {
  const actualWidth = width || (compact ? 28 : size);
  const actualHeight = height || (compact ? 28 : size);

  return (
    <img
      src={logoSrc}
      alt={alt}
      width={actualWidth}
      height={actualHeight}
      className={`object-contain select-none ${className}`}
      style={{ width: actualWidth, height: actualHeight }}
    />
  );
};

export default GCLogo;

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoImage from '@/app/icon.png';

interface BrandLogoProps {
  className?: string;
  variant?: 'color' | 'white';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: number;
  width?: number;
  layout?: 'horizontal' | 'stacked' | 'icon-only';
  href?: string;
}

export function BrandLogo({
  className = '',
  variant = 'color',
  size = 'md',
  height: customHeight,
  width: customWidth,
  layout = 'horizontal',
  href = '/',
}: BrandLogoProps) {
  // Pixel heights corresponding to each size preset (scaled up for enhanced prominence)
  const defaultDimensions = {
    sm: { height: 38, width: 92 },
    md: { height: 50, width: 121 },
    lg: { height: 64, width: 155 },
    xl: { height: 84, width: 203 },
  }[size];

  const targetHeight = customHeight ?? defaultDimensions.height;
  const targetWidth = customWidth ?? (customHeight ? Math.round(customHeight * 2.42) : defaultDimensions.width);

  // If icon-only is requested, we show just the left icon portion
  const isIconOnly = layout === 'icon-only';

  const imageElement = (
    <div
      className={`relative inline-flex items-center shrink-0 transition-transform duration-200 group-hover:scale-102 ${
        variant === 'white' ? 'brightness-0 invert' : ''
      } ${className}`}
      style={{
        height: `${targetHeight}px`,
        width: isIconOnly ? `${Math.round(targetHeight * 1.2)}px` : `${targetWidth}px`,
        overflow: isIconOnly ? 'hidden' : 'visible',
      }}
    >
      <Image
        src={logoImage}
        alt="CareerChecks"
        width={targetWidth}
        height={targetHeight}
        priority={size === 'lg' || size === 'md'}
        className={`h-full w-auto object-contain ${isIconOnly ? 'object-left max-w-none' : ''}`}
        style={isIconOnly ? { width: `${targetWidth}px` } : undefined}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center focus:outline-hidden"
        aria-label="CareerChecks Home"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}


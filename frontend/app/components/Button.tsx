'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  href,
  children,
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const buttonClasses = `px-4 py-2 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
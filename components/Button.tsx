

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', leftIcon, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-full font-semibold px-6 py-2.5 text-sm transition-transform duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90",
    secondary: "bg-transparent text-brand-secondary border border-brand-secondary hover:bg-brand-secondary/20",
    ghost: "bg-transparent text-brand-secondary hover:bg-brand-secondary/10",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
};
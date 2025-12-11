import React from 'react';
import Logo from '../ui/Logo';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  return (
    <nav className={`flex items-center justify-between px-8 py-6 ${className}`}>
      <Logo />
      
      <div className="flex gap-8">
        <a
          href="#"
          className="text-gray-300 hover:text-white transition-colors"
        >
          Home
        </a>
        <a
          href="#"
          className="text-gray-300 hover:text-white transition-colors"
        >
          Dashboard
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
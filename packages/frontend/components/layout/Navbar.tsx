import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';


interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  return (


    <nav className={`w-full ${className}`}>
      <div className="flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto">

<Logo />
      
      <div className="flex gap-8">
        <Link
          to="/"
          className="text-gray-300 hover:text-white transition-colors"
        >
          Home
        </Link>
{/*         <Link
          to="/dashboard"
          className="text-gray-300 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
 */}      </div>
      </div>
      
    </nav>
  );
};

export default Navbar;
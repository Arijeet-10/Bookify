'use client';

import React from 'react';
import { Icons } from '@/components/icons';

const Footer = () => {
  return (
    <nav className="bg-[#152226] p-4 fixed bottom-0 left-0 w-full border-t border-gray-700 dark:border-gray-800">
      <ul className="flex justify-between items-center">
        <li className="flex flex-col items-center">
          <a href="/" className="flex flex-col items-center">
            <Icons.home className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">My Booksy</span>
          </a>
        </li>
        <li className="flex flex-col items-center">
          <a href="/search" className="flex flex-col items-center">
            <Icons.search className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">Search</span>
          </a>
        </li>
        <li className="flex flex-col items-center">
          <a href="#" className="flex flex-col items-center">
            <Icons.calendar className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">Calendar</span>
          </a>
        </li>
        <li className="flex flex-col items-center">
          {/* Updated href to point to the profile page */}
          <a href="/profile" className="flex flex-col items-center">
            <Icons.user className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">Profile</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};
export default Footer;

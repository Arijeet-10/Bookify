'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import Link from 'next/link'; // Import Link

const Footer = () => {
  return (
    <nav className="bg-[#152226] p-4 fixed bottom-0 left-0 w-full border-t border-gray-700 dark:border-gray-800 mt-[50px]">
      <ul className="flex justify-between items-center">
        <li className="flex flex-col items-center">
          <Link href="/" className="flex flex-col items-center">
            <Icons.home className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">My Booksy</span>
          </Link>
        </li>
        <li className="flex flex-col items-center">
          <Link href="/search" className="flex flex-col items-center">
            <Icons.search className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">Search</span>
          </Link>
        </li>
        <li className="flex flex-col items-center">
          <Link href="#" className="flex flex-col items-center">
            <Icons.calendar className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">Calendar</span>
          </Link>
        </li>
        <li className="flex flex-col items-center">
          {/* Updated href to point to the profile page */}
          <Link href="/profile" className="flex flex-col items-center">
            <Icons.user className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-300" />
            <span className="text-xs text-gray-400 dark:text-gray-300">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};
export default Footer;

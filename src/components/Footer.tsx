'use client';

import React from 'react';
import {Icons} from '@/components/icons';

const Footer = () => {
  return (
    <nav className="bg-white p-4 fixed bottom-0 left-0 w-full border-t border-gray-200 dark:border-gray-800">
      <ul className="flex justify-between items-center">
        <li className="flex flex-col items-center">
          <a href="#" className="flex flex-col items-center">
            <Icons.home className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">My Booksy</span>
          </a>
        </li>
        <li className="flex flex-col items-center">
          <a href="/search" className="flex flex-col items-center">
            <Icons.search className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Search</span>
          </a>
        </li>
        <li className="flex flex-col items-center">
          <a href="#" className="flex flex-col items-center">
            <Icons.calendar className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Calendar</span>
          </a>
        </li>
        <li className="flex flex-col items-center">
          <a href="#" className="flex flex-col items-center">
            <Icons.user className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Profile</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};
export default Footer;


'use client';

import React from 'react';
import { Icons } from '@/components/icons'; // Keep existing import path
import Link from 'next/link'; // Import Link
import { usePathname } from 'next/navigation'; // Import usePathname
import { cn } from '@/lib/utils'; // Import cn for conditional classes

const Footer = () => {
  const pathname = usePathname(); // Get the current path

  const navItems = [
    { href: '/', label: 'My Booksy', icon: Icons.home },
    { href: '/search', label: 'Search', icon: Icons.search },
    { href: '/calendar', label: 'Calendar', icon: Icons.calendar }, // Updated href to /calendar
    { href: '/profile', label: 'Profile', icon: Icons.user },
  ];

  return (
    <nav className="bg-[#152226] p-4 fixed bottom-0 left-0 w-full border-t border-gray-700 dark:border-gray-800 mt-[50px]">
      <ul className="flex justify-around items-center"> {/* Changed to justify-around for better spacing */}
        {navItems.map((item) => {
          const isActive = pathname === item.href; // Check if the current path matches the item's href
          return (
            <li key={item.href} className="flex flex-col items-center">
              <Link href={item.href} className="flex flex-col items-center text-center">
                {/* Apply conditional styling based on isActive */}
                <item.icon
                  className={cn(
                    'w-6 h-6 mb-1',
                    isActive ? 'text-white dark:text-accent' : 'text-gray-400 dark:text-gray-500' // Active: white/accent, Inactive: gray
                  )}
                />
                <span
                  className={cn(
                    'text-xs',
                     isActive ? 'text-white dark:text-accent' : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
export default Footer;

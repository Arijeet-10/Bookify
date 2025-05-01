
'use client';

import React from 'react';
import { Icons } from '@/components/icons'; // Updated import path
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ServiceProviderFooter = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/service-provider-dashboard', label: 'Dashboard', icon: Icons.layoutDashboard },
    { href: '/service-provider-calendar', label: 'Calendar', icon: Icons.calendar }, // Example link
    // Changed 'Search' label to 'Services'. Kept href and icon for now.
    // If the destination page changes, update href. If the icon should change, update icon.
    { href: '/service-provider-services', label: 'Services', icon: Icons.briefcase }, // Changed label, kept icon for now, updated href assumption
    { href: '/profile', label: 'Profile', icon: Icons.user },
  ];

  return (
    <nav className="bg-[#152226] p-4 fixed bottom-0 left-0 w-full border-t border-gray-700 dark:border-gray-800 mt-[50px]">
      <ul className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex flex-col items-center">
              <Link href={item.href} className="flex flex-col items-center text-center">
                <item.icon
                  className={cn(
                    'w-6 h-6 mb-1',
                    isActive ? 'text-white dark:text-accent' : 'text-gray-400 dark:text-gray-500'
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

export default ServiceProviderFooter;

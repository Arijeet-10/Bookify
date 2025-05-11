
'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AdminFooter = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin-dashboard', label: 'Dashboard', icon: Icons.layoutDashboard },
    { href: '/admin-dashboard/providers', label: 'Providers', icon: Icons.users }, // Updated to link to the new providers page
    { href: '/admin-dashboard#bookings', label: 'Bookings', icon: Icons.calendarCheck }, // Link to bookings tab in main dashboard
    { href: '/profile', label: 'Profile', icon: Icons.user },
    // Placeholder for settings, can be linked to a future admin settings page
    // { href: '/admin-settings', label: 'Settings', icon: Icons.settings },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-[#152226] p-4 fixed bottom-0 left-0 w-full border-t border-gray-700 dark:border-gray-800"
    >
      <ul className="flex justify-around items-center">
        {navItems.map((item) => {
          // For tab-based navigation within the dashboard, we check if the pathname starts with /admin-dashboard
          // and if the item.href includes a hash that matches a tab.
           const isActive = item.href.includes('#')
            ? pathname === '/admin-dashboard' && window.location.hash === item.href.substring(item.href.indexOf('#'))
            : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin-dashboard' && item.href !== '/profile');


          return (
            <li key={item.href} className="flex flex-col items-center">
              <Link
                href={item.href}
                className="relative flex flex-col items-center group"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="admin-footer-active"
                      className="absolute -top-3 w-8 h-1 bg-white dark:bg-accent rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    isActive 
                      ? 'bg-gray-700/30' 
                      : 'hover:bg-gray-700/20'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-6 h-6 transition-colors',
                      isActive 
                        ? 'text-white dark:text-accent' 
                        : 'text-gray-400 dark:text-gray-500'
                    )}
                  />
                </motion.div>

                <motion.span
                  className={cn(
                    'text-xs transition-colors text-center', // Added text-center for better label display
                    isActive 
                      ? 'text-white dark:text-accent' 
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                  style={{maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} // Prevent long labels from breaking layout
                >
                  {item.label}
                </motion.span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
};

export default AdminFooter;

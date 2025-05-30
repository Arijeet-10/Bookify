'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ServiceProviderFooter = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/service-provider-dashboard', label: 'Dashboard', icon: Icons.layoutDashboard },
    { href: '/service-provider-bookings', label: 'Bookings', icon: Icons.calendar },
    { href: '/service-provider-services', label: 'Services', icon: Icons.briefcase },
    { href: '/service-provider-profile', label: 'Profile', icon: Icons.user },
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
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex flex-col items-center">
              <Link
                href={item.href}
                className="relative flex flex-col items-center group"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="sp-footer-active"
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
                    'text-xs transition-colors',
                    isActive 
                      ? 'text-white dark:text-accent' 
                      : 'text-gray-400 dark:text-gray-500'
                  )}
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

export default ServiceProviderFooter;
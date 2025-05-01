
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AdminDashboardPage = () => {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (err) {
            console.error("Logout Error:", err);
            // Handle logout error (e.g., show a toast message)
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
            <Card className="w-full max-w-4xl dark:bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Admin Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-6">Welcome, Admin!</p>
                    {/* Add Admin-specific content and controls here */}
                    <p className="text-muted-foreground mb-4">This is where admin functionalities will reside.</p>
                     <Button onClick={handleLogout} variant="destructive">
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboardPage;

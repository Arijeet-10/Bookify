'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Briefcase, CalendarCheck, Users, LogOut, AlertCircle, Settings, Search, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ServiceProvider {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phoneNumber?: string;
}

interface AppointmentService {
  id: string;
  name: string;
  price: string;
  duration: string;
}

interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  services: AppointmentService[];
  totalPrice: number;
  date: Timestamp;
  userId: string;
  userName?: string;
  status: string;
  createdAt: Timestamp;
}

const AdminDashboardPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [providerSearchTerm, setProviderSearchTerm] = useState('');
    const [bookingSearchTerm, setBookingSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Verify admin role
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
                    setIsAdmin(true);
                    fetchServiceProviders();
                    fetchAppointments();
                } else {
                    setIsAdmin(false);
                    setError("Access Denied. You are not authorized to view this page.");
                    setLoadingProviders(false);
                    setLoadingAppointments(false);
                    // Optionally redirect non-admins
                    // router.push('/'); 
                }
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchServiceProviders = async () => {
        setLoadingProviders(true);
        try {
            const providersCollectionRef = collection(db, 'serviceProviders');
            const q = query(providersCollectionRef, orderBy('businessName', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedProviders: ServiceProvider[] = [];
            querySnapshot.forEach((doc) => {
                fetchedProviders.push({ id: doc.id, ...doc.data() } as ServiceProvider);
            });
            setServiceProviders(fetchedProviders);
        } catch (err) {
            console.error("Error fetching service providers:", err);
            setError("Failed to load service providers.");
        } finally {
            setLoadingProviders(false);
        }
    };

    const fetchAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const appointmentsCollectionRef = collection(db, 'appointments');
            const q = query(appointmentsCollectionRef, orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedAppointments: Appointment[] = [];
            querySnapshot.forEach((doc) => {
                fetchedAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
            });
            setAppointments(fetchedAppointments);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(error + (error ? "\n" : "") + "Failed to load appointments.");
        } finally {
            setLoadingAppointments(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (err) {
            console.error("Logout Error:", err);
            setError("Logout failed. Please try again.");
        }
    };

    const filteredProviders = serviceProviders.filter(provider =>
        provider.businessName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        provider.fullName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(providerSearchTerm.toLowerCase())
    );

    const filteredAppointments = appointments.filter(appointment =>
        appointment.providerName.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
        (appointment.userName && appointment.userName.toLowerCase().includes(bookingSearchTerm.toLowerCase())) ||
        appointment.services.some(s => s.name.toLowerCase().includes(bookingSearchTerm.toLowerCase()))
    );
    
    const getServicesList = (services: AppointmentService[]): string => {
        if (Array.isArray(services) && services.length > 0) {
          return services.map(service => service.name).join(', ');
        }
        return 'N/A';
      };

    if (!user || !isAdmin && !loadingAppointments && !loadingProviders) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
                <Card className="w-full max-w-md dark:bg-card text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6">{error || "You are not authorized to view this page."}</p>
                        <Button onClick={() => router.push('/login')}>Go to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 pb-[80px]">
            <Card className="w-full max-w-7xl mx-auto dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-t-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <CardTitle className="text-3xl font-bold text-slate-800 dark:text-white">Admin Dashboard</CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Manage service providers and bookings.</CardDescription>
                        </div>
                        <div className="mt-4 sm:mt-0 flex gap-2">
                             <Button variant="outline" size="sm" className="dark:text-white">
                                <Settings className="mr-2 h-4 w-4" /> Site Settings
                            </Button>
                            <Button onClick={handleLogout} variant="destructive" size="sm">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md flex items-center">
                           <AlertCircle className="h-5 w-5 mr-2" /> {error}
                        </div>
                    )}
                    <Tabs defaultValue="providers" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-slate-200 dark:bg-slate-800">
                            <TabsTrigger value="providers" className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> Service Providers
                            </TabsTrigger>
                            <TabsTrigger value="bookings" className="flex items-center gap-2">
                                <CalendarCheck className="h-4 w-4" /> All Bookings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="providers" className="mt-6">
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search providers by name or email..."
                                        className="pl-8 w-full md:w-[300px] dark:bg-slate-800 dark:border-slate-700"
                                        value={providerSearchTerm}
                                        onChange={(e) => setProviderSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {loadingProviders ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
                                </div>
                            ) : (
                                <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-slate-100 dark:bg-slate-800/70">
                                            <TableRow>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Business Name</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact Name</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Email</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Category</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Phone</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredProviders.map((provider) => (
                                                <TableRow 
                                                    key={provider.id} 
                                                    className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group"
                                                    onClick={() => router.push(`/admin-dashboard/provider-services/${provider.id}`)}
                                                >
                                                    <TableCell className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                                                        {provider.businessName}
                                                        <Eye className="ml-2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{provider.fullName}</TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{provider.email}</TableCell>
                                                    <TableCell><Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{provider.serviceCategory}</Badge></TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{provider.phoneNumber || 'N/A'}</TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredProviders.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">
                                                        No service providers found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="bookings" className="mt-6">
                             <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search bookings by provider, customer or service..."
                                        className="pl-8 w-full md:w-[300px] dark:bg-slate-800 dark:border-slate-700"
                                        value={bookingSearchTerm}
                                        onChange={(e) => setBookingSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {loadingAppointments ? (
                                 <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
                                </div>
                            ) : (
                                <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-slate-100 dark:bg-slate-800/70">
                                            <TableRow>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Customer</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Provider</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Services</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Date &amp; Time</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Total</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAppointments.map((appt) => (
                                                <TableRow key={appt.id} className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{appt.userName || 'N/A'}</TableCell>
                                                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">{appt.providerName}</TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">{getServicesList(appt.services)}</TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{format(appt.date.toDate(), 'PPp')}</TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">₹{appt.totalPrice.toFixed(2)}</TableCell>
                                                    <TableCell><Badge variant={appt.status === 'confirmed' ? 'default' : appt.status === 'cancelled' ? 'destructive' : 'secondary'} className={
                                                        appt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                                        : appt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    }>{appt.status}</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                             {filteredAppointments.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-8">
                                                        No bookings found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboardPage;

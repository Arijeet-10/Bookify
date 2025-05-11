
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, CalendarCheck, Users, LogOut, AlertCircle, Settings, Search, Eye, Trash2, Flag, ArrowRight, LineChart as LineChartIcon, BarChart3 as BarChartIcon, TrendingUp, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart';


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
  createdAt?: Timestamp; // Added for signup chart
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
  date: Timestamp; // Date of the appointment
  userId: string;
  userName?: string;
  status: string; 
  createdAt: Timestamp; // Date the booking was made
}

const AdminDashboardPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [providerSearchTerm, setProviderSearchTerm] = useState('');

    // Chart data states
    const [providerSignupData, setProviderSignupData] = useState<{ month: string; signups: number }[]>([]);
    const [dailyBookingData, setDailyBookingData] = useState<{ date: string; bookings: number }[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
                    setIsAdmin(true);
                    fetchServiceProviders();
                    fetchAllAppointments();
                } else {
                    setIsAdmin(false);
                    setError("Access Denied. You are not authorized to view this page.");
                    setLoadingProviders(false);
                    setLoadingAppointments(false);
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
            // Order by createdAt if available, otherwise by businessName
            const q = query(providersCollectionRef, orderBy('createdAt', 'desc')); 
            const querySnapshot = await getDocs(q);
            const fetchedProviders: ServiceProvider[] = [];
            querySnapshot.forEach((doc) => {
                fetchedProviders.push({ id: doc.id, ...doc.data() } as ServiceProvider);
            });
            setServiceProviders(fetchedProviders);
        } catch (err) {
            console.error("Error fetching service providers:", err);
            // If createdAt index doesn't exist, fallback to businessName ordering
            if ((err as any).code === 'failed-precondition') {
                 console.warn("CreatedAt index missing for serviceProviders, falling back to businessName ordering. Please create the index for optimal performance.");
                 const fallbackQuery = query(collection(db, 'serviceProviders'), orderBy('businessName', 'asc'));
                 const fallbackSnapshot = await getDocs(fallbackQuery);
                 const fetchedProvidersFallback: ServiceProvider[] = [];
                 fallbackSnapshot.forEach((doc) => {
                    fetchedProvidersFallback.push({ id: doc.id, ...doc.data() } as ServiceProvider);
                 });
                 setServiceProviders(fetchedProvidersFallback);
            } else {
                setError("Failed to load service providers.");
            }
        } finally {
            setLoadingProviders(false);
        }
    };

    const fetchAllAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const appointmentsCollectionRef = collection(db, 'appointments');
            const q = query(appointmentsCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedAppointments: Appointment[] = [];
            querySnapshot.forEach((doc) => {
                fetchedAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
            });
            setAllAppointments(fetchedAppointments);
        } catch (err) {
            console.error("Error fetching appointments:", err);
             if ((err as any).code === 'failed-precondition') {
                 console.warn("CreatedAt index missing for appointments. Please create the index. Charts relying on this data might not work.");
            }
            // Not setting global error for appointments if providers load fine. Chart will show issue.
        } finally {
            setLoadingAppointments(false);
        }
    };
    
    const getServicesList = (services: AppointmentService[]): string => {
        if (Array.isArray(services) && services.length > 0) {
          return services.map(service => service.name).join(', ');
        }
        return 'N/A';
    };

    // Process data for Provider Signups Chart
    useEffect(() => {
        if (serviceProviders.length > 0) {
            const monthlySignups: Record<string, number> = {};
            serviceProviders.forEach(provider => {
                if (provider.createdAt) {
                    const monthYear = format(provider.createdAt.toDate(), 'MMM yyyy');
                    monthlySignups[monthYear] = (monthlySignups[monthYear] || 0) + 1;
                }
            });
            const chartData = Object.entries(monthlySignups)
                .map(([month, signups]) => ({ month, signups }))
                .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime()); // Sort by date
            setProviderSignupData(chartData);
        }
    }, [serviceProviders]);

    // Process data for Daily Bookings Chart
    useEffect(() => {
        if (allAppointments.length > 0) {
            const dailyBookings: Record<string, number> = {};
            allAppointments.forEach(appointment => {
                if (appointment.createdAt) { // using createdAt for when booking was made
                    const dateStr = format(appointment.createdAt.toDate(), 'yyyy-MM-dd');
                    dailyBookings[dateStr] = (dailyBookings[dateStr] || 0) + 1;
                }
            });
             const chartData = Object.entries(dailyBookings)
                .map(([date, bookings]) => ({ date, bookings }))
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

            // Limit to last 30-60 days for better visualization if too much data
            setDailyBookingData(chartData.slice(-60)); // Show last 60 days
        }
    }, [allAppointments]);
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (err) {
            console.error("Logout Error:", err);
            setError("Logout failed. Please try again.");
            toast({ title: "Logout Failed", description: "Please try again.", variant: "destructive"});
        }
    };

    const filteredProviders = serviceProviders.filter(provider =>
        provider.businessName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        provider.fullName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(providerSearchTerm.toLowerCase())
    );

    const handleRemoveProvider = async (providerId: string, providerName: string) => {
      try {
        await deleteDoc(doc(db, 'serviceProviders', providerId));
        const userDocRef = doc(db, 'users', providerId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'serviceProvider') {
            await deleteDoc(userDocRef);
        }

        setServiceProviders(prev => prev.filter(p => p.id !== providerId));
        toast({
          title: "Provider Removed",
          description: `${providerName} has been removed successfully.`,
        });
      } catch (error) {
        console.error("Error removing provider:", error);
        toast({
          title: "Error",
          description: `Failed to remove ${providerName}. Please try again.`,
          variant: "destructive",
        });
      }
    };

    const handleReportProvider = (providerId: string, providerName: string) => {
      console.log(`Reporting provider: ${providerName} (ID: ${providerId})`);
      toast({
        title: "Provider Reported",
        description: `${providerName} has been reported. This is a placeholder action.`,
      });
    };
    
    const providerSignupChartConfig = {
      signups: {
        label: "Signups",
        color: "hsl(var(--chart-1))",
      },
    } satisfies ChartConfig;

    const dailyBookingChartConfig = {
       bookings: {
        label: "Bookings",
        color: "hsl(var(--chart-2))",
      },
    } satisfies ChartConfig;


    if (!user || (!isAdmin && !loadingProviders && !loadingAppointments)) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[80px]">
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
                            <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Manage service providers, bookings, and site analytics.</CardDescription>
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
                    {error && !error.startsWith("Access Denied") && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md flex items-center">
                           <AlertCircle className="h-5 w-5 mr-2" /> {error}
                        </div>
                    )}
                    <Tabs defaultValue="analytics" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 md:w-auto bg-slate-200 dark:bg-slate-800">
                            <TabsTrigger value="analytics" className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Analytics
                            </TabsTrigger>
                            <TabsTrigger value="providers" className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> Service Providers
                            </TabsTrigger>
                            <TabsTrigger value="bookings" className="flex items-center gap-2">
                                <CalendarCheck className="h-4 w-4" /> All Bookings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="dark:bg-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChartIcon className="h-5 w-5 text-primary"/>
                                            Monthly Provider Signups
                                        </CardTitle>
                                        <CardDescription>Number of new service providers joining each month.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingProviders ? (
                                            <Skeleton className="h-[300px] w-full" />
                                        ) : providerSignupData.length > 0 ? (
                                            <ChartContainer config={providerSignupChartConfig} className="h-[300px] w-full">
                                                <BarChart data={providerSignupData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Legend />
                                                    <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
                                                </BarChart>
                                            </ChartContainer>
                                        ) : (
                                            <p className="text-center text-slate-500 dark:text-slate-400 py-10">No provider signup data available or `createdAt` field missing.</p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="dark:bg-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <LineChartIcon className="h-5 w-5 text-primary"/>
                                            Daily Services Booked
                                        </CardTitle>
                                        <CardDescription>Number of services booked each day (last 60 days).</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingAppointments ? (
                                            <Skeleton className="h-[300px] w-full" />
                                        ) : dailyBookingData.length > 0 ? (
                                             <ChartContainer config={dailyBookingChartConfig} className="h-[300px] w-full">
                                                <LineChart data={dailyBookingData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="date" tickFormatter={(value) => format(parseISO(value), 'MMM d')} tickLine={false} axisLine={false} tickMargin={8} />
                                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}/>
                                                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="bookings" stroke="var(--color-bookings)" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ChartContainer>
                                        ) : (
                                            <p className="text-center text-slate-500 dark:text-slate-400 py-10">No daily booking data available or `createdAt` field missing on appointments.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>


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
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredProviders.slice(0,5).map((provider) => (
                                                <TableRow 
                                                    key={provider.id} 
                                                    className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 group"
                                                >
                                                    <TableCell 
                                                        className="font-medium text-slate-800 dark:text-slate-200 flex items-center cursor-pointer"
                                                        onClick={() => router.push(`/admin-dashboard/provider-services/${provider.id}`)}
                                                    >
                                                        {provider.businessName}
                                                        <Eye className="ml-2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{provider.fullName}</TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{provider.email}</TableCell>
                                                    <TableCell><Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{provider.serviceCategory}</Badge></TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">{provider.phoneNumber || 'N/A'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently remove the service provider "{provider.businessName}" and their data.
                                                                </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRemoveProvider(provider.id, provider.businessName)} className="bg-destructive hover:bg-destructive/90">
                                                                    Yes, remove provider
                                                                </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                        <Button variant="ghost" size="icon" className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300" onClick={() => handleReportProvider(provider.id, provider.businessName)}>
                                                            <Flag className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredProviders.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-8">
                                                        No service providers found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                     {filteredProviders.length > 5 && (
                                        <div className="p-4 text-center">
                                            <Button onClick={() => router.push('/admin-dashboard/providers')}>
                                                View All Providers <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="bookings" className="mt-6">
                           <Card className="dark:bg-slate-800/50">
                                <CardHeader>
                                    <CardTitle>Recent Bookings</CardTitle>
                                    <CardDescription>Showing the latest 5 bookings. Manage all on the dedicated bookings page.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingAppointments ? (
                                        <div className="space-y-2">
                                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
                                        </div>
                                    ) : allAppointments.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                            <Package className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                                            No bookings found.
                                        </div>
                                    ) : (
                                        <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg mb-4">
                                            <Table>
                                                <TableHeader className="bg-slate-100 dark:bg-slate-800/70">
                                                    <TableRow>
                                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Customer</TableHead>
                                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Provider</TableHead>
                                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Services</TableHead>
                                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Date &amp; Time</TableHead>
                                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {allAppointments.slice(0, 5).map((appt) => (
                                                        <TableRow key={appt.id} className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <TableCell className="text-slate-600 dark:text-slate-300">{appt.userName || 'N/A'}</TableCell>
                                                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">{appt.providerName}</TableCell>
                                                            <TableCell className="text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">{getServicesList(appt.services)}</TableCell>
                                                            <TableCell className="text-slate-600 dark:text-slate-300">{format(appt.date.toDate(), 'PPp')}</TableCell>
                                                            <TableCell>
                                                                <Badge 
                                                                    variant={
                                                                        appt.status.toLowerCase() === 'confirmed' ? 'default' 
                                                                        : appt.status.toLowerCase() === 'cancelled' ? 'destructive' 
                                                                        : 'secondary'
                                                                    } 
                                                                    className={
                                                                        appt.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                                                        : appt.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                                    }
                                                                >
                                                                    {appt.status}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                    <Button onClick={() => router.push('/admin-dashboard/bookings')}>
                                        Go to All Bookings <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                           </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboardPage;


    

      
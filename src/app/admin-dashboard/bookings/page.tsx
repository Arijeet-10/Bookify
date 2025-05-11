
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CalendarCheck, Search, Filter, Trash2, Flag, ChevronLeft, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const AdminAllBookingsPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [bookingSearchTerm, setBookingSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
                    setIsAdmin(true);
                    fetchAppointments();
                } else {
                    setIsAdmin(false);
                    setError("Access Denied. You are not authorized to view this page.");
                    setLoadingAppointments(false);
                }
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchAppointments = async () => {
        setLoadingAppointments(true);
        setError(null);
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
            setError("Failed to load appointments.");
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

    const handleRemoveAppointment = async (appointmentId: string, userId: string) => {
        try {
            await deleteDoc(doc(db, 'appointments', appointmentId));
             const userAppointmentDocRef = doc(db, 'users', userId, 'appointments', appointmentId);
            // Check if the user-specific appointment document exists before attempting to delete
            const userAppointmentDocSnap = await getDoc(userAppointmentDocRef);
            if (userAppointmentDocSnap.exists()) {
                await deleteDoc(userAppointmentDocRef);
            } else {
                console.warn(`User-specific appointment doc not found: users/${userId}/appointments/${appointmentId}`);
            }

            setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
            toast({
                title: "Appointment Removed",
                description: `Appointment has been removed successfully.`,
            });
        } catch (error) {
            console.error("Error removing appointment:", error);
            toast({
                title: "Error",
                description: `Failed to remove appointment. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const handleReportAppointment = (appointmentId: string) => {
        // Placeholder for reporting functionality
        console.log(`Reporting appointment ID: ${appointmentId}`);
        toast({
            title: "Appointment Reported",
            description: `Appointment has been reported. This is a placeholder action.`,
        });
    };

    const filteredAppointments = appointments.filter(appointment => {
        const searchTermLower = bookingSearchTerm.toLowerCase();
        const statusLower = typeof statusFilter === 'string' ? statusFilter.toLowerCase() : 'all';

        const matchesSearch = bookingSearchTerm === '' ||
            appointment.providerName.toLowerCase().includes(searchTermLower) ||
            (appointment.userName && appointment.userName.toLowerCase().includes(searchTermLower)) ||
            appointment.services.some(s => s.name.toLowerCase().includes(searchTermLower));

        const matchesStatus = statusFilter === 'all' ||
            appointment.status.toLowerCase() === statusLower;

        return matchesSearch && matchesStatus;
    });

    if (!user || (!isAdmin && !loadingAppointments)) {
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
             <div className="max-w-7xl mx-auto">
                <Button 
                    onClick={() => router.push('/admin-dashboard')} 
                    variant="outline" 
                    className="mb-6 dark:text-white dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Main Dashboard
                </Button>
                <Card className="w-full dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-t-lg">
                        <div className="flex items-center">
                            <CalendarCheck className="h-7 w-7 mr-3 text-primary" />
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">Manage All Bookings</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">View, search, and manage all customer bookings.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md flex items-center">
                               <AlertCircle className="h-5 w-5 mr-2" /> {error}
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-grow md:flex-grow-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <Input
                                    type="search"
                                    placeholder="Search by provider, customer, service..."
                                    className="pl-10 w-full md:w-[350px] dark:bg-slate-800 dark:border-slate-700"
                                    value={bookingSearchTerm}
                                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as string | 'all')}>
                                <SelectTrigger className="w-full md:w-[220px] dark:bg-slate-800 dark:border-slate-700">
                                    <Filter className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {loadingAppointments ? (
                             <div className="space-y-3">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
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
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
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
                                                                This action cannot be undone. This will permanently remove this booking.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveAppointment(appt.id, appt.userId)} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, remove booking
                                                            </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <Button variant="ghost" size="icon" className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300" onClick={() => handleReportAppointment(appt.id)}>
                                                        <Flag className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                         {filteredAppointments.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-10">
                                                    No bookings found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAllBookingsPage;


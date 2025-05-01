
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AddServiceDialog from './_components/AddServiceDialog';
import EditServiceDialog from './_components/EditServiceDialog'; // Import the new Edit dialog component
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { toast } from '@/hooks/use-toast';


// Define the structure of a service object
export interface Service {
  id: string;
  name: string;
  price: string; // Keep as string for flexibility, validation can handle format
  duration: string; // e.g., "30 mins", "1 hour"
  createdAt?: Timestamp; // Optional: Track when the service was added
  updatedAt?: Timestamp; // Optional: Track when the service was updated
}

const ServiceProviderServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null); // State for service being edited


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.role === 'serviceProvider') {
            fetchServices(currentUser.uid);
          } else {
            setError('Access denied. You are not registered as a service provider.');
            setLoading(false);
            // Optional: Redirect if necessary
            // router.push('/');
          }
        } catch (err) {
          console.error("Error verifying user role:", err);
          setError('Failed to verify user role.');
          setLoading(false);
        }
      } else {
        setUser(null);
        setServices([]);
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getServicesCollectionRef = (userId: string) => {
    // Path to the subcollection: serviceProviders/{userId}/services
    return collection(db, 'serviceProviders', userId, 'services');
  };

  const fetchServices = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const servicesCollectionRef = getServicesCollectionRef(userId);
      const q = query(servicesCollectionRef); // Can add ordering later, e.g., orderBy('createdAt', 'desc')

      const querySnapshot = await getDocs(q);
      const fetchedServices: Service[] = [];
      querySnapshot.forEach((doc) => {
        fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
      });
      // Sort services alphabetically by name for consistent display
      fetchedServices.sort((a, b) => a.name.localeCompare(b.name));
      setServices(fetchedServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function called by the Add dialog when a new service is added successfully
  const handleServiceAdded = (newServiceData: Omit<Service, 'id'>) => {
    if (user) {
        // Refetch services to include the new one
        fetchServices(user.uid);
        toast({
            title: "Service Added",
            description: `"${newServiceData.name}" has been added successfully.`,
        });
    }
  };

  // Function called by the Edit dialog when a service is updated successfully
  const handleServiceUpdated = (updatedService: Service) => {
      if (user) {
          // Optimistically update the UI or refetch
          setServices(prevServices =>
              prevServices.map(service =>
                  service.id === updatedService.id ? updatedService : service
              ).sort((a, b) => a.name.localeCompare(b.name)) // Keep sorted
          );
          // Optional: Refetch for consistency: fetchServices(user.uid);
          // No toast here, EditServiceDialog handles its own success toast
      }
      setServiceToEdit(null); // Clear the service being edited
      setIsEditDialogOpen(false); // Close the edit dialog
  };


  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!user) return;

    const serviceDocRef = doc(db, 'serviceProviders', user.uid, 'services', serviceId);

    try {
      await deleteDoc(serviceDocRef);
      // Update local state to remove the deleted service
      setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
      toast({
          title: "Service Deleted",
          description: `"${serviceName}" has been successfully deleted.`,
      });
    } catch (err) {
      console.error('Error deleting service:', err);
       toast({
          title: "Error Deleting Service",
          description: "Could not delete the service. Please try again.",
          variant: "destructive",
      });
      setError('Failed to delete service. Please try again.');
    }
  };

  // Function to open the edit dialog
  const openEditDialog = (service: Service) => {
    setServiceToEdit(service);
    // We don't directly set isEditDialogOpen here, it's controlled by the EditServiceDialog's open state
    // But we need a way to trigger the EditServiceDialog's trigger.
    // The EditServiceDialog trigger will be wrapped around the Edit button itself.
  };


  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
           <CardTitle className="text-2xl">Manage Your Services</CardTitle>
           {/* Use AddServiceDialog component */}
           <AddServiceDialog
              userId={user?.uid}
              onServiceAdded={handleServiceAdded} // Pass the callback
            >
                <Button disabled={loading || !!error}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
                </Button>
           </AddServiceDialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ul className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <li key={index} className="border p-4 rounded-md flex justify-between items-center dark:border-gray-700">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-[70px] rounded-md" /> {/* Adjusted width */}
                    <Skeleton className="h-9 w-[76px] rounded-md" /> {/* Adjusted width */}
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">You haven&apos;t added any services yet. Click &quot;Add New Service&quot; to get started.</p>
          ) : (
            <ul className="space-y-4">
              {services.map((service) => (
                <li key={service.id} className="border p-4 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center dark:border-muted hover:bg-muted/50 transition-colors">
                  <div className="mb-3 sm:mb-0">
                    <p className="font-semibold text-lg">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Price: {service.price ? (service.price.startsWith('₹') ? service.price : `₹${service.price}`) : 'N/A'} | Duration: {service.duration || 'N/A'} {/* Changed $ to ₹ */}
                    </p>
                  </div>
                  <div className="flex space-x-2 self-end sm:self-center">
                    {/* Wrap the Edit button with the EditServiceDialog */}
                     {user && (
                         <EditServiceDialog
                             userId={user.uid}
                             service={service}
                             onServiceUpdated={handleServiceUpdated}
                         >
                             <Button variant="outline" size="sm">
                                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                             </Button>
                         </EditServiceDialog>
                     )}

                     {/* Add Confirmation Dialog for Delete */}
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm">
                           <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                           <AlertDialogDescription>
                             This action cannot be undone. This will permanently delete the service
                             &quot;{service.name}&quot;.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteService(service.id, service.name)}
                            >
                                Yes, delete service
                            </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderServicesPage;

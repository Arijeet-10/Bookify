
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Define the structure of a service object
interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
  // Add other relevant fields if they exist in your Firestore document
}

const ServiceProviderServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Verify user role (optional but good practice)
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.role === 'serviceProvider') {
            // User is a service provider, fetch their services
            fetchServices(currentUser.uid);
          } else {
            // User is not a service provider or doc doesn't exist
            setError('Access denied. You are not registered as a service provider.');
            setLoading(false);
            // Optional: redirect if necessary
            // router.push('/');
          }
        } catch (err) {
           console.error("Error verifying user role:", err);
           setError('Failed to verify user role.');
           setLoading(false);
        }
      } else {
        // No user logged in
        setUser(null);
        setServices([]);
        setLoading(false);
        // Redirect to login if not logged in
        router.push('/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]); // Add router to dependency array

  const fetchServices = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Query the 'services' collection for documents where 'userId' matches the logged-in user's UID
      // **ASSUMPTION:** You have a 'services' collection and each service document has a 'userId' field.
      const servicesCollectionRef = collection(db, 'services'); // Replace 'services' if your collection name is different
      const q = query(servicesCollectionRef, where('userId', '==', userId)); // Replace 'userId' if your field name is different

      const querySnapshot = await getDocs(q);
      const fetchedServices: Service[] = [];
      querySnapshot.forEach((doc) => {
        // Assuming your service document structure matches the Service interface
        fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
      });

      setServices(fetchedServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    // Logic to add a new service (e.g., open a modal or navigate to a form)
    console.log('Add new service clicked');
    // Example: You could use a dialog or navigate to /service-provider-services/add
    // router.push('/service-provider-services/add'); // Uncomment and adjust route if needed
  };

  const handleEditService = (serviceId: string) => {
    console.log(`Edit service ${serviceId} clicked`);
    // Navigate to an edit page or open a modal
    // router.push(`/service-provider-services/edit/${serviceId}`); // Uncomment and adjust route if needed
  };

  const handleDeleteService = (serviceId: string) => {
    console.log(`Delete service ${serviceId} clicked`);
    // Add confirmation and deletion logic here
    // This would typically involve a Firestore delete operation
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Manage Your Services</CardTitle>
          <Button onClick={handleAddService} disabled={loading || !!error}>Add New Service</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Display Skeleton loaders while loading
            <ul className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <li key={index} className="border p-4 rounded-md flex justify-between items-center dark:border-gray-700">
                   <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
             // Display error message
            <p className="text-center text-destructive">{error}</p>
          ) : services.length === 0 ? (
            // Display message if no services found
            <p className="text-center text-muted-foreground">You haven't added any services yet.</p>
          ) : (
             // Display fetched services
            <ul className="space-y-4">
              {services.map((service) => (
                <li key={service.id} className="border p-4 rounded-md flex justify-between items-center dark:border-gray-700">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                       {/* Format price and duration as needed */}
                      Price: {service.price ? `$${service.price}` : 'N/A'} | Duration: {service.duration || 'N/A'}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditService(service.id)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteService(service.id)}>Delete</Button>
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

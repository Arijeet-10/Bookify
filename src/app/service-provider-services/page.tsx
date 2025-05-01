
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ServiceProviderServicesPage = () => {
  // Placeholder data and functionality for services - Removed placeholder data
  const services: { id: string, name: string, price: string, duration: string }[] = [];

  const handleAddService = () => {
    // Logic to add a new service (e.g., open a modal or navigate to a form)
    console.log('Add new service clicked');
    // Example: You could use a dialog or navigate to /service-provider-services/add
  };

  const handleEditService = (serviceId: string) => {
    console.log(`Edit service ${serviceId} clicked`);
    // Navigate to an edit page or open a modal
  };

  const handleDeleteService = (serviceId: string) => {
    console.log(`Delete service ${serviceId} clicked`);
    // Add confirmation and deletion logic
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Manage Your Services</CardTitle>
          <Button onClick={handleAddService}>Add New Service</Button>
        </CardHeader>
        <CardContent>
           {services.length === 0 ? (
             <p className="text-center text-muted-foreground">You haven't added any services yet.</p>
           ) : (
             <ul className="space-y-4">
                {services.map((service) => (
                    <li key={service.id} className="border p-4 rounded-md flex justify-between items-center dark:border-gray-700">
                    <div>
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                        Price: {service.price} | Duration: {service.duration}
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

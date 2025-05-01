
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { Service } from '../page'; // Import the Service interface

// Define Zod schema for validation (same as AddServiceDialog)
const serviceSchema = z.object({
  name: z.string().min(1, { message: 'Service name is required' }),
  price: z.string().min(1, { message: 'Price is required' }).regex(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a number (e.g., 25 or 25.50)' }),
  duration: z.string().min(1, { message: 'Duration is required (e.g., 30 mins)' }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface EditServiceDialogProps {
  children: React.ReactNode; // Trigger element
  userId?: string; // ID of the service provider
  service: Service; // The service data to edit
  onServiceUpdated: (updatedService: Service) => void; // Callback after updating
}

const EditServiceDialog: React.FC<EditServiceDialogProps> = ({ children, userId, service, onServiceUpdated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { // Initialize with existing service data
      name: service.name,
      price: service.price,
      duration: service.duration,
    },
  });

  // Reset form when service prop changes (e.g., when opening for a different service)
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        price: service.price,
        duration: service.duration,
      });
    }
  }, [service, form, open]); // Add open dependency to reset on dialog open

  const onSubmit = async (data: ServiceFormValues) => {
    if (!userId || !service.id) {
        toast({
            title: "Error",
            description: "User or Service ID missing.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);
    try {
      // Reference to the specific service document: serviceProviders/{userId}/services/{serviceId}
      const serviceDocRef = doc(db, 'serviceProviders', userId, 'services', service.id);

      // Update the existing service document
      await updateDoc(serviceDocRef, {
        ...data,
        price: data.price, // Ensure price is stored correctly
        updatedAt: serverTimestamp(), // Add/update an updatedAt timestamp
      });

      // Call the callback function with the updated service data
      onServiceUpdated({ ...service, ...data, updatedAt: serverTimestamp() }); // Pass updated data back to parent

      form.reset(); // Reset form fields
      setOpen(false); // Close the dialog
      toast({
        title: "Service Updated",
        description: `"${data.name}" has been updated successfully.`,
      });

    } catch (err) {
      console.error('Error updating service:', err);
      toast({
          title: "Error",
          description: "Failed to update service. Please try again.",
          variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update the details for the service &quot;{service.name}&quot;.
          </DialogDescription>
        </DialogHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Service Name</FormLabel>
                    <FormControl className="col-span-3">
                      <Input placeholder="e.g., Haircut" {...field} disabled={loading}/>
                    </FormControl>
                    <FormMessage className="col-span-4 text-right" />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Price ($)</FormLabel>
                    <FormControl className="col-span-3">
                       <Input type="text" placeholder="e.g., 50 or 49.99" {...field} disabled={loading} />
                    </FormControl>
                     <FormMessage className="col-span-4 text-right" />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Duration</FormLabel>
                    <FormControl className="col-span-3">
                      <Input placeholder="e.g., 30 mins, 1 hour" {...field} disabled={loading}/>
                    </FormControl>
                    <FormMessage className="col-span-4 text-right" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
                 </DialogClose>
                 <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                 </Button>
               </DialogFooter>
            </form>
         </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceDialog;

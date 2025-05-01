
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { Service } from '../page'; // Import the Service interface

// Define Zod schema for validation
const serviceSchema = z.object({
  name: z.string().min(1, { message: 'Service name is required' }),
  price: z.string().min(1, { message: 'Price is required' }).regex(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a number (e.g., 25 or 25.50)' }),
  duration: z.string().min(1, { message: 'Duration is required (e.g., 30 mins)' }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface AddServiceDialogProps {
  children: React.ReactNode; // Trigger element
  userId?: string; // ID of the service provider
  onServiceAdded: (newService: Omit<Service, 'id'>) => void; // Callback after adding
}

const AddServiceDialog: React.FC<AddServiceDialogProps> = ({ children, userId, onServiceAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      price: '',
      duration: '',
    },
  });

  const onSubmit = async (data: ServiceFormValues) => {
    if (!userId) {
        toast({
            title: "Error",
            description: "User not logged in.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);
    try {
      // Reference to the subcollection: serviceProviders/{userId}/services
      const servicesCollectionRef = collection(db, 'serviceProviders', userId, 'services');

      // Add the new service document to the subcollection
      const docRef = await addDoc(servicesCollectionRef, {
        ...data,
        price: data.price, // Store price as string (or convert if needed: parseFloat(data.price))
        createdAt: serverTimestamp(), // Add a timestamp
      });

      // Call the callback function with the new service data (excluding the auto-generated ID)
      onServiceAdded({...data, createdAt: serverTimestamp()}); // Pass data back to parent

      form.reset(); // Reset form fields
      setOpen(false); // Close the dialog

    } catch (err) {
      console.error('Error adding service:', err);
      toast({
          title: "Error",
          description: "Failed to add service. Please try again.",
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
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Fill in the details for the new service you offer.
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
                    <FormMessage className="col-span-4 text-right" /> {/* Span across all columns and align right */}
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
                  {loading ? 'Adding...' : 'Add Service'}
                 </Button>
               </DialogFooter>
            </form>
         </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceDialog;

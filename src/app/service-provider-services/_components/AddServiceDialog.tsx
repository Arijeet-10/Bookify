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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { Service } from '../page';
import { IndianRupee, Clock, PlusCircle } from 'lucide-react';

// Define Zod schema for validation
const serviceSchema = z.object({
  name: z.string().min(1, { message: 'Service name is required' }),
  price: z.string().min(1, { message: 'Price is required' })
    .regex(/^\d+(\.\d{1,2})?$/, { 
      message: 'Price must be a number (e.g., 2500 or 2500.50)' 
    }),
  duration: z.string().min(1, { message: 'Duration is required (e.g., 30 mins)' }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface AddServiceDialogProps {
  children: React.ReactNode;
  userId?: string;
  onServiceAdded: (newService: Omit<Service, 'id'>) => void;
}

const AddServiceDialog: React.FC<AddServiceDialogProps> = ({ 
  children, 
  userId, 
  onServiceAdded 
}) => {
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
      const servicesCollectionRef = collection(db, 'serviceProviders', userId, 'services');
      
      // Format the price to ensure consistency
      const formattedPrice = data.price;
      
      // Create the new service object
      const newServiceData = {
        name: data.name,
        price: formattedPrice,
        duration: data.duration,
        createdAt: serverTimestamp(),
      };
      
      // Add to Firestore
      await addDoc(servicesCollectionRef, newServiceData);

      // Call the callback function with the new service data
      onServiceAdded(newServiceData);

      form.reset();
      setOpen(false);
      
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
    <Dialog open={open} onOpenChange={(newOpenState) => {
      setOpen(newOpenState);
      // Reset form when dialog is opened or closed
      if (!newOpenState) {
        form.reset();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-700 dark:to-green-700 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Service</DialogTitle>
            <DialogDescription className="text-emerald-100 mt-1">
              Create a new service offering for your clients
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Service Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Haircut, Manicure, Consultation" 
                        className="bg-slate-50 dark:bg-gray-800"
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <IndianRupee className="h-4 w-4 text-slate-500" />
                          </div>
                          <Input 
                            type="text" 
                            placeholder="e.g., 500 or 499.99" 
                            className="pl-9 bg-slate-50 dark:bg-gray-800"
                            {...field} 
                            disabled={loading} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Duration</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Clock className="h-4 w-4 text-slate-500" />
                          </div>
                          <Input 
                            placeholder="e.g., 30 mins, 1 hour" 
                            className="pl-9 bg-slate-50 dark:bg-gray-800"
                            {...field} 
                            disabled={loading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-8 gap-2 flex">
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="outline"
                  className="border-slate-200 dark:border-gray-700"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Service...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceDialog;
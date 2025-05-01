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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { Service } from '../page';
import { IndianRupee, Clock, Save } from 'lucide-react';

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

interface EditServiceDialogProps {
  children: React.ReactNode;
  userId?: string;
  service: Service;
  onServiceUpdated: (updatedService: Service) => void;
}

const EditServiceDialog: React.FC<EditServiceDialogProps> = ({ 
  children, 
  userId, 
  service, 
  onServiceUpdated 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service.name,
      // Remove currency symbol if present for proper validation
      price: service.price.startsWith('₹') ? service.price.substring(1) : service.price,
      duration: service.duration,
    },
  });

  // Reset form when service prop or dialog open state changes
  useEffect(() => {
    if (service && open) {
      form.reset({
        name: service.name,
        price: service.price.startsWith('₹') ? service.price.substring(1) : service.price,
        duration: service.duration,
      });
    }
  }, [service, form, open]);

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
      const serviceDocRef = doc(db, 'serviceProviders', userId, 'services', service.id);
      
      // Format the price to ensure consistency
      const formattedPrice = data.price;
      
      await updateDoc(serviceDocRef, {
        name: data.name,
        price: formattedPrice,
        duration: data.duration,
        updatedAt: serverTimestamp(),
      });

      // Call the callback function with the updated service data
      onServiceUpdated({ 
        ...service, 
        name: data.name,
        price: formattedPrice, 
        duration: data.duration,
        updatedAt: serverTimestamp() 
      });

      setOpen(false);
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Service</DialogTitle>
            <DialogDescription className="text-blue-100 mt-1">
              Update the details for "{service.name}"
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
                        placeholder="e.g., Haircut" 
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >         
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
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

export default EditServiceDialog;

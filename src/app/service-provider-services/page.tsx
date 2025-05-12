
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, deleteDoc, Timestamp, addDoc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AddServiceDialog from './_components/AddServiceDialog';
import EditServiceDialog from './_components/EditServiceDialog';
import { CldUploadButton } from 'next-cloudinary';
import {
  PlusCircle,
  Trash2, ChevronDown, ChevronUp,
  Pencil,
  Clock,
  IndianRupee,
  Package,
  Search,
  Image as ImageIcon, // For gallery section
  ChevronRight, ChevronDown as ChevronDownIcon, // For collapsible
  AlertCircle
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react'; // Import UploadCloud separately if needed for clarity
import { Save } from 'lucide-react'; // Import Save separately if needed for clarity
import Image from 'next/image'; // For displaying gallery images

// Define the structure of a service object
export interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Define structure for gallery images
interface GalleryImage {
  id: string;
  url: string;
  createdAt: Timestamp;
}

const ServiceProviderServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name');
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.role === 'serviceProvider') {
            fetchServices(currentUser.uid);
            fetchGalleryImages(currentUser.uid); // Fetch gallery images
            const userData = userDocSnap.data() as any; // Cast to any for dynamic access
            setAddress(userData?.address || '');
            setCity(userData?.city || '');
            setZipCode(userData?.zipCode || '');
            setPhoneNumber(userData?.phoneNumber || '');
            setOpeningTime(userData?.openingTime || '');
            setClosingTime(userData?.closingTime || '');
          } else {
            setError('Access denied. You are not registered as a service provider.');
            setLoading(false);
            setLoadingGallery(false);
          }
        } catch (err) {
          console.error("Error verifying user role:", err);
          setError('Failed to verify user role.');
          setLoading(false);
          setLoadingGallery(false);
        }
      } else {
        setUser(null);
        setServices([]);
        setGalleryImages([]);
        setLoading(false);
        setLoadingGallery(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Filter and sort services when services, searchQuery or sort params change
  useEffect(() => {
    if (!services.length) {
      setFilteredServices([]);
      return;
    }

    let result = [...services];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.price.toLowerCase().includes(query) ||
        service.duration.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'price') {
        // Extract numeric price values for comparison
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, ''));
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, ''));
        return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
      } else if (sortBy === 'duration') {
        return sortDirection === 'asc'
          ? a.duration.localeCompare(b.duration)
          : b.duration.localeCompare(a.duration);
      }
      return 0;
    });

    setFilteredServices(result);
  }, [services, searchQuery, sortBy, sortDirection]);

  const getServicesCollectionRef = (userId: string) => {
    return collection(db, 'serviceProviders', userId, 'services');
  };

  const getGalleryCollectionRef = (userId: string) => {
    return collection(db, 'serviceProviders', userId, 'imageGallery');
  };

  const fetchServices = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const servicesCollectionRef = getServicesCollectionRef(userId);
      const q = query(servicesCollectionRef, orderBy('name', 'asc')); // Default sort by name

      const querySnapshot = await getDocs(q);
      const fetchedServices: Service[] = [];
      querySnapshot.forEach((doc) => {
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

  const fetchGalleryImages = async (userId: string) => {
    setLoadingGallery(true);
    setGalleryError(null);
    try {
      const galleryCollectionRef = getGalleryCollectionRef(userId);
      const q = query(galleryCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedImages: GalleryImage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedImages.push({ id: doc.id, ...doc.data() } as GalleryImage);
      });
      setGalleryImages(fetchedImages);
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      setGalleryError('Failed to load gallery images.');
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleServiceAdded = (newServiceData: Omit<Service, 'id'>) => {
    if (user) {
      fetchServices(user.uid); // Refetch services to include the new one
      toast({
        title: "Service Added",
        description: `"${newServiceData.name}" has been added successfully.`,
      });
    }
  };

  const handleServiceUpdated = (updatedService: Service) => {
    if (user) {
      // Update the local state to reflect the change immediately
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === updatedService.id ? updatedService : service
        )
      );
      // Optionally, refetch if there are complex dependencies or server-side logic
      // fetchServices(user.uid);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!user) return;

    const serviceDocRef = doc(db, 'serviceProviders', user.uid, 'services', serviceId);

    try {
      await deleteDoc(serviceDocRef);
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

  const handleGalleryImageUploadSuccess = async (result: any) => {
    if (result.event === 'success' && user) {
      const imageUrl = result.info.secure_url;
      setLoadingGallery(true); // Indicate activity
      try {
        const galleryCollectionRef = getGalleryCollectionRef(user.uid);
        await addDoc(galleryCollectionRef, {
          url: imageUrl,
          createdAt: serverTimestamp(),
        });
        fetchGalleryImages(user.uid); // Refetch to display the new image
        toast({
          title: "Image Uploaded",
          description: "Your image has been added to the gallery.",
        });
      } catch (error) {
        console.error("Error uploading image to gallery:", error);
        toast({
          title: "Upload Failed",
          description: "Could not save the image to your gallery. Please try again.",
          variant: "destructive",
        });
      } finally {
        // setLoadingGallery(false); // fetchGalleryImages will set this
      }
    }
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!user) return;

    const imageDocRef = doc(db, 'serviceProviders', user.uid, 'imageGallery', imageId);
    try {
      await deleteDoc(imageDocRef);
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Image Deleted",
        description: "The image has been removed from your gallery.",
      });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        address,
        city,
        zipCode,
        phoneNumber,
        openingTime,
        closingTime,
      }, { merge: true }); // Use merge: true to only update specified fields

      toast({
        title: "Profile Updated",
        description: "Your contact and hours information has been saved.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: "Failed to save profile. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };
  const toggleSort = (column: 'name' | 'price' | 'duration') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: 'name' | 'price' | 'duration') => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4 pb-[120px]">
      <div className="w-full max-w-5xl">
        {/* Contact & Hours Section */}
        <Card className="shadow-lg border-0 dark:bg-gray-850 overflow-hidden mt-8">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center">
                <Clock className="mr-3 h-6 w-6" /> Contact & Hours
              </h2>
              <p className="text-purple-100 mt-1">Set your contact details and business hours</p>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your business address"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter your zip code"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="openingTime">Opening Time</Label>
              <Input
                id="openingTime"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="closingTime">Closing Time</Label>
              <Input
                id="closingTime"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-slate-50 dark:bg-gray-850 border-t border-slate-200 dark:border-gray-700 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSavingProfile || !user}>
              {isSavingProfile ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
            </Button>
          </CardFooter>
        </Card>
        <Card className="shadow-lg border-0 dark:bg-gray-850 overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 text-white p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Services Dashboard</h1>
                <p className="text-blue-100 mt-1">Manage your service offerings</p>
              </div>
              <AddServiceDialog
                userId={user?.uid}
                onServiceAdded={handleServiceAdded}
              >
                <Button
                  className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-sm transition-all"
                  disabled={loading || !!error}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
                </Button>
              </AddServiceDialog>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Search and filter bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700"
                placeholder="Search services by name, price or duration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Stats at the top */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Services</p>
                      <p className="text-2xl font-bold">{services.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Average Price</p>
                      <p className="text-2xl font-bold">
                        ₹{services.length > 0
                          ? (services.reduce((sum, service) => sum + parseFloat(service.price.replace(/[^\d.]/g, '')), 0) / services.length).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-emerald-500" />
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Filtered Results</p>
                      <p className="text-2xl font-bold">{filteredServices.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Table header with sorting */}
            {!loading && !error && services.length > 0 && (
              <div className="hidden md:grid grid-cols-12 bg-slate-100 dark:bg-gray-800 rounded-t-md p-3 mb-1 font-medium text-slate-600 dark:text-slate-300">
                <div
                  className="col-span-4 flex items-center cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  Service Name
                  <span className="ml-1">{getSortIcon('name')}</span>
                </div>
                <div
                  className="col-span-3 flex items-center cursor-pointer"
                  onClick={() => toggleSort('price')}
                >
                  Price
                  <span className="ml-1">{getSortIcon('price')}</span>
                </div>
                <div
                  className="col-span-3 flex items-center cursor-pointer"
                  onClick={() => toggleSort('duration')}
                >
                  Duration
                  <span className="ml-1">{getSortIcon('duration')}</span>
                </div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4 mt-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <div className="flex space-x-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-16 rounded-md" />
                        <Skeleton className="h-9 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">⚠️ {error}</div>
                <p className="text-slate-600 dark:text-slate-400">Please try refreshing the page or contact support.</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 dark:bg-gray-800/50 rounded-lg">
                {services.length === 0 ? (
                  <>
                    <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No Services Available</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by adding your first service offering.</p>
                    <AddServiceDialog
                      userId={user?.uid}
                      onServiceAdded={handleServiceAdded}
                    >
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Service
                      </Button>
                    </AddServiceDialog>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No Matching Services</h3>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your search query.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3"> {/* Check if filteredServices is an array before mapping */}
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-3 md:mb-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">{service.name}</h3>

                          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                              <IndianRupee className="h-3 w-3" />
                              <span>{service.price.startsWith('₹') ? service.price : `₹${service.price}`}</span>
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                              <Clock className="h-3 w-3" />
                              <span>{service.duration}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end md:self-auto">
                        {user && (
                          <EditServiceDialog
                            userId={user.uid}
                            service={service}
                            onServiceUpdated={handleServiceUpdated}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                            </Button>
                          </EditServiceDialog>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 dark:hover:text-red-200 hover:border-red-300"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the service
                                &quot;{service.name}&quot; from your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleDeleteService(service.id, service.name)}
                              >
                                Yes, delete service
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {!loading && !error && services.length > 0 && (
            <CardFooter className="p-4 bg-slate-50 dark:bg-gray-850 border-t border-slate-200 dark:border-gray-700 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
              <div>
                Showing {filteredServices.length} of {services.length} services
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </Badge>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Image Gallery Section */}
        <Card className="shadow-lg border-0 dark:bg-gray-850 overflow-hidden mt-8">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-700 dark:to-green-700 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center">
                  <ImageIcon className="mr-3 h-6 w-6" /> Image Gallery
                </h2>
                <p className="text-emerald-100 mt-1">Showcase your work and venue</p>
              </div>
              {user && (
                <CldUploadButton
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "bookify"} // Ensure a fallback or correct preset name
                  onSuccess={handleGalleryImageUploadSuccess}
                >
                  {/* Replace Button with a div to fix hydration error */}
                  <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-sm px-4 py-2">

                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Image

                  </div>

                </CldUploadButton>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingGallery ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-lg bg-slate-200 dark:bg-gray-700" />
                ))}
              </div>
            ) : galleryError ? (
              <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
                <p className="text-red-600 dark:text-red-400">{galleryError}</p>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-gray-800/50 rounded-lg">
                <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Gallery is Empty</h3>
                <p className="text-slate-500 dark:text-slate-400">Upload images to showcase your services or venue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryImages.map(image => (
                  <div key={image.id} className="relative group aspect-square">
                    <Image
                      src={image.url}
                      alt="Gallery image"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg shadow-md transition-transform group-hover:scale-105"
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the image from your gallery.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleDeleteGalleryImage(image.id)}
                          >
                            Yes, delete image
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

export default ServiceProviderServicesPage;


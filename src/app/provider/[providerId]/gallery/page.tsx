'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, getDocs, Timestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ChevronLeft, AlertCircle, ImageIcon as ImageIconLucide } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  createdAt: Timestamp;
}

interface ServiceProvider {
  id: string;
  businessName: string;
}

const ProviderGalleryPage = () => {
  const params = useParams();
  const providerId = params.providerId as string;
  const router = useRouter();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [providerData, setProviderData] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleryData = async () => {
      if (!providerId) {
        setError("Provider ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch provider data
        const providerDocRef = doc(db, 'serviceProviders', providerId);
        const providerDocSnap = await getDoc(providerDocRef);
        if (providerDocSnap.exists()) {
          setProviderData({ id: providerDocSnap.id, ...providerDocSnap.data() } as ServiceProvider);
        } else {
          throw new Error("Service provider not found. Cannot load gallery.");
        }

        // Fetch gallery images
        const galleryCollectionRef = collection(db, 'serviceProviders', providerId, 'imageGallery');
        const q = query(galleryCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedImages: GalleryImage[] = [];
        querySnapshot.forEach((doc) => {
          fetchedImages.push({ id: doc.id, ...doc.data() } as GalleryImage);
        });
        setImages(fetchedImages);
      } catch (err: any) {
        console.error('Error fetching gallery data:', err);
        setError(err.message || 'Failed to load image gallery.');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, [providerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 pb-[80px]">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <Skeleton className="h-10 w-1/2 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg bg-slate-200 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 flex justify-center items-center pb-[80px]">
        <Card className="w-full max-w-lg dark:bg-slate-900 shadow-lg text-center p-8">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center">
              <AlertCircle className="h-7 w-7 mr-2" /> Error Loading Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 pb-[80px]">
      <div className="max-w-6xl mx-auto">
        <Button 
          onClick={() => router.push(`/provider/${providerId}`)} 
          variant="outline" 
          className="mb-6 dark:text-white dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Provider
        </Button>

        <Card className="w-full dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-t-lg">
            <div className="flex items-center">
                <ImageIconLucide className="h-7 w-7 mr-3 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">
                        Image Gallery
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                        Visual showcase for {providerData?.businessName || 'the provider'}
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {images.length === 0 ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                <ImageIconLucide className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <p className="text-xl font-medium">This provider hasn't uploaded any images yet.</p>
                <p className="text-sm mt-1">Check back later to see their work or venue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {images.map((image) => (
                  <div key={image.id} className="relative aspect-square group overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={image.url}
                      alt={`Gallery image from ${providerData?.businessName}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                      data-ai-hint="service gallery"
                    />
                     <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-opacity duration-300"></div>
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

export default ProviderGalleryPage;

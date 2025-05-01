
import { Icons } from '@/components/icons.tsx'; // Updated import path

export const serviceCategories = [
  {
    id: 'dental', // Use descriptive IDs
    name: 'Dental & Orthodontics',
    image: 'https://picsum.photos/200/300',
    icon: Icons.tooth,
    "data-ai-hint": "dental orthodontics",
  },
  {
    id: 'fitness',
    name: 'Health & Fitness',
    image: 'https://picsum.photos/200/301',
    icon: Icons.dumbbell,
    "data-ai-hint": "health fitness gym workout",
  },
  {
    id: 'professional',
    name: 'Professional Services',
    image: 'https://picsum.photos/200/302',
    icon: Icons.briefcase,
    "data-ai-hint": "professional business services",
  },
   {
    id: 'barber',
    name: 'Barbershop',
    image: 'https://picsum.photos/200/304',
    icon: Icons.scissors,
     "data-ai-hint": "barbershop haircut",
  },
   {
    id: 'beauty',
    name: 'Beauty Salon',
    image: 'https://picsum.photos/200/305',
    icon: Icons.scissors, // Reusing scissors or find a better alternative if available
    "data-ai-hint": "beauty salon hair makeup",
  },
   {
    id: 'massage',
    name: 'Massage Therapy',
    image: 'https://picsum.photos/200/306',
    icon: Icons.massage, // Use the updated massage icon
    "data-ai-hint": "massage therapy spa relaxation",
  },
  {
    id: 'other',
    name: 'Other',
    image: 'https://picsum.photos/200/303',
    icon: Icons.more,
     "data-ai-hint": "various services",
  },
];

export const specialOffers = [
  {
    id: '201',
    providerName: 'LA Barber Downey',
    imageUrl: 'https://media.istockphoto.com/id/639607852/photo/hairstylist-serving-client-at-barber-shop.jpg?s=612x612&w=0&k=20&c=-kBoMs26KIX1Hl6uh_VLRHCtLxnLYyq9a0n7X8iu5MQ=',
    rating: '5.0',
    reviews: '245 reviews',
    address: '8317 Firestone Blvd, Downey, CA 90241, 5622506313, Downey, 90241',
    discount: 'SAVE UP TO 10%',
     "data-ai-hint": "barber shop men haircut",
  },
  {
    id: '202',
    providerName: 'BarberEze',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStor9vEAXB_4QZjTmJnggJ1H85KlvuX2ZsQw&s',
    rating: '4.8',
    reviews: '120 reviews',
    address: '1140 W State Rd',
    discount: 'SAVE UP TO 15%',
     "data-ai-hint": "barber shop modern haircut",
  },
];

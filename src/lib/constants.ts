
import { Icons } from '@/components/icons.tsx'; // Updated import path

export const serviceCategories = [
  {
    id: 'dental', // Use descriptive IDs
    name: 'Dental & Orthodontics',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSR0I9prkX7oEHn-jTrsVsFI3S3Kzdr5mayOg&s',
    icon: Icons.tooth,
    "data-ai-hint": "dental orthodontics",
  },
  {
    id: 'fitness',
    name: 'Health & Fitness',
    image: 'https://i0.wp.com/goldsgym.in/wp-content/uploads/2023/12/compress-strong-man-training-gym-min-scaled.jpg?fit=2560%2C1707&ssl=1',
    icon: Icons.dumbbell,
    "data-ai-hint": "health fitness gym workout",
  },
  {
    id: 'professional',
    name: 'Professional Services',
    image: 'https://blog.ipleaders.in/wp-content/uploads/2020/01/Professional-Services.jpg',
    icon: Icons.briefcase,
    "data-ai-hint": "professional business services",
  },
   {
    id: 'barber',
    name: 'Barbershop',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStor9vEAXB_4QZjTmJnggJ1H85KlvuX2ZsQw&s',
    icon: Icons.scissors,
     "data-ai-hint": "barbershop haircut",
  },
   {
    id: 'beauty',
    name: 'Beauty Salon',
    image: 'https://media.istockphoto.com/id/1394936524/photo/young-woman-on-manicure-treatment-at-beauty-salon.jpg?s=612x612&w=0&k=20&c=c1PDGyhDVL7LEJQks__JZPh4_TN0kliSPowhrTROzmg=',
    icon: Icons.scissors, // Reusing scissors or find a better alternative if available
    "data-ai-hint": "beauty salon hair makeup",
  },
   {
    id: 'massage',
    name: 'Massage Therapy',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz5Az-ggXZuf9uF8xLMmy-mtqjlW6lOxN_Ig&s',
    icon: Icons.massage, // Use the updated massage icon
    "data-ai-hint": "massage therapy spa relaxation",
  },
  {
    id: 'other',
    name: 'Other',
    image: 'https://www.shutterstock.com/image-photo/two-hands-touching-each-other-260nw-2458989061.jpg',
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

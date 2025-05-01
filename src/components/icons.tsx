import type { ComponentProps } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Dumbbell,
  Filter,
  HandHeart,
  Home,
  LayoutDashboard,
  Map as MapIcon, // Renamed Map to avoid conflict with JS Map
  MapPin,
  MoreHorizontal,
  Palette,
  Scissors,
  Search,
  SearchX,
  Share2,
  Smile, // Using Smile as a placeholder for Tooth
  Star,
  ThumbsUp,
  User,
} from "lucide-react";

// Define Icons object by directly assigning Lucide components
// We use functional components to allow passing props like className, size, etc.
export const Icons = {
  // Navigation and layout icons
  home: (props: ComponentProps<typeof Home>) => <Home {...props} />,
  user: (props: ComponentProps<typeof User>) => <User {...props} />,
  layoutDashboard: (props: ComponentProps<typeof LayoutDashboard>) => (
    <LayoutDashboard {...props} />
  ),
  
  // Search and filter icons
  search: (props: ComponentProps<typeof Search>) => <Search {...props} />,
  searchX: (props: ComponentProps<typeof SearchX>) => <SearchX {...props} />,
  filter: (props: ComponentProps<typeof Filter>) => <Filter {...props} />,
  
  // Location icons
  mapPin: (props: ComponentProps<typeof MapPin>) => <MapPin {...props} />,
  map: (props: ComponentProps<typeof MapIcon>) => <MapIcon {...props} />,
  
  // Functional icons
  calendar: (props: ComponentProps<typeof Calendar>) => <Calendar {...props} />,
  more: (props: ComponentProps<typeof MoreHorizontal>) => (
    <MoreHorizontal {...props} />
  ),
  share: (props: ComponentProps<typeof Share2>) => <Share2 {...props} />,
  thumbsup: (props: ComponentProps<typeof ThumbsUp>) => <ThumbsUp {...props} />,
  star: (props: ComponentProps<typeof Star>) => <Star {...props} />,
  alertCircle: (props: ComponentProps<typeof AlertCircle>) => (
    <AlertCircle {...props} />
  ),
  
  // Service category icons
  scissors: (props: ComponentProps<typeof Scissors>) => <Scissors {...props} />,
  briefcase: (props: ComponentProps<typeof Briefcase>) => (
    <Briefcase {...props} />
  ),
  dumbbell: (props: ComponentProps<typeof Dumbbell>) => (
    <Dumbbell {...props} />
  ),
  smile: (props: ComponentProps<typeof Smile>) => <Smile {...props} />,
  tooth: (props: ComponentProps<typeof Smile>) => <Smile {...props} />, // Placeholder for Tooth
  massage: (props: ComponentProps<typeof HandHeart>) => (
    <HandHeart {...props} />
  ),
  beauty: (props: ComponentProps<typeof Palette>) => <Palette {...props} />, // Added beauty icon using Palette
};
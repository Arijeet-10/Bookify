import type { ComponentProps } from "react";
import {
  MapPin,
  Search,
  Star,
  Calendar,
  MoreHorizontal,
  Scissors,
  Briefcase, // Added for professional services / general business
  Dumbbell,
  Smile, // Using Smile as a placeholder for Tooth and potentially Massage
  Map as MapIcon, // Renamed Map to avoid conflict with JS Map
  Share2,
  ThumbsUp,
  Home,
  User,
  LayoutDashboard, // Added for dashboard icon
  HandHeart, // Potential icon for massage/beauty
  AlertCircle,
  SearchX,
  Filter,
} from "lucide-react";

// Define Icons object by directly assigning Lucide components
// We use functional components to allow passing props like className, size, etc.
export const Icons = {
  mapPin: (props: ComponentProps<typeof MapPin>) => <MapPin {...props} />,
  search: (props: ComponentProps<typeof Search>) => <Search {...props} />,
  star: (props: ComponentProps<typeof Star>) => <Star {...props} />,
  calendar: (props: ComponentProps<typeof Calendar>) => <Calendar {...props} />,
  more: (props: ComponentProps<typeof MoreHorizontal>) => <MoreHorizontal {...props} />,
  scissors: (props: ComponentProps<typeof Scissors>) => <Scissors {...props} />,
  briefcase: (props: ComponentProps<typeof Briefcase>) => <Briefcase {...props} />, // Added Briefcase
  dumbbell: (props: ComponentProps<typeof Dumbbell>) => <Dumbbell {...props} />,
  smile: (props: ComponentProps<typeof Smile>) => <Smile {...props} />, // Placeholder for general positive/happy icon
  map: (props: ComponentProps<typeof MapIcon>) => <MapIcon {...props} />, // Use the renamed MapIcon
  share: (props: ComponentProps<typeof Share2>) => <Share2 {...props} />,
  thumbsup: (props: ComponentProps<typeof ThumbsUp>) => <ThumbsUp {...props} />,
  home: (props: ComponentProps<typeof Home>) => <Home {...props} />,
  user: (props: ComponentProps<typeof User>) => <User {...props} />,
  tooth: (props: ComponentProps<typeof Smile>) => <Smile {...props} />, // Placeholder for Tooth, using Smile
  layoutDashboard: (props: ComponentProps<typeof LayoutDashboard>) => <LayoutDashboard {...props} />, // Added Dashboard
  // Consider replacing Smile placeholder for massage/beauty if HandHeart fits better
  massage: (props: ComponentProps<typeof HandHeart>) => <HandHeart {...props} />,
  // Additional icons needed for the redesigned UI
  alertCircle: (props: ComponentProps<typeof AlertCircle>) => <AlertCircle {...props} />,
  searchX: (props: ComponentProps<typeof SearchX>) => <SearchX {...props} />,
  filter: (props: ComponentProps<typeof Filter>) => <Filter {...props} />,
};
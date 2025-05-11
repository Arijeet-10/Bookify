
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
  Palette, // Added beauty icon
  Settings, // Added for settings
  Users, // Added for managing users/providers
  CalendarCheck, // Added for managing bookings
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
  briefcase: (props: ComponentProps<typeof Briefcase>) => <Briefcase {...props} />, 
  dumbbell: (props: ComponentProps<typeof Dumbbell>) => <Dumbbell {...props} />,
  smile: (props: ComponentProps<typeof Smile>) => <Smile {...props} />, 
  map: (props: ComponentProps<typeof MapIcon>) => <MapIcon {...props} />, 
  share: (props: ComponentProps<typeof Share2>) => <Share2 {...props} />,
  thumbsup: (props: ComponentProps<typeof ThumbsUp>) => <ThumbsUp {...props} />,
  home: (props: ComponentProps<typeof Home>) => <Home {...props} />,
  user: (props: ComponentProps<typeof User>) => <User {...props} />,
  tooth: (props: ComponentProps<typeof Smile>) => <Smile {...props} />, 
  layoutDashboard: (props: ComponentProps<typeof LayoutDashboard>) => <LayoutDashboard {...props} />, 
  massage: (props: ComponentProps<typeof HandHeart>) => <HandHeart {...props} />,
  alertCircle: (props: ComponentProps<typeof AlertCircle>) => <AlertCircle {...props} />,
  searchX: (props: ComponentProps<typeof SearchX>) => <SearchX {...props} />,
  filter: (props: ComponentProps<typeof Filter>) => <Filter {...props} />,
  beauty: (props: ComponentProps<typeof Palette>) => <Palette {...props} />,
  settings: (props: ComponentProps<typeof Settings>) => <Settings {...props} />,
  users: (props: ComponentProps<typeof Users>) => <Users {...props} />,
  calendarCheck: (props: ComponentProps<typeof CalendarCheck>) => <CalendarCheck {...props} />,
};

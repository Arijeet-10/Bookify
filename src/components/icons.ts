import {
  LucideIcon,
  MapPin,
  Search,
  Star,
  Calendar,
  MoreHorizontal,
  Scissors,
  Briefcase,
  Dumbbell,
  Smile, // Using Smile as a placeholder for Tooth and potentially Massage
  Map,
  Share2,
  ThumbsUp,
  Home,
  User
} from "lucide-react";
import type { ComponentProps } from "react";

// Define a type for the icon props to ensure consistency
type IconComponent = (props: ComponentProps<LucideIcon>) => JSX.Element;

// Define Icons object with explicit typing
export const Icons: { [key: string]: IconComponent } = {
  mapPin: (props) => <MapPin {...props} />,
  search: (props) => <Search {...props} />,
  star: (props) => <Star {...props} />,
  calendar: (props) => <Calendar {...props} />,
  more: (props) => <MoreHorizontal {...props} />,
  scissors: (props) => <Scissors {...props} />,
  briefcase: (props) => <Briefcase {...props} />,
  dumbbell: (props) => <Dumbbell {...props} />,
  smile: (props) => <Smile {...props} />, // Placeholder for general positive/happy icon
  map: (props) => <Map {...props} />,
  share: (props) => <Share2 {...props} />,
  thumbsup: (props) => <ThumbsUp {...props} />,
  home: (props) => <Home {...props} />,
  user: (props) => <User {...props} />,
  tooth: (props) => <Smile {...props} />, // Placeholder for Tooth, using Smile
  // Add other custom icons or placeholders here if needed
  // Example of inline SVG for a custom icon if needed:
  // customIcon: (props) => (
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
  //     {/* SVG path data */}
  //   </svg>
  // ),
};

// Export the LucideIcon type if needed elsewhere
export type { LucideIcon };

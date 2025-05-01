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
  MapPin as MapIcon, // Renamed Map to avoid conflict with JS Map and use MapPin as placeholder
  Share2,
  ThumbsUp,
  Home,
  User
} from "lucide-react";
import type { ComponentProps } from "react";

// Define Icons object by directly assigning Lucide components
export const Icons = {
  mapPin: MapPin,
  search: Search,
  star: Star,
  calendar: Calendar,
  more: MoreHorizontal,
  scissors: Scissors,
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  smile: Smile, // Placeholder for general positive/happy icon
  map: MapIcon, // Use the renamed MapIcon (which is actually MapPin)
  share: Share2,
  thumbsup: ThumbsUp,
  home: Home,
  user: User,
  tooth: Smile, // Placeholder for Tooth, using Smile
};

// Export the LucideIcon type if needed elsewhere
export type { LucideIcon };

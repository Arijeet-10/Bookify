import {ArrowRight, Check, ChevronsUpDown, Circle, Copy, Edit, ExternalLink, File, HelpCircle, Home, Loader2, Mail, MessageSquare, Moon, Plus, PlusCircle, Search, Server, Settings, Share2, Shield, Sun, Trash, User, X, Workflow} from 'lucide-react';

const Icons = {
  arrowRight: ArrowRight,
  check: Check,
  chevronDown: ChevronsUpDown,
  circle: Circle,
  workflow: Workflow,
  close: X,
  copy: Copy,
  dark: Moon,
  edit: Edit,
  externalLink: ExternalLink,
  file: File,
  help: HelpCircle,
  home: Home,
  light: Sun,
  loader: Loader2,
  mail: Mail,
  messageSquare: MessageSquare,
  plus: Plus,
  plusCircle: PlusCircle,
  search: Search,
  server: Server,
  settings: Settings,
  share: Share2,
  shield: Shield,
  spinner: Loader2,
  trash: Trash,
  user: User,
  haircut: ()=> (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scissors"><path d="M3 3v18h18"/><path d="m7 7 1 1 2 2"/><path d="m17 17-1-1-2-2"/><path d="M7 17 17 7"/><circle cx="7" cy="7" r="1"/><circle cx="17" cy="17" r="1"/></svg>
  ),
  massage: ()=> (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hand-massage"><path d="M16 7a5 5 0 0 0-5-5H3v5"/><path d="M3 12h9a5 5 0 0 1 5 5v2a3 3 0 0 1-3 3H3"/><path d="M17 4a2 2 0 0 1 2 2"/><path d="M21 11a2 2 0 0 1 2 2"/><path d="M17 18a2 2 0 0 1 2 2"/></svg>
  ),
  nail: ()=> (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hand"><path d="M12 22a3 3 0 0 0 3-3v-3"/><path d="M5 22a3 3 0 0 1-3-3v-3"/><path d="M19 22a3 3 0 0 0 3-3v-3"/><path d="M8 22a3 3 0 0 1-3-3v-3"/><path d="M16 22a3 3 0 0 0 3-3v-3"/><path d="M12 16a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/></svg>
  ),
  facial: ()=> (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-face-scanning"><path d="M3 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/><path d="M21 8v8"/><path d="M3 8v8"/><path d="M21 20v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1"/><path d="M8 12h.01"/><path d="M16 12h.01"/></svg>
  ),
};

export {Icons};

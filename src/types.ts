export type UserType = 'bride' | 'groom' | 'vendor' | 'planner' | 'admin';

export interface UserDetails {
  fullName: string;
  state: string;
  city: string;
  address: string;
}

export interface WeddingDetails {
  date: string;
  state: string;
  city: string;
  venueFinalized: 'yes' | 'no' | 'discussion';
  venueName?: string;
  venueLocation?: string;
  fianceName?: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
}

export interface AppState {
  screen: 'splash' | 'onboarding_info' | 'user_type' | 'auth' | 'onboarding_form' | 'dashboard' | 'checklist' | 'inspiration' | 'packages' | 'profile' | 'real_weddings' | 'blogs' | 'category_page' | 'bookings' | 'saved_vendors' | 'settings' | 'help_support' | 'about_vivah' | 'terms' | 'privacy' | 'guest_list' | 'admin_login' | 'admin_dashboard' | 'vendor_dashboard' | 'planner_dashboard' | 'role_selection';
  userType: UserType | null;
  userDetails: UserDetails | null;
  fianceDetails: UserDetails | null;
  weddingDetails: WeddingDetails | null;
  isPremium: boolean;
  selectedCategory?: string;
  guests: Guest[];
  adminUser?: AdminProfile;
}

export interface AdminVendor {
  id: string;
  name: string;
  services: string;
  status: 'pending' | 'approved' | 'rejected';
  details: string;
  rating?: number;
  category?: string;
}

export interface AdminBooking {
  id: string;
  service: string;
  customer_name: string;
  customer_id: string;
  date: string;
  payment_status: string;
  vendor_id: string;
  amount?: number;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  status: 'active' | 'blocked';
  lastActivity: string;
}

export interface AdminEventRecord {
  id: string;
  name: string;
  type: 'wedding' | 'birthday' | 'corporate';
  date: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  details: string;
}

export interface AdminProfile {
  name: string;
  email: string;
  contact: string;
  image: string;
  role: 'Super Admin' | 'Manager';
}

export interface AdminReports {
  totalBookings: number;
  pendingApprovals: number;
  approvedVendors: number;
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  monthlyTrends: { month: string; bookings: number; revenue: number }[];
}

export interface AIConfig {
  expertChatPrompt: string;
  recommendationsEnabled: boolean;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface AdminFeedback {
  id: string;
  user_name: string;
  user_id: string;
  rating: number;
  comment: string;
  date: string;
}

export type RSVPStatus = 'Accepted' | 'Maybe' | 'Not Attending' | 'Pending';
export type RelationType = 'Family' | 'Friend' | 'Relative';

export interface Guest {
  id: string;
  name: string;
  relation: RelationType;
  phone: string;
  email?: string;
  rsvp: RSVPStatus;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface PortfolioItem {
  id: string;
  image: string;
  title: string;
}

export interface CatalogueItem {
  id: string;
  image: string;
  title: string;
}

export interface InspirationBoard {
  id: string;
  name: string;
  count: number;
  img: string;
  description: string;
  catalogue: CatalogueItem[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  location: string;
  price: string;
  priceValue: number; // For sorting
  image: string;
  isPremium?: boolean;
  description?: string;
  email?: string;
  phone?: string;
  portfolio?: PortfolioItem[];
  availability?: string[]; // Array of dates or months, e.g., ['2026-12-10', '2026-12-11']
  specificServices?: string[]; // e.g., ['Candid', 'Cinematic', 'Traditional']
}

export interface Package {
  id: string;
  name: string;
  members: string[];
  price: string;
  image: string;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: 'Tips' | 'Budget' | 'Fashion';
  date: string;
}

export interface RealWedding {
  id: string;
  couple: string;
  location: string;
  story: string;
  mainImage: string;
  gallery: string[];
  vendors: { name: string; category: string }[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  planned: number;
}

export interface BudgetPurchase {
  id: string;
  name: string;
  categoryId: string;
  cost: number;
  status: 'paid' | 'pending';
  vendorId?: string;
  vendorName?: string;
  collaborators: ('bride' | 'groom')[];
}

import { Task, Vendor, Package, InspirationBoard, Blog, RealWedding, WeddingEvent, UserDetails } from './types';

export const INITIAL_EVENTS: WeddingEvent[] = [
  { id: '1', name: 'Mehendi', date: '2026-12-10', time: '11:00 AM', venue: 'Garden Area, City Palace', description: 'Traditional mehendi ceremony with music and dance.' },
  { id: '2', name: 'Sangeet', date: '2026-12-10', time: '07:00 PM', venue: 'Grand Ballroom', description: 'An evening of performances and celebration.' },
  { id: '3', name: 'Wedding Ceremony', date: '2026-12-11', time: '10:00 AM', venue: 'Mandap, Lake View', description: 'The main wedding rituals.' },
  { id: '4', name: 'Reception', date: '2026-12-12', time: '08:00 PM', venue: 'Royal Banquet Hall', description: 'Dinner and reception for guests.' },
];

export const INITIAL_USERS: UserDetails[] = [
  { fullName: 'Admin User', state: 'Maharashtra', city: 'Mumbai', address: 'Admin HQ' },
  { fullName: 'Vendor User', state: 'Delhi', city: 'New Delhi', address: 'Vendor Studio' },
  { fullName: 'Priya Sharma', state: 'Maharashtra', city: 'Mumbai', address: 'Priya Residence' },
];

export const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Book Venue', completed: false },
  { id: '2', title: 'Finalize Guest List', completed: false },
  { id: '3', title: 'Hire Photographer', completed: false },
  { id: '4', title: 'Send Invitations', completed: false },
  { id: '5', title: 'Outfit Selection', completed: false },
  { id: '6', title: 'Decor Planning', completed: false },
  { id: '7', title: 'Catering Finalization', completed: false },
  { id: '8', title: 'Mehendi Planning', completed: false },
  { id: '9', title: 'Sangeet Arrangements', completed: false },
];

export const VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'The Wedding Salad',
    category: 'Photographer',
    rating: 4.9,
    location: 'Mumbai',
    price: '₹2,50,000',
    priceValue: 250000,
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=400',
    isPremium: true,
    description: 'Specializing in candid wedding photography and cinematic films.',
    portfolio: [
      { id: 'v1-p1', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400', title: 'The Royal Entry' }
    ],
    availability: ['2026-12-10', '2026-12-11', '2026-12-12'],
    specificServices: ['Candid', 'Cinematic', 'Traditional']
  },
  {
    id: 'v2',
    name: 'Abhinav Bhagat Events',
    category: 'Decorator',
    rating: 4.8,
    location: 'Delhi',
    price: '₹5,00,000',
    priceValue: 500000,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400',
    isPremium: true,
    description: 'Creating bespoke wedding experiences with a focus on luxury decor.',
    portfolio: [
      { id: 'v2-p1', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400', title: 'Floral Mandap' }
    ],
    availability: ['2026-12-11', '2026-12-12'],
    specificServices: ['Floral', 'Theme', 'Lighting']
  },
  {
    id: 'v3',
    name: 'Namrata Soni',
    category: 'Makeup Artist',
    rating: 4.7,
    location: 'Mumbai',
    price: '₹1,50,000',
    priceValue: 150000,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400',
    description: 'Renowned celebrity makeup artist known for her signature "no-makeup" look.',
    portfolio: [
      { id: 'v3-p1', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400', title: 'Bridal Glow' }
    ],
    availability: ['2026-12-10', '2026-12-12'],
    specificServices: ['Bridal', 'Airbrush', 'Hairstyling']
  },
  {
    id: 'v4',
    name: 'Shaadi Squad',
    category: 'Planner',
    rating: 5.0,
    location: 'Mumbai',
    price: '₹15,00,000',
    priceValue: 1500000,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400',
    isPremium: true,
    description: 'The planners behind some of Indias most high-profile weddings.',
    portfolio: [
      { id: 'v4-p1', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400', title: 'Destination Wedding' }
    ],
    availability: ['2026-12-10', '2026-12-11', '2026-12-12'],
    specificServices: ['Destination', 'Full Planning', 'Coordination']
  },
  {
    id: 'v5',
    name: 'Sabyasachi Mukherjee',
    category: 'Outfit',
    rating: 5.0,
    location: 'Kolkata',
    price: '₹8,00,000',
    priceValue: 800000,
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=400',
    isPremium: true,
    description: 'The ultimate destination for bridal lehengas and luxury wedding wear.',
    availability: ['2026-12-10', '2026-12-11'],
    specificServices: ['Lehenga', 'Saree', 'Custom Design']
  },
  {
    id: 'v6',
    name: 'Anita Dongre',
    category: 'Outfit',
    rating: 4.9,
    location: 'Mumbai',
    price: '₹4,00,000',
    priceValue: 400000,
    image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?auto=format&fit=crop&q=80&w=400',
    description: 'Elegant and sustainable bridal wear inspired by Rajasthani heritage.',
    availability: ['2026-12-11', '2026-12-12'],
    specificServices: ['Lehenga', 'Sustainable', 'Ethnic']
  }
];

export const INSPIRATION_BOARDS: InspirationBoard[] = [
  {
    id: 'ib1',
    name: 'Decor',
    count: 24,
    img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400',
    description: 'Explore the latest trends in wedding decor.',
    catalogue: [
      { id: 'c1', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400', title: 'Floral Extravaganza' }
    ]
  }
];

export const POWER_PAIRS: Package[] = [
  {
    id: 'p1',
    name: 'Cinematic Memories',
    members: ['Photography', 'Film'],
    price: '₹4,50,000',
    image: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=400'
  }
];

export const BLOGS: Blog[] = [
  {
    id: 'b1',
    title: 'Modern Minimalism in Indian Weddings',
    excerpt: 'How to achieve a luxury feel with clean lines.',
    content: 'Full content about minimalism...',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=400',
    category: 'Tips',
    date: '2024-03-15'
  },
  {
    id: 'b2',
    title: 'Budgeting for Your Big Day',
    excerpt: 'Smart ways to save without compromising on style.',
    content: 'Full content about budgeting...',
    image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=400',
    category: 'Budget',
    date: '2024-03-20'
  }
];

export const REAL_WEDDINGS: RealWedding[] = [
  {
    id: 'rw1',
    couple: 'Ananya & Rahul',
    location: 'Udaipur',
    story: 'A royal destination wedding at the City Palace.',
    mainImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400'
    ],
    vendors: [
      { name: 'The Wedding Salad', category: 'Photography' },
      { name: 'Shaadi Squad', category: 'Planning' }
    ]
  }
];

export const CATEGORIES = [
  {
    name: 'Outfit',
    items: ['Bridal Lehenga', 'Wedding Sarees', 'Engagement', 'Mehndi', 'Blouse Designs']
  },
  {
    name: 'Jewellery & Accessories',
    items: ['Necklaces', 'Earrings', 'Bangles', 'Maang Tikka']
  },
  {
    name: 'Mehndi',
    items: ['Arabic', 'Simple', 'Unique', 'Bridal Mehndi']
  },
  {
    name: 'Decor & Ideas',
    items: ['Wedding Decor', 'Bridal Entry', 'Groom Entry', 'Wedding Games']
  },
  {
    name: 'Wedding Card Designs',
    items: ['Traditional', 'Modern', 'Digital Invitations']
  },
  {
    name: 'Wedding Photography',
    items: ['Candid', 'Traditional', 'Cinematic']
  },
  {
    name: 'Groom Wear',
    items: ['Sherwani', 'Suits', 'Indo-Western']
  },
  {
    name: 'Bridal Makeup & Hair',
    items: ['Bridal Makeup', 'Hairstyles', 'Pre-wedding Grooming']
  }
];

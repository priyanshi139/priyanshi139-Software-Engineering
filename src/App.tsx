/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Calendar, 
  MapPin, 
  Bell, 
  Menu, 
  CheckCircle2, 
  Plus, 
  Image as ImageIcon, 
  Package as PackageIcon, 
  LayoutDashboard, 
  Sparkles, 
  Search, 
  Filter, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Crown,
  Share2,
  MessageSquare,
  ArrowRight,
  Sun,
  Flame,
  Star,
  Users,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle,
  Send,
  Lock,
  X,
  FileText,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  GripVertical,
  PieChart,
  Mail,
  Phone,
  Info,
  Target,
  Leaf,
  Trash2,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Ban,
  Unlock,
  Briefcase,
  TrendingUp,
  Map,
  Zap,
  Globe,
  Save,
  CreditCard,
  UserPlus,
  Check,
  Loader2,
  AlertCircle,
  Home,
  Tag,
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FunctionDeclaration, GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { AppState, UserType, UserDetails, WeddingDetails, Task, Vendor, InspirationBoard, Blog, RealWedding, Guest, RSVPStatus, RelationType, AdminVendor, AdminBooking, AdminFeedback, AdminReports, AdminProfile, AdminUserRecord, AdminEventRecord, AIConfig, AdminNotification } from './types';
import { INITIAL_TASKS, VENDORS, POWER_PAIRS, BLOGS, INSPIRATION_BOARDS, REAL_WEDDINGS, CATEGORIES } from './constants';
import BudgetOverview from './components/BudgetOverview';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser, handleFirestoreError, OperationType, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-ivory p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Something went wrong</h2>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">
            We encountered an unexpected error. Please try refreshing the app.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-rose text-ivory px-8 py-3 rounded-full font-bold shadow-lg"
          >
            Refresh App
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-slate-100 rounded-xl text-left text-xs overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

const SortableTask: React.FC<{ task: Task; toggleTask: (id: string) => void; deleteTask: (id: string) => void }> = ({ task, toggleTask, deleteTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300">
        <GripVertical size={20} />
      </div>
      <motion.div 
        onClick={() => toggleTask(task.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${task.completed ? 'bg-emerald-500 border-emerald-500 text-ivory' : 'border-slate-200'}`}
        whileTap={{ scale: 0.8 }}
      >
        <AnimatePresence>
          {task.completed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <CheckCircle2 size={14} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span 
        onClick={() => toggleTask(task.id)}
        className={`font-medium flex-1 cursor-pointer ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}
      >
        {task.title}
      </span>
      <button 
        onClick={() => deleteTask(task.id)}
        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

// --- Expert Chat Component ---

const ExpertChatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  messages: Array<{id: string, role: 'user' | 'expert', text: string}>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{id: string, role: 'user' | 'expert', text: string}>>>;
  input: string;
  setInput: (val: string) => void;
  isTyping: boolean;
  setIsTyping: (val: boolean) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  state: AppState;
}> = ({ isOpen, onClose, messages, setMessages, input, setInput, isTyping, setIsTyping, tasks, setTasks, state }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); 

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio context failed', e);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    const userMsgId = Math.random().toString(36).substring(2, 11);
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const getVendorsTool: FunctionDeclaration = {
        name: "get_vendors",
        description: "Search for wedding vendors in a specific category and optionally a location.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "The category of vendor (e.g., Photography, Catering, Venue)" },
            location: { type: Type.STRING, description: "Optional location to filter by" }
          },
          required: ["category"]
        }
      };

      const addTaskTool: FunctionDeclaration = {
        name: "add_task",
        description: "Add a new task to the user's wedding checklist.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the task to add" }
          },
          required: ["title"]
        }
      };

      const getBudgetSummaryTool: FunctionDeclaration = {
        name: "get_budget_summary",
        description: "Get a summary of the current wedding budget status.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      };

      const getTasksTool: FunctionDeclaration = {
        name: "get_tasks",
        description: "Get a list of all tasks in the user's wedding checklist.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are Aira, a professional AI Wedding Concierge for the Vivaha app. Your goal is to help couples plan their dream wedding. 
          You have access to the user's current wedding details:
          - City: ${state.weddingDetails?.city || 'Not set'}
          - Date: ${state.weddingDetails?.date || 'Not set'}
          - User Type: ${state.userType || 'Guest'}
          
          Be helpful, enthusiastic, and knowledgeable about Indian traditions, venues, budgets, and vendor categories. 
          Keep responses concise but informative. Use bullet points for lists. 
          You can search for vendors, add tasks to their checklist, get the current task list, and check their budget summary using the provided tools.`,
          tools: [{ functionDeclarations: [getVendorsTool, addTaskTool, getBudgetSummaryTool, getTasksTool] }]
        },
      });
      
      let finalResponseText = response.text;
      const functionCalls = response.functionCalls;

      if (functionCalls) {
        const toolResults = [];
        for (const call of functionCalls) {
          if (call.name === "get_vendors") {
            const { category, location } = call.args as any;
            const filteredVendors = VENDORS.filter(v => 
              v.category.toLowerCase().includes(category.toLowerCase()) && 
              (!location || v.location.toLowerCase().includes(location.toLowerCase()))
            ).slice(0, 3);
            toolResults.push({
              name: call.name,
              content: filteredVendors.length > 0 
                ? `Found these vendors: ${filteredVendors.map(v => v.name + " in " + v.location).join(", ")}`
                : "No vendors found in that category/location."
            });
          } else if (call.name === "add_task") {
            const { title } = call.args as any;
            const newTask: Task = { id: Math.random().toString(36).substring(2, 11), title, completed: false };
            setTasks(prev => [...prev, newTask]);
            toolResults.push({
              name: call.name,
              content: `Successfully added task: "${title}" to your checklist.`
            });
          } else if (call.name === "get_tasks") {
            toolResults.push({
              name: call.name,
              content: `Current tasks: ${tasks.map(t => t.title + (t.completed ? " (Done)" : " (Pending)")).join(", ")}`
            });
          } else if (call.name === "get_budget_summary") {
            toolResults.push({
              name: call.name,
              content: "The user has a premium wedding plan. Most categories are within budget. Total estimated spend is ₹25,00,000."
            });
          }
        }

        // Send tool results back to model for final response
        const secondResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            { role: 'user', parts: [{ text: userMsg }] },
            response.candidates[0].content,
            {
              role: 'user',
              parts: toolResults.map(res => ({
                functionResponse: {
                  name: res.name,
                  response: { content: res.content }
                }
              }))
            }
          ],
          config: {
            systemInstruction: "You are Aira, the AI Wedding Concierge. Provide a final helpful response based on the tool results. If you added a task or found vendors, mention it clearly.",
          }
        });
        finalResponseText = secondResponse.text;
      }

      const expertMsgId = Math.random().toString(36).substring(2, 11);
      setMessages(prev => [...prev, { id: expertMsgId, role: 'expert', text: finalResponseText || "I'm sorry, I couldn't process that. How else can I help?" }]);
      playNotificationSound();
    } catch (e) {
      console.error("AI Error:", e);
      const errorId = Math.random().toString(36).substring(2, 11);
      setMessages(prev => [...prev, { id: errorId, role: 'expert', text: "I'm having trouble connecting to my wedding database. Please try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-ivory w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 bg-rose text-ivory flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm md:text-base truncate">Chat with Aira - AI Concierge</h3>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Online now</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-ivory"
        >
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-rose text-ivory rounded-tr-none' 
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
              }`}>
                {msg.role === 'user' ? msg.text : <Markdown>{msg.text}</Markdown>}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex gap-1">
                <div className="w-1.5 h-1.5 bg-rose/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-rose/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-rose/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 pb-8 sm:pb-6 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose/30 transition-colors"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-2xl bg-rose text-ivory flex items-center justify-center shadow-lg shadow-rose/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Admin Components ---

const AdminLogin: React.FC<{ onLogin: (user: AdminProfile) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
   // Simple admin auth check
const ADMIN_EMAIL = 'admin@wedding.com';
const ADMIN_PASSWORD = 'admin123';

if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
  onLogin({
    name: 'Admin User',
    email: email,
    role: 'Super Admin',
    image: `https://ui-avatars.com/api/?name=Admin&background=1e293b&color=D4AF37`,
    contact: '+91 98765 43210'
  });
} else {
  setError('Invalid credentials. Use admin@wedding.com / admin123');
}
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-ivory p-8 flex flex-col justify-center">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <ShieldCheck className="text-gold" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Admin Portal</h2>
        <p className="text-slate-500">Authorized Access Only</p>
      </div>
      
      <div className="space-y-4 max-w-md mx-auto w-full">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@wedding.com" 
            className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold transition-all" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold transition-all" 
          />
        </div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100"
          >
            {error}
          </motion.p>
        )}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`w-full bg-slate-800 text-ivory py-4 rounded-2xl font-bold shadow-xl mt-4 active:scale-95 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin" />
              Verifying...
            </>
          ) : 'Login to Dashboard'}
        </button>

        <div className="mt-8 p-4 bg-gold/10 rounded-2xl border border-gold/20">
          <p className="text-[10px] font-bold text-gold uppercase tracking-widest mb-2 text-center">Demo Credentials</p>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-800">admin@wedding.com</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-slate-500">Pass:</span>
            <span className="font-mono text-slate-800">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ admin: AdminProfile; onLogout: () => void; appState: AppState }> = ({ admin, onLogout, appState }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'vendors' | 'events' | 'revenue' | 'ai' | 'settings'>('overview');
  const [adminProfile] = useState<AdminProfile>(admin);

  const mockReports = {
    totalUsers: 1250, totalEvents: 450, approvedVendors: 320, totalRevenue: 2500000,
    monthlyTrends: [
      { month: 'Jan', bookings: 45 }, { month: 'Feb', bookings: 52 },
      { month: 'Mar', bookings: 48 }, { month: 'Apr', bookings: 61 },
      { month: 'May', bookings: 55 }, { month: 'Jun', bookings: 67 },
    ]
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { id: 'users', label: 'Users', icon: <Users size={15} /> },
    { id: 'vendors', label: 'Vendors', icon: <Briefcase size={15} /> },
    { id: 'events', label: 'Events', icon: <Calendar size={15} /> },
    { id: 'revenue', label: 'Revenue', icon: <CreditCard size={15} /> },
    { id: 'ai', label: 'AI Control', icon: <Zap size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  return (
    <div className="absolute inset-0 flex z-[200] overflow-hidden" style={{ fontFamily: 'system-ui' }}>
      {/* SIDEBAR */}
      <div style={{ width: 200, minWidth: 200, background: '#1e293b', display: 'flex', flexDirection: 'column' }}>
        
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#D4AF37', letterSpacing: '0.12em' }}>✦ VIVAHA</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Admin Portal</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                fontSize: 12.5, border: 'none', cursor: 'pointer',
                background: activeTab === item.id ? '#D4AF37' : 'transparent',
                color: activeTab === item.id ? '#1e293b' : 'rgba(255,255,255,0.55)',
                fontWeight: activeTab === item.id ? 600 : 400,
                textAlign: 'left', width: '100%',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#1e293b', flexShrink: 0 }}>
              {adminProfile.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{adminProfile.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{adminProfile.role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer', marginTop: 4 }}
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
        
        {/* Topbar */}
        <div style={{ height: 52, minHeight: 52, background: 'white', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#1e293b', textTransform: 'capitalize' }}>{activeTab}</span>
          <button
            onClick={onLogout}
            style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Users', value: '1,250', color: '#E6F1FB', iconColor: '#185FA5' },
                  { label: 'Total Events', value: '450', color: '#EEEDFE', iconColor: '#534AB7' },
                  { label: 'Vendors', value: '320', color: '#FAEEDA', iconColor: '#854F0B' },
                  { label: 'Revenue', value: '₹25L', color: '#EAF3DE', iconColor: '#3B6D11' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrendingUp size={18} color={s.iconColor} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 14 }}>Monthly Bookings</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
                  {mockReports.monthlyTrends.map((m, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: i === 5 ? '#185FA5' : i === 3 ? '#378ADD' : '#B5D4F4', height: `${(m.bookings / 67) * 100}%` }} />
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 12 }}>Recent Activity</div>
                {[
                  { name: 'Priya Sharma', action: 'Booked venue', time: '10m ago', bg: '#E6F1FB' },
                  { name: 'Royal Palace', action: 'Updated pricing', time: '45m ago', bg: '#FAEEDA' },
                  { name: 'Amit Kumar', action: 'New registration', time: '2h ago', bg: '#EAF3DE' },
                  { name: 'System', action: 'Backup complete', time: '5h ago', bg: '#F1EFE8' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '0.5px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} color="#64748b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1e293b' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.action}</div>
                    </div>
                    <span style={{ fontSize: 10.5, color: '#cbd5e1' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>User Management</span>
                <button style={{ background: '#185FA5', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer' }}>+ Add User</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['User', 'Type', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: appState.userDetails?.fullName || 'Priya Sharma', email: 'priya@example.com', type: 'Bride', status: 'Active', statusColor: '#EAF3DE', textColor: '#3B6D11' },
                      { name: appState.fianceDetails?.fullName || 'Rohan Mehta', email: 'rohan@example.com', type: 'Groom', status: 'Active', statusColor: '#EAF3DE', textColor: '#3B6D11' },
                      { name: 'Elite Weddings', email: 'elite@example.com', type: 'Planner', status: 'Pending', statusColor: '#FAEEDA', textColor: '#854F0B' },
                    ].map((u, i) => (
                      <tr key={i} style={{ borderTop: '0.5px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#185FA5' }}>
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: '#1e293b' }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{u.type}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: u.statusColor, color: u.textColor, padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 500 }}>{u.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '0.5px solid #e2e8f0', background: 'none', cursor: 'pointer', color: '#64748b' }}>View</button>
                            <button style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '0.5px solid #e2e8f0', background: 'none', cursor: 'pointer', color: '#A32D2D' }}>Block</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDORS */}
          {activeTab === 'vendors' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { name: 'Royal Palace Udaipur', category: 'Venue', rating: 4.9, status: 'Approved', sc: '#EAF3DE', tc: '#3B6D11' },
                { name: 'Dream Clicks Studio', category: 'Photography', rating: 4.7, status: 'Pending', sc: '#FAEEDA', tc: '#854F0B' },
              ].map((v, i) => (
                <div key={i} style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{v.category}</div>
                    </div>
                    <span style={{ background: v.sc, color: v.tc, padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 500 }}>{v.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 12 }}>★ {v.rating}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {v.status === 'Pending' ? (
                      <>
                        <button style={{ flex: 1, padding: 6, fontSize: 11.5, borderRadius: 6, border: 'none', background: '#EAF3DE', color: '#3B6D11', cursor: 'pointer' }}>Approve</button>
                        <button style={{ flex: 1, padding: 6, fontSize: 11.5, borderRadius: 6, border: 'none', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>Reject</button>
                      </>
                    ) : (
                      <>
                        <button style={{ flex: 1, padding: 6, fontSize: 11.5, borderRadius: 6, border: '0.5px solid #e2e8f0', background: 'none', color: '#64748b', cursor: 'pointer' }}>Edit</button>
                        <button style={{ flex: 1, padding: 6, fontSize: 11.5, borderRadius: 6, border: '0.5px solid #e2e8f0', background: 'none', color: '#A32D2D', cursor: 'pointer' }}>Remove</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REVENUE */}
          {activeTab === 'revenue' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Earnings', value: '₹25,00,000', bg: '#EAF3DE', color: '#27500A' },
                  { label: 'Platform Cut (10%)', value: '₹2,50,000', bg: 'white', color: '#1e293b' },
                  { label: 'Pending Payouts', value: '₹1,20,000', bg: 'white', color: '#A32D2D' },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e2e8f0', fontSize: 13, fontWeight: 500, color: '#1e293b' }}>Payment History</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead><tr style={{ background: '#f8fafc' }}>
                    {['ID', 'Customer', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {[
                      { id: '#001', name: 'Priya Sharma', amount: '₹5,00,000', status: 'Paid', sc: '#EAF3DE', tc: '#3B6D11' },
                      { id: '#002', name: 'Rohan Mehta', amount: '₹1,50,000', status: 'Pending', sc: '#FAEEDA', tc: '#854F0B' },
                    ].map((b, i) => (
                      <tr key={i} style={{ borderTop: '0.5px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>{b.id}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>{b.name}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>{b.amount}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ background: b.sc, color: b.tc, padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 500 }}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* AI CONTROL */}
          {activeTab === 'ai' && (
            <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 16 }}>Aira AI Control Panel</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>System Instruction</label>
                <textarea
                  defaultValue="You are Aira, a professional AI Wedding Concierge for the Vivaha app."
                  style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#1e293b', background: '#f8fafc', resize: 'none', height: 90 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1e293b' }}>Smart Recommendations</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>AI suggests vendors and tasks</div>
                </div>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: '#185FA5', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', right: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'white' }} />
                </div>
              </div>
              <button style={{ background: '#1e293b', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 500 }}>Save Configuration</button>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 16 }}>App Configuration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>App Name</label>
                  <input type="text" defaultValue="VIVAHA" style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#f8fafc', color: '#1e293b' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1e293b' }}>Maintenance Mode</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Disable app for all users</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: '#e2e8f0', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'white' }} />
                  </div>
                </div>
                <button style={{ background: '#1e293b', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 500, width: 'fit-content' }}>Save Settings</button>
              </div>
            </div>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Events tab — add your events content here
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
const VendorDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'inquiries' | 'reviews' | 'gallery' | 'profile'>('dashboard');
  
  const stats = [
    { label: 'New Inquiries', value: '8', icon: <MessageSquare className="text-rose" /> },
    { label: 'Bookings', value: '24', icon: <Calendar className="text-gold" /> },
    { label: 'Earnings', value: '₹12.5L', icon: <Crown className="text-emerald-500" /> },
    { label: 'Rating', value: '4.9', icon: <Star className="text-gold fill-current" /> },
  ];

  const inquiries = [
    { id: '1', name: 'Priya & Rahul', email: 'priya@example.com', date: 'Dec 12, 2026', status: 'New', message: 'We are interested in booking your venue for our December wedding. Is it available on the 12th?' },
    { id: '2', name: 'Amit & Sneha', email: 'amit@example.com', date: 'Jan 05, 2027', status: 'Pending', message: 'Could you provide a detailed quote for 300 guests?' },
    { id: '3', name: 'Vikram & Anjali', email: 'vikram@example.com', date: 'Feb 14, 2027', status: 'Read', message: 'Do you have any special packages for Valentines Day weddings?' },
    { id: '4', name: 'Siddharth & Riya', email: 'sid@example.com', date: 'Mar 20, 2027', status: 'Replied', message: 'We would like to schedule a site visit next weekend.' },
  ];

  const reviews = [
    { id: '1', name: 'Rohan & Megha', rating: 5, date: 'Nov 20, 2025', comment: 'Absolutely stunning venue! The staff was incredibly helpful and made our day perfect.' },
    { id: '2', name: 'Karan & Ishita', rating: 4, date: 'Oct 15, 2025', comment: 'Great experience overall. The decor was beautiful, though the catering could have been a bit faster.' },
    { id: '3', name: 'Arjun & Divya', rating: 5, date: 'Sep 30, 2025', comment: 'The best decision we made for our wedding. Highly recommend!' },
  ];

  return (
    <div className="absolute inset-0 bg-ivory flex flex-col overflow-hidden z-[200]">
      <div className="bg-rose p-6 flex items-center justify-between text-ivory">
        <div className="flex items-center gap-3">
          <PackageIcon className="text-gold" />
          <h2 className="text-xl font-bold">Vendor Portal</h2>
        </div>
        <button onClick={onLogout} className="text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg">Logout</button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-ivory flex items-center justify-center mb-2">{stat.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6 no-scrollbar">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['dashboard', 'bookings', 'inquiries', 'reviews', 'gallery', 'profile'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-rose text-ivory' : 'bg-white text-slate-500 border border-slate-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Recent Inquiries</h3>
              <button onClick={() => setActiveTab('inquiries')} className="text-xs font-bold text-rose">View All</button>
            </div>
            {inquiries.slice(0, 2).map((inquiry) => (
              <div key={inquiry.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{inquiry.name}</p>
                  <p className="text-xs text-slate-500">{inquiry.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${inquiry.status === 'New' ? 'bg-rose/10 text-rose' : 'bg-amber-50 text-amber-600'}`}>
                  {inquiry.status}
                </span>
              </div>
            ))}

            <div className="bg-gold/10 p-6 rounded-3xl border border-gold/20 mt-6">
              <h4 className="font-bold text-rose mb-2">Upgrade to Premium</h4>
              <p className="text-xs text-slate-600 mb-4">Get 3x more visibility and priority matching with high-budget couples.</p>
              <button className="w-full bg-rose text-ivory py-3 rounded-xl text-xs font-bold shadow-lg shadow-rose/20">Upgrade Now</button>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4 pb-24">
            <h3 className="font-bold text-slate-800">All Inquiries</h3>
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{inquiry.name}</h4>
                    <p className="text-xs text-slate-400">{inquiry.email} • {inquiry.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${
                    inquiry.status === 'New' ? 'bg-rose/10 text-rose' : 
                    inquiry.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                    inquiry.status === 'Replied' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {inquiry.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl italic">
                  "{inquiry.message}"
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl bg-rose text-ivory text-[10px] font-bold uppercase tracking-widest">Reply</button>
                  <button className="px-4 py-2 rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4 pb-24">
            <h3 className="font-bold text-slate-800">Confirmed Bookings</h3>
            {[
              { name: 'Mehta Wedding', date: 'Dec 12, 2026', amount: '₹2.5L', status: 'Confirmed' },
              { name: 'Kapoor Wedding', date: 'Jan 15, 2027', amount: '₹1.8L', status: 'Confirmed' },
            ].map((booking, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{booking.name}</p>
                  <p className="text-xs text-slate-500">{booking.date} • {booking.amount}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-bold uppercase">{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4 pb-24">
            <h3 className="font-bold text-slate-800">Customer Reviews</h3>
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{review.name}</h4>
                    <p className="text-xs text-slate-400">{review.date}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-current' : 'text-slate-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{review.comment}"
                </p>
                <button className="text-[10px] font-bold text-rose uppercase tracking-widest">Reply to Review</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Portfolio Gallery</h3>
              <button className="bg-rose text-ivory px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Plus size={14} /> Upload New
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 1, title: 'Grand Ballroom Setup', img: 'https://picsum.photos/seed/venue1/800/600' },
                { id: 2, title: 'Outdoor Mandap', img: 'https://picsum.photos/seed/venue2/800/600' },
                { id: 3, title: 'Catering Display', img: 'https://picsum.photos/seed/food1/800/600' },
                { id: 4, title: 'Night Lighting', img: 'https://picsum.photos/seed/night/800/600' },
              ].map((item) => (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm group relative">
                  <img src={item.img} className="w-full aspect-square object-cover" alt={item.title} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="w-8 h-8 bg-white text-slate-600 rounded-full flex items-center justify-center hover:bg-rose hover:text-white transition-colors">
                      <Info size={14} />
                    </button>
                    <button className="w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-slate-800 truncate">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 pb-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-rose/10 flex items-center justify-center text-rose mb-4 relative">
                <ImageIcon size={40} />
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-gold text-rose rounded-full flex items-center justify-center shadow-lg">
                  <Plus size={16} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Royal Palace Weddings</h3>
              <p className="text-xs text-slate-500">Premium Venue • Udaipur</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Business Name</label>
                  <input type="text" defaultValue="Royal Palace Weddings" className="w-full p-4 bg-white rounded-xl border border-slate-100 outline-none focus:border-gold text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea defaultValue="A premier wedding venue in the heart of Udaipur..." className="w-full p-4 bg-white rounded-xl border border-slate-100 outline-none focus:border-gold h-32 text-sm resize-none" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Contact Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                    <input type="email" defaultValue="contact@royalpalace.com" className="w-full p-4 bg-white rounded-xl border border-slate-100 outline-none focus:border-gold text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Phone</label>
                    <input type="tel" defaultValue="+91 98765 43210" className="w-full p-4 bg-white rounded-xl border border-slate-100 outline-none focus:border-gold text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Services & Portfolio</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Services Offered</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Outdoor Mandap', 'Grand Ballroom', 'Catering', 'Decor'].map(s => (
                      <span key={s} className="px-3 py-1 bg-gold/10 text-rose text-[10px] font-bold rounded-full border border-gold/20 flex items-center gap-2">
                        {s} <Plus className="rotate-45" size={10} />
                      </span>
                    ))}
                    <button className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-full border border-dashed border-slate-200">+ Add Service</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Portfolio Images</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 relative group">
                        <ImageIcon size={24} />
                        <button className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="rotate-45" size={10} />
                        </button>
                      </div>
                    ))}
                    <button className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Plus size={20} />
                      <span className="text-[8px] font-bold uppercase">Upload</span>
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full bg-rose text-ivory py-4 rounded-2xl font-bold shadow-lg shadow-rose/20 active:scale-95 transition-transform">Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AiConciergeDashboard: React.FC<{ onLogout: () => void, onLaunchAi: () => void }> = ({ onLogout, onLaunchAi }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'ai_tools' | 'tasks'>('clients');
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [plannerData, setPlannerData] = useState({
    eventType: 'Wedding',
    budget: '₹10,00,000',
    location: 'Udaipur',
    guests: '200'
  });

  const generatePlan = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an AI event planner. Generate a detailed plan for a ${plannerData.eventType} in ${plannerData.location} with a budget of ${plannerData.budget} for ${plannerData.guests} guests. Include budget breakdown, decoration ideas, catering menu, and a detailed timeline. Format the output in clean Markdown.`,
      });
      setAiPlan(response.text || "Failed to generate plan.");
    } catch (err) {
      console.error(err);
      setAiError("Failed to connect to AI service. Please check your API key.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-ivory flex flex-col overflow-hidden z-[200]">
      <div className="bg-slate-800 p-6 flex items-center justify-between text-ivory">
        <div className="flex items-center gap-3">
          <Sparkles className="text-gold" />
          <h2 className="text-xl font-bold">AI Concierge Studio</h2>
        </div>
        <button onClick={onLogout} className="text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg">Logout</button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6 no-scrollbar">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['clients', 'ai_tools', 'tasks'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-full text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-slate-800 text-ivory' : 'bg-white text-slate-500 border border-slate-100'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {activeTab === 'clients' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Active Clients</h3>
            {[
              { name: 'The Mehta Wedding', progress: 65, date: 'Dec 2026' },
              { name: 'Kapoor & Singh', progress: 30, date: 'Feb 2027' },
            ].map((client, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{client.name}</h4>
                    <p className="text-xs text-slate-500">{client.date} • Udaipur</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-gold/20 border-t-gold flex items-center justify-center text-[10px] font-bold text-gold">
                    {client.progress}%
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gold h-full" style={{ width: `${client.progress}%` }} />
                </div>
                <button className="w-full mt-4 py-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-600">Open Project</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ai_tools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-ivory relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 text-gold/20 group-hover:scale-110 transition-transform" size={80} />
              <h3 className="text-2xl font-bold mb-2">Aira AI Pro</h3>
              <p className="text-ivory/60 text-sm mb-6 leading-relaxed">Generate complex itineraries, vendor comparisons, and budget reports in seconds.</p>
              <button 
                onClick={() => setShowAiPlanner(true)}
                className="bg-gold text-slate-900 px-6 py-3 rounded-xl font-bold text-xs hover:scale-105 transition-transform"
              >
                Launch AI Planner
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowAiPlanner(true)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 text-left hover:border-gold/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <FileText size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Budget Gen</h4>
                <p className="text-[10px] text-slate-500">Auto-calculate costs</p>
              </button>
              <button 
                onClick={() => onLaunchAi()}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 text-left hover:border-gold/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <LayoutDashboard size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Moodboard</h4>
                <p className="text-[10px] text-slate-500">AI image generation</p>
              </button>
              <button 
                onClick={() => onLaunchAi()}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 text-left hover:border-gold/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Users size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Guest List</h4>
                <p className="text-[10px] text-slate-500">Smart categorization</p>
              </button>
              <button 
                onClick={() => setShowAiPlanner(true)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 text-left hover:border-gold/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose/5 flex items-center justify-center text-rose mb-4 group-hover:bg-rose group-hover:text-white transition-all">
                  <Calendar size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Itinerary</h4>
                <p className="text-[10px] text-slate-500">Minute-by-minute plan</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">My Tasks</h3>
              <button className="text-xs font-bold text-gold">Add Task</button>
            </div>
            {[
              { title: 'Follow up with Mehta Wedding', priority: 'High', due: 'Today' },
              { title: 'Send quote to Kapoor & Singh', priority: 'Medium', due: 'Tomorrow' },
              { title: 'Update portfolio gallery', priority: 'Low', due: 'Next Week' },
            ].map((task, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Due {task.due}</p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Planner Modal */}
      <AnimatePresence>
        {showAiPlanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-ivory w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-gold" />
                  <h3 className="text-xl font-bold text-slate-800">AI Event Planner</h3>
                </div>
                <button onClick={() => setShowAiPlanner(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose/10 hover:text-rose transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {!aiPlan ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Type</label>
                        <select 
                          value={plannerData.eventType}
                          onChange={e => setPlannerData({...plannerData, eventType: e.target.value})}
                          className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold text-sm"
                        >
                          <option>Wedding</option>
                          <option>Birthday</option>
                          <option>Corporate Gala</option>
                          <option>Engagement</option>
                          <option>Anniversary</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget</label>
                        <input 
                          type="text" 
                          value={plannerData.budget}
                          onChange={e => setPlannerData({...plannerData, budget: e.target.value})}
                          className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold text-sm"
                          placeholder="e.g. ₹10,00,000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                        <input 
                          type="text" 
                          value={plannerData.location}
                          onChange={e => setPlannerData({...plannerData, location: e.target.value})}
                          className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold text-sm"
                          placeholder="e.g. Udaipur"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest Count</label>
                        <input 
                          type="number" 
                          value={plannerData.guests}
                          onChange={e => setPlannerData({...plannerData, guests: e.target.value})}
                          className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold text-sm"
                          placeholder="e.g. 200"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={generatePlan}
                      disabled={aiLoading}
                      className="w-full bg-slate-800 text-ivory py-4 rounded-2xl font-bold shadow-lg shadow-slate-800/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Aira is thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} className="text-gold" />
                          Generate Smart Plan
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="prose prose-slate max-w-none">
                      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                          <Markdown>
                            {aiPlan}
                          </Markdown>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setAiPlan(null)}
                        className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm"
                      >
                        New Plan
                      </button>
                      <button 
                        onClick={() => setShowAiPlanner(false)}
                        className="flex-1 py-4 rounded-2xl bg-gold text-rose font-bold text-sm shadow-lg shadow-gold/20"
                      >
                        Save & Close
                      </button>
                    </div>
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={16} />
                    {aiError}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function App() {
  const [state, setState] = useState<AppState>({
    screen: 'splash',
    userType: null,
    userDetails: null,
    fianceDetails: null,
    weddingDetails: null,
    isPremium: false,
    guests: [],
  });

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [showSplash, setShowSplash] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [userId, setUserId] = useState<string | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isExpertChatOpen, setIsExpertChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'expert', text: string}>>([
    { id: 'initial', role: 'expert', text: "Hi! 👋 I'm Aira, your Vivaha AI Concierge. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<InspirationBoard | null>(null);

  // Firebase Auth and Profile Sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("Auth taking too long, proceeding with mock state");
        setIsAuthReady(true);
        setIsLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setUserId(user.uid);
      }
      setIsAuthReady(true);
      setIsLoading(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Persistence Logic (Restored to local storage)
  useEffect(() => {
    const savedState = localStorage.getItem('vivaha_app_state');
    const savedTasks = localStorage.getItem('vivaha_app_tasks');
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          ...parsed,
          screen: parsed.screen || prev.screen,
          userType: parsed.userType || prev.userType
        }));
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
      }
    }

    let id = localStorage.getItem('vivaha_user_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('vivaha_user_id', id);
    }
    setUserId(id);
  }, []);

  useEffect(() => {
    if (state.screen !== 'splash') {
      localStorage.setItem('vivaha_app_state', JSON.stringify({
        userType: state.userType,
        userDetails: state.userDetails,
        fianceDetails: state.fianceDetails,
        weddingDetails: state.weddingDetails,
        isPremium: state.isPremium,
        screen: state.screen
      }));
      localStorage.setItem('vivaha_app_tasks', JSON.stringify(tasks));
    }
  }, [state, tasks]);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [state.screen]);

  // --- Components ---

  const MegaMenu = () => (
    <AnimatePresence>
      {megaMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[72px] left-0 right-0 bg-white z-[100] shadow-2xl rounded-b-[2rem] overflow-hidden border-t border-slate-100"
        >
          <div className="p-8 grid grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="space-y-4">
                <h3 className="text-rose font-bold text-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {cat.name}
                </h3>
                <div className="flex flex-col gap-2">
                  {cat.items.map((item) => (
                    <button 
                      key={item}
                      onClick={() => {
                        setState(prev => ({ ...prev, screen: 'category_page', selectedCategory: item }));
                        setMegaMenuOpen(false);
                      }}
                      className="text-slate-600 hover:text-gold text-sm text-left transition-colors flex items-center justify-between group"
                    >
                      {item}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-rose/5 p-6 flex justify-between items-center border-t border-rose/10">
            <p className="text-xs text-rose font-medium italic">Find the best wedding vendors across India</p>
            <button 
              onClick={() => setMegaMenuOpen(false)}
              className="text-rose font-bold text-sm flex items-center gap-1"
            >
              Close Menu <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-slate-200 animate-pulse rounded-2xl ${className}`} />
  );

  const SplashScreen = () => {
    const [splashStep, setSplashStep] = useState(0);

    useEffect(() => {
      const getTimeout = (step: number) => {
        if (step === 0) return 2000; // Logo for 2 sec
        if (step >= 1 && step <= 3) return 2500; // Slower initial screens
        return 1500; // Remaining screens same speed
      };

      const timer = setTimeout(() => {
        if (splashStep < 7) {
          setSplashStep(s => s + 1);
        } else {
          setShowSplash(false);
          if (state.screen === 'splash') {
            navigate('onboarding_info');
          }
        }
      }, getTimeout(splashStep));
      return () => clearTimeout(timer);
    }, [splashStep]);

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-rose flex flex-col items-center justify-center text-center p-6 z-50 overflow-hidden"
      >
        {/* Skip Button */}
        <button 
          onClick={() => {
            setShowSplash(false);
            if (state.screen === 'splash') {
              navigate('onboarding_info');
            }
          }}
          className="absolute top-12 right-6 text-gold/60 text-xs font-bold uppercase tracking-widest z-50 flex items-center gap-1"
        >
          Skip <ChevronRight size={14} />
        </button>

        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full border-[1px] border-gold animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full border-[1px] border-gold animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <AnimatePresence mode="wait">
          {splashStep === 0 && (
            <motion.div 
              key="app-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={48} className="text-gold mandala-glow" />
                <h1 className="brand-logo-large text-6xl gold-shimmer tracking-tight">VIVAHA</h1>
              </div>
              <div className="w-32 h-[1px] bg-gold/30 mx-auto" />
              <p className="text-champagne/80 tracking-[0.3em] uppercase text-xs font-bold">
                Your AI Wedding Concierge
              </p>
            </motion.div>
          )}

          {splashStep === 1 && (
            <motion.div 
              key="ganesha"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center space-y-6"
            >
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-5xl md:text-6xl font-serif text-gold tracking-tight w-full text-center break-words"
              >
                श्री गणेशाय नमः
              </motion.h2>
              <div className="w-24 h-[1px] bg-gold/30 mx-auto" />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-champagne/60 tracking-[0.3em] uppercase text-[10px] font-bold"
              >
                Om Gan Ganapataye Namah
              </motion.p>
            </motion.div>
          )}

          {splashStep === 2 && (
            <motion.div 
              key="shloka1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center space-y-10 max-w-sm"
            >
              <div className="w-24 h-[1px] bg-gold/30" />
              <div className="space-y-8">
                <h3 className="text-4xl font-serif italic text-gold leading-tight">ॐ सर्वे भवन्तु सुखिनः</h3>
                <div className="space-y-4">
                  <p className="text-ivory/90 italic leading-relaxed text-xl font-serif">
                    "May all be happy,<br/>May all be free from illness."
                  </p>
                  <p className="text-champagne/50 text-sm uppercase tracking-widest">Universal Peace Prayer</p>
                </div>
              </div>
              <div className="w-24 h-[1px] bg-gold/30" />
            </motion.div>
          )}

          {splashStep === 3 && (
            <motion.div 
              key="shloka2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center space-y-10 max-w-sm"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Flame size={300} className="text-gold" />
              </motion.div>
              <div className="z-10 space-y-8 w-full">
                <h3 className="text-3xl md:text-4xl font-serif italic text-gold w-full text-center break-words">ॐ भूर्भुवः स्वः</h3>
                <p className="text-ivory/90 italic leading-relaxed text-lg md:text-xl font-serif px-4 w-full text-center break-words">
                  "May the Divine Light enlighten our minds and guide our path."
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold/30" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {splashStep === 4 && (
            <motion.div 
              key="about1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center space-y-6 max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-gold" />
              </div>
              <h3 className="text-3xl font-bold text-ivory leading-tight">India's Premier AI Concierge</h3>
              <p className="text-champagne/80 text-lg font-serif italic">
                "Blending tradition with technology for your perfect day."
              </p>
            </motion.div>
          )}

          {splashStep === 5 && (
            <motion.div 
              key="about2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center space-y-6 max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <Users size={32} className="text-gold" />
              </div>
              <h3 className="text-3xl font-bold text-ivory leading-tight">Curated Vendors & Traditions</h3>
              <p className="text-champagne/80 text-lg font-serif italic">
                "Hand-picked experts to bring your vision to life."
              </p>
            </motion.div>
          )}

          {splashStep === 6 && (
            <motion.div 
              key="about3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center space-y-6 max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <Heart size={32} className="text-gold" />
              </div>
              <h3 className="text-3xl font-bold text-ivory leading-tight">Your Dream Wedding, Simplified</h3>
              <p className="text-champagne/80 text-lg font-serif italic">
                "From first thought to final celebration, we're with you."
              </p>
            </motion.div>
          )}

          {splashStep === 7 && (
            <motion.div 
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center max-w-lg"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 text-center"
              >
                <motion.h2 
                  className="text-4xl font-serif text-gold mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  श्री गणेशाय नमः
                </motion.h2>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-ivory mb-4 leading-tight w-full text-center break-words">
                  Start Your Wedding Journey with Blessings
                </h1>
                <p className="text-champagne/80 text-base md:text-lg font-serif italic mb-8 w-full text-center break-words">
                  Plan, manage and celebrate your big day — all in one place.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 w-full px-6"
              >
                <button 
                  onClick={() => {
                    setShowSplash(false);
                    if (state.screen === 'splash') {
                      navigate('onboarding_info');
                    }
                  }}
                  className="flex-1 bg-gold text-rose font-bold py-4 px-8 rounded-full shadow-2xl transition-all hover:shadow-gold/20 hover:-translate-y-1 active:translate-y-0"
                >
                  Get Started
                </button>
                <button 
                  onClick={() => {
                    setShowSplash(false);
                    navigate('dashboard');
                    setActiveTab('home');
                  }}
                  className="flex-1 bg-white/10 backdrop-blur-md text-ivory border border-white/20 font-bold py-4 px-8 rounded-full transition-all hover:bg-white/20 hover:-translate-y-1 active:translate-y-0"
                >
                  Explore Vendors
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const OnboardingInfo = () => {
    const [step, setStep] = useState(0);
    const screens = [
      {
        title: "Welcome to Vivaha",
        desc: "Your journey to a perfect wedding begins here. Experience the future of wedding planning.",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200"
      },
      {
        title: "Heritage & Innovation",
        desc: "We blend centuries-old Indian traditions with cutting-edge AI to create a planning experience like no other.",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"
      },
      {
        title: "Our Story",
        desc: "Founded in the heart of Udaipur, Vivah was created to bring transparency and joy back to wedding planning.",
        image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200"
      },
      {
        title: "The Vivah Promise",
        desc: "Uncompromising quality and hand-picked vendors. We only partner with the best in the industry.",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200"
      },
      {
        title: "AI-Driven Excellence",
        desc: "Our intelligent algorithms help you find the perfect match for your style, budget, and location.",
        image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200"
      },
      {
        title: "Sustainability",
        desc: "We champion eco-conscious weddings and support local artisans to preserve our planet and culture.",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200"
      },
      {
        title: "Nationwide Network",
        desc: "Access a curated network of 5000+ premium vendors across 50+ cities in India.",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"
      }
    ];

    return (
      <motion.div className="absolute inset-0 bg-ivory flex flex-col">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex z-20">
          {screens.map((_, i) => (
            <div 
              key={`progress-${i}`} 
              className={`flex-1 h-full transition-all duration-500 ${i <= step ? 'bg-rose' : 'bg-rose/10'}`} 
            />
          ))}
        </div>

        <div className="relative h-[60vh] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img 
              key={step}
              src={screens[step].image}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-ivory via-transparent to-transparent" />
        </div>
        
        <div className="flex-1 p-8 flex flex-col justify-between relative">
          <button 
            onClick={() => navigate('user_type')}
            className="absolute top-4 right-8 text-rose/60 font-bold text-sm"
          >
            Skip
          </button>
          
          <div className="text-center mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-3xl font-bold text-rose mb-4 leading-tight">
                  {screens[step].title}
                </h2>
                <p className="text-slate-600">
                  {screens[step].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-2">
              {screens.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-gold' : 'w-2 bg-gold/30'}`} />
              ))}
            </div>
            
            <div className="w-full flex gap-4">
              {step > 0 && (
                <button 
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 bg-ivory border-2 border-rose/20 text-rose py-4 rounded-2xl font-semibold active:scale-[0.98] transition-transform"
                >
                  Back
                </button>
              )}
              {step < screens.length - 1 ? (
                <button 
                  onClick={() => setStep(s => s + 1)}
                  className={`${step === 0 ? 'w-full' : 'flex-[2]'} bg-rose text-ivory py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose/20 active:scale-[0.98] transition-transform`}
                >
                  Continue <ChevronRight size={20} />
                </button>
              ) : (
                <div className={`${step === 0 ? 'w-full' : 'flex-[2]'} space-y-4 text-center`}>
                  <button 
                    onClick={() => navigate('user_type')}
                    className="w-full bg-emerald-500 text-ivory py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => navigate('role_selection')}
                    className="text-rose font-bold text-sm hover:underline"
                  >
                    Already have an account? Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const RoleSelectionScreen = () => (
    <div className="absolute inset-0 bg-ivory p-8 flex flex-col justify-center">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-rose rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Lock className="text-gold" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-rose">Login As</h2>
        <p className="text-slate-500">Select your role to continue</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'bride', label: 'Bride / Groom', icon: <Heart className="text-rose" />, desc: 'Plan your dream wedding' },
          { id: 'vendor', label: 'Vendor', icon: <PackageIcon className="text-gold" />, desc: 'Manage your services' },
          { id: 'planner', label: 'AI Concierge', icon: <Sparkles className="text-gold" />, desc: 'AI-assisted coordination' },
          { id: 'admin', label: 'Admin', icon: <ShieldCheck className="text-slate-800" />, desc: 'System management' },
        ].map((role) => (
          <button
            key={role.id}
            onClick={() => {
              if (role.id === 'bride') {
                setState(prev => ({ ...prev, userType: 'bride' }));
                navigate('onboarding_form');
              } else if (role.id === 'admin') {
                setState(prev => ({ ...prev, userType: 'admin' }));
                navigate('admin_login');
              } else if (role.id === 'vendor') {
                setState(prev => ({ ...prev, userType: 'vendor' }));
                navigate('vendor_dashboard');
              } else if (role.id === 'planner') {
                setState(prev => ({ ...prev, userType: 'planner' }));
                navigate('planner_dashboard');
              }
            }}
            className="premium-card p-5 flex items-center gap-4 hover:border-gold transition-all text-left group active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-ivory flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              {role.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-800">{role.label}</h4>
              <p className="text-xs text-slate-500">{role.desc}</p>
            </div>
            <ChevronRight className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <button 
        onClick={() => navigate('splash')}
        className="mt-8 text-rose font-bold text-sm text-center"
      >
        Back to Home
      </button>
    </div>
  );

  const UserTypeSelection = () => (
    <div className="absolute inset-0 bg-ivory p-8 flex flex-col justify-center">
      <h2 className="text-4xl font-bold text-rose mb-2 text-center">Who are you?</h2>
      <p className="text-slate-500 text-center mb-12">Tailoring your experience...</p>
      
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'bride', label: 'Bride', icon: <Heart className="text-rose" /> },
          { id: 'groom', label: 'Groom', icon: <User className="text-rose" /> },
          { id: 'vendor', label: 'Vendor', icon: <PackageIcon className="text-gold" /> },
          { id: 'planner', label: 'AI Concierge', icon: <Sparkles className="text-gold" /> },
          { id: 'admin', label: 'Admin Portal', icon: <ShieldCheck className="text-slate-800" /> },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => {
              if (type.id === 'bride' || type.id === 'groom') {
                setState(prev => ({ ...prev, userType: type.id as UserType }));
                navigate('onboarding_form');
              } else if (type.id === 'admin') {
                setState(prev => ({ ...prev, userType: 'admin' }));
                navigate('admin_login');
              } else if (type.id === 'vendor') {
                setState(prev => ({ ...prev, userType: 'vendor' }));
                navigate('vendor_dashboard');
              } else if (type.id === 'planner') {
                setState(prev => ({ ...prev, userType: 'planner' }));
                navigate('planner_dashboard');
              }
            }}
            className="premium-card p-6 flex items-center gap-4 hover:border-gold transition-colors text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-ivory flex items-center justify-center group-hover:scale-110 transition-transform">
              {type.icon}
            </div>
            <span className="text-xl font-medium text-slate-800">{type.label}</span>
            <ChevronRight className="ml-auto text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );

  const AuthScreen = () => {
    const [method, setMethod] = useState<'phone' | 'google' | null>(null);
    const [otp, setOtp] = useState(['', '', '', '']);
    const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const handleOtpChange = (index: number, value: string) => {
      if (value.length > 1) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) otpRefs[index + 1].current?.focus();
    };

    return (
      <div className="absolute inset-0 bg-ivory p-8 flex flex-col justify-center overflow-y-auto no-scrollbar">
        {!method ? (
          <div className="space-y-6">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-rose rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Heart className="text-gold fill-current" size={40} />
              </div>
              <h2 className="text-3xl font-bold text-rose">Welcome Back</h2>
              <p className="text-slate-500">Securely access your wedding plans</p>
            </div>
            
            <button 
              onClick={() => setMethod('phone')}
              className="w-full bg-white border border-slate-200 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 shadow-sm"
            >
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">📱</div>
              Continue with Mobile
            </button>
            <button 
              onClick={() => navigate('onboarding_form')}
              className="w-full bg-white border border-slate-200 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setMethod(null)} className="mb-8 text-rose flex items-center gap-1">
              <ChevronLeft size={20} /> Back
            </button>
            <h2 className="text-3xl font-bold text-rose mb-2">Verify Mobile</h2>
            <p className="text-slate-500 mb-8">Enter the 4-digit code sent to your number</p>
            
            <div className="flex justify-center gap-3 mb-12">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-14 h-16 text-center text-2xl font-bold bg-white border-2 border-slate-100 rounded-xl focus:border-gold outline-none transition-colors"
                />
              ))}
            </div>
            
            <button 
              onClick={() => navigate('onboarding_form')}
              className="w-full bg-rose text-ivory py-4 rounded-2xl font-bold shadow-lg shadow-rose/20"
            >
              Verify & Continue
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  const OnboardingForm = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      name: '', contact: '', state: '', city: '', address: '',
      fName: '', fState: '', fCity: '',
      eventType: 'wedding', wDate: '', budget: '', guests: '',
      wState: '', wCity: '', venue: 'no', vName: '', vLoc: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showWarning, setShowWarning] = useState(false);

    const validate = (data: typeof formData) => {
      const newErrors: Record<string, string> = {};
      
      if (step === 1) {
        if (!data.name.trim()) newErrors.name = 'Full name is required';
        else if (data.name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
        
        if (!data.contact.trim()) newErrors.contact = 'Contact number is required';
        else if (!/^\d{10}$/.test(data.contact.trim())) newErrors.contact = 'Enter a valid 10-digit number';
        
        if (!data.state) newErrors.state = 'Please select a state';
        if (!data.city.trim()) newErrors.city = 'City is required';
      }

      if (step === 2) {
        if (!data.fName.trim()) newErrors.fName = 'Fiancé name is required';
        if (!data.fState) newErrors.fState = 'Please select a state';
        if (!data.fCity.trim()) newErrors.fCity = 'City is required';
      }

      if (step === 3) {
        if (!data.eventType) newErrors.eventType = 'Please select event type';
        
        if (!data.wDate) newErrors.wDate = 'Wedding date is required';
        else {
          const selectedDate = new Date(data.wDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) newErrors.wDate = 'Date must be in the future';
        }

        if (!data.budget) newErrors.budget = 'Budget is required';
        else if (isNaN(Number(data.budget)) || Number(data.budget) <= 0) newErrors.budget = 'Enter a valid budget amount';

        if (!data.guests) newErrors.guests = 'Number of guests is required';
        else if (isNaN(Number(data.guests)) || Number(data.guests) <= 0) newErrors.guests = 'Enter a valid number of guests';

        if (!data.wState) newErrors.wState = 'Please select wedding state';
        if (!data.wCity.trim()) newErrors.wCity = 'Wedding city is required';
      }

      return newErrors;
    };

    useEffect(() => {
      setErrors(validate(formData));
    }, [formData, step]);

    const handleBlur = (field: string) => {
      setTouched(prev => ({ ...prev, [field]: true }));
    };

    const isStepValid = () => {
      const stepErrors = validate(formData);
      return Object.keys(stepErrors).length === 0;
    };

    const next = async () => {
      if (!isStepValid()) {
        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        setShowWarning(true);
        setTimeout(() => {
          setShowWarning(false);
          const firstError = document.querySelector('.border-red-500');
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }

      if (step < 3) setStep(s => s + 1);
      else {
        let wId = weddingId;
        if (!wId) {
          wId = Math.random().toString(36).substr(2, 9);
          setWeddingId(wId);
        }

        if (currentUser) {
          setGlobalLoading(true);
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              role: state.userType,
              weddingId: wId,
              displayName: formData.name,
              contact: formData.contact
            }, { merge: true });

            // Save wedding details to Firestore
            const weddingDocRef = doc(db, 'weddings', wId);
            await setDoc(weddingDocRef, {
              id: wId,
              brideName: state.userType === 'bride' ? formData.name : formData.fName,
              groomName: state.userType === 'groom' ? formData.name : formData.fName,
              date: formData.wDate,
              state: formData.wState,
              city: formData.wCity,
              venueFinalized: formData.venue,
              venueName: formData.vName,
              venueLocation: formData.vLoc,
              eventType: formData.eventType,
              budget: Number(formData.budget),
              guests: Number(formData.guests)
            }, { merge: true });
          } catch (error) {
            console.error("Firestore update failed, falling back to local storage", error);
            setGlobalError("Network error. Saving locally for now.");
            setTimeout(() => setGlobalError(null), 3000);
          } finally {
            setGlobalLoading(false);
          }
        }

        // Always save to local storage for mock flow stability
        localStorage.setItem('vivaha_wedding_id', wId);
        localStorage.setItem('vivaha_wedding_details', JSON.stringify({
          date: formData.wDate,
          state: formData.wState,
          city: formData.wCity,
          venueFinalized: formData.venue,
          venueName: formData.vName,
          venueLocation: formData.vLoc,
          eventType: formData.eventType,
          budget: Number(formData.budget),
          guests: Number(formData.guests)
        }));

        setState(prev => ({
          ...prev,
          userDetails: { 
            fullName: formData.name, 
            state: formData.state, 
            city: formData.city, 
            address: formData.address,
            contact: formData.contact
          },
          fianceDetails: { fullName: formData.fName, state: formData.fState, city: formData.fCity, address: '' },
          weddingDetails: { 
            date: formData.wDate, 
            state: formData.wState, 
            city: formData.wCity, 
            venueFinalized: formData.venue as any,
            venueName: formData.vName,
            venueLocation: formData.vLoc,
            eventType: formData.eventType,
            budget: Number(formData.budget),
            guests: Number(formData.guests)
          },
          screen: 'dashboard'
        }));
      }
    };

    const renderError = (field: string) => {
      if (touched[field] && errors[field]) {
        return <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors[field]}</p>;
      }
      return null;
    };

    const inputClass = (field: string) => {
      const base = "w-full p-4 bg-white rounded-2xl border outline-none transition-all";
      if (touched[field] && errors[field]) {
        return `${base} border-red-500 focus:border-red-500 bg-red-50/30`;
      }
      return `${base} border-slate-100 focus:border-gold`;
    };

    return (
      <div className="absolute inset-0 bg-ivory p-6 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-8 bg-gold' : 'w-4 bg-gold/20'}`} />
            ))}
          </div>
          <span className="text-gold font-medium">Step {step} of 3</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-32"
          >
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-rose">Your Details</h2>
                  <p className="text-slate-500 text-sm">Tell us a bit about yourself to get started.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      onBlur={() => handleBlur('name')}
                      className={inputClass('name')} 
                    />
                    {renderError('name')}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number *</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile number" 
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      onBlur={() => handleBlur('contact')}
                      className={inputClass('contact')} 
                    />
                    {renderError('contact')}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">State *</label>
                      <select 
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        onBlur={() => handleBlur('state')}
                        className={inputClass('state')}
                      >
                        <option value="">Select State</option>
                        <option>Maharashtra</option>
                        <option>Delhi</option>
                        <option>Karnataka</option>
                        <option>Rajasthan</option>
                        <option>Gujarat</option>
                        <option>Punjab</option>
                      </select>
                      {renderError('state')}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">City *</label>
                      <input 
                        type="text" 
                        placeholder="Mumbai" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        onBlur={() => handleBlur('city')}
                        className={inputClass('city')} 
                      />
                      {renderError('city')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
                    <textarea 
                      placeholder="Residential address (Optional)" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold h-24" 
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-rose">Fiancé Details</h2>
                  <p className="text-slate-500 text-sm">We'd love to know who the lucky person is!</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter fiancé's name" 
                      value={formData.fName}
                      onChange={(e) => setFormData({...formData, fName: e.target.value})}
                      onBlur={() => handleBlur('fName')}
                      className={inputClass('fName')} 
                    />
                    {renderError('fName')}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">State *</label>
                      <select 
                        value={formData.fState}
                        onChange={(e) => setFormData({...formData, fState: e.target.value})}
                        onBlur={() => handleBlur('fState')}
                        className={inputClass('fState')}
                      >
                        <option value="">Select State</option>
                        <option>Maharashtra</option>
                        <option>Delhi</option>
                        <option>Karnataka</option>
                        <option>Rajasthan</option>
                        <option>Gujarat</option>
                        <option>Punjab</option>
                      </select>
                      {renderError('fState')}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">City *</label>
                      <input 
                        type="text" 
                        placeholder="Mumbai" 
                        value={formData.fCity}
                        onChange={(e) => setFormData({...formData, fCity: e.target.value})}
                        onBlur={() => handleBlur('fCity')}
                        className={inputClass('fCity')} 
                      />
                      {renderError('fCity')}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <motion.h2 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-serif text-gold mb-4"
                  >
                    श्री गणेशाय नमः
                  </motion.h2>
                  <h2 className="text-3xl font-bold text-rose">Wedding Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Type *</label>
                    <select 
                      value={formData.eventType}
                      onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                      onBlur={() => handleBlur('eventType')}
                      className={inputClass('eventType')}
                    >
                      <option value="wedding">Wedding</option>
                      <option value="engagement">Engagement</option>
                      <option value="reception">Reception</option>
                      <option value="sangeet">Sangeet / Mehendi</option>
                    </select>
                    {renderError('eventType')}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wedding Date *</label>
                      <input 
                        type="date" 
                        value={formData.wDate}
                        onChange={(e) => setFormData({...formData, wDate: e.target.value})}
                        onBlur={() => handleBlur('wDate')}
                        className={inputClass('wDate')} 
                      />
                      {renderError('wDate')}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Guests *</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 500" 
                        value={formData.guests}
                        onChange={(e) => setFormData({...formData, guests: e.target.value})}
                        onBlur={() => handleBlur('guests')}
                        className={inputClass('guests')} 
                      />
                      {renderError('guests')}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Budget (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1000000" 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      onBlur={() => handleBlur('budget')}
                      className={inputClass('budget')} 
                    />
                    {renderError('budget')}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wedding State *</label>
                      <select 
                        value={formData.wState}
                        onChange={(e) => setFormData({...formData, wState: e.target.value})}
                        onBlur={() => handleBlur('wState')}
                        className={inputClass('wState')}
                      >
                        <option value="">Select State</option>
                        <option>Rajasthan</option>
                        <option>Goa</option>
                        <option>Uttarakhand</option>
                        <option>Maharashtra</option>
                        <option>Karnataka</option>
                        <option>Kerala</option>
                      </select>
                      {renderError('wState')}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wedding City *</label>
                      <input 
                        type="text" 
                        placeholder="Udaipur" 
                        value={formData.wCity}
                        onChange={(e) => setFormData({...formData, wCity: e.target.value})}
                        onBlur={() => handleBlur('wCity')}
                        className={inputClass('wCity')} 
                      />
                      {renderError('wCity')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Have you finalized venue?</label>
                    <div className="flex gap-2">
                      {['Yes', 'No', 'In Discussion'].map(opt => (
                        <button key={opt} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${formData.venue === opt.toLowerCase() ? 'bg-rose text-ivory border-rose' : 'bg-white text-slate-600 border-slate-100'}`} onClick={() => setFormData({...formData, venue: opt.toLowerCase()})}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-8 left-6 right-6 space-y-4">
          <AnimatePresence>
            {showWarning && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-500 text-white p-3 rounded-xl text-center text-xs font-bold shadow-lg"
              >
                Please fill all required fields correctly to proceed.
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-white text-rose border border-rose/20 py-4 rounded-2xl font-bold transition-all active:scale-95"
              >
                Back
              </button>
            )}
            <button 
              onClick={next}
              disabled={!isStepValid() && Object.keys(touched).length > 0}
              className={`flex-[2] py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isStepValid() 
                  ? 'bg-rose text-ivory shadow-rose/20' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {step === 3 ? 'Complete Setup' : 'Continue'} <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Layout Components ---

  const [activeTab, setActiveTab] = useState<'home' | 'checklist' | 'inspiration' | 'packages' | 'profile' | 'budget'>('home');

  // Navigation Helper
  const navigate = (screen: AppState['screen']) => setState(prev => ({ ...prev, screen }));

  const TopBar = () => (
    <div className="sticky top-0 z-[110] bg-ivory/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSideMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose hover:scale-110 active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
        <button 
          onClick={() => setMegaMenuOpen(!megaMenuOpen)}
          className={`px-4 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-2 ${megaMenuOpen ? 'bg-rose text-ivory border-rose' : 'bg-white text-rose border-slate-100'}`}
        >
          Vendors <ChevronDown size={14} className={`transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('dashboard')}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold mandala-glow" />
          <h1 className="brand-logo gold-shimmer">VIVAHA</h1>
          <Sparkles size={16} className="text-gold mandala-glow" />
        </div>
        <div className="flourish-underline" />
      </div>
      <button 
        onClick={() => setNotificationsOpen(true)}
        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose relative hover:scale-110 active:scale-95 transition-transform"
      >
        <Bell size={20} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
      </button>
    </div>
  );

  const BottomNav = () => (
    <div className="absolute bottom-0 left-0 right-0 bottom-nav-blur px-4 py-3 flex items-center justify-between z-40 border-t border-slate-100">
      {[
        { id: 'home', icon: <LayoutDashboard size={24} />, label: 'Home' },
        { id: 'checklist', icon: <CheckCircle2 size={24} />, label: 'Checklist' },
        { id: 'budget', icon: <PieChart size={24} />, label: 'Budget' },
        { id: 'inspiration', icon: <ImageIcon size={24} />, label: 'Inspiration' },
        { id: 'packages', icon: <PackageIcon size={24} />, label: 'Packages' },
        { id: 'profile', icon: state.userDetails?.profileImage ? <img src={state.userDetails.profileImage} className="w-6 h-6 rounded-full object-cover border border-gold" /> : <User size={24} />, label: 'Profile' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id as any);
            if (state.screen !== 'dashboard') navigate('dashboard');
          }}
          className={`flex flex-col items-center gap-1 transition-all group ${activeTab === tab.id ? 'text-rose scale-110' : 'text-slate-400 hover:text-rose/60'}`}
        >
          <div className={`transition-transform group-active:scale-90 ${activeTab === tab.id ? 'text-gold' : ''}`}>
            {tab.icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  // --- Tab Screens ---

  const HomeTab = () => {
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const featuredVendors = VENDORS.filter(v => v.isPremium);

    useEffect(() => {
      const interval = setInterval(() => {
        setFeaturedIndex(prev => (prev + 1) % featuredVendors.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [featuredVendors.length]);

    if (isLoading) {
      return (
        <div className="p-6 space-y-8 pb-24">
          <Skeleton className="h-64 w-full" />
          <div className="flex gap-4 overflow-hidden">
            <Skeleton className="h-32 w-32 shrink-0" />
            <Skeleton className="h-32 w-32 shrink-0" />
            <Skeleton className="h-32 w-32 shrink-0" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    const coupleNames = state.userDetails?.fullName && state.fianceDetails?.fullName 
      ? `${state.userDetails.fullName.split(' ')[0]} & ${state.fianceDetails.fullName.split(' ')[0]}`
      : "Planning Your Wedding";
    
    const weddingDateStr = state.weddingDetails?.date 
      ? new Date(state.weddingDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : "Date Not Set";

    const weddingDate = state.weddingDetails?.date ? new Date(state.weddingDetails.date) : null;
    const today = new Date();
    // Ensure we calculate correctly even if the date is today
    const diffTime = weddingDate ? weddingDate.getTime() - today.getTime() : 0;
    const daysLeft = weddingDate ? Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) : null;

    return (
      <div className="p-6 space-y-10 pb-24 overflow-x-hidden">
        {/* Hero Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-rose to-petal p-6 sm:p-8 rounded-[2.5rem] text-ivory shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-rose-400/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-serif text-gold mb-4 sm:mb-6"
            >
              श्री गणेशाय नमः
            </motion.h2>
            
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 font-serif italic">{coupleNames}</h3>
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-champagne/80 text-xs sm:text-sm mb-6">
              <span className="flex items-center gap-1"><Calendar size={14} /> {weddingDateStr}</span>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-gold/40" />
              <span className="flex items-center gap-1"><MapPin size={14} /> {state.weddingDetails?.city || 'Location Not Set'}</span>
            </div>

            <div className="w-full bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
              <div className="text-left min-w-0">
                <p className="text-[10px] uppercase font-bold text-champagne/60 tracking-widest truncate">Countdown</p>
                <p className="font-bold text-sm sm:text-lg truncate">{daysLeft !== null ? `${daysLeft} Days to go` : 'Set your date'}</p>
              </div>
              <button 
                onClick={() => navigate('guest_list')}
                className="bg-gold text-rose px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold shadow-lg shrink-0"
              >
                Share Invite
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Planner Promo Card */}
        <section>
          <div 
            onClick={() => setIsExpertChatOpen(true)}
            className="bg-gradient-to-br from-rose to-petal p-8 rounded-[2.5rem] text-ivory relative overflow-hidden shadow-xl shadow-rose/20 cursor-pointer group"
          >
            <Sparkles className="absolute top-4 right-4 text-gold/20 group-hover:scale-110 transition-transform" size={100} />
            <div className="relative z-10">
              <span className="bg-gold text-rose text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">New Feature</span>
              <h3 className="text-3xl font-bold mb-2">Aira - AI Concierge</h3>
              <p className="text-ivory/80 text-sm mb-6 leading-relaxed max-w-[200px]">Get instant advice on venues, budgets, and traditions from our expert AI.</p>
              <div className="flex items-center gap-2 text-gold font-bold">
                Start Planning <ArrowRight size={20} />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Vendors Carousel */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-rose">Featured Vendors</h2>
            <div className="flex gap-1">
              {featuredVendors.length > 0 && featuredVendors.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === featuredIndex ? 'w-4 bg-gold' : 'w-1 bg-gold/20'}`} />
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] shadow-xl aspect-[16/10] bg-slate-100">
            {featuredVendors.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="absolute inset-0"
                >
                  <img 
                    src={featuredVendors[featuredIndex].image} 
                    className="w-full h-full object-cover" 
                    alt={featuredVendors[featuredIndex].name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <div className="flex justify-between items-end gap-4">
                      <div className="min-w-0">
                        <span className="bg-gold text-rose text-[10px] font-bold px-2 py-1 rounded-full mb-2 inline-block uppercase tracking-widest truncate max-w-full">Premium Partner</span>
                        <h4 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">{featuredVendors[featuredIndex].name}</h4>
                        <p className="text-white/70 text-xs sm:text-sm flex items-center gap-2 truncate">
                          <Star size={14} className="text-gold fill-current" /> {featuredVendors[featuredIndex].rating} • {featuredVendors[featuredIndex].category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-gold font-bold text-base sm:text-lg">{featuredVendors[featuredIndex].price}</p>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest">Starting Price</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">No featured vendors available</div>
            )}
          </div>
        </section>

        {/* Browse Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-rose">Browse Categories</h2>
            <button onClick={() => setMegaMenuOpen(true)} className="text-gold text-sm font-bold flex items-center gap-1">
              All Categories <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
            {CATEGORIES.slice(0, 4).map((cat) => (
              <div 
                key={cat.name} 
                className="min-w-[160px] premium-card p-6 flex flex-col items-center text-center cursor-pointer hover:border-gold/50 transition-all hover:-translate-y-1"
                onClick={() => {
                  setState(prev => ({ ...prev, screen: 'category_page', selectedCategory: cat.items[0] }));
                }}
              >
                <div className="w-20 h-20 rounded-full bg-rose/5 flex items-center justify-center mb-4 border border-rose/10 group-hover:bg-rose/10 transition-colors">
                  <Sparkles className="text-rose" size={32} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{cat.items.length} Options</p>
              </div>
            ))}
          </div>
        </section>

        {/* Real Weddings Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-rose">Real Weddings</h2>
            <button onClick={() => navigate('real_weddings')} className="text-gold text-sm font-bold">View All</button>
          </div>
          <div className="space-y-6">
            {REAL_WEDDINGS.map(wedding => (
              <div key={wedding.id} className="premium-card overflow-hidden group cursor-pointer" onClick={() => navigate('real_weddings')}>
                <div className="relative h-64">
                  <img src={wedding.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={wedding.couple} referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <p className="text-xs font-bold text-rose flex items-center gap-1">
                      <MapPin size={12} /> {wedding.location}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-2xl font-bold text-slate-800 mb-2">{wedding.couple}</h4>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6 italic">"{wedding.story}"</p>
                  <div className="flex flex-wrap gap-2">
                    {wedding.vendors.map((v, i) => (
                      <span key={`${v.category}-${i}`} className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg">
                        {v.category}: {v.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-rose">Wedding Tips & Ideas</h2>
            <button onClick={() => navigate('blogs')} className="text-gold text-sm font-bold">Read Blog</button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {BLOGS.map(blog => (
              <div key={blog.id} className="premium-card flex flex-col sm:flex-row overflow-hidden hover:shadow-xl transition-shadow">
                <div className="sm:w-48 h-48 shrink-0 relative">
                  <img src={blog.image} className="w-full h-full object-cover" alt={blog.title} referrerPolicy="no-referrer" />
                  <div className="absolute top-2 left-2 bg-rose text-ivory text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">
                    {blog.category}
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xl mb-2 leading-tight hover:text-rose transition-colors cursor-pointer">{blog.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2">{blog.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{blog.date}</span>
                    <button className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-1 group">
                      Read Full Story <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discover Vivaha Section */}
        <section className="bg-ivory rounded-[2.5rem] p-8 border border-gold/10 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-rose">Discover Vivaha</h2>
            <button onClick={() => navigate('about_vivah')} className="text-gold text-sm font-bold flex items-center gap-1">
              Learn More <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Our Mission', icon: <Target className="text-rose" />, section: 'mission' },
              { label: 'Authenticity', icon: <ShieldCheck className="text-gold" />, section: 'authenticity' },
              { label: 'Our Team', icon: <Users className="text-rose" />, section: 'team' },
              { label: 'Sustainability', icon: <Leaf className="text-emerald-500" />, section: 'sustainability' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => navigate('about_vivah')}
                className="premium-card p-4 flex flex-col items-center text-center hover:bg-white transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    );
  };

  const ChecklistTab = () => {
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{role: 'user' | 'ai', text: string}>>([]);
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiInput, setAiInput] = useState('');

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const deleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setTasks((items) => {
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    };

    const toggleTask = (id: string) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const handleAddTask = () => {
      if (!newTaskTitle.trim()) return;
      const newTask: Task = {
        id: Math.random().toString(36).substring(2, 9),
        title: newTaskTitle,
        completed: false
      };
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setIsAddTaskOpen(false);
    };

    const askAi = async (customPrompt?: string) => {
      const userMessage = customPrompt || aiInput || "Give me some personalized wedding planning advice.";
      if (!userMessage.trim()) return;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      setLoadingAi(true);
      setAiChatOpen(true);
      
      // Add user message to history
      setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
      setAiInput('');
      
      // Get context from state and localStorage
      const weddingDate = state.weddingDetails?.date || 'Not set';
      const location = state.weddingDetails?.city ? `${state.weddingDetails.city}, ${state.weddingDetails.state}` : 'Not set';
      const budget = localStorage.getItem('wedding_total_budget') || '15,00,000';
      
      const context = `Context: The user is planning a wedding on ${weddingDate} in ${location} with a total budget of ₹${budget}. `;
      const history = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      const prompt = `${context}\n\nChat History:\n${history}\n\nUser Question: ${userMessage}\n\nPlease provide personalized advice based on these details. If details are missing, suggest what they should consider.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        
        const aiText = response.text || 'No response';
        setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        
        // Play notification sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
          audio.volume = 0.5;
          audio.play();
        } catch (soundError) {
          console.log('Sound playback failed', soundError);
        }
      } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to AI assistant.' }]);
      }
      setLoadingAi(false);
    };

    return (
      <div className="p-6 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-rose">Wedding Checklist</h2>
          <button 
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-rose text-ivory p-3 rounded-2xl shadow-lg"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <SortableTask key={task.id} task={task} toggleTask={toggleTask} deleteTask={deleteTask} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* AI Assistant Floating Button */}
        <button 
          onClick={state.isPremium ? () => askAi() : () => alert("Upgrade to Premium for AI assistance!")}
          className="absolute bottom-36 right-4 w-16 h-16 bg-gradient-to-br from-rose to-petal rounded-full shadow-2xl flex items-center justify-center text-gold border-2 border-gold/20 z-50 animate-bounce"
        >
          <Sparkles size={28} />
        </button>

        {/* Add Task Modal */}
        <AnimatePresence>
          {isAddTaskOpen && (
            <motion.div 
              key="add-task-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                key="add-task-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-ivory w-full max-w-sm rounded-[2rem] p-8 shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-rose mb-6">Add New Task</h3>
                <input 
                  autoFocus
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold mb-6"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsAddTaskOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddTask}
                    className="flex-1 bg-rose text-ivory py-4 rounded-2xl font-bold shadow-lg shadow-rose/20"
                  >
                    Add Task
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Modal */}
        <AnimatePresence>
          {aiChatOpen && (
            <motion.div 
              key="ai-concierge-modal"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end"
            >
              <div className="bg-ivory w-full rounded-t-[3rem] p-8 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center text-gold">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-rose">AI Concierge</h3>
                      <p className="text-xs text-slate-500">Premium Planning Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setMessages([])}
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose"
                    >
                      Reset Chat
                    </button>
                    <button onClick={() => setAiChatOpen(false)} className="text-slate-400">
                      <Plus className="rotate-45" size={24} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[50vh] overflow-y-auto no-scrollbar mb-6 pr-2">
                  {messages.length === 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-slate-700 leading-relaxed">
                      Hello! I'm Aira, your AI Wedding Concierge. I can help you with your wedding in {state.weddingDetails?.city || 'India'}. I can search for vendors, add tasks, and manage your budget. How can I assist you today?
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border ${
                        msg.role === 'user' 
                          ? 'bg-rose text-ivory border-rose/20 rounded-tr-none' 
                          : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {loadingAi && (
                    <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm rounded-tl-none flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-gold rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!loadingAi && (
                  <div className="space-y-6">
                    <div className="relative">
                      <input 
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            askAi();
                          }
                        }}
                        placeholder="Ask me anything about your wedding..."
                        className="w-full p-5 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold shadow-sm pr-16"
                      />
                      <button 
                        onClick={() => askAi()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-rose text-ivory rounded-xl flex items-center justify-center shadow-lg shadow-rose/20"
                      >
                        <Send size={20} />
                      </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {[
                        "Suggest Udaipur venues",
                        "Wedding budget tips",
                        "Traditional rituals list",
                        "Vendor selection guide"
                      ].map(suggestion => (
                        <button 
                          key={suggestion}
                          onClick={() => askAi(suggestion)}
                          className="px-4 py-2 bg-gold/10 text-rose border border-gold/20 rounded-full text-[10px] font-bold whitespace-nowrap"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const CategoryPage = () => {
    const [sortBy, setSortBy] = useState<'rating' | 'priceLow' | 'priceHigh'>('rating');
    const [filterCity, setFilterCity] = useState<string>('All');
    const [filterMinBudget, setFilterMinBudget] = useState<number>(0);
    const [filterMaxBudget, setFilterMaxBudget] = useState<number>(2000000);
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterService, setFilterService] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mock API Fetch
    useEffect(() => {
      const fetchVendors = async () => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setVendors(VENDORS);
        setIsLoading(false);
      };
      fetchVendors();
    }, []);

    // Get unique services for the current category
    const availableServices = Array.from(new Set(vendors
      .filter(v => state.selectedCategory ? v.category.toLowerCase().includes(state.selectedCategory.toLowerCase()) : true)
      .flatMap(v => v.specificServices || [])
    ));

    const filteredVendors = vendors.filter(v => {
      const matchesCategory = state.selectedCategory ? v.category.toLowerCase().includes(state.selectedCategory.toLowerCase()) || v.name.toLowerCase().includes(state.selectedCategory.toLowerCase()) : true;
      const matchesCity = filterCity === 'All' || v.location === filterCity;
      const matchesBudget = v.priceValue >= filterMinBudget && v.priceValue <= filterMaxBudget;
      const matchesDate = (!filterStartDate && !filterEndDate) || (v.availability && v.availability.some(date => 
        (filterStartDate ? date >= filterStartDate : true) && 
        (filterEndDate ? date <= filterEndDate : true)
      ));
      const matchesService = filterService === 'All' || (v.specificServices && v.specificServices.includes(filterService));
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesCity && matchesBudget && matchesDate && matchesService && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'priceLow') return a.priceValue - b.priceValue;
      if (sortBy === 'priceHigh') return b.priceValue - a.priceValue;
      return 0;
    });

    return (
      <div className="absolute inset-0 bg-ivory flex flex-col z-[80]">
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <button onClick={() => navigate('dashboard')} className="text-rose flex items-center gap-1 font-bold">
            <ChevronLeft size={20} /> Back
          </button>
          <h2 className="text-xl font-bold text-rose">{state.selectedCategory || 'Vendors'}</h2>
          <div className="w-10" />
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar pb-24">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${state.selectedCategory || 'vendors'}...`}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold shadow-sm text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose"
              >
                <Plus className="rotate-45" size={20} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Filters & Sorting</h3>
              <button 
                onClick={() => {
                  setFilterCity('All');
                  setFilterMinBudget(0);
                  setFilterMaxBudget(2000000);
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterService('All');
                  setSearchQuery('');
                }}
                className="text-[10px] font-bold text-rose uppercase tracking-widest hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Location</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['All', 'Mumbai', 'Delhi', 'Kolkata', 'Udaipur'].map(city => (
                  <button 
                    key={city}
                    onClick={() => setFilterCity(city)}
                    className={`px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${filterCity === city ? 'bg-rose text-ivory border-rose shadow-md shadow-rose/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-rose/30'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Price Range (₹)</p>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2">
                      <span>Min: ₹{filterMinBudget.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000000" 
                      step="50000"
                      value={filterMinBudget}
                      onChange={(e) => setFilterMinBudget(parseInt(e.target.value))}
                      className="w-full accent-rose h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2">
                      <span>Max: ₹{filterMaxBudget.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="500000" 
                      max="2000000" 
                      step="50000"
                      value={filterMaxBudget}
                      onChange={(e) => setFilterMaxBudget(parseInt(e.target.value))}
                      className="w-full accent-rose h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Availability Range</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-rose/50" size={14} />
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-2 py-2.5 text-xs outline-none focus:border-rose/30 transition-colors text-slate-600"
                    />
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-bold text-slate-400">START</span>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-rose/50" size={14} />
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-2 py-2.5 text-xs outline-none focus:border-rose/30 transition-colors text-slate-600"
                    />
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-bold text-slate-400">END</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Specific Services</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                <button 
                  onClick={() => setFilterService('All')}
                  className={`px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${filterService === 'All' ? 'bg-gold text-rose border-gold shadow-md shadow-gold/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-gold/30'}`}
                >
                  All Services
                </button>
                {availableServices.map(service => (
                  <button 
                    key={service}
                    onClick={() => setFilterService(service)}
                    className={`px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${filterService === service ? 'bg-gold text-rose border-gold shadow-md shadow-gold/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-gold/30'}`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <p className="text-xs font-medium text-slate-400">
                {isLoading ? 'Fetching vendors...' : `Showing ${filteredVendors.length} results`}
              </p>
              <button 
                onClick={() => {
                  if (sortBy === 'rating') setSortBy('priceLow');
                  else if (sortBy === 'priceLow') setSortBy('priceHigh');
                  else setSortBy('rating');
                }}
                className="bg-slate-100 px-4 py-2 rounded-xl text-slate-600 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
              >
                <ArrowUpDown size={14} /> {sortBy === 'rating' ? 'Top Rated' : sortBy === 'priceLow' ? 'Price: Low' : 'Price: High'}
              </button>
            </div>
          </div>

          {/* Vendor List */}
          <div className="space-y-6">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-72 bg-slate-100 rounded-[2rem] animate-pulse" />
              ))
            ) : filteredVendors.length > 0 ? filteredVendors.map(vendor => (
              <motion.div 
                layout
                key={vendor.id} 
                className="premium-card overflow-hidden group"
                onClick={() => setSelectedVendor(vendor)}
              >
                <div className="relative h-48">
                  <img src={vendor.image} className="w-full h-full object-cover" alt={vendor.name} referrerPolicy="no-referrer" />
                  {vendor.isPremium && (
                    <div className="absolute top-4 right-4 bg-gold text-rose text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                      PREMIUM
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{vendor.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {vendor.location}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold">
                      <Star size={14} className="fill-current" /> {vendor.rating}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                    <p className="text-rose font-bold">{vendor.price}</p>
                    <button className="text-gold text-xs font-bold uppercase tracking-widest">View Portfolio</button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Search size={40} />
                </div>
                <p className="text-slate-500 font-medium">No vendors found matching your criteria.</p>
                <button 
                  onClick={() => {
                    setFilterCity('All'); 
                    setFilterMinBudget(0);
                    setFilterMaxBudget(2000000);
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterService('All');
                  }} 
                  className="text-rose font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RealWeddingsPage = () => (
    <div className="absolute inset-0 bg-ivory flex flex-col z-[80]">
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => navigate('dashboard')} className="text-rose flex items-center gap-1 font-bold">
          <ChevronLeft size={20} /> Back
        </button>
        <h2 className="text-xl font-bold text-rose">Real Weddings</h2>
        <div className="w-10" />
      </div>
      <div className="p-6 space-y-8 overflow-y-auto no-scrollbar pb-24">
        {REAL_WEDDINGS.map(wedding => (
          <div key={wedding.id} className="space-y-6">
            <div className="premium-card overflow-hidden">
              <img src={wedding.mainImage} className="w-full h-80 object-cover" alt={wedding.couple} referrerPolicy="no-referrer" />
              <div className="p-6">
                <h3 className="text-3xl font-bold text-slate-800 mb-2">{wedding.couple}</h3>
                <p className="text-rose font-medium mb-4 flex items-center gap-2"><MapPin size={16} /> {wedding.location}</p>
                <p className="text-slate-600 leading-relaxed italic mb-8">"{wedding.story}"</p>
                
                <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">The Dream Team</h4>
                <div className="grid grid-cols-2 gap-4">
                  {wedding.vendors.map((v, i) => (
                    <div key={`${v.category}-${i}`} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{v.category}</p>
                      <p className="font-bold text-slate-800 text-sm">{v.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const BlogsPage = () => (
    <div className="absolute inset-0 bg-ivory flex flex-col z-[80]">
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => navigate('dashboard')} className="text-rose flex items-center gap-1 font-bold">
          <ChevronLeft size={20} /> Back
        </button>
        <h2 className="text-xl font-bold text-rose">Wedding Blog</h2>
        <div className="w-10" />
      </div>
      <div className="p-6 space-y-8 overflow-y-auto no-scrollbar pb-24">
        {BLOGS.map(blog => (
          <div key={blog.id} className="premium-card overflow-hidden">
            <img src={blog.image} className="w-full h-64 object-cover" alt={blog.title} referrerPolicy="no-referrer" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-rose/10 text-rose text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">{blog.category}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{blog.date}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">{blog.title}</h3>
              <p className="text-slate-600 leading-relaxed mb-6">{blog.excerpt}</p>
              <button className="w-full bg-rose text-ivory py-4 rounded-2xl font-bold">Read Full Article</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const InspirationTab = () => (
    <div className="p-6 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-rose">Inspiration Boards</h2>
        <button className="bg-gold text-rose p-3 rounded-2xl shadow-lg">
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {INSPIRATION_BOARDS.map((board) => (
          <div 
            key={board.id} 
            className="premium-card relative aspect-square overflow-hidden group cursor-pointer"
            onClick={() => setSelectedBoard(board)}
          >
            <img src={board.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={board.name} referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <h4 className="text-ivory font-bold text-lg">{board.name}</h4>
              <p className="text-gold/80 text-[10px] font-bold uppercase tracking-widest">{board.count} Items</p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-2xl font-bold text-rose mb-4">Real Weddings</h2>
        <div className="space-y-4">
          {[
            { couple: 'Ananya & Kabir', city: 'Jaipur', type: 'Destination', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
            { couple: 'Meera & Arjun', city: 'Mumbai', type: 'Grand', img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
          ].map((wedding, idx) => (
            <div key={`${wedding.couple}-${idx}`} className="premium-card overflow-hidden">
              <img src={wedding.img} className="w-full h-48 object-cover" alt={wedding.couple} referrerPolicy="no-referrer" />
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{wedding.couple}</h4>
                  <p className="text-xs text-slate-500">{wedding.city} • {wedding.type} Wedding</p>
                </div>
                <button className="bg-gold/10 text-gold p-2 rounded-xl">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const PackagesTab = () => {
    const [subTab, setSubTab] = useState<'pairs' | 'experts' | 'top'>('pairs');

    return (
      <div className="p-6 space-y-8 pb-24">
        <h2 className="text-3xl font-bold text-rose">Design Your Package</h2>

        <div className="flex bg-white/50 p-1 rounded-2xl border border-slate-100">
          {[
            { id: 'pairs', label: 'Power Pairs' },
            { id: 'experts', label: 'Solo Experts' },
            { id: 'top', label: 'Top Vendors' },
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${subTab === t.id ? 'bg-rose text-ivory shadow-lg' : 'text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {subTab === 'pairs' && POWER_PAIRS.map(pkg => (
            <div key={pkg.id} className="premium-card overflow-hidden">
              <img src={pkg.image} className="w-full h-48 object-cover" alt={pkg.name} referrerPolicy="no-referrer" />
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-rose">{pkg.name}</h3>
                    <p className="text-xs text-slate-500">{pkg.members.join(' + ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{pkg.price}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Starting At</p>
                  </div>
                </div>
                <button className="w-full bg-rose/5 text-rose border border-rose/10 py-3 rounded-xl font-bold hover:bg-rose hover:text-ivory transition-all">
                  View Package Details
                </button>
              </div>
            </div>
          ))}

          {subTab === 'experts' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Search vendor type..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-gold" />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['Photographer', 'Makeup', 'DJ', 'Planner', 'Caterer'].map(cat => (
                  <button key={cat} className="whitespace-nowrap px-6 py-2 rounded-full border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest bg-gold/5">
                    {cat}
                  </button>
                ))}
              </div>
              {VENDORS.map(vendor => (
                <div 
                  key={vendor.id} 
                  className="premium-card flex p-4 gap-4 cursor-pointer hover:border-gold/50 transition-colors"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <img src={vendor.image} className="w-24 h-24 rounded-2xl object-cover" alt={vendor.name} referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-slate-800">{vendor.name}</h4>
                      <div className="flex items-center gap-1 text-gold">
                        <Sparkles size={12} fill="currentColor" />
                        <span className="text-xs font-bold">{vendor.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{vendor.category} • {vendor.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 font-bold">{vendor.price}</span>
                      <button className="bg-rose text-ivory p-2 rounded-lg">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subTab === 'top' && (
             <div className="text-center py-12">
                <Crown className="text-gold mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-rose mb-2">Most Loved Vendors</h3>
                <p className="text-slate-500 text-sm">Curated selection for our premium couples.</p>
             </div>
          )}
        </div>

        {/* Sticky Summary */}
        <div className="absolute bottom-24 left-6 right-6 bg-rose text-ivory p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gold/20">
          <div>
            <p className="text-[10px] uppercase font-bold text-champagne/60 tracking-widest">My Package</p>
            <p className="font-bold">₹0 Selected</p>
          </div>
          <button className="bg-gold text-rose px-6 py-2 rounded-xl font-bold text-sm">
            Save Package
          </button>
        </div>
      </div>
    );
  };

  const BookingsPage = () => (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-rose">My Bookings</h2>
      </div>
      
      <div className="space-y-4">
        {/* Placeholder for bookings - assuming empty for now */}
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-rose/5 rounded-full flex items-center justify-center text-rose/30">
            <Calendar size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No bookings yet</h3>
            <p className="text-slate-500 text-sm max-w-[240px]">Start exploring vendors and book your favorites for your big day.</p>
          </div>
          <button 
            onClick={() => {
              navigate('dashboard');
              setActiveTab('home');
            }}
            className="bg-gold text-rose px-6 py-3 rounded-xl font-bold text-sm shadow-lg"
          >
            Explore Vendors
          </button>
        </div>
      </div>
    </div>
  );

  const SavedVendorsPage = () => (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-rose">Saved Vendors</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {VENDORS.slice(0, 2).map(vendor => (
          <div key={vendor.id} className="premium-card overflow-hidden flex">
            <img src={vendor.image} className="w-24 h-24 object-cover" alt={vendor.name} referrerPolicy="no-referrer" />
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{vendor.name}</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{vendor.category}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-gold">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-bold">{vendor.rating}</span>
                </div>
                <button className="text-rose/40 hover:text-rose transition-colors">
                  <Heart size={18} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsPage = () => {
    const [activeSection, setActiveSection] = useState<'profile' | 'fiance' | 'wedding'>('profile');
    const [editData, setEditData] = useState({
      name: state.userDetails?.fullName || '',
      state: state.userDetails?.state || '',
      city: state.userDetails?.city || '',
      address: state.userDetails?.address || '',
      fName: state.fianceDetails?.fullName || '',
      fState: state.fianceDetails?.state || '',
      fCity: state.fianceDetails?.city || '',
      wDate: state.weddingDetails?.date || '',
      wState: state.weddingDetails?.state || '',
      wCity: state.weddingDetails?.city || '',
      vName: state.weddingDetails?.venueName || '',
      vLoc: state.weddingDetails?.venueLocation || ''
    });

    const handleSave = () => {
      setState(prev => ({
        ...prev,
        userDetails: { fullName: editData.name, state: editData.state, city: editData.city, address: editData.address },
        fianceDetails: { fullName: editData.fName, state: editData.fState, city: editData.fCity, address: '' },
        weddingDetails: { 
          ...prev.weddingDetails!,
          date: editData.wDate, 
          state: editData.wState, 
          city: editData.wCity, 
          venueName: editData.vName,
          venueLocation: editData.vLoc
        }
      }));
      navigate('dashboard');
    };

    return (
      <div className="p-6 space-y-8 pb-24">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-rose">Settings</h2>
          </div>
          <button 
            onClick={handleSave}
            className="bg-gold text-rose px-6 py-2 rounded-full font-bold text-sm shadow-lg"
          >
            Save
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
          {(['profile', 'fiance', 'wedding'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSection === tab ? 'bg-white text-rose shadow-sm' : 'text-slate-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeSection === 'profile' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <input 
                    type="text" 
                    value={editData.state}
                    onChange={(e) => setEditData({...editData, state: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <input 
                    type="text" 
                    value={editData.city}
                    onChange={(e) => setEditData({...editData, city: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <textarea 
                  rows={3}
                  value={editData.address}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30 resize-none" 
                />
              </div>
            </div>
          )}

          {activeSection === 'fiance' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fiancé Name</label>
                <input 
                  type="text" 
                  value={editData.fName}
                  onChange={(e) => setEditData({...editData, fName: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <input 
                    type="text" 
                    value={editData.fState}
                    onChange={(e) => setEditData({...editData, fState: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <input 
                    type="text" 
                    value={editData.fCity}
                    onChange={(e) => setEditData({...editData, fCity: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'wedding' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Wedding Date</label>
                <input 
                  type="date" 
                  value={editData.wDate}
                  onChange={(e) => setEditData({...editData, wDate: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <input 
                    type="text" 
                    value={editData.wState}
                    onChange={(e) => setEditData({...editData, wState: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <input 
                    type="text" 
                    value={editData.wCity}
                    onChange={(e) => setEditData({...editData, wCity: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Venue Name</label>
                <input 
                  type="text" 
                  value={editData.vName}
                  onChange={(e) => setEditData({...editData, vName: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Venue Location</label>
                <input 
                  type="text" 
                  value={editData.vLoc}
                  onChange={(e) => setEditData({...editData, vLoc: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/30" 
                />
              </div>
            </div>
          )}
        </div>

        <section className="space-y-4 pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Danger Zone</h3>
          <div className="premium-card">
            <button className="w-full p-5 flex items-center gap-4 text-red-500 font-medium hover:bg-red-50 transition-colors">
              <LogOut size={18} />
              <span>Delete Account</span>
            </button>
          </div>
        </section>
      </div>
    );
  };

  const HelpSupportPage = () => (
    <div className="p-6 space-y-8 pb-24">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-rose">Help & Support</h2>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Common Questions</h3>
          <div className="space-y-3">
            {[
              "How do I book a vendor?",
              "What is included in Premium?",
              "How to share my wedding invite?",
              "Can I change my wedding date later?"
            ].map((q) => (
              <div key={q} className="premium-card p-4 flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-medium text-slate-700">{q}</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-gold transition-colors" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Contact Us</h3>
          <div className="premium-card p-6 space-y-4">
            <div 
              onClick={() => setIsExpertChatOpen(true)}
              className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-rose/5 rounded-full flex items-center justify-center text-rose">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Chat with us</p>
                <p className="text-xs text-slate-500">Available 10 AM - 8 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose/5 rounded-full flex items-center justify-center text-rose">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Email Support</p>
                <p className="text-xs text-slate-500">support@vivaha.com</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const AboutVivahPage = () => {
    const [activeSection, setActiveSection] = useState<'about' | 'mission' | 'authenticity' | 'contact' | 'careers' | 'testimonials' | 'sustainability' | 'refunds' | 'support' | 'story' | 'team'>('about');

    const sections = {
      about: {
        title: "About Vivah",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Vivah is India's premier AI-powered wedding planning platform, designed to make your journey to the altar as beautiful as the wedding itself.</p>
            <p>Our vision is to simplify the complex world of wedding planning by connecting couples with the finest vendors and providing intelligent tools to manage every detail.</p>
          </div>
        )
      },
      story: {
        title: "Our Story",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Founded in 2024, Vivah was born out of a simple observation: wedding planning in India is unnecessarily stressful. We set out to change that by combining traditional expertise with modern technology.</p>
            <p>What started as a small team in Udaipur has now grown into a nationwide platform helping thousands of couples plan their dream weddings.</p>
          </div>
        )
      },
      team: {
        title: "Our Team",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>We are a diverse group of wedding experts, tech enthusiasts, and creative designers dedicated to making your wedding day perfect.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="premium-card p-3 text-center">
                <div className="w-12 h-12 rounded-full bg-rose/10 mx-auto mb-2 flex items-center justify-center text-rose font-bold">AS</div>
                <p className="text-xs font-bold text-slate-800">Arjun Singh</p>
                <p className="text-[10px] text-slate-400">Founder & CEO</p>
              </div>
              <div className="premium-card p-3 text-center">
                <div className="w-12 h-12 rounded-full bg-rose/10 mx-auto mb-2 flex items-center justify-center text-rose font-bold">MP</div>
                <p className="text-xs font-bold text-slate-800">Meera Patel</p>
                <p className="text-[10px] text-slate-400">Head of Design</p>
              </div>
            </div>
          </div>
        )
      },
      mission: {
        title: "Our Mission",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>At Vivah, our mission is to empower every couple to create their perfect wedding day without the stress typically associated with planning.</p>
            <p>We leverage cutting-edge AI technology to provide personalized recommendations, budget management, and real-time collaboration tools that bring your vision to life.</p>
          </div>
        )
      },
      authenticity: {
        title: "Authenticity & Trust",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Trust is the foundation of every successful wedding. We rigorously vet every vendor on our platform to ensure they meet our high standards of quality and professionalism.</p>
            <p>With verified reviews from real couples and secure payment protection, you can book with confidence knowing that your big day is in safe hands.</p>
          </div>
        )
      },
      contact: {
        title: "Contact Us",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Have questions or need assistance? Our dedicated concierge team is here to help you every step of the way.</p>
            <div className="premium-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose">
                  <Mail size={16} />
                </div>
                <span className="text-sm font-medium">support@vivah.app</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose">
                  <Phone size={16} />
                </div>
                <span className="text-sm font-medium">+91 98765 43210</span>
              </div>
            </div>
          </div>
        )
      },
      careers: {
        title: "Careers",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Join the team that's redefining wedding planning in India. We're always looking for passionate individuals in tech, design, and wedding planning.</p>
            <p>Email your resume to <span className="text-rose font-bold">careers@vivah.app</span> to explore opportunities.</p>
          </div>
        )
      },
      testimonials: {
        title: "Testimonials",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>"Vivah made our wedding planning so much easier. The vendor recommendations were spot on!" - <span className="font-bold text-slate-800">Anjali & Rahul</span></p>
            <p>"The budget tracker saved us from overspending. Highly recommend to all couples!" - <span className="font-bold text-slate-800">Siddharth & Meera</span></p>
          </div>
        )
      },
      sustainability: {
        title: "Sustainability",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>We believe in celebrating love while respecting our planet. Vivah promotes eco-friendly wedding practices and connects you with sustainable vendors.</p>
          </div>
        )
      },
      refunds: {
        title: "Refunds",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Our cancellation and refund policy is designed to be fair to both couples and vendors. Please refer to individual vendor contracts for specific terms.</p>
          </div>
        )
      },
      support: {
        title: "Support",
        content: (
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Our Wedding Concierge and Vendor Support teams are available 24/7 to assist with any issues or special requests.</p>
            <p>Whether you're a couple looking for the perfect venue or a vendor needing help with your dashboard, we've got you covered.</p>
          </div>
        )
      }
    };

    return (
      <div className="p-6 space-y-8 pb-24 bg-ivory min-h-screen">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate('dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-rose">Information</h2>
        </div>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-gold rounded-3xl flex items-center justify-center shadow-xl">
            <Heart className="text-rose w-12 h-12 fill-current" />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <Sparkles size={24} className="text-gold mandala-glow" />
              <h3 className="brand-logo-large gold-shimmer">VIVAHA</h3>
              <Sparkles size={24} className="text-gold mandala-glow" />
            </div>
            <div className="flourish-underline w-24" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Version 2.4.0</p>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full py-2">
            {Object.keys(sections).map((key) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`px-6 py-2 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all ${activeSection === key ? 'bg-rose text-ivory shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {sections[key as keyof typeof sections].title}
              </button>
            ))}
          </div>

          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-left"
          >
            <h4 className="text-xl font-bold text-rose mb-4">{sections[activeSection].title}</h4>
            {sections[activeSection].content}
          </motion.div>

          <div className="pt-8 w-full space-y-4">
            <div 
              onClick={() => navigate('terms')}
              className="premium-card p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-bold text-slate-800">Terms of Service</span>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
            <div 
              onClick={() => navigate('privacy')}
              className="premium-card p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-bold text-slate-800">Privacy Policy</span>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TermsPage = () => (
    <div className="p-6 space-y-8 pb-24 bg-ivory min-h-screen">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('about_vivah')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-rose">Terms of Service</h2>
      </div>
      <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
        <p className="font-bold text-slate-800">Last Updated: April 2026</p>
        <section className="space-y-2">
          <h3 className="font-bold text-rose">1. Acceptance of Terms</h3>
          <p>By accessing and using Vivah, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        </section>
        <section className="space-y-2">
          <h3 className="font-bold text-rose">2. User Accounts</h3>
          <p>You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.</p>
        </section>
        <section className="space-y-2">
          <h3 className="font-bold text-rose">3. Vendor Bookings</h3>
          <p>Vivah acts as a platform to connect couples with vendors. While we vet vendors, the final contract is between you and the vendor.</p>
        </section>
      </div>
    </div>
  );

  const PrivacyPage = () => (
    <div className="p-6 space-y-8 pb-24 bg-ivory min-h-screen">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('about_vivah')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-rose">Privacy Policy</h2>
      </div>
      <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
        <p className="font-bold text-slate-800">Last Updated: April 2026</p>
        <section className="space-y-2">
          <h3 className="font-bold text-rose">1. Information We Collect</h3>
          <p>We collect information you provide directly to us, such as when you create an account, fill out your wedding details, or communicate with vendors.</p>
        </section>
        <section className="space-y-2">
          <h3 className="font-bold text-rose">2. How We Use Your Information</h3>
          <p>We use the information we collect to provide, maintain, and improve our services, and to personalize your wedding planning experience.</p>
        </section>
      </div>
    </div>
  );

  const GuestListPage = () => {
    const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
    const [newGuest, setNewGuest] = useState<Partial<Guest>>({
      name: '',
      relation: 'Friend',
      phone: '',
      email: '',
      rsvp: 'Pending'
    });

    const handleAddGuest = () => {
      if (!newGuest.name || !newGuest.phone) return;
      const guest: Guest = {
        id: Math.random().toString(36).substring(2, 9),
        name: newGuest.name!,
        relation: (newGuest.relation as RelationType) || 'Friend',
        phone: newGuest.phone!,
        email: newGuest.email,
        rsvp: 'Pending'
      };
      setState(prev => ({ ...prev, guests: [...(prev.guests || []), guest] }));
      setNewGuest({ name: '', relation: 'Friend', phone: '', email: '', rsvp: 'Pending' });
      setIsAddGuestOpen(false);
    };

    const deleteGuest = (id: string) => {
      setState(prev => ({
        ...prev,
        guests: prev.guests.filter(g => g.id !== id)
      }));
    };

    const updateRSVP = (id: string, rsvp: RSVPStatus) => {
      setState(prev => ({
        ...prev,
        guests: prev.guests.map(g => g.id === id ? { ...g, rsvp } : g)
      }));
    };

    const stats = {
      total: state.guests?.length || 0,
      accepted: state.guests?.filter(g => g.rsvp === 'Accepted').length || 0,
      declined: state.guests?.filter(g => g.rsvp === 'Not Attending').length || 0,
      maybe: state.guests?.filter(g => g.rsvp === 'Maybe').length || 0,
      pending: state.guests?.filter(g => g.rsvp === 'Pending').length || 0,
    };

    const sendInvite = (guest: Guest, platform: 'whatsapp' | 'sms' | 'email') => {
      const couple = state.userDetails?.fullName && state.weddingDetails?.fianceName 
        ? `${state.userDetails.fullName.split(' ')[0]} & ${state.weddingDetails.fianceName.split(' ')[0]}`
        : "Priya & Rohan";
      const date = state.weddingDetails?.date 
        ? new Date(state.weddingDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : "Dec 12, 2026";
      const location = state.weddingDetails?.city || "Udaipur";
      const link = window.location.origin;
      const message = `You are warmly invited to celebrate the wedding of ${couple} on ${date} at ${location}! 💍\nCheck all event details here: ${link}`;
      
      if (platform === 'whatsapp') {
        window.open(`https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`, '_blank');
      } else if (platform === 'sms') {
        window.open(`sms:${guest.phone}?body=${encodeURIComponent(message)}`, '_blank');
      } else if (platform === 'email' && guest.email) {
        window.open(`mailto:${guest.email}?subject=Wedding Invitation&body=${encodeURIComponent(message)}`, '_blank');
      }
    };

    return (
      <div className="p-6 space-y-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate('dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-rose">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-rose">Invite Guests</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Guest List Dashboard</h3>
            <p className="text-slate-400 text-xs">Track RSVPs and send invites</p>
          </div>
          <button 
            onClick={() => setIsAddGuestOpen(true)}
            className="bg-rose text-ivory p-3 rounded-2xl shadow-xl shadow-rose/20 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="premium-card p-4 bg-white border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Invited</p>
            <p className="text-2xl font-bold text-rose">{stats.total}</p>
          </div>
          <div className="premium-card p-4 bg-emerald-50 border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">Accepted</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.accepted}</p>
          </div>
          <div className="premium-card p-4 bg-rose/5 border-rose/10">
            <p className="text-[10px] uppercase font-bold text-rose tracking-widest mb-1">Declined</p>
            <p className="text-2xl font-bold text-rose">{stats.declined}</p>
          </div>
          <div className="premium-card p-4 bg-amber-50 border-amber-100">
            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-widest mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
          </div>
        </div>

        {/* Guest List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-gold" /> Invite Family & Relatives
          </h3>
          {state.guests?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <Users size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">No guests added yet</p>
              <button onClick={() => setIsAddGuestOpen(true)} className="text-rose font-bold text-sm mt-2">Add your first guest</button>
            </div>
          ) : (
            <div className="space-y-3">
              {state.guests?.map(guest => (
                <div key={guest.id} className="premium-card p-5 bg-white border-slate-100 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{guest.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{guest.relation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        guest.rsvp === 'Accepted' ? 'bg-emerald-100 text-emerald-600' :
                        guest.rsvp === 'Not Attending' ? 'bg-rose/10 text-rose' :
                        guest.rsvp === 'Maybe' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {guest.rsvp}
                      </div>
                      <button 
                        onClick={() => deleteGuest(guest.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => sendInvite(guest, 'whatsapp')}
                      className="flex-1 bg-[#25D366] text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button 
                      onClick={() => sendInvite(guest, 'sms')}
                      className="flex-1 bg-slate-800 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={14} /> SMS
                    </button>
                    {guest.email && (
                      <button 
                        onClick={() => sendInvite(guest, 'email')}
                        className="flex-1 bg-rose text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1"
                      >
                        <Send size={14} /> Email
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-auto">RSVP Status:</p>
                    {['Accepted', 'Maybe', 'Not Attending'].map(status => (
                      <button 
                        key={status}
                        onClick={() => updateRSVP(guest.id, status as RSVPStatus)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${guest.rsvp === status ? 'bg-rose text-white border-rose' : 'bg-white text-slate-400 border-slate-100'}`}
                      >
                        {status === 'Not Attending' ? 'Decline' : status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Guest Modal */}
        <AnimatePresence>
          {isAddGuestOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddGuestOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-ivory w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-rose">Add Guest</h3>
                  <button onClick={() => setIsAddGuestOpen(false)} className="text-slate-400"><X size={24} /></button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest Name</label>
                    <input 
                      type="text" 
                      value={newGuest.name}
                      onChange={e => setNewGuest({...newGuest, name: e.target.value})}
                      placeholder="Enter guest name" 
                      className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-rose" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relation</label>
                    <div className="flex gap-2">
                      {['Family', 'Friend', 'Relative'].map(rel => (
                        <button 
                          key={rel}
                          onClick={() => setNewGuest({...newGuest, relation: rel as RelationType})}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${newGuest.relation === rel ? 'bg-rose text-white border-rose' : 'bg-white text-slate-600 border-slate-100'}`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input 
                      type="tel" 
                      value={newGuest.phone}
                      onChange={e => setNewGuest({...newGuest, phone: e.target.value})}
                      placeholder="+91 98765 43210" 
                      className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-rose" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email (Optional)</label>
                    <input 
                      type="email" 
                      value={newGuest.email}
                      onChange={e => setNewGuest({...newGuest, email: e.target.value})}
                      placeholder="guest@example.com" 
                      className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-rose" 
                    />
                  </div>
                  
                  <button 
                    onClick={handleAddGuest}
                    className="w-full bg-rose text-ivory py-4 rounded-2xl font-bold mt-4 shadow-xl shadow-rose/20 active:scale-95 transition-all"
                  >
                    Add to Guest List
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const BudgetTab = () => {
    return (
      <div className="pb-24">
        {weddingId ? (
          <BudgetOverview 
            userType={state.userType as 'bride' | 'groom'} 
            weddingId={weddingId} 
          />
        ) : (
          <div className="p-12 text-center space-y-4">
            <PieChart size={64} className="mx-auto text-slate-200" />
            <h3 className="text-xl font-bold text-slate-800">No Wedding Found</h3>
            <p className="text-slate-500">Please complete your onboarding to start tracking your budget.</p>
            <button 
              onClick={() => navigate('onboarding_form')}
              className="bg-rose text-white px-8 py-3 rounded-2xl font-bold"
            >
              Set Up Wedding
            </button>
          </div>
        )}
      </div>
    );
  };

  const ProfileTab = () => {
    const weddingDate = state.weddingDetails?.date ? new Date(state.weddingDetails.date) : null;
    const today = new Date();
    // Ensure we calculate correctly even if the date is today
    const diffTime = weddingDate ? weddingDate.getTime() - today.getTime() : 0;
    const daysLeft = weddingDate ? Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) : null;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setState(prev => ({
            ...prev,
            userDetails: prev.userDetails ? {
              ...prev.userDetails,
              profileImage: base64String
            } : {
              fullName: 'Vivaha User',
              state: '',
              city: '',
              address: '',
              profileImage: base64String
            }
          }));
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="p-6 space-y-8 pb-24">
        <div className="flex flex-col items-center text-center pt-8">
          <div className="relative mb-4 group">
            <div 
              className="w-32 h-32 rounded-full border-4 border-gold p-1 relative overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {state.userDetails?.profileImage ? (
                <img src={state.userDetails.profileImage} className="w-full h-full rounded-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Edit className="text-white" size={24} />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            {state.isPremium && (
              <div className="absolute -bottom-2 -right-2 bg-gold text-rose p-2 rounded-full shadow-lg border-2 border-ivory">
                <Crown size={20} />
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-rose">{state.userDetails?.fullName || 'Vivaha User'}</h2>
          <p className="text-slate-500 capitalize">{state.userType || 'User'} • {daysLeft !== null ? `Wedding in ${daysLeft} Days` : 'Planning your big day'}</p>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-6 py-2 rounded-full bg-gold/10 text-gold font-bold text-xs uppercase tracking-widest hover:bg-gold/20 transition-all flex items-center gap-2"
          >
            <ImageIcon size={14} />
            {state.userDetails?.profileImage ? 'Change Photo' : 'Upload Photo'}
          </button>
        </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Saved', count: 12, icon: <Heart size={18} />, screen: 'saved_vendors' },
          { label: 'Bookings', count: 0, icon: <Calendar size={18} />, screen: 'bookings' },
          { label: 'Boards', count: 6, icon: <ImageIcon size={18} />, screen: 'inspiration' },
        ].map(stat => (
          <button 
            key={stat.label} 
            onClick={() => {
              if (stat.screen === 'inspiration') {
                setActiveTab('inspiration');
              } else {
                navigate(stat.screen as any);
              }
            }}
            className="premium-card p-4 text-center hover:bg-slate-50 transition-colors"
          >
            <div className="text-gold flex justify-center mb-1">{stat.icon}</div>
            <p className="text-lg font-bold text-rose">{stat.count}</p>
            <p className="text-[10px] uppercase font-bold text-slate-400">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Account Settings</h3>
        <div className="premium-card divide-y divide-slate-50">
          {[
            { icon: <User size={20} />, label: 'Personal Information', screen: 'settings' },
            { icon: <Heart size={20} />, label: 'Fiancé Information', screen: 'settings' },
            { icon: <Calendar size={20} />, label: 'Wedding Details', screen: 'settings' },
            { icon: <Crown size={20} />, label: 'Subscription Plan', extra: state.isPremium ? 'Premium' : 'Free', screen: 'packages' },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                if (item.screen === 'packages') {
                  setActiveTab('packages');
                } else {
                  navigate(item.screen as any);
                }
              }}
              className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="text-rose/60">{item.icon}</div>
              <span className="font-medium text-slate-700">{item.label}</span>
              {item.extra && <span className="ml-auto text-xs font-bold text-gold uppercase">{item.extra}</span>}
              {!item.extra && <ChevronRight className="ml-auto text-slate-300" size={18} />}
            </button>
          ))}
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 pt-4">Support & Privacy</h3>
        <div className="premium-card divide-y divide-slate-50">
          {[
            { icon: <MessageSquare size={20} />, label: 'Help & Support', screen: 'help_support' },
            { icon: <ShieldCheck size={20} />, label: 'About Vivah', screen: 'about_vivah' },
            { icon: <LogOut size={20} />, label: 'Logout', color: 'text-red-500' },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={async () => {
                if (item.label === 'Logout') {
                  try {
                    await signOut(auth);
                    setShowSplash(true);
                    setState(prev => ({ ...prev, screen: 'splash', userType: null }));
                  } catch (error) {
                    console.error("Logout failed", error);
                  }
                } else if (item.screen) {
                  navigate(item.screen as any);
                }
              }}
              className={`w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors ${item.color || 'text-slate-700'}`}>
              <div className="opacity-60">{item.icon}</div>
              <span className="font-medium">{item.label}</span>
              <ChevronRight className="ml-auto text-slate-300" size={18} />
            </button>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
};

  const InspirationDetailModal: React.FC<{ board: InspirationBoard, onClose: () => void }> = ({ board, onClose }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-ivory w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col"
      >
        <div className="relative h-64 flex-shrink-0">
          <img src={board.img} className="w-full h-full object-cover" alt={board.name} referrerPolicy="no-referrer" />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-ivory hover:bg-black/40 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-3xl font-bold text-ivory">{board.name} Catalogue</h2>
            <p className="text-gold font-bold text-xs uppercase tracking-widest">{board.count} Curated Ideas</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
            <p className="text-slate-600 leading-relaxed">
              {board.description}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Gallery</h3>
            <div className="grid grid-cols-2 gap-4">
              {board.catalogue.map((item) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden aspect-[3/4]">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-ivory text-[10px] font-bold uppercase tracking-widest">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );

  const VendorDetailModal: React.FC<{ vendor: Vendor, onClose: () => void }> = ({ vendor, onClose }) => {
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', weddingDate: '', message: '' });
    const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'reviews'>('overview');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setFormStatus('sending');
      // Simulate API call
      setTimeout(() => {
        setFormStatus('sent');
        setFormData({ name: '', email: '', phone: '', weddingDate: '', message: '' });
        setTimeout(() => setFormStatus('idle'), 3000);
      }, 1500);
    };

    const mockReviews = [
      { id: 1, user: "Ananya R.", rating: 5, comment: "Absolutely incredible service! They made our wedding day so special.", date: "2 weeks ago" },
      { id: 2, user: "Rahul M.", rating: 4, comment: "Very professional and punctual. The quality was top-notch.", date: "1 month ago" },
      { id: 3, user: "Sneha K.", rating: 5, comment: "Exceeded all our expectations. Highly recommended!", date: "3 months ago" }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-ivory w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col"
        >
          <div className="relative h-64 flex-shrink-0">
            <img src={vendor.image} className="w-full h-full object-cover" alt={vendor.name} referrerPolicy="no-referrer" />
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-ivory hover:bg-black/40 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-between items-end">
                <div>
                  <span className="bg-gold text-rose text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                    {vendor.category}
                  </span>
                  <h2 className="text-3xl font-bold text-ivory">{vendor.name}</h2>
                  <p className="text-ivory/80 text-xs flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {vendor.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-gold bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                  <Sparkles size={14} fill="currentColor" />
                  <span className="text-sm font-bold">{vendor.rating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100 bg-white px-8">
            {['overview', 'gallery', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-rose' : 'text-slate-400'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose" 
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {activeTab === 'overview' && (
              <>
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Featured Gallery</h3>
                    <button onClick={() => setActiveTab('gallery')} className="text-[10px] font-bold text-gold uppercase tracking-widest">View All</button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                    {vendor.portfolio?.slice(0, 4).map((item) => (
                      <div 
                        key={item.id} 
                        className="flex-shrink-0 w-48 aspect-[4/5] rounded-2xl overflow-hidden relative group cursor-pointer"
                        onClick={() => setActiveGalleryImage(item.image)}
                      >
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-ivory text-[10px] font-bold uppercase tracking-widest">{item.title}</p>
                        </div>
                      </div>
                    )) || (
                      <div className="w-full py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <ImageIcon className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-xs text-slate-400">No portfolio items available yet.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About the Vendor</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {vendor.description || "A premier wedding service provider dedicated to making your special day unforgettable with exceptional quality and attention to detail."}
                  </p>
                </section>

                {vendor.specificServices && vendor.specificServices.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {vendor.specificServices.map(service => (
                        <span key={service} className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                          {service}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Location</h3>
                  <div className="bg-slate-100 rounded-3xl p-4 flex items-center gap-4 border border-slate-200">
                    <div className="w-12 h-12 bg-rose/10 rounded-2xl flex items-center justify-center text-rose">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{vendor.location}</p>
                      <p className="text-[10px] text-slate-500">View on Google Maps</p>
                    </div>
                    <button className="ml-auto bg-white p-2 rounded-xl border border-slate-200 text-rose hover:bg-rose hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>

                {vendor.availability && vendor.availability.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Available Dates</h3>
                    <div className="flex flex-wrap gap-2">
                      {vendor.availability.map(date => (
                        <span key={date} className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={10} /> {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Mail size={14} className="text-gold" /> Request a Quote
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your Name"
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gold text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gold text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 00000 00000"
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gold text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Wedding Date</label>
                        <input 
                          type="date" 
                          required
                          value={formData.weddingDate}
                          onChange={e => setFormData({ ...formData, weddingDate: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gold text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Requirements</label>
                      <textarea 
                        required
                        rows={3}
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell the vendor about your guest count and specific needs..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gold text-sm resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        type="submit"
                        disabled={formStatus !== 'idle'}
                        className={`flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          formStatus === 'sent' ? 'bg-emerald-500 text-white' : 'bg-rose text-ivory hover:bg-rose-600 active:scale-95'
                        }`}
                      >
                        {formStatus === 'idle' && <><Send size={16} /> Request Quote</>}
                        {formStatus === 'sending' && <div className="w-5 h-5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />}
                        {formStatus === 'sent' && <><CheckCircle2 size={16} /> Request Sent!</>}
                      </button>
                      {vendor.phone && (
                        <a 
                          href={`tel:${vendor.phone}`}
                          className="flex-1 bg-white border border-rose/20 text-rose py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose/5 transition-all active:scale-95"
                        >
                          <Phone size={16} /> Call
                        </a>
                      )}
                    </div>
                  </form>
                </section>

                <section className="bg-rose/5 p-6 rounded-3xl border border-rose/10">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Starting Price</p>
                      <p className="text-2xl font-bold text-rose">{vendor.price}</p>
                    </div>
                    <button className="bg-rose text-ivory px-6 py-3 rounded-2xl font-bold shadow-lg shadow-rose/20 active:scale-95 transition-transform">
                      Book Now
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center">*Prices may vary based on customization and requirements.</p>
                </section>
              </>
            )}

            {activeTab === 'gallery' && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portfolio Showcase</h3>
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">{vendor.portfolio?.length || 0} Items</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {vendor.portfolio?.map((item) => (
                    <motion.div 
                      layoutId={`portfolio-${item.id}`}
                      key={item.id} 
                      className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                      onClick={() => setActiveGalleryImage(item.image)}
                    >
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                        <p className="text-ivory text-[10px] font-bold uppercase tracking-widest mb-1">{item.title}</p>
                        <div className="w-8 h-0.5 bg-gold rounded-full" />
                      </div>
                    </motion.div>
                  )) || (
                    <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                      <ImageIcon className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-sm font-medium text-slate-400">No portfolio items available yet.</p>
                      <p className="text-xs text-slate-300 mt-1">Check back later for updates!</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'reviews' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client Feedback</h3>
                  <div className="flex items-center gap-1 text-gold">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm font-bold">{vendor.rating}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {mockReviews.map(review => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={review.id} 
                      className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose/5 flex items-center justify-center text-rose font-bold text-xs">
                            {review.user.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{review.user}</p>
                            <p className="text-[10px] text-slate-400">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-gold">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < review.rating ? "fill-current" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed bg-slate-50/50 p-4 rounded-2xl">
                        "{review.comment}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </motion.div>

        {/* Lightbox for Gallery */}
        <AnimatePresence>
          {activeGalleryImage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveGalleryImage(null)}
              className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
            >
              <button className="absolute top-8 right-8 text-white">
                <X size={32} />
              </button>
              <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={activeGalleryImage} 
                className="max-w-full max-h-full rounded-2xl shadow-2xl" 
                alt="Gallery Preview"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const Footer = () => (
    <footer className="bg-slate-800 text-slate-300 pt-12 pb-8 px-6 mt-12">
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="col-span-2">
          <div className="flex flex-col items-start mb-8">
            <div className="flex items-center gap-3">
              <Sparkles size={24} className="text-gold mandala-glow" />
              <h2 className="brand-logo-large gold-shimmer">VIVAHA</h2>
            </div>
            <div className="flourish-underline-left w-32" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <h4 className="text-ivory font-bold uppercase tracking-widest mb-2">About Vivaha</h4>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Who are we?</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Careers</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Authenticity</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Testimonials</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Sustainability</p>
              <p className="hover:text-gold cursor-pointer text-rose">Investor Relations</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-ivory font-bold uppercase tracking-widest mb-2">Help</h4>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Contact Us</p>
              <p onClick={() => navigate('help_support')} className="hover:text-gold cursor-pointer">FAQs</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Wedding Concierge</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Cancellation & Refund</p>
              <p onClick={() => navigate('about_vivah')} className="hover:text-gold cursor-pointer">Vendor Support</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="text-ivory font-bold uppercase tracking-widest mb-2">Inspire Me</h4>
          <p className="hover:text-gold cursor-pointer">Wedding Blog</p>
          <p className="hover:text-gold cursor-pointer">Mood Boards</p>
          <p className="hover:text-gold cursor-pointer">Planning Guides</p>
          <p className="hover:text-gold cursor-pointer">Success Stories</p>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="text-ivory font-bold uppercase tracking-widest mb-2">Quick Links</h4>
          <p className="hover:text-gold cursor-pointer">Special Offers</p>
          <p className="hover:text-gold cursor-pointer">New Vendors</p>
          <p className="hover:text-gold cursor-pointer">Destination Weddings</p>
          <p className="hover:text-gold cursor-pointer">Luxury Packages</p>
          <p className="hover:text-gold cursor-pointer">Sitemap</p>
        </div>

        <div className="col-span-2 space-y-3 text-xs">
          <h4 className="text-ivory font-bold uppercase tracking-widest mb-2">Top Categories</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <p className="hover:text-gold cursor-pointer">Venues</p>
            <p className="hover:text-gold cursor-pointer">Photography</p>
            <p className="hover:text-gold cursor-pointer">Makeup Artists</p>
            <p className="hover:text-gold cursor-pointer">Decorators</p>
            <p className="hover:text-gold cursor-pointer">Catering</p>
            <p className="hover:text-gold cursor-pointer">Bridal Wear</p>
            <p className="hover:text-gold cursor-pointer">Groom Wear</p>
            <p className="hover:text-gold cursor-pointer">Invitations</p>
            <p className="hover:text-gold cursor-pointer">Jewelry</p>
            <p className="hover:text-gold cursor-pointer">Honeymoon</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-8 pb-4">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center text-rose">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-ivory uppercase">Verified Vendors</h5>
              <p className="text-[9px] text-slate-500">Curated & Vetted</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center text-rose">
              <Lock size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-ivory uppercase">Secure Booking</h5>
              <p className="text-[9px] text-slate-500">100% Payment Protection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center text-rose">
              <Star size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-ivory uppercase">Authentic Reviews</h5>
              <p className="text-[9px] text-slate-500">Real Couple Feedback</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center text-rose">
              <Users size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-ivory uppercase">5000+ Vendors</h5>
              <p className="text-[9px] text-slate-500">Across 50+ Cities</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-slate-700 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Show us some love ❤️ on social media</p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
              <Instagram size={16} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
              <Facebook size={16} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
              <Twitter size={16} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
              <Youtube size={16} />
            </div>
          </div>
        </div>
      </div>

    </footer>
  );

  // --- Render Logic ---

  const LoadingOverlay = () => (
    <AnimatePresence>
      {globalLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
          <p className="text-gold font-serif italic text-lg">Please wait...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ErrorToast = () => (
    <AnimatePresence>
      {globalError && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-6 right-6 bg-red-500 text-white p-4 rounded-2xl shadow-xl z-[1000] flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-xs font-bold">{globalError}</p>
          </div>
          <button onClick={() => setGlobalError(null)} className="p-1">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading && showSplash) {
    return (
      <div className="w-full max-w-md mx-auto h-[100dvh] bg-rose flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
        <p className="text-gold font-serif italic">Vivaha is loading...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full max-w-md mx-auto h-[100dvh] bg-ivory shadow-2xl relative overflow-x-hidden flex flex-col box-border">
        <LoadingOverlay />
        <ErrorToast />
        
        <AnimatePresence>
          {selectedVendor && (
            <VendorDetailModal 
              key="vendor-modal"
              vendor={selectedVendor} 
              onClose={() => setSelectedVendor(null)} 
            />
          )}
          {selectedBoard && (
            <InspirationDetailModal 
              key="board-modal"
              board={selectedBoard} 
              onClose={() => setSelectedBoard(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpertChatOpen && (
            <ExpertChatModal 
              key="expert-chat-modal" 
              isOpen={isExpertChatOpen}
              onClose={() => setIsExpertChatOpen(false)}
              messages={chatMessages}
              setMessages={setChatMessages}
              input={chatInput}
              setInput={setChatInput}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              tasks={tasks}
              setTasks={setTasks}
              state={state}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}

        {!showSplash && state.screen === 'onboarding_info' && <OnboardingInfo key="info" />}
        {!showSplash && state.screen === 'role_selection' && <RoleSelectionScreen key="roles" />}
        {!showSplash && state.screen === 'user_type' && <UserTypeSelection key="type" />}
        {!showSplash && state.screen === 'auth' && <AuthScreen key="auth" />}
        {!showSplash && state.screen === 'admin_login' && <AdminLogin key="admin_login" onLogin={(user) => setState(prev => ({ ...prev, screen: 'admin_dashboard', adminUser: user }))} />}
        {!showSplash && state.screen === 'admin_dashboard' && state.adminUser && <AdminDashboard key="admin_dashboard" admin={state.adminUser} appState={state} onLogout={() => setState(prev => ({ ...prev, screen: 'user_type', adminUser: undefined }))} />}
        {!showSplash && state.screen === 'vendor_dashboard' && <VendorDashboard key="vendor_dashboard" onLogout={() => setState(prev => ({ ...prev, screen: 'user_type' }))} />}
        {!showSplash && state.screen === 'planner_dashboard' && <AiConciergeDashboard key="planner_dashboard" onLogout={() => setState(prev => ({ ...prev, screen: 'user_type' }))} onLaunchAi={() => setIsExpertChatOpen(true)} />}
        {!showSplash && state.screen === 'onboarding_form' && <OnboardingForm key="form" />}
        
        {!showSplash && ['dashboard', 'checklist', 'inspiration', 'packages', 'profile', 'category_page', 'real_weddings', 'blogs', 'bookings', 'saved_vendors', 'settings', 'help_support', 'about_vivah', 'guest_list'].includes(state.screen) && (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col relative overflow-hidden"
          >
            {!['bookings', 'saved_vendors', 'settings', 'help_support', 'about_vivah', 'guest_list'].includes(state.screen) && <TopBar />}
            <MegaMenu />
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <AnimatePresence mode="wait">
                {state.screen === 'category_page' && <motion.div key="cp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-50"><CategoryPage /></motion.div>}
                {state.screen === 'real_weddings' && <motion.div key="rw" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-50"><RealWeddingsPage /></motion.div>}
                {state.screen === 'blogs' && <motion.div key="bl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-50"><BlogsPage /></motion.div>}
                {state.screen === 'bookings' && <motion.div key="bk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><BookingsPage /></motion.div>}
                {state.screen === 'saved_vendors' && <motion.div key="sv" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><SavedVendorsPage /></motion.div>}
                {state.screen === 'settings' && <motion.div key="st" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><SettingsPage /></motion.div>}
                {state.screen === 'help_support' && <motion.div key="hs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><HelpSupportPage /></motion.div>}
                {state.screen === 'about_vivah' && <motion.div key="av" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><AboutVivahPage /></motion.div>}
        {state.screen === 'terms' && <motion.div key="terms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><TermsPage /></motion.div>}
        {state.screen === 'privacy' && <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><PrivacyPage /></motion.div>}
                {state.screen === 'guest_list' && <motion.div key="gl" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-50"><GuestListPage /></motion.div>}
                
                {activeTab === 'home' && state.screen === 'dashboard' && <motion.div key="h" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><HomeTab /></motion.div>}
                {activeTab === 'checklist' && state.screen === 'dashboard' && <motion.div key="c" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><ChecklistTab /></motion.div>}
                {activeTab === 'inspiration' && state.screen === 'dashboard' && <motion.div key="i" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><InspirationTab /></motion.div>}
                {activeTab === 'packages' && state.screen === 'dashboard' && <motion.div key="p" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><PackagesTab /></motion.div>}
                {activeTab === 'budget' && state.screen === 'dashboard' && <motion.div key="b" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><BudgetTab /></motion.div>}
                {activeTab === 'profile' && state.screen === 'dashboard' && <motion.div key="pr" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><ProfileTab /></motion.div>}
              </AnimatePresence>
            </div>
            {!['bookings', 'saved_vendors', 'settings', 'help_support', 'about_vivah', 'guest_list'].includes(state.screen) && <BottomNav />}

            {/* Side Menu Drawer */}
            <AnimatePresence>
              {sideMenuOpen && (
                <>
                  <motion.div 
                    key="sidemenu-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSideMenuOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                  />
                  <motion.div 
                    key="sidemenu-drawer"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    className="absolute top-0 left-0 bottom-0 w-4/5 bg-ivory z-[101] shadow-2xl p-8 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-12">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <Sparkles size={20} className="text-gold mandala-glow" />
                          <h2 className="brand-logo-large gold-shimmer">VIVAHA</h2>
                        </div>
                        <div className="flourish-underline-left w-24" />
                      </div>
                      <button onClick={() => setSideMenuOpen(false)} className="text-rose p-2 -mr-2">
                        <Plus className="rotate-45" size={28} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                      {[
                        { icon: <LayoutDashboard />, label: 'Dashboard', screen: 'dashboard' },
                        { icon: <Calendar />, label: 'Wedding Timeline' },
                        { icon: <User />, label: 'Guest Management', screen: 'guest_list' },
                        { icon: <Info />, label: 'About Vivah', screen: 'about_vivah' },
                        { icon: <Sparkles />, label: 'AI Planning' },
                        { icon: <Settings />, label: 'App Settings', screen: 'settings' },
                        { icon: <Users />, label: 'Switch Role', screen: 'role_selection' },
                      ].map((item) => (
                        <button 
                          key={item.label} 
                          onClick={() => {
                            if (item.screen) navigate(item.screen as any);
                            setSideMenuOpen(false);
                          }}
                          className="flex items-center gap-4 text-slate-700 font-medium text-lg w-full text-left"
                        >
                          <div className="text-rose/60">{item.icon}</div>
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          await signOut(auth);
                          setState(prev => ({ ...prev, screen: 'role_selection', userType: null }));
                          setSideMenuOpen(false);
                        } catch (error) {
                          console.error("Logout failed", error);
                        }
                      }}
                      className="flex items-center gap-4 text-red-500 font-bold text-lg mt-auto"
                    >
                      <LogOut /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Notifications Drawer */}
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <motion.div 
                    key="notifications-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setNotificationsOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                  />
                  <motion.div 
                    key="notifications-drawer"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute top-0 right-0 bottom-0 w-4/5 bg-ivory z-[101] shadow-2xl p-8 flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-rose">Notifications</h2>
                      <button onClick={() => setNotificationsOpen(false)} className="text-rose">
                        <Plus className="rotate-45" size={28} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {[
                        { title: 'New Vendor Offer', desc: 'The Wedding Salad offered 10% discount!', time: '2h ago' },
                        { title: 'Checklist Update', desc: "Don't forget to finalize the guest list.", time: '5h ago' },
                        { title: 'AI Suggestion', desc: 'New decor themes available for Udaipur.', time: '1d ago' },
                      ].map((n, i) => (
                        <div key={`notification-${i}`} className="premium-card p-4 border-l-4 border-rose">
                          <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                          <p className="text-xs text-slate-500 mb-1">{n.desc}</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence>
          {!showSplash && !isExpertChatOpen && (
            <motion.div 
              key="chat-button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpertChatOpen(true)}
              className="absolute bottom-20 right-4 z-[150] bg-white rounded-full shadow-2xl p-3 flex items-center gap-3 border border-slate-100 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-rose flex items-center justify-center text-ivory">
                <MessageCircle size={24} />
              </div>
              <span className="text-xs font-bold text-slate-700 pr-2">How may we help you?</span>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

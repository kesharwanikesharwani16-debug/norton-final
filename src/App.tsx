/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Settings, 
  History, 
  Lock, 
  Globe, 
  Cpu, 
  Bell,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  CreditCard,
  Star,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Notification Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'info' | 'success' | 'warning', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
      type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
      type === 'warning' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
      'bg-norton-yellow/20 border-norton-yellow/30 text-norton-yellow'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : type === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">×</button>
  </motion.div>
);

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-norton-gray border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <AlertTriangle size={20} className="opacity-50" />
            </button>
          </div>
          {children}
          <div className="mt-8">
            <button 
              onClick={onClose}
              className="w-full py-3 bg-norton-yellow text-black font-bold rounded-xl hover:bg-yellow-400 transition-all"
            >
              Understand
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const STATIC_TIPS = [
  "Enable two-factor authentication (2FA) on all your important accounts to add an extra layer of security.",
  "Be cautious of unsolicited emails or messages asking for personal information or containing suspicious links.",
  "Keep your operating system and all installed software up to date to protect against known vulnerabilities.",
  "Use a reputable password manager to create and store strong, unique passwords for every site you use.",
  "Regularly back up your important files to an external drive or a secure cloud storage service.",
  "Avoid using public Wi-Fi for sensitive activities like banking or shopping unless you use a VPN.",
  "Check your privacy settings on social media platforms to control who can see your personal information.",
  "Be wary of downloading software or files from untrusted sources; they may contain malware.",
  "Lock your computer or mobile device with a strong PIN, password, or biometric authentication.",
  "Review your financial statements regularly for any unauthorized transactions or suspicious activity."
];

type ScanStatus = 'idle' | 'scanning' | 'complete' | 'threats_found';

const NortonLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="40" stroke="#FFD300" strokeWidth="12" />
    <path 
      d="M30 50L45 65L75 35" 
      stroke="black" 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

export default function App() {
  const [view, setView] = useState<'dashboard' | 'plans'>('dashboard');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [securityTip, setSecurityTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSecurityTip = async () => {
    setLoadingTip(true);
    
    if (!ai) {
      const randomTip = STATIC_TIPS[Math.floor(Math.random() * STATIC_TIPS.length)];
      setTimeout(() => {
        setSecurityTip(randomTip);
        setLoadingTip(false);
      }, 800);
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Give me a short, professional security tip for a computer user. Keep it under 2 sentences.",
      });
      setSecurityTip(response.text || STATIC_TIPS[0]);
    } catch (error) {
      console.error('Error fetching security tip:', error);
      setSecurityTip(STATIC_TIPS[Math.floor(Math.random() * STATIC_TIPS.length)]);
    } finally {
      setLoadingTip(false);
    }
  };

  useEffect(() => {
    fetchSecurityTip();
  }, []);

  const startScan = () => {
    setScanStatus('scanning');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanStatus('complete');
          showToast('System scan completed successfully!', 'success');
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  return (
    <div className="flex h-screen bg-norton-dark text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,211,0,0.2)]">
            <NortonLogo className="w-8 h-8" />
          </div>
          <span className="font-bold text-lg tracking-tight">NORTON<span className="text-norton-yellow">360</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem 
            icon={<ShieldCheck size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
          />
          <NavItem 
            icon={<CreditCard size={20} />} 
            label="Subscription Plans" 
            active={view === 'plans'} 
            onClick={() => setView('plans')}
          />
          <NavItem icon={<Search size={20} />} label="Security Scan" onClick={() => showToast('Scan module initialized', 'info')} />
          <NavItem icon={<Globe size={20} />} label="Web Protection" onClick={() => setShowModal(true)} />
          <NavItem icon={<Lock size={20} />} label="Privacy Manager" />
          <NavItem icon={<History size={20} />} label="Security History" />
          <NavItem icon={<Cpu size={20} />} label="Performance" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-norton-dark/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>Home</span>
            <ChevronRight size={14} />
            <span className="text-white capitalize">{view}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-norton-yellow rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-neutral-700 border border-white/10 flex items-center justify-center text-xs font-bold">
              JD
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto space-y-8">
          {view === 'dashboard' ? (
            <>
              <section className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/5 p-8 flex items-center justify-between">
                <div className="relative z-10 space-y-4 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
                    <CheckCircle2 size={14} />
                    System Protected
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight">You are <span className="text-norton-yellow">Safe</span></h1>
                  <p className="text-neutral-400 leading-relaxed">
                    Your system is currently being monitored for threats. All security modules are active and up to date.
                  </p>
                  <div className="flex gap-4 pt-2">
                    <button 
                      onClick={startScan}
                      disabled={scanStatus === 'scanning'}
                      className="px-6 py-3 bg-norton-yellow text-black font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-norton-yellow/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Search size={18} />
                      Run Smart Scan
                    </button>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 font-semibold rounded-xl transition-all border border-white/10">
                      View Details
                    </button>
                  </div>
                </div>
                
                <div className="relative hidden md:block">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-64 h-64 bg-norton-yellow/10 rounded-full flex items-center justify-center relative"
                  >
                    <div className="absolute inset-0 border-2 border-dashed border-norton-yellow/20 rounded-full animate-spin-slow"></div>
                    <NortonLogo className="w-32 h-32" />
                  </motion.div>
                </div>
              </section>

              <AnimatePresence>
                {scanStatus === 'scanning' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-norton-yellow/10 border border-norton-yellow/30 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="animate-spin text-norton-yellow" size={20} />
                        <span className="font-semibold">Scanning system files...</span>
                      </div>
                      <span className="font-mono text-norton-yellow">{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-norton-yellow"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SecurityCard 
                  icon={<Zap className="text-norton-yellow" />}
                  title="Quick Scan"
                  description="Check critical system areas for immediate threats."
                  action="Start"
                  onClick={() => showToast('Quick scan started...', 'info')}
                />
                <SecurityCard 
                  icon={<Lock className="text-norton-yellow" />}
                  title="Safe Web"
                  description="Blocks malicious websites and phishing attempts."
                  action="Manage"
                  status="Active"
                  onClick={() => setShowModal(true)}
                />
                <SecurityCard 
                  icon={<RefreshCw className="text-norton-yellow" />}
                  title="Live Update"
                  description="Keep your virus definitions and software current."
                  action="Check"
                  status="Up to date"
                  onClick={() => showToast('Checking for updates...', 'info')}
                />
              </div>

              <section className="bg-gradient-to-br from-norton-gray to-black border border-white/5 rounded-3xl p-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                    <Info className="text-norton-yellow" size={24} />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Security Insight</h3>
                      <button 
                        onClick={fetchSecurityTip}
                        disabled={loadingTip}
                        className="text-xs text-norton-yellow hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={loadingTip ? 'animate-spin' : ''} />
                        Refresh Tip
                      </button>
                    </div>
                    <div className="text-neutral-300 italic min-h-[3rem]">
                      {loadingTip ? (
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-norton-yellow/50 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-norton-yellow/50 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-norton-yellow/50 rounded-full animate-bounce delay-200"></div>
                        </div>
                      ) : (
                        <Markdown>{securityTip}</Markdown>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Choose Your <span className="text-norton-yellow">Protection</span></h2>
                <p className="text-neutral-400 max-w-2xl mx-auto">
                  Select the plan that best fits your security needs. Upgrade anytime to unlock advanced features.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PricingCard 
                  title="Basic"
                  price="Free"
                  features={["Smart Scan", "Basic Malware Removal", "Security Insights"]}
                  icon={<Shield className="text-neutral-400" />}
                  onSelect={() => showToast('You are already on the Basic plan', 'info')}
                />
                <PricingCard 
                  title="Premium"
                  price="$9.99"
                  period="/mo"
                  features={["Real-time Protection", "Secure VPN", "Password Manager", "Safe Web Browsing"]}
                  icon={<Star className="text-norton-yellow" />}
                  highlight
                  onSelect={() => showToast('Redirecting to secure checkout...', 'success')}
                />
                <PricingCard 
                  title="Family"
                  price="$14.99"
                  period="/mo"
                  features={["Up to 5 Devices", "Parental Controls", "Cloud Backup (50GB)", "Priority Support"]}
                  icon={<Users className="text-norton-yellow" />}
                  onSelect={() => showToast('Redirecting to secure checkout...', 'success')}
                />
              </div>
            </div>
          )}

          <footer className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 text-xs">
            <div className="flex gap-6">
              <span>© 2026 NORTON360 Security</span>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Cloud Protection: Connected</span>
            </div>
          </footer>
        </div>
      </main>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Web Protection"
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="text-green-400" size={24} />
            <div>
              <p className="font-bold text-green-400">Active & Secure</p>
              <p className="text-xs text-neutral-400">Your browser is being protected in real-time.</p>
            </div>
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Norton Safe Web provides protection against identity theft and online scams by warning you of dangerous sites while you search, shop, or browse online.
          </p>
        </div>
      </Modal>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <a 
      href="#" 
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
        active 
          ? 'bg-norton-yellow text-black font-bold' 
          : 'text-neutral-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={active ? 'text-black' : 'text-neutral-500 group-hover:text-norton-yellow transition-colors'}>
        {icon}
      </span>
      <span>{label}</span>
    </a>
  );
}

function SecurityCard({ icon, title, description, action, status, onClick }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  action: string,
  status?: string,
  onClick?: () => void
}) {
  return (
    <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl hover:border-norton-yellow/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-norton-yellow/20 transition-colors">
          {icon}
        </div>
        {status && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-1 rounded">
            {status}
          </span>
        )}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
        {description}
      </p>
      <button 
        onClick={onClick}
        className="w-full py-2 bg-white/5 hover:bg-norton-yellow hover:text-black font-semibold rounded-lg transition-all border border-white/10 hover:border-norton-yellow"
      >
        {action}
      </button>
    </div>
  );
}

function PricingCard({ title, price, period, features, icon, highlight, onSelect }: {
  title: string,
  price: string,
  period?: string,
  features: string[],
  icon: React.ReactNode,
  highlight?: boolean,
  onSelect: () => void
}) {
  return (
    <div className={`relative p-8 rounded-3xl border transition-all ${
      highlight 
        ? 'bg-norton-yellow/5 border-norton-yellow shadow-2xl shadow-norton-yellow/10 scale-105 z-10' 
        : 'bg-neutral-900 border-white/5 hover:border-white/20'
    }`}>
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-norton-yellow text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
          Most Popular
        </div>
      )}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className="text-neutral-500">{period}</span>}
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
            <CheckCircle2 size={16} className="text-norton-yellow shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <button 
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-bold transition-all ${
          highlight 
            ? 'bg-norton-yellow text-black hover:bg-yellow-400' 
            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
        }`}
      >
        {price === 'Free' ? 'Current Plan' : 'Buy Now'}
      </button>
    </div>
  );
}

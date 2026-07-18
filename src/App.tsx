/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine';
import GarageCanvas from './components/GarageCanvas';
import SquadCanvas from './components/SquadCanvas';
import ScreenGate from './components/ScreenGate';
import { ModeSelector } from './components/ModeSelector';
import { auth, db } from './firebase';
import { getAllCustomCars, deleteCustomCar, saveCustomCar, CustomCar } from './customCarsDb';
import { getAllCustomStadiums, deleteCustomStadium, saveCustomStadium, CustomStadium } from './customStadiumsDb';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Play, 
  HelpCircle, 
  X, 
  Rocket, 
  Gamepad2, 
  Trophy, 
  Settings, 
  History, 
  MessageSquare, 
  Newspaper, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  Battery, 
  User, 
  Sparkles, 
  Clock, 
  Share2,
  Tv,
  CheckCircle,
  Cpu,
  Volume2,
  Lock,
  ShoppingCart,
  Plus,
  Users,
  Check,
  Trash2,
  UserPlus,
  Mic,
  Sliders,
  Monitor,
  WifiOff,
  Car,
  Bell,
  Video,
  LogOut,
  Wifi,
  Mail,
} from 'lucide-react';

// Define the car presets corresponding to the user's lobby screen!
interface CarPreset {
  id: string;
  name: string;
  color: number;
  colorHexStr: string;
  accent: number;
  accentHexStr: string;
  speed: number;
  boost: number;
  handling: number;
  description: string;
  price: number;
  modelUrl?: string;
  customRotation?: { x: number; y: number; z: number };
  customRawRotation?: { pitch: number; yaw: number; roll: number };
  isCustom?: boolean;
}

const CAR_PRESETS: CarPreset[] = [
  {
    id: 'pagani',
    name: 'PAGANI ZONDA',
    color: 0xcccccc,
    colorHexStr: '#cccccc',
    accent: 0xff3333,
    accentHexStr: '#ff3333',
    speed: 99,
    boost: 95,
    handling: 92,
    description: 'Ultra-exclusive hypercar imported directly to your garage.',
    price: 800,
    modelUrl: '/paganizondacinque.glb'
  },
  {
    id: 'vision',
    name: 'VISION GT',
    color: 0xdc58ee, // Magenta
    colorHexStr: '#dc58ee',
    accent: 0x39ff14, // Neon Green
    accentHexStr: '#39ff14',
    speed: 95,
    boost: 92,
    handling: 89,
    description: 'Sleek, high-voltage futuristic racer equipped with lightweight hyper-composite frame.',
    price: 400
  },
  {
    id: 'stealth',
    name: 'STEALTH',
    color: 0x333333, // Dark grey
    colorHexStr: '#333333',
    accent: 0xff1e27, // Red
    accentHexStr: '#ff1e27',
    speed: 98,
    boost: 86,
    handling: 94,
    description: 'Ultra-aerodynamic streamliner engineered for speed loops and high-G stadium drift action.',
    price: 500
  },
  {
    id: 'lunchbox',
    name: 'LunchBox',
    color: 0xffd32a, // Yellow
    colorHexStr: '#ffd32a',
    accent: 0x222222, // Dark
    accentHexStr: '#222222',
    speed: 82,
    boost: 85,
    handling: 80,
    description: 'The standard stadium workhorse. Well-balanced torque with robust chassis dynamics.',
    price: 0
  },
  {
    id: 'reaper',
    name: 'REAPER SPECIAL',
    color: 0xff1e27, // Red
    colorHexStr: '#ff1e27',
    accent: 0x222222, // Matte Black
    accentHexStr: '#222222',
    speed: 89,
    boost: 91,
    handling: 84,
    description: 'Aggressive street model tuned for maximum acceleration with reinforced heavy impact-bumpers.',
    price: 350
  },
  {
    id: 'tron',
    name: 'TRON INTERCEPTOR',
    color: 0x0ea5e9, // Cyan
    colorHexStr: '#0ea5e9',
    accent: 0xffffff, // White
    accentHexStr: '#ffffff',
    speed: 76,
    boost: 99,
    handling: 78,
    description: 'A heavy armored dreadnought offering unmatched raw booster capacity and ball impact force.',
    price: 600
  }
];

interface SidebarFriend {
  uid: string;
  displayName: string;
  statusText: string;
  statusColor: string;
  level: number;
  rankTier: string; // 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Heroic' | 'Grandmaster' | 'Master'
  photoURL?: string;
  status: 'online' | 'matchmaking' | 'playing' | 'offline';
}

const FALLBACK_FRIENDS: SidebarFriend[] = [
  { uid: 'bot_samurai', displayName: 'Samurai', statusText: 'Online', statusColor: '#39ff14', level: 61, rankTier: 'Heroic', status: 'online' },
  { uid: 'bot_dmt_pushpa', displayName: 'DMT PUSHPA', statusText: 'Matchmaking', statusColor: '#ff9f43', level: 48, rankTier: 'Heroic', status: 'matchmaking' },
  { uid: 'bot_kay6e5g7n', displayName: 'Kay6E5g7N', statusText: '1 mins | BERMUD', statusColor: '#00d2ff', level: 25, rankTier: 'Diamond', status: 'playing' },
  { uid: 'bot_gtk_gaming', displayName: 'GTK$$Gamming', statusText: 'Online', statusColor: '#39ff14', level: 59, rankTier: 'Platinum', status: 'online' },
  { uid: 'bot_veidora', displayName: 'Veidora 🌟', statusText: 'Online', statusColor: '#39ff14', level: 84, rankTier: 'Grandmaster', status: 'online' },
  { uid: 'bot_minal', displayName: 'MINAL Sw', statusText: '9 mins | SOLARA', statusColor: '#00d2ff', level: 105, rankTier: 'Master', status: 'playing' },
  { uid: 'bot_broken', displayName: 'BROKEN', statusText: 'Offline', statusColor: '#94a3b8', level: 12, rankTier: 'Bronze', status: 'offline' }
];

const isRealUser = (name: string | undefined | null): boolean => {
  if (!name || name.trim() === '') return false;
  const lower = name.toLowerCase();
  if (lower.startsWith('bot_') || lower.startsWith('bot ') || lower.startsWith('bot_')) return false;
  const knownBots = [
    'viper_99', 'nitroboost', 'turbocharge', 'driftking', 'apexracer', 
    'rusty', 'ghost', 'fury', 'rage', 'spark', 'drift', 'apex', 'viper', 
    'nitro', 'turbo'
  ];
  if (knownBots.includes(lower)) return false;
  return true;
};

const ErrorOverlay = () => { const [err, setErr] = useState(""); useEffect(() => { window.onerror = (m,s,l,c,e) => setErr(m + " " + s + ":" + l); window.onunhandledrejection = (e) => setErr(String(e.reason)); }, []); return err ? <div style={{position:"fixed",top:0,left:0,zIndex:999999,background:"red",color:"white",padding:20}}>{err}</div> : null; };

function StandaloneTermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0c1938 0%, #050a18 100%)',
      color: '#c4d1eb',
      fontFamily: '"Inter", sans-serif',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'rgba(5, 10, 24, 0.75)',
        border: '1px solid rgba(67, 245, 255, 0.2)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 0 40px rgba(67, 245, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#43f5ff',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
            textShadow: '0 0 15px rgba(67, 245, 255, 0.5)'
          }}>Car Football Arena</h1>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#ffd32a',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0
          }}>Terms & Services</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', lineHeight: '1.7', color: '#c4d1eb' }}>
          <p>
            Welcome to <strong>Car Football Arena</strong>! By accessing or playing our game, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>1. Beta Development & Data Policy</h3>
          <p>
            Car Football Arena is currently in active development and beta phases. We reserve the right to modify, reset, or wipe player statistics, coin balances, vehicle unlocks, and custom decals at any time to ensure balanced gameplay and database optimization.
          </p>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>2. Fair Play & Anti-Cheat</h3>
          <p>
            We mandate a fair and competitive environment. The use of unauthorized third-party clients, memory editors, speed hacks, network packet manipulators, or automated bot scripts is strictly forbidden. Any account found using exploits will face permanent termination.
          </p>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>3. Community Standards & Chat Conduct</h3>
          <p>
            Be respectful to other arena drivers in the live match chat. Toxic behavior, hate speech, harassment, spamming, or sharing harmful links will result in chat muting or immediate account suspension.
          </p>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>4. Virtual Assets & VIP Passes</h3>
          <p>
            All virtual currency, cosmetic custom paints, and VIP Stadium Passes acquired in Car Football Arena have no real-world cash value and are non-transferable and non-refundable.
          </p>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = window.location.pathname.replace(/\/terms$/, '') || '/';
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #43f5ff)',
              border: 'none',
              color: '#0a1329',
              padding: '14px 32px',
              borderRadius: '30px',
              fontWeight: 900,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 0 15px rgba(67,245,255,0.4)',
              transition: 'all 0.2s'
            }}
          >
            Go To Game
          </button>
        </div>
      </div>
    </div>
  );
}

function StandalonePrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0c1938 0%, #050a18 100%)',
      color: '#c4d1eb',
      fontFamily: '"Inter", sans-serif',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'rgba(5, 10, 24, 0.75)',
        border: '1px solid rgba(67, 245, 255, 0.2)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 0 40px rgba(67, 245, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#43f5ff',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
            textShadow: '0 0 15px rgba(67, 245, 255, 0.5)'
          }}>Car Football Arena</h1>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#ffd32a',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0
          }}>Privacy Policy</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', lineHeight: '1.7', color: '#c4d1eb' }}>
          <p>
            At <strong>Car Football Arena</strong>, we take player privacy and account security seriously. This document describes the types of data we collect and how we handle it.
          </p>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>1. Information We Collect</h3>
          <p>
            To deliver matchmaking, store player statistics, and secure user profiles, we collect:
          </p>
          <ul style={{ paddingLeft: '20px', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>⭐ <strong>Authentication Data</strong>: User email, display name, and unique authentication identifier when linked via Google login.</li>
            <li>⭐ <strong>Match Statistics</strong>: Match wins, losses, goals scored, levels reached, and virtual coin balance.</li>
            <li>⭐ <strong>Game Preferences</strong>: Selected car presets, customizing configurations (paints, active decal colors), and settings.</li>
          </ul>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>2. How We Protect Your Data</h3>
          <p>
            All connection flows between your client browser and our cloud servers are encrypted using Secure Sockets Layer (SSL/TLS). Your authentication credentials and records are stored securely in Firestore databases protected by strict attribute-based security rules. Your email is kept confidential and is never displayed publicly or shared with third parties.
          </p>

          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', textTransform: 'uppercase' }}>3. Player Rights & Account Deletion</h3>
          <p>
            You have full control over your profile. You can change your driver display name at any time. Furthermore, if you wish to wipe your data entirely, you can click on the <strong>Delete Account</strong> option in the settings menu to permanently purge your records from our servers.
          </p>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = window.location.pathname.replace(/\/privacy$/, '') || '/';
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #43f5ff)',
              border: 'none',
              color: '#0a1329',
              padding: '14px 32px',
              borderRadius: '30px',
              fontWeight: 900,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 0 15px rgba(67,245,255,0.4)',
              transition: 'all 0.2s'
            }}
          >
            Go To Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Path routing detection
  const pathName = window.location.pathname;
  const isTermsPage = pathName.endsWith('/terms') || window.location.hash === '#/terms' || window.location.hash === '#terms' || window.location.search.includes('page=terms');
  const isPrivacyPage = pathName.endsWith('/privacy') || window.location.hash === '#/privacy' || window.location.hash === '#privacy' || window.location.search.includes('page=privacy');

  if (isTermsPage) {
    return <StandaloneTermsPage />;
  }
  if (isPrivacyPage) {
    return <StandalonePrivacyPage />;
  }

  const mountRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);
  
  // Navigation Screens: 'loading' | 'login' | 'lobby' | 'playing' | 'loading_match'
  const [screen, setScreen] = useState<'loading' | 'login' | 'profile_setup' | 'lobby' | 'playing' | 'loading_match'>('loading');
  const [renderedScreen, setRenderedScreen] = useState<'loading' | 'login' | 'profile_setup' | 'lobby' | 'playing' | 'loading_match'>('loading');
  const [matchLoadingProgress, setMatchLoadingProgress] = useState<number>(0);
  
  // Sidebar Dialog modals states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [renderedActiveModal, setRenderedActiveModal] = useState<string | null>(null);
  
  const [gateState, setGateState] = useState<'open' | 'closing' | 'closed' | 'opening'>('open');

  // Trigger mechanical gate closing/opening on screen state change
  useEffect(() => {
    if (screen === renderedScreen && activeModal === renderedActiveModal) return;

    setGateState('closing');

    const timer = setTimeout(() => {
      setRenderedScreen(screen);
      setRenderedActiveModal(activeModal);
      setGateState('opening');

      const finishTimer = setTimeout(() => {
        setGateState('open');
      }, 850);

      return () => clearTimeout(finishTimer);
    }, 850);

    return () => clearTimeout(timer);
  }, [screen, activeModal]); // eslint-disable-line react-hooks/exhaustive-deps
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showMoreLoginOptions, setShowMoreLoginOptions] = useState(false);
  const [showEmailAuthModal, setShowEmailAuthModal] = useState<'login' | 'signup' | 'verify_email' | null>(null);
  const [emailAuthError, setEmailAuthError] = useState('');
  const [emailAuthSuccess, setEmailAuthSuccess] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Fullscreen and Orientation Lock + Back Button Interception
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    window.history.pushState({ noBackExitsApp: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState({ noBackExitsApp: true }, '');
      setShowQuitModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    const enableImmersiveMode = () => {
      try {
        const docEl = document.documentElement as any;
        const requestFullscreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
        if (requestFullscreen) {
          requestFullscreen.call(docEl).then(() => {
            if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
              (window.screen.orientation as any).lock('landscape').catch(() => {});
            }
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Immersive mode failed", err);
      }
    };

    const handleUserInteraction = () => {
      setHasInteracted(true);
      enableImmersiveMode();
    };

    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [validationFailed, setValidationFailed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileAgeInput, setProfileAgeInput] = useState('');
  const [pendingLoginFn, setPendingLoginFn] = useState<(() => void) | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.providerData.some((p: any) => p.providerId === 'password') && !currentUser.emailVerified) {
          setUser(currentUser);
          setAuthLoading(false);
          setScreen('login');
          setShowEmailAuthModal('verify_email');
          return;
        }

        const pendingName = localStorage.getItem('pendingUserName');
        // Check if user has neither a display name nor a pending name in local storage
        if (!pendingName && !currentUser.displayName && !currentUser.isAnonymous) {
          setUser(currentUser);
          setAuthLoading(false);
          setScreen('profile_setup');
          return;
        }

        if (pendingName && currentUser.displayName !== pendingName) {
          try {
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(currentUser, { displayName: pendingName });
          } catch (e) {
            console.error('Failed to update profile name:', e);
          }
        }
      }
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser && screen === 'login') {
        setScreen('lobby');
      } else if (!currentUser) {
        setScreen('login');
      }
    });
    return () => unsubscribe();
  }, [renderedScreen]);
  
  // Splash Screen States
  const [bgImage, setBgImage] = useState('/splash.jpeg?v=2');
  const [logoImage, setLogoImage] = useState('/logo.png');
  const [hasBgError, setHasBgError] = useState(false);
  const [hasLogoError, setHasLogoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing game systems...');
  const [showInstructions, setShowInstructions] = useState(false);

  // Owned cars state (ids of cars purchased by user). Start with only 'lunchbox' (free).
  const [ownedCarIds, setOwnedCarIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ownedCarIds');
    return saved ? JSON.parse(saved) : ['lunchbox'];
  });

  // Dynamic user coins state
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('coins');
    return saved ? parseInt(saved) : 600; // Provide 600 initial coins so they can test purchasing right away!
  });

  const [lobbyNotice, setLobbyNotice] = useState<string | null>(null);

  // Selected Car index within the owned list
  const [selectedOwnedCarIndex, setSelectedOwnedCarIndex] = useState<number>(() => {
    const saved = localStorage.getItem('selectedOwnedCarIndex');
    const parsed = saved ? parseInt(saved) : 0;
    return isNaN(parsed) ? 0 : parsed;
  });

  // Custom cars loaded from IndexedDB
  const [customCarPresets, setCustomCarPresets] = useState<CarPreset[]>([]);

  // Custom stadiums loaded from IndexedDB
  const [customStadiums, setCustomStadiums] = useState<CustomStadium[]>([]);

  // File upload state for custom stadiums
  const [uploadStadiumName, setUploadStadiumName] = useState('');
  const [uploadStadiumFile, setUploadStadiumFile] = useState<File | null>(null);
  const [uploadingStadium, setUploadingStadium] = useState(false);

  const loadAllCustomStadiums = async () => {
    try {
      const stadiums = await getAllCustomStadiums();
      const updatedStadiums = stadiums.map(s => ({
        ...s,
        blobUrl: URL.createObjectURL(s.blob)
      }));
      setCustomStadiums(updatedStadiums);
    } catch (err) {
      console.error("Error loading custom stadiums:", err);
    }
  };

  // File upload state for custom cars
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState(90);
  const [uploadBoost, setUploadBoost] = useState(90);
  const [uploadHandling, setUploadHandling] = useState(90);
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);

  const loadAllCustomCars = async () => {
    try {
      const cars = await getAllCustomCars();
      const presets: CarPreset[] = cars.map(car => {
        const blobUrl = URL.createObjectURL(car.blob);
        return {
          id: car.id,
          name: car.name.toUpperCase(),
          color: 0xffffff,
          colorHexStr: '#ffffff',
          accent: 0xff3333,
          accentHexStr: '#ff3333',
          speed: car.speed,
          boost: car.boost,
          handling: car.handling,
          description: 'Custom uploaded car model.',
          price: 0,
          modelUrl: blobUrl,
          isCustom: true,
          customRotation: {
            x: (car.pitch || 0) * Math.PI / 180,
            y: (car.yaw || 0) * Math.PI / 180,
            z: (car.roll || 0) * Math.PI / 180,
          },
          customRawRotation: {
            pitch: car.pitch || 0,
            yaw: car.yaw || 0,
            roll: car.roll || 0
          }
        };
      });
      setCustomCarPresets(presets);
      
      // Auto-own all custom cars!
      const customIds = presets.map(p => p.id);
      setOwnedCarIds(prev => {
        const standardIds = CAR_PRESETS.map(p => p.id);
        const validIds = [...standardIds, ...customIds];
        const filteredPrev = prev.filter(id => validIds.includes(id));
        const merged = Array.from(new Set([...filteredPrev, ...customIds]));
        localStorage.setItem('ownedCarIds', JSON.stringify(merged));
        return merged;
      });
    } catch (err) {
      console.error("Error loading custom cars:", err);
    }
  };

  const handleUpdateCustomRotation = async (id: string, pitch: number, yaw: number, roll: number) => {
    try {
      // Find the custom car in IndexedDB
      const cars = await getAllCustomCars();
      const match = cars.find(c => c.id === id);
      if (match) {
        match.pitch = pitch;
        match.yaw = yaw;
        match.roll = roll;
        await saveCustomCar(match);
        
        // Live update the customCarPresets state without having to recreate the object URLs
        setCustomCarPresets(prev => prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              customRotation: {
                x: pitch * Math.PI / 180,
                y: yaw * Math.PI / 180,
                z: roll * Math.PI / 180,
              },
              customRawRotation: { pitch, yaw, roll }
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Error updating custom car rotation:", err);
    }
  };

  const handleUpdateCustomStats = async (id: string, speed: number, boost: number, handling: number) => {
    try {
      const cars = await getAllCustomCars();
      const match = cars.find(c => c.id === id);
      if (match) {
        match.speed = speed;
        match.boost = boost;
        match.handling = handling;
        await saveCustomCar(match);
        
        // Live update the customCarPresets state
        setCustomCarPresets(prev => prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              speed,
              boost,
              handling
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Error updating custom car stats:", err);
    }
  };

  useEffect(() => {
    loadAllCustomCars();
    const clearCustomStadiums = async () => {
      try {
        const stadiums = await getAllCustomStadiums();
        for (const s of stadiums) {
          await deleteCustomStadium(s.id);
        }
        localStorage.setItem('selectedStadium', 'emerald');
        setSelectedStadium('emerald');
        setCustomStadiums([]);
      } catch (err) {
        console.error("Error clearing custom stadiums:", err);
      }
    };
    clearCustomStadiums();
  }, []);

  const allCarPresets = [...CAR_PRESETS, ...customCarPresets];

  const [activeSkin, setActiveSkin] = useState<'Basic' | 'Cyber Lab' | 'Jungle Jim' | 'Toxic Worm'>('Basic');
  const [matchMode, setMatchMode] = useState<'1v1' | '2v2' | 'ranked' | 'practice'>('ranked');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState<string>(() => {
    return localStorage.getItem('selectedStadium') || 'emerald';
  });
  const [userRankStars, setUserRankStars] = useState(() => {
    const saved = localStorage.getItem('userRankStars');
    return saved ? parseInt(saved) : 0;
  });

  // Real device-like battery & connectivity states
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isBatteryCharging, setIsBatteryCharging] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Inside sandboxed iframe, navigator.onLine might return false or fail.
    // We default to true to prevent blocking the user's gameplay experience.
    setIsOnline(true);

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let batteryInstance: any = null;
    const updateBattery = (batt: any) => {
      setBatteryLevel(Math.round(batt.level * 100));
      setIsBatteryCharging(batt.charging);
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        batteryInstance = batt;
        updateBattery(batt);
        batt.addEventListener('levelchange', () => updateBattery(batt));
        batt.addEventListener('chargingchange', () => updateBattery(batt));
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => updateBattery(batteryInstance));
        batteryInstance.removeEventListener('chargingchange', () => updateBattery(batteryInstance));
      }
    };
  }, []);

  const getRankInfo = (stars: number) => {
    const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Master'];
    const rankIndex = Math.min(Math.floor(stars / 25), 6);
    const tier = ranks[rankIndex];
    const level = rankIndex === 6 ? Math.floor((stars - 150) / 5) + 1 : Math.floor((stars % 25) / 5) + 1;
    const currentStars = stars % 5;
    const maxStars = 5;
    return { tier, level, currentStars, maxStars };
  };

  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(5);
  const [matchTeams, setMatchTeams] = useState<{ 
    blue: string[], 
    orange: string[],
    blueColors?: number[],
    blueAccents?: number[]
  } | null>(null);
  const [initialRealUsersCount, setInitialRealUsersCount] = useState<number | null>(null);

  // Invite and Lobby States
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingFriends, setIsSearchingFriends] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedUids, setInvitedUids] = useState<string[]>([]);
  const [incomingInvitation, setIncomingInvitation] = useState<any | null>(null);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [matchCountdown, setMatchCountdown] = useState<number | null>(null);
  const [matchmakingTime, setMatchmakingTime] = useState<number>(0);

  // Free Fire Style Friends Sidebar states
  const [isFriendsDrawerOpen, setIsFriendsDrawerOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'friends' | 'add_friend' | 'requests'>('friends');
  const [drawerOnlineDropdownOpen, setDrawerOnlineDropdownOpen] = useState(false);
  const [drawerSearchText, setDrawerSearchText] = useState('');
  const [drawerSearchVisible, setDrawerSearchVisible] = useState(false);
  const [addFriendSearchText, setAddFriendSearchText] = useState('');
  const [addFriendSearchResults, setAddFriendSearchResults] = useState<any[]>([]);
  const [isSearchingAddFriend, setIsSearchingAddFriend] = useState(false);
  const [copiedUidText, setCopiedUidText] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const lastResetStr = localStorage.getItem('lastRankResetDate');
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${now.getMonth()}`;
    
    if (lastResetStr !== currentMonthStr) {
      if (lastResetStr) {
        // Drop rank stars by 80% (keep 20%)
        setUserRankStars(prev => {
          const newStars = Math.floor(prev * 0.2);
          localStorage.setItem('userRankStars', newStars.toString());
          return newStars;
        });
      }
      localStorage.setItem('lastRankResetDate', currentMonthStr);
    }
  }, []);

  // Friends & Request System States
  const [friendsTab, setFriendsTab] = useState<'friends' | 'requests'>('friends');
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  // Car custom positioning state (loaded from localStorage or defaults)
  const [carY, setCarY] = useState<number>(() => {
    const saved = localStorage.getItem('carY');
    return saved ? parseFloat(saved) : -0.6;
  });
  const [carZ, setCarZ] = useState<number>(() => {
    const saved = localStorage.getItem('carZ');
    return saved ? parseFloat(saved) : -3.3; // Deeper backward
  });
  const [carScale, setCarScale] = useState<number>(() => {
    const saved = localStorage.getItem('carScale');
    return saved ? parseFloat(saved) : 0.85;
  });

  const handleUpdateCarY = (val: number) => {
    setCarY(val);
    localStorage.setItem('carY', val.toString());
  };

  const handleUpdateCarZ = (val: number) => {
    setCarZ(val);
    localStorage.setItem('carZ', val.toString());
  };

  const handleUpdateCarScale = (val: number) => {
    setCarScale(val);
    localStorage.setItem('carScale', val.toString());
  };

  // Custom coloring option (Car Customizer paint option!)
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>(localStorage.getItem('customPrimaryColor') || '');
  const [customAccentColor, setCustomAccentColor] = useState<string>(localStorage.getItem('customPrimaryColor') || '');

  // Home screen/Lobby enabled buttons list (starts empty so all are removed initially)
  const [enabledLobbyButtons, setEnabledLobbyButtons] = useState<string[]>([]);

  // Controls & HUD Settings States
  const [settingsTab, setSettingsTab] = useState<'account' | 'in-match' | 'display' | 'sound' | 'recording' | 'notification'>('account');
  const [sensitivity, setSensitivity] = useState<number>(() => {
    const saved = localStorage.getItem('sensitivity');
    return saved ? parseInt(saved) : 50;
  });
  const [recordingEnabled, setRecordingEnabled] = useState<boolean>(() => {
    return localStorage.getItem('recordingEnabled') === 'true';
  });
  const [generalNotifications, setGeneralNotifications] = useState<boolean>(() => {
    return localStorage.getItem('generalNotifications') !== 'false';
  });
  const [selectedHudBtn, setSelectedHudBtn] = useState<string>('forward');
  
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    const saved = localStorage.getItem('soundVolume');
    return saved ? parseInt(saved) : 85;
  });
  const [musicVolume, setMusicVolume] = useState<number>(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? parseInt(saved) : 60;
  });
  const [engineVolume, setEngineVolume] = useState<number>(() => {
    const saved = localStorage.getItem('engineVolume');
    return saved ? parseInt(saved) : 75;
  });
  const [masterVolume, setMasterVolume] = useState<boolean>(() => {
    return localStorage.getItem('masterVolume') !== 'false';
  });
  const [voiceChat, setVoiceChat] = useState<boolean>(() => {
    return localStorage.getItem('voiceChat') !== 'false';
  });
  const [layoutPreset, setLayoutPreset] = useState<string>('Default');
  const [hudScale, setHudScale] = useState<number>(() => {
    const saved = localStorage.getItem('hudScale');
    return saved ? parseInt(saved) : 80;
  });
  const [autoBoost, setAutoBoost] = useState<boolean>(() => {
    return localStorage.getItem('autoBoost') === 'true';
  });
  const [qualityPreset, setQualityPreset] = useState<'Low'|'Medium'|'High'|'Ultra'|'Smooth'|'Standard'|'Max'>(() => {
    const saved = localStorage.getItem('qualityPreset');
    return (saved as any) || 'High';
  });

  useEffect(() => {
    localStorage.setItem('qualityPreset', qualityPreset);
  }, [qualityPreset]);
  const [resolution, setResolution] = useState<string>('1920x1080');
  const [colorBlindMode, setColorBlindMode] = useState<boolean>(false);
  const [subtitleSize, setSubtitleSize] = useState<string>('Medium');

  const [tiltControlsEnabled, setTiltControlsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tiltControlsEnabled') === 'true';
  });

  const [mobileControlsOpacity, setMobileControlsOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('mobileControlsOpacity');
    return saved ? parseInt(saved) : 80;
  });

  const [mobileControlsEnabled, setMobileControlsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('mobileControlsEnabled');
    return saved ? saved === 'true' : true; // Default to enabled so they are easily found!
  });
  const [btnPositions, setBtnPositions] = useState<Record<string, { x: number, y: number }>>(() => {
    const saved = localStorage.getItem('mobileBtnPositions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      steerLeft: { x: 8, y: 20 },
      steerRight: { x: 22, y: 20 },
      forward: { x: 78, y: 32 },
      reverse: { x: 78, y: 12 },
      boost: { x: 90, y: 32 },
      jump: { x: 90, y: 12 }
    };
  });

  // Device Motion Steering Logic
  useEffect(() => {
    if (!tiltControlsEnabled) return;

    let isLeftDown = false;
    let isRightDown = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const tiltThreshold = 10;
      let tilt = 0;
      
      const orientation = (window.screen && window.screen.orientation && window.screen.orientation.angle) || window.orientation || 0;
      
      if (orientation === 90) {
        tilt = e.beta || 0;
      } else if (orientation === -90 || orientation === 270) {
        tilt = -(e.beta || 0);
      } else {
        tilt = e.gamma || 0;
      }

      if (tilt < -tiltThreshold) {
        if (!isLeftDown) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', bubbles: true }));
          isLeftDown = true;
        }
        if (isRightDown) {
          window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true }));
          isRightDown = false;
        }
      } else if (tilt > tiltThreshold) {
        if (!isRightDown) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true }));
          isRightDown = true;
        }
        if (isLeftDown) {
          window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', bubbles: true }));
          isLeftDown = false;
        }
      } else {
        if (isLeftDown) {
          window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', bubbles: true }));
          isLeftDown = false;
        }
        if (isRightDown) {
          window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true }));
          isRightDown = false;
        }
      }
    };

    // Need to handle iOS 13+ permission for DeviceOrientation
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // Just listen if permission was already granted. The first time users will need a button.
      // Since it's a setting, we can just try to listen. 
    }
    
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (isLeftDown) window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', bubbles: true }));
      if (isRightDown) window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true }));
    };
  }, [tiltControlsEnabled]);

  // Live countdown timer for the Weekly Competition
  const [countdown, setCountdown] = useState({ days: 30, hours: 16, minutes: 8, seconds: 32 });

  // Derive list of owned car presets (All presets and custom cars are fully available/unlocked)
  const ownedCarPresets = allCarPresets;

  // Get currently selected car info
  const selectedCar = ownedCarPresets[selectedOwnedCarIndex] || ownedCarPresets[0] || allCarPresets[2] || CAR_PRESETS[2];
  
  const handleCarChange = (direction: 'next' | 'prev') => {
    if (ownedCarPresets.length <= 1) return;
    if (direction === 'next') {
      const nextIdx = (selectedOwnedCarIndex + 1) % ownedCarPresets.length;
      setSelectedOwnedCarIndex(nextIdx);
      localStorage.setItem('selectedOwnedCarIndex', nextIdx.toString());
    } else {
      const prevIdx = (selectedOwnedCarIndex - 1 + ownedCarPresets.length) % ownedCarPresets.length;
      setSelectedOwnedCarIndex(prevIdx);
      localStorage.setItem('selectedOwnedCarIndex', prevIdx.toString());
    }
  };

  // Derive colors to send to Three.js game engine
  const gameCarColor = customPrimaryColor 
    ? parseInt(customPrimaryColor.replace('#', '0x')) 
    : selectedCar.color;

  const gameCarAccent = customAccentColor 
    ? parseInt(customAccentColor.replace('#', '0x')) 
    : (activeSkin === 'Cyber Lab' ? 0x0ea5e9 : (activeSkin === 'Jungle Jim' ? 0x22c55e : (activeSkin === 'Toxic Worm' ? 0x8b5cf6 : selectedCar.accent)));

  // 1. Splash Screen countdown and load simulation
  useEffect(() => {
    if (screen !== 'loading') return;
    
    // Check if user uploaded splash background image
    const imgBg = new Image();
    imgBg.src = '/splash.jpeg?v=2';
    imgBg.onload = () => {
      setBgImage('/splash.jpeg?v=2');
      setHasBgError(false);
    };
    imgBg.onerror = () => {
      const imgBgOld = new Image();
      imgBgOld.src = '/splash_bg.jpg';
      imgBgOld.onload = () => {
        setBgImage('/splash_bg.jpg');
        setHasBgError(false);
      };
      imgBgOld.onerror = () => {
        const imgBgPng = new Image();
        imgBgPng.src = '/splash_bg.png';
        imgBgPng.onload = () => {
          setBgImage('/splash_bg.png');
          setHasBgError(false);
        };
        imgBgPng.onerror = () => {
          setHasBgError(true);
        };
      };
    };

    // Check if user uploaded logo image
    const imgLogo = new Image();
    imgLogo.src = '/logo.png';
    imgLogo.onload = () => {
      setLogoImage('/logo.png');
      setHasLogoError(false);
    };
    imgLogo.onerror = () => {
      const imgLogoJpg = new Image();
      imgLogoJpg.src = '/logo.jpg';
      imgLogoJpg.onload = () => {
        setLogoImage('/logo.jpg');
        setHasLogoError(false);
      };
      imgLogoJpg.onerror = () => {
        setHasLogoError(true);
      };
    };

    // Simulating stadium assets loading sequence (exactly 7.0 seconds)
    const startTime = Date.now();
    const duration = 7000; 
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        // Seamlessly transitions directly into our Lobby home screen or login screen
        setScreen((prevScreen) => {
          if (authLoading) return prevScreen; // wait? actually it's fine
          return user ? 'lobby' : 'login';
        });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [screen, user, authLoading]);

  // Loading screen tech messages
  const techMessages = [
    'CONNECTING TO STADIUM HOST...',
    'TILING WOODEN PLANK ARENA WALLS...',
    'CALIBRATING ROOF CORNER POSITIONS...',
    'ELEVATING HIGH-SCALE ROOF STRUCTURES...',
    'WELDING INDUSTRIAL STEEL TRUSSES...',
    'DEPLOYING ROOF INTEGRATED LED FLOODLIGHTS...',
    'MOUNTING JUMBOTRONS WITH TRUSS COLUMNS...',
    'ELEVATING CORNER MAST FLOODLIGHTS TOWERS...',
    'INFLATING ROCKET-SKINNED FOOTBALL...',
    'CHARGING NITRO BOOSTER THRUSTERS...',
    'STADIUM PREPARATION COMPLETE!'
  ];

  useEffect(() => {
    if (screen !== 'loading') return;
    const msgIndex = Math.min(
      Math.floor((progress / 100) * techMessages.length),
      techMessages.length - 1
    );
    setLoadingText(techMessages[msgIndex]);
  }, [progress, screen]);

  // 2. Weekly Competition ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              } else {
                days = 3; hours = 16; minutes = 10; seconds = 8;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Online Presence Heartbeat in Firestore
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }

    const uid = user.uid;
    const name = user.displayName || user.email?.split('@')[0] || 'User';
    const userDocRef = doc(db, 'online_users', uid);

    const updatePresence = async () => {
      try {
        await setDoc(userDocRef, {
          uid,
          displayName: name,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          lastSeen: Date.now(),
          status: 'online'
        }, { merge: true });

        // Also update global users collection
        const globalUserRef = doc(db, 'users', uid);
        await setDoc(globalUserRef, {
          uid,
          shortId: uid.substring(0, 8).toUpperCase(),
          displayName: name,
          email: user.email || '',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          lastSeen: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error("Error setting presence:", e);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 10000);

    const q = query(collection(db, 'online_users'), where('status', '==', 'online'));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      let users: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid !== uid && data.lastSeen > Date.now() - 60000) {
          users.push(data);
        }
      });
      
      setOnlineUsers(users);
    }, (error) => {
      console.error("Error fetching online users:", error);
    });

    return () => {
      clearInterval(interval);
      unsubscribeUsers();
      deleteDoc(userDocRef).catch(e => console.error("Error cleaning up presence:", e));
    };
  }, [user]);

  // Friends List Sync Effect
  useEffect(() => {
    if (!user) {
      setFriendsList([]);
      return;
    }

    const friendsColRef = collection(db, 'users', user.uid, 'friends');
    const unsubscribe = onSnapshot(friendsColRef, (snapshot) => {
      let friends: any[] = [];
      snapshot.forEach((doc) => {
        friends.push(doc.data());
      });
      
      // Inject fake friends for testing lobby features
      friends = [
        ...friends,
        { uid: 'bot_fake_1', displayName: 'GhostRider', email: 'ghost@test.com', status: 'online', statusText: 'In Lobby' },
        { uid: 'bot_fake_2', displayName: 'SpeedyDemon', email: 'speedy@test.com', status: 'playing', statusText: 'In Match (2-1)' },
        { uid: 'bot_fake_3', displayName: 'NoobMaster', email: 'noob@test.com', status: 'offline', statusText: 'Offline' }
      ];

      setFriendsList(friends);
    }, (error) => {
      console.error("Error watching friends:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to incoming friend requests
  useEffect(() => {
    if (!user) {
      setIncomingFriendRequests([]);
      return;
    }

    const q = query(
      collection(db, 'friend_requests'),
      where('toId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setIncomingFriendRequests(requests);
    }, (error) => {
      console.error("Error watching incoming friend requests:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to sent friend requests
  useEffect(() => {
    if (!user) {
      setSentRequests([]);
      return;
    }

    const q = query(
      collection(db, 'friend_requests'),
      where('fromId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setSentRequests(requests);
    }, (error) => {
      console.error("Error watching sent friend requests:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Debounced Friends and User Search Effect
  useEffect(() => {
    if (!friendSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingFriends(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const results: any[] = [];
        const cleanQuery = friendSearchQuery.toLowerCase().trim();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.uid !== user?.uid) {
            const matchesName = data.displayName?.toLowerCase().includes(cleanQuery);
            const shortId = data.shortId?.toLowerCase() || data.uid?.substring(0, 8).toLowerCase();
            const matchesUid = shortId === cleanQuery || data.uid?.toLowerCase() === cleanQuery;
            if (matchesName || matchesUid) {
              results.push(data);
            }
          }
        });
        setSearchResults(results.slice(0, 10)); // Limit to top 10 search results
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setIsSearchingFriends(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [friendSearchQuery, user]);

  // 4. Incoming Invitations Listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'lobby_invitations'), where('toId', '==', user.uid), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setIncomingInvitation({ id: docSnap.id, ...docSnap.data() });
      } else {
        setIncomingInvitation(null);
      }
    }, (error) => {
      console.error("Error watching invitations:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // 5. Lobby Team State Sync from Firestore
  useEffect(() => {
    if (!lobbyId) {
      setMatchTeams(null);
      return;
    }

    const docRef = doc(db, 'lobby_teams', lobbyId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const blueList = data.blue || ['', '', '', ''];
        const orangeList = data.orange || ['', '', '', ''];
        
        setMatchTeams({
          blue: blueList,
          orange: orangeList,
          blueColors: data.blueColors || [gameCarColor, 0x00d2ff, 0x00ff44, 0xffdd00],
          blueAccents: data.blueAccents || [gameCarAccent, 0xffdd00, 0xffffff, 0xff00ff]
        });
        
        if (data.status === 'playing' && renderedScreen !== 'playing' && renderedScreen !== 'loading_match' && screen !== 'loading_match') {
          const allUsers = [...blueList, ...orangeList];
          const realUsersCount = allUsers.filter(name => isRealUser(name)).length;
          setInitialRealUsersCount(realUsersCount);
          setMatchLoadingProgress(0);
          setScreen('loading_match');
        } else if (screen === 'playing') {
          // If already playing, check if match was ended/finished or if not enough real users remain
          if (data.status === 'finished') {
            setScreen('lobby');
            setInitialRealUsersCount(null);
            setLobbyNotice("⚽ MATCH FINISHED!\nNot enough real users left. Returning to lobby.");
          } else {
            const allUsers = [...blueList, ...orangeList];
            const realUsersLeft = allUsers.filter(name => isRealUser(name)).length;
            
            // If we started with multiple real users, threshold is 1 (match ends when only 1 is left).
            // If we started solo, threshold is 0 (match ends when 0 are left).
            const startCount = initialRealUsersCount !== null ? initialRealUsersCount : realUsersLeft;
            const threshold = startCount > 1 ? 1 : 0;
            
            if (realUsersLeft <= threshold) {
              // Update status to 'finished' in Firestore so all other observers exit too
              updateDoc(docRef, { status: 'finished' })
                .catch(e => console.error("Error finishing lobby from snapshot:", e));
              
              setScreen('lobby');
              setInitialRealUsersCount(null);
              setLobbyNotice("⚽ MATCH FINISHED!\nNot enough real users left. Returning to lobby.");
            }
          }
        }
      }
    }, (error) => {
      console.error("Error syncing lobby teams:", error);
    });

    return () => unsubscribe();
  }, [lobbyId, screen, initialRealUsersCount]);

  // 6. Initialize standard lobby when entering lobby screen
  useEffect(() => {
    if (screen === 'lobby' && user) {
      const userName = user.displayName || user.email?.split('@')[0] || 'User';
      const hostId = user.uid;
      setLobbyId(hostId);
      
      const initLobby = async () => {
        try {
          await setDoc(doc(db, 'lobby_teams', hostId), {
            hostId,
            hostName: userName,
            blue: [userName, '', '', ''],
            orange: ['', '', '', ''],
            blueColors: [gameCarColor, 0x00d2ff, 0x00ff44, 0xffdd00],
            blueAccents: [gameCarAccent, 0xffdd00, 0xffffff, 0xff00ff],
            status: 'waiting',
            timestamp: Date.now()
          });
        } catch (e) {
          console.error("Error creating Firestore lobby:", e);
        }
      };
      initLobby();
    } else if (screen !== 'lobby') {
      setIsSearching(false);
      setSearchTimer(0);
      setMatchCountdown(null);
      setInvitedUids([]);
    }
  }, [screen, user]);

  // Real-time car customizer colors synchronizer for Squad Lobby
  useEffect(() => {
    if (!lobbyId || !user || !matchTeams) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    const blue = [...matchTeams.blue];
    const ourIdx = blue.indexOf(userName);
    if (ourIdx !== -1) {
      const docRef = doc(db, 'lobby_teams', lobbyId);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const blueColors = [...(data.blueColors || [0xff003c, 0x00d2ff, 0x00ff44, 0xffdd00])];
          const blueAccents = [...(data.blueAccents || [0xffdd00, 0xff00ff, 0xffffff, 0xff003c])];
          if (blueColors[ourIdx] !== gameCarColor || blueAccents[ourIdx] !== gameCarAccent) {
            blueColors[ourIdx] = gameCarColor;
            blueAccents[ourIdx] = gameCarAccent;
            updateDoc(docRef, { blueColors, blueAccents }).catch(e => console.error("Error syncing car color:", e));
          }
        }
      });
    }
  }, [lobbyId, user, matchTeams?.blue, gameCarColor, gameCarAccent]);

  // 7. Online matchmaking search simulation
  useEffect(() => {
    if (!isSearching || !lobbyId || !user) return;
    if (lobbyId !== user.uid) return;

    const searchInterval = setInterval(async () => {
      setSearchTimer(prev => {
        const newVal = prev - 1;
        if (newVal <= 0) {
          clearInterval(searchInterval);
          setIsSearching(false);
          setMatchCountdown(null);
          setMatchLoadingProgress(0);
          
          if (lobbyId && user && lobbyId === user.uid) {
            updateDoc(doc(db, 'lobby_teams', lobbyId), { status: 'playing' })
              .then(() => setScreen('loading_match'))
              .catch(e => {
                console.error("Error setting playing status:", e);
                setScreen('loading_match');
              });
          } else {
            setScreen('loading_match');
          }
        } else {
          const docRef = doc(db, 'lobby_teams', lobbyId);
          getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const blue = [...(data.blue || ['', '', ''])];
              const orange = [...(data.orange || ['', '', ''])];
              
              const maxSlots = matchMode === '1v1' ? 1 : matchMode === '2v2' ? 2 : 3;
              const slicedBlue = blue.slice(0, maxSlots);
              const slicedOrange = orange.slice(0, maxSlots);
              
              const emptyBlue = slicedBlue.findIndex(n => n === '');
              const emptyOrange = slicedOrange.findIndex(n => n === '');
              
              const botNames = ['Apex', 'Viper', 'Nitro', 'Turbo', 'Rusty', 'Drift', 'Spark', 'Ghost', 'Fury', 'Rage'];
              
              if (emptyBlue !== -1 || emptyOrange !== -1) {
                const botName = `BOT_${botNames[Math.floor(Math.random() * botNames.length)]}${Math.floor(Math.random() * 99)}`;
                if (emptyBlue !== -1 && emptyOrange !== -1) {
                  if (Math.random() > 0.5) blue[emptyBlue] = botName;
                  else orange[emptyOrange] = botName;
                } else if (emptyBlue !== -1) {
                  blue[emptyBlue] = botName;
                } else {
                  orange[emptyOrange] = botName;
                }
                updateDoc(docRef, { blue, orange }).catch(e => console.error("Error filling slots:", e));
              }
            }
          });
        }
        return newVal;
      });
    }, 1000);

    return () => clearInterval(searchInterval);
  }, [isSearching, lobbyId, user, matchMode]);

  // 8. Countdown Timer ticking
  useEffect(() => {
    if (matchCountdown === null) return;
    if (matchCountdown <= 0) {
      setMatchCountdown(null);
      if (lobbyId && user && lobbyId === user.uid) {
        updateDoc(doc(db, 'lobby_teams', lobbyId), { status: 'playing' })
          .then(() => setScreen('playing'))
          .catch(e => console.error("Error setting playing status:", e));
      } else {
        setScreen('playing');
      }
      return;
    }

    const timerId = setTimeout(() => {
      setMatchCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [matchCountdown, lobbyId, user]);

  // 8.1 Matchmaking Elapsed Timer ticking
  useEffect(() => {
    if (!isSearching) {
      setMatchmakingTime(0);
      return;
    }
    const intervalId = setInterval(() => {
      setMatchmakingTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isSearching]);

  // 8.2 Match Loading Progress ticking
  useEffect(() => {
    if (screen !== 'loading_match') {
      setMatchLoadingProgress(0);
      return;
    }

    const intervalId = setInterval(() => {
      setMatchLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId);
          setScreen('playing');
          return 100;
        }

        // Generate dynamic steps to feel premium and professional
        let step = Math.floor(Math.random() * 4) + 1; // 1-4% standard increase
        
        // Slightly slow down between 85% and 95% to simulate intense physics map loading
        if (prev >= 85 && prev <= 95) {
          if (Math.random() > 0.45) {
            step = 0; // standard loading pause
          } else {
            step = 1;
          }
        }
        
        return Math.min(100, prev + step);
      });
    }, 60);

    return () => clearInterval(intervalId);
  }, [screen]);

  // 9. Instantiate Three.js game engine with chosen car options
  useEffect(() => {
    if (renderedScreen !== 'playing') return;
    if (!mountRef.current) return;
    
    const customStadium = customStadiums.find(s => s.id === selectedStadium);
    const stadiumUrl = customStadium ? (customStadium as any).blobUrl : undefined;

    const game = createGame(mountRef.current, {
      color: gameCarColor,
      accent: gameCarAccent,
      matchMode: matchMode,
      stadiumId: customStadium ? 'cyber' : selectedStadium,
      stadiumUrl: stadiumUrl,
      teamColors: matchTeams?.blueColors ? matchTeams.blueColors.map((color, idx) => ({
        color: color,
        accent: matchTeams.blueAccents?.[idx] || 0xffffff
      })) : undefined,
      modelUrl: selectedCar?.modelUrl,
      quality: qualityPreset
    });
    
    gameInstanceRef.current = game;
    
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, [renderedScreen, selectedStadium, qualityPreset, customStadiums]);

  // 9. Friends List handlers
  const handleAddFriend = async (targetUser: { uid: string, displayName: string, photoURL?: string }) => {
    if (!user) return;
    try {
      const friendDocRef = doc(db, 'users', user.uid, 'friends', targetUser.uid);
      await setDoc(friendDocRef, {
        uid: targetUser.uid,
        displayName: targetUser.displayName,
        photoURL: targetUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.uid}`,
        addedAt: Date.now()
      });
      
      // Reciprocal mutual friend addition
      const ourName = user.displayName || user.email?.split('@')[0] || 'User';
      const reciprocalFriendDocRef = doc(db, 'users', targetUser.uid, 'friends', user.uid);
      await setDoc(reciprocalFriendDocRef, {
        uid: user.uid,
        displayName: ourName,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        addedAt: Date.now()
      });
    } catch (e) {
      console.error("Error adding friend:", e);
    }
  };

  // 10. Invitation Handlers
  const handleSendInvitation = async (friend: any) => {
    if (!user || !lobbyId) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    setInvitedUids(prev => [...prev, friend.uid]);

    if (friend.uid.startsWith('bot_')) {
      setTimeout(async () => {
        try {
          const docRef = doc(db, 'lobby_teams', lobbyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const blue = [...(data.blue || ['', '', '', ''])];
            const blueColors = [...(data.blueColors || [0xff003c, 0x00d2ff, 0x00ff44, 0xffdd00])];
            const blueAccents = [...(data.blueAccents || [0xffdd00, 0xff00ff, 0xffffff, 0xff003c])];
            const emptyBlueIdx = blue.findIndex(n => n === '');
            if (emptyBlueIdx !== -1) {
              blue[emptyBlueIdx] = friend.displayName;
              blueColors[emptyBlueIdx] = [0x00d2ff, 0x00ff44, 0xffdd00, 0xff00ff, 0xffffff, 0xff5500][Math.floor(Math.random() * 6)];
              blueAccents[emptyBlueIdx] = [0xff00ff, 0xffffff, 0xffd12d, 0x00d2ff, 0xff003c][Math.floor(Math.random() * 5)];
              await updateDoc(docRef, { blue, blueColors, blueAccents });
            }
          }
        } catch (e) {
          console.error("Error adding bot to lobby:", e);
        }
      }, 1500);
    } else {
      const inviteId = `${user.uid}_${friend.uid}_${Date.now()}`;
      try {
        await setDoc(doc(db, 'lobby_invitations', inviteId), {
          id: inviteId,
          fromId: user.uid,
          fromName: userName,
          toId: friend.uid,
          status: 'pending',
          timestamp: Date.now()
        });
      } catch (e) {
        console.error("Error sending invitation:", e);
      }
    }
  };

  const handleAcceptInvitation = async (invite: any) => {
    if (!user) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    
    try {
      await updateDoc(doc(db, 'lobby_invitations', invite.id), { status: 'accepted' });
      const hostLobbyRef = doc(db, 'lobby_teams', invite.fromId);
      const hostSnap = await getDoc(hostLobbyRef);
      if (hostSnap.exists()) {
        const data = hostSnap.data();
        const blue = [...(data.blue || ['', '', '', ''])];
        const blueColors = [...(data.blueColors || [0xff003c, 0x00d2ff, 0x00ff44, 0xffdd00])];
        const blueAccents = [...(data.blueAccents || [0xffdd00, 0xff00ff, 0xffffff, 0xff003c])];
        const emptyIdx = blue.findIndex(n => n === '');
        if (emptyIdx !== -1) {
          blue[emptyIdx] = userName;
          blueColors[emptyIdx] = gameCarColor;
          blueAccents[emptyIdx] = gameCarAccent;
          await updateDoc(hostLobbyRef, { blue, blueColors, blueAccents });
        }
        setLobbyId(invite.fromId);
        setActiveModal('play_screen');
      }
    } catch (e) {
      console.error("Error accepting invitation:", e);
    }
    setIncomingInvitation(null);
  };

  const handleRejectInvitation = async (invite: any) => {
    try {
      await updateDoc(doc(db, 'lobby_invitations', invite.id), { status: 'rejected' });
    } catch (e) {
      console.error("Error rejecting invitation:", e);
    }
    setIncomingInvitation(null);
  };

  const handleSearchAddFriend = async (text: string) => {
    if (!text.trim()) {
      setAddFriendSearchResults([]);
      return;
    }
    setIsSearchingAddFriend(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const results: any[] = [];
      const cleanQuery = text.toLowerCase().trim();
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid !== user?.uid) {
          const matchesName = data.displayName?.toLowerCase().includes(cleanQuery);
          const shortId = data.shortId?.toLowerCase() || data.uid?.substring(0, 8).toLowerCase();
          const matchesUid = shortId === cleanQuery || data.uid?.toLowerCase() === cleanQuery;
          if (matchesName || matchesUid) {
            results.push(data);
          }
        }
      });
      setAddFriendSearchResults(results.slice(0, 10));
    } catch (err) {
      console.error("Error searching user to add:", err);
    } finally {
      setIsSearchingAddFriend(false);
    }
  };

  const handleSendFriendRequest = async (targetUser: any) => {
    if (!user) return;
    try {
      const reqId = `${user.uid}_${targetUser.uid}`;
      await setDoc(doc(db, 'friend_requests', reqId), {
        id: reqId,
        fromId: user.uid,
        fromName: user.displayName || user.email?.split('@')[0] || 'User',
        fromPhoto: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        toId: targetUser.uid,
        status: 'pending',
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  };

  const handleAcceptFriendRequest = async (request: any) => {
    if (!user) return;
    try {
      // 1. Add request sender to our friends list
      await setDoc(doc(db, 'users', user.uid, 'friends', request.fromId), {
        uid: request.fromId,
        displayName: request.fromName,
        photoURL: request.fromPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromId}`,
        addedAt: Date.now()
      });

      // 2. Add ourselves to the request sender's friends list
      await setDoc(doc(db, 'users', request.fromId, 'friends', user.uid), {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        addedAt: Date.now()
      });

      // 3. Delete the friend request
      await deleteDoc(doc(db, 'friend_requests', request.id));
    } catch (err) {
      console.error("Error accepting friend request:", err);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid));
      await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid));
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };

  const handleLaunchMatch = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
        await (window.screen.orientation as any).lock('landscape');
      }
    } catch (e) {
      console.warn("Fullscreen/orientation not locked", e);
    }
    
    // Use the user's selected stadium!
    let chosenStadium = selectedStadium || 'emerald';
    setSelectedStadium(chosenStadium);
    localStorage.setItem('selectedStadium', chosenStadium);

    if (!user) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'User';

    let joinedExisting = false;
    let targetLobbyId = '';

    // Only search for other searching lobbies if we are NOT in a practice match
    if (matchMode !== 'practice') {
      try {
        const q = query(
          collection(db, 'lobby_teams'),
          where('status', '==', 'searching'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          if (data.hostId !== user.uid) {
            // Check if there is an empty slot in blue or orange
            const blue = [...(data.blue || ['', '', '', ''])];
            const orange = [...(data.orange || ['', '', '', ''])];
            const maxSlots = matchMode === '1v1' ? 1 : matchMode === '2v2' ? 2 : 3;
            
            const emptyBlueIdx = blue.slice(0, maxSlots).findIndex(n => n === '');
            const emptyOrangeIdx = orange.slice(0, maxSlots).findIndex(n => n === '');
            
            if (emptyBlueIdx !== -1 || emptyOrangeIdx !== -1) {
              // We can join this lobby!
              targetLobbyId = data.hostId;
              const docRef = doc(db, 'lobby_teams', targetLobbyId);
              
              if (emptyBlueIdx !== -1) {
                blue[emptyBlueIdx] = userName;
                const blueColors = [...(data.blueColors || [0x00d2ff, 0x00d2ff, 0x00ff44, 0xffdd00])];
                const blueAccents = [...(data.blueAccents || [0xffffff, 0xffdd00, 0xffffff, 0xff00ff])];
                blueColors[emptyBlueIdx] = gameCarColor;
                blueAccents[emptyBlueIdx] = gameCarAccent;
                await updateDoc(docRef, { blue, blueColors, blueAccents });
              } else {
                orange[emptyOrangeIdx] = userName;
                const orangeColors = [...(data.orangeColors || [0xff3d3d, 0xff3d3d, 0x00ff44, 0xffdd00])];
                const orangeAccents = [...(data.orangeAccents || [0xffffff, 0xffdd00, 0xffffff, 0xff00ff])];
                orangeColors[emptyOrangeIdx] = gameCarColor;
                orangeAccents[emptyOrangeIdx] = gameCarAccent;
                await updateDoc(docRef, { orange, orangeColors, orangeAccents });
              }
              
              setLobbyId(targetLobbyId);
              joinedExisting = true;
              break;
            }
          }
        }
      } catch (err) {
        console.error("Error querying active matchmaking lobbies:", err);
      }
    }

    if (!joinedExisting) {
      // Mark our own lobby as searching so others can find us!
      const hostId = user.uid;
      const docRef = doc(db, 'lobby_teams', hostId);
      await updateDoc(docRef, { status: 'searching', timestamp: Date.now() }).catch(e => console.error(e));
      setLobbyId(hostId);
    }

    setIsSearching(true);
    // Use a natural, premium matchmaking search time of 6-9 seconds
    const randomSearchTime = Math.floor(Math.random() * 4) + 6;
    setSearchTimer(randomSearchTime);
  };

  const handleBackToLobby = async () => {
    // Keep fullscreen active to prevent mobile navigation/address bars from showing up and keep orientation locked
    try {
      if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
        await (window.screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {
      console.warn("Could not lock orientation", e);
    }

    // If online match and lobby/user exists, perform Firestore replacement with bot
    if (lobbyId && user) {
      const ourName = user.displayName || user.email?.split('@')[0] || 'User';
      const docRef = doc(db, 'lobby_teams', lobbyId);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const blue = [...(data.blue || ['', '', ''])];
          const orange = [...(data.orange || ['', '', ''])];
          
          let replaced = false;
          // Find and replace our name in blue team
          const blueIdx = blue.indexOf(ourName);
          if (blueIdx !== -1) {
            blue[blueIdx] = `BOT_${ourName.slice(0, 10).replace(/\s+/g, '_')}_${Math.floor(Math.random() * 90 + 10)}`;
            replaced = true;
          }
          // Find and replace our name in orange team
          const orangeIdx = orange.indexOf(ourName);
          if (orangeIdx !== -1) {
            orange[orangeIdx] = `BOT_${ourName.slice(0, 10).replace(/\s+/g, '_')}_${Math.floor(Math.random() * 90 + 10)}`;
            replaced = true;
          }

          if (replaced) {
            const allUsers = [...blue, ...orange];
            const realUsersLeft = allUsers.filter(name => isRealUser(name));
            
            if (realUsersLeft.length <= 1) {
              // If only 1 or 0 real users left, finish the match in Firestore
              await updateDoc(docRef, {
                blue,
                orange,
                status: 'finished'
              });
            } else {
              // Otherwise, just replace with bot so match continues for other real users
              await updateDoc(docRef, {
                blue,
                orange
              });
            }
          }
        }
      } catch (err) {
        console.error("Error updating lobby teams on exit match:", err);
      }
    }

    setScreen('lobby');
    setInitialRealUsersCount(null);
    
    // Award match completion coins!
    const rewardCoins = 150;
    const newCoins = coins + rewardCoins;
    setCoins(newCoins);
    localStorage.setItem('coins', newCoins.toString());
    
    if (matchMode === 'ranked') {
      const rewardStars = 1;
      const newStars = userRankStars + rewardStars;
      setUserRankStars(newStars);
      localStorage.setItem('userRankStars', newStars.toString());
      setLobbyNotice(`⚽ RANKED MATCH COMPLETED!\nYou earned +${rewardCoins} gold coins and +${rewardStars} Rank Star!`);
    } else {
      setLobbyNotice(`⚽ MATCH COMPLETED!\nYou drove hard and earned +${rewardCoins} gold coins!`);
    }
  };

  // Switch car helper
  const handlePrevCar = () => {
    if (ownedCarPresets.length <= 1) return;
    const nextIdx = selectedOwnedCarIndex === 0 ? ownedCarPresets.length - 1 : selectedOwnedCarIndex - 1;
    setSelectedOwnedCarIndex(nextIdx);
    localStorage.setItem('selectedOwnedCarIndex', nextIdx.toString());
    setCustomPrimaryColor('');
    setCustomAccentColor('');
  };

  const handleNextCar = () => {
    if (ownedCarPresets.length <= 1) return;
    const nextIdx = selectedOwnedCarIndex === ownedCarPresets.length - 1 ? 0 : selectedOwnedCarIndex + 1;
    setSelectedOwnedCarIndex(nextIdx);
    localStorage.setItem('selectedOwnedCarIndex', nextIdx.toString());
    setCustomPrimaryColor('');
    setCustomAccentColor('');
  };

  // Return Loading Splash Screen
  if (renderedScreen === 'loading') {
    const gameplayTips = [
      "DRIFT FOR EXTRA BOOST",
      "HIT BALL AT SPEED",
      "DEFEND YOUR GOAL AREA",
      "COLLECT YELLOW POWER PADS",
      "UPGRADE SKINS IN GARAGE"
    ];
    const currentTipIndex = Math.min(Math.floor((progress / 100) * gameplayTips.length), gameplayTips.length - 1);
    const currentTip = gameplayTips[currentTipIndex];

    return (
      <div 
        style={{ 
          position: 'fixed',
          inset: 0,
          backgroundImage: hasBgError ? 'radial-gradient(circle at 50% 30%, #111a2e 0%, #060c18 60%, #02050b 100%)' : `url(${bgImage})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          color: '#ffffff', 
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden'
        }}
      >
        {/* Transparent Bottom-Left Tips Overlay Panel - fits perfectly into the pre-existing blue-outlined box next to f connect */}
        <div 
          style={{ 
            position: 'absolute', 
            left: '7.2%', 
            bottom: '4.2%', 
            width: '18.0%', 
            height: '4.8%', 
            zIndex: 10, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 4px',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          <p style={{ fontSize: 'clamp(0.45rem, 0.95vw, 0.68rem)', color: '#ffffff', lineHeight: '1.2', margin: 0, fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.95)', letterSpacing: '0.2px', wordBreak: 'break-word' }}>
            {currentTip}
          </p>
        </div>

        {/* COMPACT, NO-BACKGROUND LOADING BAR AT THE BOTTOM CENTER */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '2.3%', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '150px', 
            zIndex: 10, 
            background: 'none', 
            border: 'none', 
            padding: '0', 
            boxShadow: 'none', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 950, color: '#43f5ff', textShadow: '0 0 5px rgba(67, 245, 255, 0.7), 0 1px 3px rgba(0,0,0,0.95)' }}>
            {progress}%
          </span>
          
          <div style={{ height: '3px', width: '100%', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #43f5ff 0%, #ffd32a 100%)', 
                borderRadius: '999px',
                boxShadow: '0 0 6px rgba(67, 245, 255, 0.6)',
                transition: 'width 0.1s ease-out'
              }} 
            />
          </div>
        </div>
        <ScreenGate gateState={gateState} />
      </div>
    );
  }

  // Login Screen
  if (renderedScreen === 'login') {
    const handleLoginAttempt = (loginFn: () => void) => {
      // Attempt to enforce fullscreen and landscape on interaction
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
          (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (e) {
        console.warn("Could not enforce fullscreen/orientation", e);
      }

      if (!termsAccepted || !ageConfirmed) {
        setValidationFailed(true);
        alert("Please accept the Terms of Service and confirm your age before logging in.");
        return;
      }
      setValidationFailed(false);
      setLoginError('');
      
      loginFn();
    };

    return (
      <div 
        style={{ 
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(/loginpage.png?v=2)`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        <div id="login-buttons-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}>
          
          {/* Centered Login Buttons Group Container */}
          <div style={{
            position: 'absolute',
            bottom: '21%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            zIndex: 50,
            pointerEvents: 'auto'
          }}>
            {loginError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center', width: '100%', marginBottom: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                {loginError}
              </div>
            )}
            {/* Facebook Button */}
            <button 
              id="facebook-login"
              onClick={() => handleLoginAttempt(() => signInWithPopup(auth, new FacebookAuthProvider()).catch(e => setLoginError("Facebook Login Error: " + e.message + " (If you see an error, try opening the app in a new tab)")))}
              style={{ 
                width: '253px', 
                height: '42px', 
                background: '#1877f2', 
                border: 'none', 
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '14px',
                letterSpacing: '0.1px',
                cursor: 'pointer', 
                outline: 'none', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                fontFamily: '"Inter", sans-serif',
                marginBottom: '-3px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#166fe5';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1877f2';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="white" />
                <path d="M13.5 17.5V11.5H15.5L16 9.5H13.5V8.5C13.5 7.8 13.5 7.5 14.5 7.5H16V5.5C15.3 5.5 14.2 5.5 13.5 5.5C11.5 5.5 10.5 6.5 10.5 8.5V9.5H8.5V11.5H10.5V17.5H13.5Z" fill="#1877f2" />
              </svg>
              Sign in with Facebook
            </button>

            {/* OR Divider with horizontal lines */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif',
              pointerEvents: 'none',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              margin: '2px 0',
              marginTop: '-11px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.4)' }}></div>
              <span style={{ margin: '0 10px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.4)' }}></div>
            </div>

            {/* Row of Guest and More Buttons */}
            <div style={{
              display: 'flex',
              width: '100%',
              gap: '10px'
            }}>
              {/* Guest Button */}
              <button 
                id="guest-login"
                onClick={() => handleLoginAttempt(() => signInAnonymously(auth).catch(e => alert("Guest Login Error: " + e.message)))}
                style={{ 
                  flex: 1, 
                  height: '38px', 
                  background: 'linear-gradient(to bottom, #eaeaea 0%, #cacaca 100%)', 
                  border: 'none', 
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0,0,0,0.4)',
                  color: '#1a1a1a',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  cursor: 'pointer', 
                  outline: 'none', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  fontFamily: '"Inter", sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #ffffff 0%, #dadada 100%)';
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #eaeaea 0%, #cacaca 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1a1a1a' }}>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                Guest
              </button>

              {/* More Button */}
              <button 
                id="more-login"
                onClick={() => setShowMoreLoginOptions(true)}
                style={{ 
                  flex: 1, 
                  height: '38px', 
                  background: 'linear-gradient(to bottom, #eaeaea 0%, #cacaca 100%)', 
                  border: 'none', 
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0,0,0,0.4)',
                  color: '#1a1a1a',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  cursor: 'pointer', 
                  outline: 'none', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  fontFamily: '"Inter", sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #ffffff 0%, #dadada 100%)';
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #eaeaea 0%, #cacaca 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#1a1a1a" />
                  <circle cx="7" cy="12" r="1.5" fill="#ffffff" />
                  <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
                  <circle cx="17" cy="12" r="1.5" fill="#ffffff" />
                </svg>
                More
              </button>
            </div>
          </div>

          {/* Legal Checkboxes */}
          <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, textShadow: '0 1px 2px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
            <label style={{ 
              color: 'white', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              padding: '4px 8px',
              paddingLeft: '9px',
              paddingRight: '210px',
              paddingTop: '0px',
              marginTop: '-1px',
              marginBottom: '-24px',
              borderRadius: '4px',
              pointerEvents: 'auto',
              border: validationFailed && !termsAccepted ? '2px solid red' : '2px solid transparent',
              background: validationFailed && !termsAccepted ? 'rgba(255, 0, 0, 0.2)' : 'transparent'
            }}>
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                }} 
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: validationFailed && !termsAccepted ? 'red' : 'auto' }}
              />
              <span>
                I have read and agree to the{' '}
                <a href="?page=terms" target="_blank" style={{ color: '#00d2ff', textDecoration: 'underline', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); }}>Terms of Service</a>
                {' '}and{' '}
                <a href="?page=privacy" target="_blank" style={{ color: '#00d2ff', textDecoration: 'underline', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); }}>Privacy Policy</a>
              </span>
            </label>
            <label style={{ 
              color: 'white', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              padding: '4px 8px',
              paddingRight: '299px',
              marginTop: '9px',
              marginBottom: '-1px',
              borderRadius: '4px',
              pointerEvents: 'auto',
              border: validationFailed && !ageConfirmed ? '2px solid red' : '2px solid transparent',
              background: validationFailed && !ageConfirmed ? 'rgba(255, 0, 0, 0.2)' : 'transparent'
            }}>
              <input 
                type="checkbox" 
                checked={ageConfirmed} 
                onChange={(e) => setAgeConfirmed(e.target.checked)} 
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: validationFailed && !ageConfirmed ? 'red' : 'auto' }}
              />
              <span>I confirm that my age information is true and valid</span>
            </label>
          </div>

          {showMoreLoginOptions && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'auto' }}>
              <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '2px solid #00d2ff', display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
                <h3 style={{ margin: 0, textAlign: 'center', color: '#fff', fontSize: '1.2rem', textTransform: 'uppercase', textShadow: '0 0 10px #00d2ff' }}>More Login Options</h3>
                <button 
                  onClick={() => handleLoginAttempt(() => signInWithPopup(auth, new GoogleAuthProvider()).catch(e => setLoginError("Google Login Error: " + e.message + " (If you see a 403 error, try opening the app in a new tab)")))}
                  style={{ padding: '12px', background: '#ffffff', color: '#000000', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <User size={18} />
                  Login with Google
                </button>
                <button 
                  onClick={() => handleLoginAttempt(() => {
                    setShowMoreLoginOptions(false);
                    setShowEmailAuthModal('login');
                    setEmailInput('');
                    setPasswordInput('');
                  })}
                  style={{ padding: '12px', background: '#333333', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <MessageSquare size={18} />
                  Login with Email
                </button>
                <button 
                  onClick={() => setShowMoreLoginOptions(false)}
                  style={{ padding: '10px', background: 'transparent', color: '#8fa2c4', border: '1px solid #8fa2c4', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showEmailAuthModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 105, pointerEvents: 'auto' }}>
              <div style={{ background: '#0a101d', padding: '30px', borderRadius: '16px', border: '2px solid #43f5ff', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '350px', boxShadow: '0 0 30px rgba(67, 245, 255, 0.2)' }}>
                <h2 style={{ margin: 0, textAlign: 'center', color: '#ffffff', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                  {showEmailAuthModal === 'login' ? 'Login with Email' : showEmailAuthModal === 'signup' ? 'Create Account' : 'Verify Email'}
                </h2>
                
                {emailAuthError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                    {emailAuthError}
                  </div>
                )}
                {emailAuthSuccess && (
                  <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                    {emailAuthSuccess}
                  </div>
                )}

                {showEmailAuthModal !== 'verify_email' ? (
                  <>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #43f5ff', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }}
                    />
                    
                    <input
                      type="password"
                      placeholder="Password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #43f5ff', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }}
                    />
                    
                    <button
                      onClick={() => {
                        setEmailAuthError('');
                        setEmailAuthSuccess('');
                        if (!emailInput || !passwordInput) {
                          setEmailAuthError("Please enter both email and password.");
                          return;
                        }
                        if (showEmailAuthModal === 'login') {
                          signInWithEmailAndPassword(auth, emailInput, passwordInput)
                            .then((userCred) => {
                              if (!userCred.user.emailVerified) {
                                // Keep them logged in but transition them to the verification state
                                setEmailAuthError("Please verify your email address before logging in. Check your inbox (and spam folder).");
                                setShowEmailAuthModal('verify_email');
                              } else {
                                setShowEmailAuthModal(null);
                              }
                            })
                            .catch(e => setEmailAuthError("Login error: " + e.message));
                        } else {
                          createUserWithEmailAndPassword(auth, emailInput, passwordInput)
                            .then(async (userCred) => {
                              try {
                                const { sendEmailVerification } = await import('firebase/auth');
                                await sendEmailVerification(userCred.user);
                                setEmailAuthSuccess("Signup successful! A verification link has been sent to " + emailInput + ". Check your inbox (and spam folder).");
                                setShowEmailAuthModal('verify_email');
                              } catch (err: any) {
                                setEmailAuthError("Signup successful, but failed to send verification email: " + err.message);
                              }
                            })
                            .catch(e => setEmailAuthError("Signup error: " + e.message));
                        }
                      }}
                      style={{ padding: '14px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      {showEmailAuthModal === 'login' ? 'Login' : 'Sign Up'}
                    </button>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <button
                        onClick={() => {
                          setEmailAuthError('');
                          setEmailAuthSuccess('');
                          setShowEmailAuthModal(showEmailAuthModal === 'login' ? 'signup' : 'login');
                        }}
                        style={{ background: 'none', border: 'none', color: '#43f5ff', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                      >
                        {showEmailAuthModal === 'login' ? 'Create new account' : 'Back to Login'}
                      </button>
                      <button
                        onClick={() => {
                          auth.signOut();
                          setShowEmailAuthModal(null);
                        }}
                        style={{ background: 'none', border: 'none', color: '#8fa2c4', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <p style={{ color: '#c4d1eb', fontSize: '0.95rem', textAlign: 'center', lineHeight: '1.5' }}>
                      We've sent a verification link to <strong style={{ color: '#00d2ff' }}>{emailInput || auth.currentUser?.email}</strong>. Please check your inbox (and spam folder), click the link, and click below to check status.
                    </p>
                    <button
                      onClick={async () => {
                        setEmailAuthError('');
                        setEmailAuthSuccess('');
                        if (auth.currentUser) {
                          try {
                            await auth.currentUser.reload();
                            if (auth.currentUser.emailVerified) {
                              setEmailAuthSuccess("Email verified successfully! Opening profile setup...");
                              const pendingName = localStorage.getItem('pendingUserName');
                              if (!pendingName && !auth.currentUser.displayName) {
                                setScreen('profile_setup');
                              } else {
                                setScreen('lobby');
                              }
                              setShowEmailAuthModal(null);
                            } else {
                              setEmailAuthError("Email is still not verified. Please check your email and click the link first.");
                            }
                          } catch (err: any) {
                            setEmailAuthError("Status check failed: " + err.message);
                          }
                        } else {
                          setEmailAuthError("No active session. Please sign up or log in again.");
                        }
                      }}
                      style={{ padding: '14px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      Check Status
                    </button>
                    <button
                      onClick={async () => {
                        setEmailAuthError('');
                        setEmailAuthSuccess('');
                        if (auth.currentUser) {
                          try {
                            const { sendEmailVerification } = await import('firebase/auth');
                            await sendEmailVerification(auth.currentUser);
                            setEmailAuthSuccess("Verification link resent successfully! Check your inbox.");
                          } catch (err: any) {
                            setEmailAuthError("Failed to resend: " + err.message);
                          }
                        } else {
                          setEmailAuthError("No active session. Please sign up or log in again.");
                        }
                      }}
                      style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', color: '#43f5ff', border: '1px solid #43f5ff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      Resend Link
                    </button>
                    <button
                      onClick={() => {
                        auth.signOut();
                        setEmailAuthError('');
                        setEmailAuthSuccess('');
                        setShowEmailAuthModal('login');
                      }}
                      style={{ padding: '10px', background: 'transparent', color: '#8fa2c4', border: 'none', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                    >
                      Back to Login / Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {showLegalModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
              <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '2px solid #00d2ff', display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                <h2 style={{ margin: 0, color: '#43f5ff', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  {showLegalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h2>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {showLegalModal === 'terms' ? (
                    <>
                      <p><strong>1. Acceptance of Terms</strong><br/>By accessing or playing this game, you agree to abide by these Terms of Service and all applicable laws and regulations.</p>
                      <p><strong>2. User Accounts</strong><br/>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                      <p><strong>3. Code of Conduct</strong><br/>You agree not to engage in any abusive, harassing, or disruptive behavior while playing the game or interacting with other users.</p>
                      <p><strong>4. Intellectual Property</strong><br/>All content, including graphics, code, and audio, is the property of the game developers and may not be reproduced without permission.</p>
                      <p><strong>5. Modifications</strong><br/>We reserve the right to modify these terms at any time. Continued use of the game constitutes acceptance of the new terms.</p>
                    </>
                  ) : (
                    <>
                      <p><strong>1. Data Collection</strong><br/>We collect basic account information (such as your display name and email address if provided) and gameplay data to provide and improve the game experience.</p>
                      <p><strong>2. Usage of Information</strong><br/>Your information is used solely for game functionality, matchmaking, leaderboards, and account recovery. We do not sell your personal data.</p>
                      <p><strong>3. Third-Party Services</strong><br/>We use third-party authentication services (like Google and Facebook) and database hosting (Firebase). These services have their own privacy policies.</p>
                      <p><strong>4. Data Security</strong><br/>We implement standard security measures to protect your data, but no method of transmission over the internet is 100% secure.</p>
                      <p><strong>5. Children's Privacy</strong><br/>This game complies with Google Play Console policies regarding family and children. We require age confirmation to ensure appropriate data handling for minors.</p>
                      <p><strong>6. Data Deletion</strong><br/>You may request the deletion of your account and associated data at any time through the in-game settings.</p>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setShowLegalModal(null)}
                  style={{ alignSelf: 'center', padding: '10px 30px', background: '#00d2ff', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '10px' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
        <ScreenGate gateState={gateState} />
      </div>
    );
  }

  if (renderedScreen === 'profile_setup') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a101d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: '#111827', padding: '40px', borderRadius: '16px', border: '2px solid #00d2ff', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 0 30px rgba(0, 210, 255, 0.2)' }}>
          <h2 style={{ margin: 0, color: '#43f5ff', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' }}>
            Driver Registration
          </h2>
          <p style={{ margin: 0, color: '#c4d1eb', fontSize: '0.9rem', textAlign: 'center' }}>
            Welcome! Please complete your profile to continue.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Display Name</label>
            <input 
              type="text"
              value={profileNameInput}
              onChange={e => setProfileNameInput(e.target.value)}
              placeholder="Enter your driver name"
              style={{ padding: '14px', borderRadius: '8px', border: '1px solid #43f5ff', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Age</label>
            <input 
              type="number"
              value={profileAgeInput}
              onChange={e => setProfileAgeInput(e.target.value)}
              placeholder="Enter your age"
              min="1"
              max="120"
              style={{ padding: '14px', borderRadius: '8px', border: '1px solid #43f5ff', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '1rem' }}
            />
          </div>

          <button 
            onClick={async () => {
              if (!profileNameInput.trim()) {
                alert("Display name is required");
                return;
              }
              if (!profileAgeInput.trim() || isNaN(Number(profileAgeInput))) {
                alert("Valid age is required");
                return;
              }
              localStorage.setItem('pendingUserName', profileNameInput.trim());
              localStorage.setItem('pendingUserAge', profileAgeInput.trim());
              
              if (user) {
                try {
                  const { updateProfile } = await import('firebase/auth');
                  await updateProfile(user, { displayName: profileNameInput.trim() });
                } catch (e) {
                  console.error('Failed to update profile name:', e);
                }
              }
              setScreen('lobby');
            }}
            style={{ padding: '16px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem' }}
          >
            Enter City
          </button>

          <button 
            onClick={() => {
              auth.signOut();
              setScreen('login');
            }}
            style={{ padding: '10px', background: 'transparent', color: '#8fa2c4', border: 'none', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline', marginTop: '5px' }}
          >
            Cancel / Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Match Loading Screen (Free Fire Style Empty Loading Screen)
  if (renderedScreen === 'loading_match') {
    const modeLabel = 
      matchMode === 'ranked' ? 'Ranked 3v3 (Neon Cyberdome)' :
      matchMode === '2v2' ? '2v2 Casual (Emerald Forest)' :
      matchMode === '1v1' ? '1v1 Casual (Emerald Forest)' : 'Practice Match (Emerald Forest)';

    return (
      <div 
        id="match-loading-container"
        style={{ 
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/mainmenubg.png?v=2)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundColor: '#000000',
          overflow: 'hidden',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 'env(safe-area-inset-top, 10px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px)',
          boxSizing: 'border-box'
        }}
      >
        {/* Empty layout, only bottom loading HUD is visible */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Active Mode Name above the loading bar */}
          <div style={{ 
            color: '#ffffff', 
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            fontSize: '1rem', 
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '1px'
          }}>
            Loading {modeLabel}...
          </div>

          {/* Golden/Yellow Loading Bar */}
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: 'rgba(0, 0, 0, 0.6)', 
            borderRadius: '3px',
            border: '1px solid rgba(255, 211, 42, 0.2)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #ffd32a 0%, #ff9f43 100%)',
              width: `${matchLoadingProgress}%`,
              borderRadius: '3px',
              boxShadow: '0 0 10px rgba(255, 211, 42, 0.8)',
              transition: 'width 0.08s linear'
            }} />
          </div>

          {/* Loading status text and Percentage below loading bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            color: '#ffd32a', 
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            fontSize: '0.8rem', 
            fontWeight: '800',
            letterSpacing: '2px',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)'
          }}>
            <span>LOADING...</span>
            <span style={{ color: '#ffffff' }}>{Math.floor(matchLoadingProgress)}%</span>
          </div>
        </div>

        <ScreenGate gateState={gateState} />
      </div>
    );
  }

  // Lobby Screen (Garage Showroom & Dashboard)
  if (renderedScreen === 'lobby') {
    const ourName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const hasRealFriendsInSquad = matchTeams && matchTeams.blue.filter(n => n !== '' && n !== ourName && isRealUser(n)).length > 0;
    const isSquadLobbyActive = hasRealFriendsInSquad || invitedUids.length > 0;

    return (
      <div 
        id="lobby-container"
        style={{ 
          position: 'fixed',
          inset: 0,
          backgroundColor: '#000000',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#ffffff',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        {/* 3D GARAGE CANVAS COMPONENT */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {isSquadLobbyActive ? (
            <SquadCanvas 
              blueNames={(matchTeams?.blue || [ourName, '', '', '']).map((n: string) => n.startsWith('BOT_') ? '' : n)}
              blueColors={matchTeams?.blueColors || [gameCarColor, 0x00d2ff, 0x00ff44, 0xffdd00]}
              blueAccents={matchTeams?.blueAccents || [gameCarAccent, 0xffdd00, 0xffffff, 0xff00ff]}
              backgroundImage="/mainmenubg.png?v=2"
            />
          ) : (
            <GarageCanvas 
              color={gameCarColor} 
              accent={gameCarAccent} 
              carY={carY}
              carZ={carZ}
              carScale={carScale}
              modelUrl={selectedCar?.modelUrl}
              customRotation={selectedCar?.customRotation}
            />
          )}
        </div>

        {/* ==================== HUD LAYER ==================== */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          
          {/* Main Play Button in Bottom Right (Embedded Corner Style) */}
          <div style={{ 
            position: 'absolute', 
            bottom: '0px', 
            right: '0px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '8px', 
            pointerEvents: 'auto',
            width: '310px',
            height: '48px',
            background: 'rgba(2, 6, 17, 0.9)',
            borderLeft: '1.5px solid rgba(67, 245, 255, 0.4)',
            borderTop: '1.5px solid rgba(67, 245, 255, 0.4)',
            borderRight: 'none',
            borderBottom: 'none',
            borderRadius: '12px 0 0 0',
            padding: '0 12px',
            backdropFilter: 'blur(8px)',
            boxShadow: 'inset 0 2px 8px rgba(67, 245, 255, 0.15), -2px -2px 12px rgba(0, 0, 0, 0.9)',
            boxSizing: 'border-box'
          }}>
            {/* Clickable Rank Badge Icon (Only icon, no text, opens empty rankings screen) */}
            <button
              onClick={() => setActiveModal('rankings_screen')}
              style={{
                background: 'rgba(5, 12, 28, 0.8)',
                border: '1.5px solid rgba(255, 211, 42, 0.6)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 0 8px rgba(255, 211, 42, 0.3)',
                transition: 'all 0.15s ease-in-out',
                position: 'relative'
              }}
              className="hover:scale-110 hover:border-yellow-400 hover:shadow-yellow-500/50 active:scale-95"
              title="Open Rankings"
            >
              {/* Badge Emblem Design */}
              <div style={{
                width: '16px',
                height: '20px',
                background: 'linear-gradient(135deg, #ffd32a 0%, #ff9f43 100%)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}>
                <Trophy size={9} style={{ color: '#000000', strokeWidth: 3 }} />
              </div>
            </button>

            {/* Mode Selector Button */}
            <button
              onClick={() => setShowModeSelector(true)}
              className="hover:scale-105 transition-all relative overflow-hidden"
              style={{
                backgroundImage: 'url("/modebutton.png?v=2")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: '100% 100%',
                width: '120px',
                height: '34px',
                color: 'white',
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 'bold',
                fontSize: '9px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: `1.5px solid ${
                  matchMode === '1v1' ? '#9d4edd' :
                  matchMode === '2v2' ? '#00d2ff' :
                  matchMode === 'practice' ? '#10b981' : '#ff5500'
                }`,
                borderRadius: '4px',
                boxShadow: `0 0 10px ${
                  matchMode === '1v1' ? 'rgba(157, 78, 221, 0.5)' :
                  matchMode === '2v2' ? 'rgba(0, 210, 255, 0.5)' :
                  matchMode === 'practice' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 85, 0, 0.5)'
                }, inset 0 0 6px ${
                  matchMode === '1v1' ? 'rgba(157, 78, 221, 0.25)' :
                  matchMode === '2v2' ? 'rgba(0, 210, 255, 0.25)' :
                  matchMode === 'practice' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 85, 0, 0.25)'
                }`,
                textShadow: `0 0 5px ${
                  matchMode === '1v1' ? '#9d4edd' :
                  matchMode === '2v2' ? '#00d2ff' :
                  matchMode === 'practice' ? '#10b981' : '#ff5500'
                }`
              }}
            >
              {matchMode === '1v1' ? '1v1 CASUAL' : matchMode === '2v2' ? '2v2 CASUAL' : matchMode === 'practice' ? 'PRACTICE' : 'RANKED 3V3'}
            </button>
            <button 
              onClick={() => {
                if (!isSearching && matchCountdown === null) {
                  handleLaunchMatch();
                }
              }}
              disabled={isSearching || matchCountdown !== null}
              className="hover:scale-105 rounded cursor-pointer transition-all border-none"
              style={{ 
                width: '120px', 
                height: '34px', 
                backgroundImage: 'url("/playbutton.png?v=2")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: '100% 100%',
                opacity: (isSearching || matchCountdown !== null) ? 0.5 : 1,
                outline: 'none',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            />
          </div>

          {/* Garage Button below Profile Image */}
          <div style={{ position: 'absolute', top: '110px', left: '12px', width: '130px', height: '40px', pointerEvents: 'auto' }}>
            <button 
              onClick={() => setActiveModal('my_garage')}
              className="hover:scale-105 transition-all outline-none"
              style={{ 
                width: '120px', 
                height: '34px', 
                backgroundImage: 'url("/garagebutton.png?v=2")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: '100% 100%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                marginTop: '6px'
              }}
            />
          </div>
          
          {/* TOP BAR */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 'env(safe-area-inset-top, 10px) env(safe-area-inset-right, 10px) 10px env(safe-area-inset-left, 10px)', background: 'linear-gradient(to bottom, rgba(3,8,20,0.8) 0%, rgba(3,8,20,0) 100%)', zIndex: 40 }}>
            
            {/* CYBERPUNK USER PROFILE BOX (Placed on Left) */}
            <div style={{ position: 'relative', pointerEvents: 'auto', marginLeft: '-11px', marginTop: '-11px' }}>
              <style>{`
                @keyframes neon-trace-blue {
                  0% { stroke-dashoffset: 450; }
                  100% { stroke-dashoffset: 0; }
                }
                @keyframes laser-sweep {
                  0% { transform: translateY(-2px); opacity: 0.1; }
                  50% { opacity: 0.5; }
                  100% { transform: translateY(52px); opacity: 0.1; }
                }
                @keyframes gaming-pulse {
                  0%, 100% {
                    box-shadow: 0 0 10px rgba(0, 240, 255, 0.15), inset 0 0 10px rgba(0, 0, 0, 0.9);
                  }
                  50% {
                    box-shadow: 0 0 18px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.9);
                  }
                }
                .gaming-pulsate {
                  animation: gaming-pulse 4s infinite ease-in-out;
                }
              `}</style>

              {/* Outer container with cut bottom-right corner */}
              <div 
                id="user-profile-card"
                className="gaming-pulsate"
                style={{
                  width: '180px',
                  height: '50px',
                  position: 'relative',
                  background: '#04060b',
                  backdropFilter: 'blur(10px)',
                  clipPath: 'polygon(0 0, 100% 0, 100% 38px, 168px 50px, 0 50px)',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* Horizontal glowing red neon tube along the top edge */}
                <div style={{
                  position: 'absolute',
                  top: '1px',
                  left: '8px',
                  right: '8px',
                  height: '1.5px',
                  background: '#ff003c',
                  boxShadow: '0 0 6px #ff003c, 0 0 12px rgba(255, 0, 60, 0.8)',
                  borderRadius: '1px',
                  zIndex: 2,
                  opacity: 0.85
                }} />

                {/* Tech circuit lines in the background */}
                <svg 
                  width="100%" 
                  height="100%" 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    overflow: 'hidden', 
                    pointerEvents: 'none', 
                    zIndex: 1 
                  }}
                >
                  {/* Subtle Grid */}
                  <defs>
                    <pattern id="gaming-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gaming-grid)" opacity="0.4" />

                  {/* Circuit Board Traces (Red & Gray lines) */}
                  <path d="M 10 40 L 40 40 L 50 30 L 110 30" fill="none" stroke="rgba(255, 0, 60, 0.25)" strokeWidth="0.75" />
                  <circle cx="110" cy="30" r="1.2" fill="#ff003c" opacity="0.6" />

                  <path d="M 120 12 L 150 12 L 160 22 L 180 22" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.7" />
                  <circle cx="120" cy="12" r="1" fill="#ffffff" opacity="0.3" />

                  {/* Animated laser scan line */}
                  <line 
                    x1="0" 
                    y1="0" 
                    x2="180" 
                    y2="0" 
                    stroke="rgba(255, 0, 60, 0.35)" 
                    strokeWidth="1" 
                    style={{
                      animation: 'laser-sweep 3s ease-in-out infinite',
                      filter: 'drop-shadow(0 0 2px #ff003c)'
                    }}
                  />
                </svg>

                {/* Neon Glowing Border Trace SVG */}
                <svg 
                  width="100%" 
                  height="100%" 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    pointerEvents: 'none', 
                    zIndex: 3 
                  }}
                >
                  {/* Outer tracing blue neon line (clockwise) */}
                  <polygon 
                    points="1,1 179,1 179,38 167,49 1,49" 
                    fill="none" 
                    stroke="rgba(0, 240, 255, 0.15)" 
                    strokeWidth="1" 
                  />
                  <polygon 
                    points="1,1 179,1 179,38 167,49 1,49" 
                    fill="none" 
                    stroke="#00f0ff" 
                    strokeWidth="1.5" 
                    strokeDasharray="45 180"
                    style={{
                      animation: 'neon-trace-blue 4s linear infinite',
                      filter: 'drop-shadow(0 0 3px #00f0ff) drop-shadow(0 0 6px rgba(0, 240, 255, 0.5))'
                    }}
                  />
                </svg>

                {/* Content Layer (Avatar + Details) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 5, width: '100%' }}>
                  
                  {/* Profile Picture with neon frame design & solid black background */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <div style={{ 
                      position: 'relative', 
                      width: '26px', 
                      height: '26px', 
                      flexShrink: 0, 
                      borderRadius: '5px', 
                      background: '#000000', 
                      border: '1.5px solid #00f0ff', 
                      padding: '1px', 
                      boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
                        alt="Profile" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '2px', 
                          objectFit: 'cover',
                          background: '#000000'
                        }} 
                      />
                      {/* Active green status dot indicator */}
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '-1px', 
                        right: '-1px', 
                        width: '5px', 
                        height: '5px', 
                        background: '#39ff14', 
                        borderRadius: '50%', 
                        border: '1px solid #000000', 
                        boxShadow: '0 0 4px #39ff14' 
                      }} />
                    </div>
                    {/* ONLINE text under avatar just like in the reference image */}
                    <span style={{ 
                      fontSize: '0.42rem', 
                      color: '#00f0ff', 
                      fontWeight: 900, 
                      letterSpacing: '0.3px', 
                      textTransform: 'uppercase',
                      fontFamily: '"Space Grotesk", sans-serif',
                      textShadow: '0 0 3px rgba(0, 240, 255, 0.8)',
                      lineHeight: '1.2'
                    }}>
                      ONLINE
                    </span>
                  </div>

                  {/* User Information */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', justifyContent: 'center', flexGrow: 1 }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 900, 
                      color: '#ffffff', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.8px',
                      textShadow: '0 0 5px #00f0ff, 0 0 10px rgba(0, 240, 255, 0.6)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '0.8rem',
                      fontFamily: '"Space Grotesk", "Inter", sans-serif'
                    }}>
                      {user?.displayName || (user?.isAnonymous ? 'GUEST_PLAYER' : user?.email?.split('@')[0] || 'PILOT')}
                    </span>
                    
                    {/* UID block styled like the red block in the reference image */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      background: 'rgba(255, 0, 60, 0.15)', 
                      border: '1px solid rgba(255, 0, 60, 0.5)', 
                      borderRadius: '2px', 
                      padding: '1px 4px',
                      width: 'fit-content'
                    }}>
                      <span style={{ 
                        fontSize: '0.48rem', 
                        color: '#ff003c', 
                        fontWeight: 900, 
                        fontFamily: 'monospace',
                        letterSpacing: '0.4px',
                        textShadow: '0 0 3px rgba(255, 0, 60, 0.6)',
                        lineHeight: '0.5rem'
                      }}>
                        UID: <span style={{ color: '#ffffff', fontWeight: 800 }}>{user?.uid?.substring(0, 8)?.toUpperCase() || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FREE FIRE STYLE TOP-RIGHT ICONS BAR (Marked in Blue in reference image) */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '6px', 
              pointerEvents: 'auto',
              width: '290px',
              height: '30px',
              marginRight: '-20px',
              marginTop: '-14px',
              background: 'rgba(2, 6, 17, 0.85)',
              borderLeft: '1.5px solid rgba(67, 245, 255, 0.4)',
              borderBottom: '1.5px solid rgba(67, 245, 255, 0.4)',
              borderTop: 'none',
              borderRight: 'none',
              borderRadius: '0 0 0 12px',
              padding: '0 10px',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 -2px 10px rgba(67, 245, 255, 0.1), -2px 2px 12px rgba(0, 0, 0, 0.8)',
              boxSizing: 'border-box'
            }}>
              

              
              {/* 1. Rankings / Leaderboard Icon (Shield/Medal style) */}
              <button 
                onClick={() => setActiveModal('rankings_screen')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffd32a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease-in-out',
                  outline: 'none'
                }}
                className="hover:bg-white/10 hover:scale-110 active:scale-95"
                title="Rankings"
              >
                <Trophy size={13} style={{ filter: 'drop-shadow(0 0 4px rgba(255,211,42,0.4))' }} />
              </button>
              
              {/* Divider */}
              <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.08)' }} />

              {/* 2. Friends / Social Icon (Full Screen Manager) */}
              <button 
                onClick={() => setActiveModal('friends_system')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#43f5ff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  borderRadius: '4px',
                  position: 'relative',
                  transition: 'all 0.15s ease-in-out',
                  outline: 'none'
                }}
                className="hover:bg-white/10 hover:scale-110 active:scale-95"
                title="Friends community"
              >
                <Users size={13} style={{ filter: 'drop-shadow(0 0 4px rgba(67,245,255,0.4))' }} />
                {incomingFriendRequests.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-1px',
                    width: '5px',
                    height: '5px',
                    background: '#ff003c',
                    borderRadius: '50%',
                    boxShadow: '0 0 3px #ff003c'
                  }} />
                )}
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.08)' }} />

              {/* 3. Messages / Notifications Icon */}
              <button 
                onClick={() => setActiveModal('news')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease-in-out',
                  outline: 'none'
                }}
                className="hover:bg-white/10 hover:scale-110 active:scale-95"
                title="Messages & Notifications"
              >
                <Mail size={13} />
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.08)' }} />

              {/* 4. Settings Gear Icon */}
              <button 
                onClick={() => setActiveModal('settings')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease-in-out',
                  outline: 'none'
                }}
                className="hover:bg-white/10 hover:scale-110 active:scale-95"
                title="Settings"
              >
                <Settings size={13} />
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.08)' }} />

              {/* 5. Device Status: Wifi & Battery Info */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0px',
                padding: '0',
                minWidth: '38px',
                height: '100%'
              }}>
                {/* Wifi Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '11px' }}>
                  <Wifi 
                    size={10} 
                    style={{ 
                      color: isOnline ? '#39ff14' : '#ff003c',
                      filter: isOnline ? 'drop-shadow(0 0 2px #39ff14)' : 'drop-shadow(0 0 2px #ff003c)',
                      transition: 'color 0.3s'
                    }} 
                  />
                </div>
                
                {/* Battery Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '9px' }}>
                  <div style={{
                    width: '14px',
                    height: '7px',
                    border: '0.75px solid rgba(255,255,255,0.5)',
                    borderRadius: '1px',
                    position: 'relative',
                    padding: '0.25px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: `${batteryLevel}%`,
                      height: '100%',
                      background: isBatteryCharging 
                        ? '#39ff14' 
                        : (batteryLevel <= 20 ? '#ff003c' : '#ffffff'),
                      transition: 'width 0.5s'
                    }} />
                    <div style={{
                      position: 'absolute',
                      right: '-1.5px',
                      top: '1.5px',
                      width: '0.75px',
                      height: '2px',
                      background: 'rgba(255,255,255,0.5)'
                    }} />
                  </div>
                  <span style={{ 
                    fontSize: '6px', 
                    color: 'rgba(255,255,255,0.8)', 
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    lineHeight: 1
                  }}>
                    {batteryLevel}%
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* CAR SELECTOR ARROWS REMOVED - Using Garage now */}



          {/* LEFT SIDEBAR CONTROLS - Transparent Interactive Hotspots */}
          <div style={{ position: 'absolute', top: '70px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto' }}>
            
            {/* Free credits - Transparent Overlay */}
            {enabledLobbyButtons.includes('credits') && (
              <button 
                onClick={() => setActiveModal('credits')}
                className="opacity-0 hover:opacity-100 hover:bg-white/10 border-none rounded-full cursor-pointer transition-all flex items-center justify-center"
                style={{ width: '140px', height: '36px', outline: 'none' }}
              >
                <div style={{ width: '100%', height: '100%' }} />
              </button>
            )}

            {/* Free NOS - Transparent Overlay */}
            {enabledLobbyButtons.includes('nos') && (
              <button 
                onClick={() => setActiveModal('nos')}
                className="opacity-0 hover:opacity-100 hover:bg-white/10 border-none rounded-full cursor-pointer transition-all flex items-center justify-center"
                style={{ width: '130px', height: '36px', outline: 'none' }}
              >
                <div style={{ width: '100%', height: '100%' }} />
              </button>
            )}

            {/* Circular Settings Group buttons - Transparent Overlays */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {['settings', 'replay', 'chat', 'news'].filter(id => enabledLobbyButtons.includes(id)).map(id => (
                <div key={id} style={{ position: 'relative', width: '42px', height: '42px' }}>
                  <button
                    onClick={() => setActiveModal(id)}
                    className="opacity-0 hover:opacity-100 hover:bg-white/10 border-none rounded-lg cursor-pointer transition-all w-full h-full"
                    style={{ outline: 'none' }}
                  >
                    <div style={{ width: '100%', height: '100%' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE BUTTONS - Transparent Overlays */}
          <div style={{ position: 'absolute', top: '160px', right: '16px', display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'auto', alignItems: 'flex-end' }}>
            {enabledLobbyButtons.includes('right_side_btn1') && (
              <button 
                className="opacity-0 hover:opacity-100 hover:bg-white/10 rounded-md cursor-pointer transition-all border-none"
                style={{ width: '120px', height: '36px', outline: 'none' }}
              >
                <div style={{ width: '100%', height: '100%' }} />
              </button>
            )}
            {enabledLobbyButtons.includes('right_side_btn2') && (
              <button 
                className="opacity-0 hover:opacity-100 hover:bg-white/10 rounded-md cursor-pointer transition-all border-none"
                style={{ width: '120px', height: '36px', outline: 'none' }}
              >
                <div style={{ width: '100%', height: '100%' }} />
              </button>
            )}
          </div>

          {/* BOTTOM BAR */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '16px', background: 'transparent' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
              
              {/* Facebook Connect (Bottom Left) - Transparent Overlay */}
              {enabledLobbyButtons.includes('facebook') && (
                <button 
                  onClick={() => setActiveModal('facebook')}
                  className="opacity-0 hover:opacity-100 hover:bg-white/10 rounded cursor-pointer transition-all border-none"
                  style={{ width: '140px', height: '40px', outline: 'none', pointerEvents: 'auto' }}
                >
                  <div style={{ width: '100%', height: '100%' }} />
                </button>
              )}

              {/* MAIN TOURNAMENT GAMEPLAY TRIGGER (Center Bottom) */}
              {enabledLobbyButtons.includes('go_lock') && (
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
                  
                  {/* GIANT CENTRAL GO BUTTON! - 100% transparent overlay over GO on printed image! */}
                  <button 
                    onClick={handleLaunchMatch}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'transform 0.1s'
                    }}
                    className="opacity-0 hover:opacity-100 hover:bg-white/10"
                    onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ width: '100%', height: '100%' }} />
                  </button>

                </div>
              )}

              {/* Gold VIP Access Emblem (Bottom Right) - Transparent Overlay */}
              {enabledLobbyButtons.includes('vip') && (
                <button 
                  onClick={() => setActiveModal('vip')}
                  className="opacity-0 hover:opacity-100 hover:bg-white/10 rounded-full cursor-pointer transition-all border-none"
                  style={{ width: '100px', height: '100px', outline: 'none', pointerEvents: 'auto' }}
                >
                  <div style={{ width: '100%', height: '100%' }} />
                </button>
              )}

            </div>
          </div>
           {/* ==================== FREE FIRE STYLE FRIENDS LIST SYSTEM ==================== */}
          {(() => {
            const getStablePlayerStats = (uid: string) => {
              if (!uid) return { level: 12, rankTier: 'Bronze' };
              const charSum = uid.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
              const level = (charSum % 70) + 12; // Level between 12 and 81
              const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Master'];
              const rankTier = ranks[charSum % ranks.length];
              return { level, rankTier };
            };

            const combinedFriendsList = friendsList.map(f => {
              const isOnline = onlineUsers.some(op => op.uid === f.uid);
              const stats = getStablePlayerStats(f.uid);
              return {
                uid: f.uid,
                displayName: f.displayName || 'Pilot',
                statusText: isOnline ? 'Online' : 'Offline',
                statusColor: isOnline ? '#39ff14' : '#94a3b8',
                level: stats.level,
                rankTier: stats.rankTier,
                status: isOnline ? 'online' : 'offline',
                photoURL: f.photoURL
              };
            });

            if (isFriendsDrawerOpen) {
              return (
                <div 
                  id="ff-friends-drawer"
                  style={{ 
                    position: 'absolute', 
                    right: '0px', 
                    top: '0px', 
                    bottom: '0px', 
                    width: '300px', 
                    background: 'rgba(5, 10, 20, 0.95)', 
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderRadius: '0px', 
                    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.75)', 
                    zIndex: 100, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    pointerEvents: 'auto', 
                    animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                    fontFamily: '"Space Grotesk", sans-serif',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <style>{`
                    @keyframes slideInRight {
                      from { transform: translateX(340px); opacity: 0.8; }
                      to { transform: translateX(0); opacity: 1; }
                    }
                    #ff-drawer-scrollable-list::-webkit-scrollbar {
                      width: 4px;
                    }
                    #ff-drawer-scrollable-list::-webkit-scrollbar-track {
                      background: rgba(0, 0, 0, 0.2);
                    }
                    #ff-drawer-scrollable-list::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.25);
                      border-radius: 2px;
                    }
                  `}</style>

                  {/* Drawer Pull Strip on the left edge */}
                  <div 
                    onClick={() => setIsFriendsDrawerOpen(false)}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    className="hover:bg-white/5"
                  >
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '9px', fontWeight: 900 }}>▶</span>
                  </div>

                  {/* Header Banner */}
                  <div style={{
                    padding: '12px 12px 12px 24px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase'
                      }}>
                        SQUAD & FRIENDS
                      </span>
                    </div>
                    <button 
                      onClick={() => setIsFriendsDrawerOpen(false)}
                      style={{ background: 'none', border: 'none', color: '#88a2cd', cursor: 'pointer', display: 'flex', outline: 'none' }}
                      className="hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Main Content Area */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: '14px', boxSizing: 'border-box', height: '100%', overflow: 'hidden' }}>
                    
                    {/* Top Tabs Bar */}
                    <div style={{ 
                      display: 'flex', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                      background: 'rgba(0,0,0,0.4)',
                      height: '42px',
                      alignItems: 'stretch'
                    }}>
                      <button
                        onClick={() => setDrawerActiveTab('friends')}
                        style={{
                          flex: 1,
                          background: drawerActiveTab === 'friends' ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          border: 'none',
                          borderBottom: drawerActiveTab === 'friends' ? '2px solid #ffffff' : '2px solid transparent',
                          color: drawerActiveTab === 'friends' ? '#ffffff' : '#8fa2c4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '10px',
                          letterSpacing: '0.5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Users size={14} style={{ marginRight: '5px' }} />
                        <span>FRIENDS</span>
                      </button>

                      <button
                        onClick={() => setDrawerActiveTab('add_friend')}
                        style={{
                          flex: 1,
                          background: drawerActiveTab === 'add_friend' ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          border: 'none',
                          borderBottom: drawerActiveTab === 'add_friend' ? '2px solid #ffffff' : '2px solid transparent',
                          color: drawerActiveTab === 'add_friend' ? '#ffffff' : '#8fa2c4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '10px',
                          letterSpacing: '0.5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <UserPlus size={14} style={{ marginRight: '5px' }} />
                        <span>ADD</span>
                      </button>

                      <button
                        onClick={() => setDrawerActiveTab('requests')}
                        style={{
                          flex: 1,
                          background: drawerActiveTab === 'requests' ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          border: 'none',
                          borderBottom: drawerActiveTab === 'requests' ? '2px solid #ffffff' : '2px solid transparent',
                          color: drawerActiveTab === 'requests' ? '#ffffff' : '#8fa2c4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '10px',
                          letterSpacing: '0.5px',
                          transition: 'all 0.15s',
                          position: 'relative'
                        }}
                      >
                        <Bell size={14} style={{ marginRight: '5px' }} />
                        <span>REQUESTS</span>
                        {incomingFriendRequests.length > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '5px',
                            right: '4px',
                            background: '#ff003c',
                            color: 'white',
                            fontSize: '8px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            fontWeight: 900,
                            boxShadow: '0 0 8px #ff003c',
                            animation: 'pulse 1s infinite alternate'
                          }}>
                            {incomingFriendRequests.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Tab Contents */}
                    <div 
                      id="ff-drawer-scrollable-list"
                      style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '12px 12px 12px 0px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Tab 1: Active Friends */}
                      {drawerActiveTab === 'friends' && (() => {
                        const filtered = combinedFriendsList.filter(f => 
                          f.displayName.toLowerCase().includes(drawerSearchText.toLowerCase())
                        );

                        return (
                          <>
                            {/* Search filter for friends */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                              <input 
                                type="text"
                                placeholder="FILTER FRIENDS LIST..."
                                value={drawerSearchText}
                                onChange={(e) => setDrawerSearchText(e.target.value)}
                                style={{
                                  flex: 1,
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid rgba(67, 245, 255, 0.25)',
                                  borderRadius: '4px',
                                  padding: '6px 10px',
                                  fontSize: '11px',
                                  color: '#ffffff',
                                  outline: 'none',
                                  fontFamily: 'monospace'
                                }}
                              />
                            </div>

                            {/* Active Friends List / Empty State */}
                            {combinedFriendsList.length === 0 ? (
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: '40px 10px', 
                                textAlign: 'center',
                                gap: '12px'
                              }}>
                                <div style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 159, 67, 0.1)',
                                  border: '1px dashed #ff9f43',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ff9f43'
                                }}>
                                  <Users size={22} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px' }}>
                                    YOUR SQUAD IS EMPTY
                                  </span>
                                  <span style={{ color: '#8fa2c4', fontSize: '10px', lineHeight: '14px' }}>
                                    You have no battle mates. Head over to the ADD tab to search and invite players by UID!
                                  </span>
                                </div>
                                <button
                                  onClick={() => setDrawerActiveTab('add_friend')}
                                  style={{
                                    background: 'linear-gradient(135deg, #ff9f43 0%, #e67e22 100%)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#000000',
                                    fontWeight: 900,
                                    fontSize: '10px',
                                    padding: '6px 14px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(230, 126, 34, 0.25)',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  Find Players
                                </button>
                              </div>
                            ) : filtered.length === 0 ? (
                              <div style={{ color: '#8fa2c4', fontSize: '11px', textAlign: 'center', marginTop: '30px' }}>
                                No matching friends found
                              </div>
                            ) : (
                              filtered.map((friend) => {
                                const avatarUrl = friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`;
                                const isInvited = invitedUids.includes(friend.uid);

                                return (
                                  <div 
                                    key={`drawer-friend-${friend.uid}`}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(67, 245, 255, 0.15)',
                                      borderRadius: '4px',
                                      padding: '8px 10px',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {/* Square avatar with simple cyber border */}
                                      <div style={{ 
                                        width: '34px', 
                                        height: '34px', 
                                        borderRadius: '3px', 
                                        border: '1px solid rgba(67, 245, 255, 0.4)', 
                                        position: 'relative',
                                        background: '#0c0e17'
                                      }}>
                                        <img 
                                          src={avatarUrl} 
                                          alt="" 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                          referrerPolicy="no-referrer"
                                        />
                                        {friend.status !== 'offline' && (
                                          <div style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            right: '-2px',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#39ff14',
                                            border: '1.5px solid #08090d',
                                            boxShadow: '0 0 6px #39ff14'
                                          }} />
                                        )}
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ 
                                          color: '#ffffff', 
                                          fontWeight: 900, 
                                          fontSize: '11px',
                                          letterSpacing: '0.3px'
                                        }}>
                                          {friend.displayName}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ 
                                            color: friend.statusColor, 
                                            fontSize: '8.5px',
                                            fontWeight: 900,
                                            textTransform: 'uppercase'
                                          }}>
                                            {friend.statusText}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right side controls: Level badge + Invite button */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '2px', 
                                        background: 'rgba(0,0,0,0.5)', 
                                        padding: '1px 4px', 
                                        borderRadius: '3px', 
                                        border: '1px solid rgba(67,245,255,0.1)' 
                                      }}>
                                        <div style={{
                                          width: '7px',
                                          height: '7px',
                                          background: 
                                            friend.rankTier === 'Heroic' || friend.rankTier === 'Master' ? '#ff003c' :
                                            friend.rankTier === 'Diamond' ? '#00f0ff' :
                                            friend.rankTier === 'Platinum' ? '#e2e8f0' : '#43f5ff',
                                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        }} />
                                        <span style={{ color: '#ffffff', fontSize: '8px', fontWeight: 900, fontFamily: 'monospace' }}>
                                          Lv.{friend.level}
                                        </span>
                                      </div>

                                      {/* Invite to Lobby */}
                                      <button
                                        onClick={() => handleSendInvitation(friend)}
                                        disabled={isInvited || friend.status === 'offline'}
                                        style={{
                                          background: isInvited ? 'rgba(67, 245, 255, 0.03)' : 'transparent',
                                          border: isInvited ? '1px solid rgba(67, 245, 255, 0.15)' : '1px solid rgba(67, 245, 255, 0.5)',
                                          color: isInvited ? 'rgba(67, 245, 255, 0.3)' : '#43f5ff',
                                          borderRadius: '3px',
                                          width: '24px',
                                          height: '24px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: (isInvited || friend.status === 'offline') ? 'default' : 'pointer',
                                          fontWeight: 900,
                                          fontSize: '12px',
                                          outline: 'none',
                                          opacity: friend.status === 'offline' ? 0.3 : 1,
                                          transition: 'all 0.1s'
                                        }}
                                        title={isInvited ? 'Invited' : friend.status === 'offline' ? 'Offline' : 'Invite to lobby'}
                                      >
                                        {isInvited ? '✓' : '+'}
                                      </button>

                                      {/* Remove Friend */}
                                      <button
                                        onClick={() => {
                                          if (confirm(`Remove ${friend.displayName} from friends?`)) {
                                            handleRemoveFriend(friend.uid);
                                          }
                                        }}
                                        style={{
                                          background: 'rgba(255,0,60,0.1)',
                                          border: '1px solid rgba(255,0,60,0.2)',
                                          color: '#ff003c',
                                          borderRadius: '3px',
                                          width: '24px',
                                          height: '24px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          outline: 'none',
                                          transition: 'all 0.1s'
                                        }}
                                        title="Remove Friend"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </>
                        );
                      })()}

                      {/* Tab 2: Add Friend (UID / Name Search) */}
                      {drawerActiveTab === 'add_friend' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ color: '#43f5ff', fontWeight: 900, fontSize: '10px', letterSpacing: '1px' }}>
                            SEARCH PLAYERS BY UID OR NAME
                          </span>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input 
                              type="text"
                              placeholder="ENTER UID OR NAME..."
                              value={addFriendSearchText}
                              onChange={(e) => setAddFriendSearchText(e.target.value)}
                              style={{
                                flex: 1,
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(67, 245, 255, 0.25)',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#ffffff',
                                outline: 'none',
                                fontFamily: 'monospace'
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearchAddFriend(addFriendSearchText);
                              }}
                            />
                            <button
                              onClick={() => handleSearchAddFriend(addFriendSearchText)}
                              disabled={isSearchingAddFriend}
                              style={{
                                background: 'linear-gradient(135deg, #43f5ff 0%, #00d2ff 100%)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#000000',
                                fontWeight: 900,
                                fontSize: '10px',
                                padding: '0 12px',
                                cursor: 'pointer',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                outline: 'none'
                              }}
                            >
                              {isSearchingAddFriend ? '...' : 'SEARCH'}
                            </button>
                          </div>

                          {/* Search Results Display */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
                            {isSearchingAddFriend ? (
                              <div style={{ color: '#43f5ff', fontSize: '11px', textAlign: 'center', padding: '20px 0', fontWeight: 'bold' }}>
                                SCANNING DATABASE...
                              </div>
                            ) : addFriendSearchResults.length === 0 ? (
                              addFriendSearchText.trim() ? (
                                <div style={{ color: '#8fa2c4', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
                                  No players found with this UID or name.
                                </div>
                              ) : (
                                <div style={{ color: '#8fa2c4', fontSize: '10px', textAlign: 'center', padding: '20px 10px', border: '1px dashed rgba(67, 245, 255, 0.1)', borderRadius: '4px' }}>
                                  Enter another player's name or exact UID to find and add them to your squad.
                                </div>
                              )
                            ) : (
                              addFriendSearchResults.map((searchedUser) => {
                                const isAlreadyFriend = friendsList.some(f => f.uid === searchedUser.uid);
                                const isRequestSent = sentRequests.some(r => r.toId === searchedUser.uid);
                                const isIncomingRequest = incomingFriendRequests.some(r => r.fromId === searchedUser.uid);
                                const stats = getStablePlayerStats(searchedUser.uid);
                                const userAvatar = searchedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchedUser.uid}`;

                                return (
                                  <div 
                                    key={`search-res-${searchedUser.uid}`}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(67, 245, 255, 0.15)',
                                      borderRadius: '4px',
                                      padding: '8px',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '3px', 
                                        border: '1px solid rgba(67, 245, 255, 0.4)',
                                        background: '#0c0e17'
                                      }}>
                                        <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}>
                                          {searchedUser.displayName || 'Player'}
                                        </span>
                                        <span style={{ color: '#8fa2c4', fontSize: '8px', fontFamily: 'monospace' }}>
                                          UID: {searchedUser.uid.slice(0, 8)}...
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      {isAlreadyFriend ? (
                                        <span style={{ color: '#43f5ff', fontSize: '9px', fontWeight: 900, background: 'rgba(67,245,255,0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                                          FRIEND
                                        </span>
                                      ) : isRequestSent ? (
                                        <span style={{ color: '#8fa2c4', fontSize: '9px', fontWeight: 900, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '3px' }}>
                                          PENDING
                                        </span>
                                      ) : isIncomingRequest ? (
                                        <button
                                          onClick={() => {
                                            const req = incomingFriendRequests.find(r => r.fromId === searchedUser.uid);
                                            if (req) handleAcceptFriendRequest(req);
                                          }}
                                          style={{
                                            background: '#39ff14',
                                            border: 'none',
                                            borderRadius: '3px',
                                            color: '#000000',
                                            fontWeight: 900,
                                            fontSize: '9px',
                                            padding: '3px 8px',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          ACCEPT
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleSendFriendRequest(searchedUser)}
                                          style={{
                                            background: 'linear-gradient(135deg, #43f5ff 0%, #00d2ff 100%)',
                                            border: 'none',
                                            borderRadius: '3px',
                                            color: '#000000',
                                            fontWeight: 900,
                                            fontSize: '9px',
                                            padding: '4px 10px',
                                            cursor: 'pointer',
                                            outline: 'none'
                                          }}
                                          className="hover:scale-105 active:scale-95 transition-all"
                                        >
                                          + ADD
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Polish "My In-game UID card" at the bottom */}
                          <div style={{
                            marginTop: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(67, 245, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            boxSizing: 'border-box'
                          }}>
                            <span style={{ color: '#43f5ff', fontWeight: 900, fontSize: '8.5px', letterSpacing: '0.5px' }}>
                              YOUR IN-GAME UID (SHARE WITH FRIENDS)
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ 
                                color: '#ffffff', 
                                fontFamily: 'monospace', 
                                fontSize: '10.5px', 
                                background: '#0a0d15', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.05)'
                              }}>
                                {user?.uid || 'SIGN IN TO GET UID'}
                              </span>
                              <button
                                onClick={() => {
                                  if (user?.uid) {
                                    navigator.clipboard.writeText(user.uid);
                                    setCopiedUidText(true);
                                    setTimeout(() => setCopiedUidText(false), 2000);
                                  }
                                }}
                                style={{
                                  background: copiedUidText ? '#2ecc71' : 'rgba(67, 245, 255, 0.08)',
                                  border: `1px solid ${copiedUidText ? '#2ecc71' : 'rgba(67, 245, 255, 0.3)'}`,
                                  borderRadius: '4px',
                                  color: copiedUidText ? '#000000' : '#43f5ff',
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  padding: '5px 10px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  outline: 'none',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {copiedUidText ? 'COPIED!' : 'COPY'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 3: Incoming Friend Requests */}
                      {drawerActiveTab === 'requests' && (() => {
                        if (incomingFriendRequests.length === 0) {
                          return (
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              padding: '50px 10px', 
                              textAlign: 'center',
                              gap: '10px'
                            }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1.5px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#8fa2c4'
                              }}>
                                <Bell size={18} />
                              </div>
                              <span style={{ color: '#8fa2c4', fontSize: '10.5px' }}>
                                No pending friend requests
                              </span>
                            </div>
                          );
                        }

                        return incomingFriendRequests.map((request) => {
                          const requestAvatar = request.fromPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromId}`;
                          return (
                            <div 
                              key={`drawer-req-${request.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(67, 245, 255, 0.15)',
                                borderRadius: '4px',
                                padding: '8px 10px',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img 
                                  src={requestAvatar} 
                                  alt="" 
                                  style={{ width: '28px', height: '28px', borderRadius: '3px', border: '1px solid rgba(67, 245, 255, 0.4)', background: '#0c0e17' }} 
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '11px' }}>{request.fromName}</span>
                                  <span style={{ color: '#43f5ff', fontSize: '8px', fontWeight: 900, letterSpacing: '0.3px' }}>WANTS TO ADD YOU</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => handleAcceptFriendRequest(request)}
                                  style={{
                                    background: '#2ecc71',
                                    border: 'none',
                                    color: '#000000',
                                    borderRadius: '3px',
                                    padding: '3px 8px',
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    outline: 'none'
                                  }}
                                >
                                  ACCEPT
                                </button>
                                <button
                                  onClick={() => handleRejectFriendRequest(request.id)}
                                  style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '3px',
                                    padding: '3px 6px',
                                    fontSize: '9px',
                                    cursor: 'pointer',
                                    outline: 'none'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Bottom Leaderboard Quick Access button */}
                    <div style={{ padding: '8px 12px 12px 0px', boxSizing: 'border-box' }}>
                      <button
                        onClick={() => {
                          setActiveModal('friends_system');
                        }}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg, rgba(67, 245, 255, 0.08) 0%, rgba(2, 6, 17, 0.5) 100%)',
                          border: '1px solid rgba(67, 245, 255, 0.25)',
                          borderRadius: '4px',
                          color: '#43f5ff',
                          fontFamily: '"Space Grotesk", sans-serif',
                          fontWeight: 900,
                          fontSize: '10px',
                          letterSpacing: '0.5px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          textTransform: 'uppercase',
                          outline: 'none',
                          transition: 'all 0.15s'
                        }}
                        className="hover:bg-cyan-500/10 hover:border-cyan-400"
                      >
                        <Trophy size={11} />
                        <span>Show Global Leaderboard</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            } else {
              return (
                <div 
                  id="ff-friends-collapsed"
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-end', 
                    pointerEvents: 'auto', 
                    zIndex: 45 
                  }}
                >
                  <style>{`
                    @keyframes ff-arrow-bounce {
                      0% { transform: translateX(0px); }
                      100% { transform: translateX(-4px); }
                    }
                  `}</style>
                  
                  {/* Friends Cards Stack - Positioned above the arrow, growing upwards */}
                  <div style={{ 
                    position: 'absolute',
                    bottom: '25px',
                    right: '0px',
                    marginLeft: '0px',
                    marginTop: '0px',
                    marginRight: '17px',
                    display: 'flex', 
                    flexDirection: 'column-reverse', // Start from bottom and grow upwards
                    gap: '5px' 
                  }}>
                    {combinedFriendsList.slice(0, 4).map((friend) => {
                      const avatarUrl = friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`;
                      const isOffline = friend.status === 'offline';
                      
                      return (
                        <div 
                          key={`collapsed-friend-${friend.uid}`}
                          style={{
                            width: '140px',
                            height: '46px',
                            background: 'rgba(10, 15, 25, 0.45)',
                            backdropFilter: 'blur(3px)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '2px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: '4px 6px',
                            gap: '8px',
                            boxSizing: 'border-box',
                            position: 'relative',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
                            opacity: isOffline ? 0.75 : 1,
                            transition: 'all 0.1s ease-in-out'
                          }}
                          className="hover:scale-102 hover:border-white/35"
                        >
                          {/* Profile Picture */}
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '2px', 
                            overflow: 'hidden', 
                            border: '1px solid rgba(255,255,255,0.3)',
                            position: 'relative',
                            flexShrink: 0,
                            background: '#0c0e17'
                          }}>
                            <img 
                              src={avatarUrl} 
                              alt="" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              referrerPolicy="no-referrer"
                            />
                            {/* Online Green Glow Badge */}
                            {!isOffline && (
                              <div style={{
                                position: 'absolute',
                                bottom: '0px',
                                right: '0px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#39ff14',
                                boxShadow: '0 0 4px #39ff14'
                              }} />
                            )}
                          </div>

                          {/* Display Name and Level Details */}
                          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, gap: '1px' }}>
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#ffffff', 
                              fontWeight: '800', 
                              fontFamily: '"Space Grotesk", sans-serif',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textTransform: 'uppercase',
                              textShadow: '0 1px 2px rgba(0,0,0,0.9)'
                            }}>
                              {friend.displayName.split(' ')[0]}
                            </span>
                            <span style={{
                              fontSize: '7.5px',
                              color: isOffline ? '#888888' : '#ffd32a',
                              fontWeight: '600',
                              fontFamily: '"Space Grotesk", sans-serif',
                              opacity: 0.85,
                              textTransform: 'uppercase',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                            }}>
                              {isOffline ? 'Offline' : `Lv.${friend.level || 25}`}
                            </span>
                          </div>

                          {/* Invite Plus (+) Button */}
                          <button
                            onClick={() => handleSendInvitation(friend)}
                            disabled={isOffline}
                            style={{
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: '900',
                              color: isOffline ? '#555555' : '#ffffff',
                              cursor: isOffline ? 'default' : 'pointer',
                              padding: 0,
                              outline: 'none',
                              border: 'none',
                              background: 'transparent',
                              transition: 'transform 0.1s'
                            }}
                            className="hover:scale-125 active:scale-90"
                            title={isOffline ? 'Offline' : 'Invite to Lobby'}
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Toggle Arrow Button: Simple sleek black rectangular button with white arrow `<` matching screenshot perfectly */}
                  <div style={{ position: 'relative', marginTop: '240px' }}>
                    {/* Blinking indicator if there are pending requests to alert player */}
                    {incomingFriendRequests.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-6px',
                        background: '#ff003c',
                        color: 'white',
                        fontSize: '8px',
                        padding: '2px 5px',
                        borderRadius: '6px',
                        fontWeight: 900,
                        boxShadow: '0 0 8px #ff003c',
                        whiteSpace: 'nowrap',
                        animation: 'pulse 1s infinite alternate',
                        zIndex: 10
                      }}>
                        {incomingFriendRequests.length} REQ
                      </div>
                    )}
                    <button
                      onClick={() => setIsFriendsDrawerOpen(true)}
                      style={{
                        width: '42px',
                        height: '20px',
                        marginRight: '16px',
                        background: '#090a10',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        transition: 'all 0.1s ease-in-out',
                        alignSelf: 'flex-start'
                      }}
                      className="hover:bg-gray-800"
                      title="Expand Friend List"
                    >
                      <ChevronLeft 
                        size={14} 
                        style={{ 
                          color: '#ffffff', 
                          strokeWidth: 3.5,
                          animation: 'ff-arrow-bounce 0.8s infinite alternate' 
                        }} 
                      />
                    </button>
                  </div>

                </div>
              );
            }
          })()}

        </div>



        {/* ==================== 5. MODALS & SUB-POPUPS (WHITE STRUCTURE) ==================== */}
        {renderedActiveModal === 'my_garage' ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>


            {/* Color Customizer */}
            <div style={{ position: 'absolute', top: '20px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 101 }}>
              <span style={{ color: 'white', fontWeight: 'bold', textShadow: '0 0 5px black', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem' }}>BODY COLOR</span>
              <div style={{ display: 'flex', gap: '15px' }}>
                {['#ff003c', '#00d2ff', '#00ff44', '#ffdd00', '#ff00ff', '#ffffff', '#111111'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCustomPrimaryColor(c);
                      localStorage.setItem('customPrimaryColor', c);
                    }}
                    style={{
                      width: '40px', height: '40px', borderRadius: '4px', backgroundColor: c,
                      border: customPrimaryColor === c ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer', outline: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                      transform: customPrimaryColor === c ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>
            <GarageCanvas 
               color={customPrimaryColor ? parseInt(customPrimaryColor.replace('#', '0x')) : selectedCar.color}
               accent={customAccentColor ? parseInt(customAccentColor.replace('#', '0x')) : selectedCar.accent}
               backgroundImage="/Garage.png?v=2"
               carScale={1.6}
               carY={-0.4}
               modelUrl={selectedCar?.modelUrl}
               customRotation={selectedCar?.customRotation}
            />

            {/* Live Stats & Config for Custom Cars removed */}
            {/* Left Arrow */}
            <button
              onClick={() => {
                const nextIdx = (selectedOwnedCarIndex - 1 + ownedCarPresets.length) % ownedCarPresets.length;
                setSelectedOwnedCarIndex(nextIdx);
                localStorage.setItem('selectedOwnedCarIndex', nextIdx.toString());
              }}
              style={{ position: 'absolute', top: '50%', left: '30px', background: 'transparent', border: 'none', borderRadius: '50%', padding: '10px', color: 'transparent', cursor: 'pointer', zIndex: 101, marginTop: '13px', marginLeft: '-20px', opacity: 0 }}
            >
              <ChevronLeft />
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={() => {
                const nextIdx = (selectedOwnedCarIndex + 1) % ownedCarPresets.length;
                setSelectedOwnedCarIndex(nextIdx);
                localStorage.setItem('selectedOwnedCarIndex', nextIdx.toString());
              }}
              style={{ position: 'absolute', top: '50%', right: '30px', background: 'transparent', border: 'none', borderRadius: '50%', padding: '10px', color: 'transparent', cursor: 'pointer', zIndex: 101, marginLeft: '0px', marginRight: '-19px', marginBottom: '0px', marginTop: '13px', opacity: 0 }}
            >
              <ChevronRight />
            </button>

            {/* Car Name Display */}
            <div style={{ position: 'absolute', top: '35%', width: '100%', textAlign: 'center', color: 'white', fontSize: '2rem', fontWeight: 900, textShadow: '0 0 10px #000', zIndex: 101, marginBottom: '0px', marginTop: '-49px' }}>
               {ownedCarPresets[selectedOwnedCarIndex]?.name}
            </div>

            {/* Back Button */}
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '30px',
                width: '107px',
                height: '40px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: 'transparent',
                fontSize: '1rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                zIndex: 101,
                marginTop: '0px',
                marginBottom: '-17px',
                marginRight: '0px',
                marginLeft: '-9px',
                opacity: 0
              }}
            >
              ← BACK
            </button>

            {/* Select Button */}
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '171px',
                height: '51px',
                background: 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: 'transparent',
                fontSize: '1.2rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: 'pointer',
                zIndex: 101,
                marginTop: '0px',
                marginBottom: '-18px',
                opacity: 0
              }}
            >
              SELECT
            </button>
          </div>
        ) : renderedActiveModal === 'rankings_screen' ? (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(3, 8, 20, 0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(6px)' }}>
            <div style={{ 
              background: 'linear-gradient(180deg, #071124 0%, #020710 100%)', 
              border: '2px solid rgba(255, 211, 42, 0.5)', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '680px',
              height: 'min(420px, 90vh)',
              position: 'relative', 
              overflow: 'hidden', 
              boxShadow: '0 20px 45px rgba(0,0,0,0.8), 0 0 30px rgba(255, 211, 42, 0.2)', 
              display: 'flex',
              flexDirection: 'column'
            }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(255, 211, 42, 0.15)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#ffd32a' }}>
                    🏆 Squad & Solo Rankings
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#88a2cd' }}>Track seasonal ranks, leaderboards, and exclusive rewards</span>
                </div>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s'
                  }}
                  className="hover:bg-red-500 hover:border-red-400"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ flexGrow: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Trophy size={48} style={{ color: '#ffd32a', animation: 'pulse 1.5s infinite alternate' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '1px' }}>
                  Rankings & Leaderboard
                </span>
                <p style={{ color: '#8fa2c4', fontSize: '0.85rem', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
                  This screen is currently empty and ready for renovation. Soon you will see global leaderboards, seasonal rankings, and tier details here!
                </p>
              </div>

            </div>
          </div>
        ) : renderedActiveModal === 'friends_system' ? (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(3, 8, 20, 0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: renderedActiveModal === 'settings' ? '0' : '16px', backdropFilter: 'blur(6px)' }}>
            <div style={{ 
              background: 'linear-gradient(180deg, #071124 0%, #020710 100%)', 
              border: '2px solid rgba(67, 245, 255, 0.4)', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '680px',
              height: 'min(420px, 90vh)',
              position: 'relative', 
              overflow: 'hidden', 
              boxShadow: '0 20px 45px rgba(0,0,0,0.8), 0 0 30px rgba(67, 245, 255, 0.2)', 
              display: 'flex',
              flexDirection: 'column'
            }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(67, 245, 255, 0.15)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#43f5ff' }}>
                    👥 Drivers Community
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#88a2cd' }}>Search and manage your racing friends & pending requests</span>
                </div>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    setFriendSearchQuery('');
                  }} 
                  style={{ background: 'none', border: 'none', color: '#8fa2c4', cursor: 'pointer', padding: '4px', display: 'flex', transition: 'color 0.2s' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Main Body */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Left Tabs Sidebar */}
                <div style={{ 
                  width: '180px', 
                  background: 'rgba(0, 0, 0, 0.35)', 
                  borderRight: '1px solid rgba(67, 245, 255, 0.15)', 
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Friends Tab Button */}
                  <button
                    onClick={() => setFriendsTab('friends')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: friendsTab === 'friends' ? 'rgba(67, 245, 255, 0.15)' : 'transparent',
                      border: friendsTab === 'friends' ? '1px solid rgba(67, 245, 255, 0.4)' : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: friendsTab === 'friends' ? '#43f5ff' : '#8fa2c4',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} />
                      <span>Friends</span>
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(67, 245, 255, 0.1)', 
                      padding: '2px 6px', 
                      borderRadius: '10px',
                      border: '1px solid rgba(67, 245, 255, 0.2)',
                      color: '#43f5ff'
                    }}>
                      {friendsList.length}
                    </span>
                  </button>

                  {/* Requests Tab Button */}
                  <button
                    onClick={() => setFriendsTab('requests')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: friendsTab === 'requests' ? 'rgba(67, 245, 255, 0.15)' : 'transparent',
                      border: friendsTab === 'requests' ? '1px solid rgba(67, 245, 255, 0.4)' : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: friendsTab === 'requests' ? '#43f5ff' : '#8fa2c4',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserPlus size={16} />
                      <span>Requests</span>
                    </div>
                    {incomingFriendRequests.length > 0 && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        background: '#ff4d4d', 
                        padding: '1px 6px', 
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: 'black',
                        boxShadow: '0 0 8px rgba(255, 77, 77, 0.5)'
                      }}>
                        {incomingFriendRequests.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Content Area */}
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  
                  {/* Search bar at the top */}
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    <input
                      type="text"
                      placeholder="Search drivers by Name or ID to add..."
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(67, 245, 255, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px 10px 36px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(67, 245, 255, 0.5)', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </span>
                    {friendSearchQuery && (
                      <button
                        onClick={() => setFriendSearchQuery('')}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#8fa2c4', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Scrollable List Container */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    {friendSearchQuery.trim() !== '' ? (
                      /* SEARCH MODE */
                      <div>
                        {/* Section 1: Your Friends matching search */}
                        {(() => {
                          const matchedFriends = friendsList.filter(f => 
                            f.displayName?.toLowerCase().includes(friendSearchQuery.toLowerCase().trim()) ||
                            f.uid?.toLowerCase() === friendSearchQuery.toLowerCase().trim()
                          );
                          if (matchedFriends.length > 0) {
                            return (
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#8fa2c4', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid rgba(143, 162, 196, 0.15)', paddingBottom: '4px' }}>Matched Friends</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {matchedFriends.map(friend => {
                                    const isOnline = onlineUsers.some(op => op.uid === friend.uid);
                                    return (
                                      <div key={`search-friend-${friend.uid}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(67, 245, 255, 0.04)', border: '1px solid rgba(67, 245, 255, 0.15)', borderRadius: '8px', padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <div style={{ position: 'relative' }}>
                                            <img src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(67, 245, 255, 0.2)' }} />
                                            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#4ade80' : '#6b7280', border: '1.5px solid #071124', boxShadow: isOnline ? '0 0 6px #4ade80' : 'none' }} />
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{friend.displayName}</span>
                                            <span style={{ fontSize: '0.6rem', color: isOnline ? '#4ade80' : '#8fa2c4' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleRemoveFriend(friend.uid)}
                                          style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '6px', padding: '6px 8px', color: '#ff4d4d', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          <Trash2 size={12} /> Remove
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Section 2: Global Database Search */}
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#8fa2c4', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid rgba(143, 162, 196, 0.15)', paddingBottom: '4px' }}>Find New Drivers</div>
                          {isSearchingFriends ? (
                            <div style={{ color: 'rgba(67, 245, 255, 0.6)', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>Scanning rocket arena databases...</div>
                          ) : searchResults.length === 0 ? (
                            <div style={{ color: '#8fa2c4', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>No users found matching "{friendSearchQuery}"</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {searchResults.map(user => {
                                const isAlreadyFriend = friendsList.some(f => f.uid === user.uid);
                                if (isAlreadyFriend) return null;

                                const hasReceivedReq = incomingFriendRequests.find(r => r.fromId === user.uid);
                                const hasSentReq = sentRequests.some(r => r.toId === user.uid && r.status === 'pending');
                                const isOnline = onlineUsers.some(op => op.uid === user.uid);

                                return (
                                  <div key={`global-user-${user.uid}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(67, 245, 255, 0.1)', borderRadius: '8px', padding: '8px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ position: 'relative' }}>
                                        <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(67, 245, 255, 0.2)' }} />
                                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#4ade80' : '#6b7280', border: '1.5px solid #071124', boxShadow: isOnline ? '0 0 6px #4ade80' : 'none' }} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{user.displayName}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#8fa2c4' }}>ID: {user.uid.substring(0, 8)}</span>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      {hasReceivedReq ? (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            onClick={() => handleAcceptFriendRequest(hasReceivedReq)}
                                            style={{ background: '#10b981', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                          >
                                            Accept
                                          </button>
                                          <button
                                            onClick={() => handleRejectFriendRequest(hasReceivedReq.id)}
                                            style={{ background: '#ff4d4d', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : hasSentReq ? (
                                        <span style={{ fontSize: '0.7rem', color: '#ffd32a', fontWeight: 'bold', background: 'rgba(255,211,42,0.1)', border: '1px solid rgba(255,211,42,0.2)', padding: '4px 8px', borderRadius: '6px' }}>
                                          Pending
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleSendFriendRequest(user)}
                                          style={{ background: 'rgba(67, 245, 255, 0.1)', border: '1px solid rgba(67, 245, 255, 0.4)', borderRadius: '6px', padding: '6px 10px', color: '#43f5ff', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                          + Add Friend
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* LIST MODE */
                      friendsTab === 'friends' ? (
                        /* FRIENDS LIST TAB */
                        <div>
                          {friendsList.length === 0 ? (
                            <div style={{ color: '#8fa2c4', fontSize: '0.85rem', textAlign: 'center', padding: '40px 20px', lineHeight: '1.5' }}>
                              No friends added yet.<br />
                              <span style={{ fontSize: '0.75rem', color: 'rgba(67, 245, 255, 0.6)' }}>Use the search bar above to search by name or unique ID and add other users!</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(() => {
                                // Sort friends: Online friends always go on top!
                                const sorted = [...friendsList].sort((a, b) => {
                                  const aOnline = onlineUsers.some(op => op.uid === a.uid);
                                  const bOnline = onlineUsers.some(op => op.uid === b.uid);
                                  if (aOnline && !bOnline) return -1;
                                  if (!aOnline && bOnline) return 1;
                                  return 0;
                                });

                                return sorted.map(friend => {
                                  const isOnline = onlineUsers.some(op => op.uid === friend.uid);
                                  return (
                                    <div key={friend.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(67, 245, 255, 0.03)', border: '1px solid rgba(67, 245, 255, 0.1)', borderRadius: '8px', padding: '8px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ position: 'relative' }}>
                                          <img src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(67, 245, 255, 0.15)' }} />
                                          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#4ade80' : '#6b7280', border: '1.5px solid #071124', boxShadow: isOnline ? '0 0 6px #4ade80' : 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{friend.displayName}</span>
                                          <span style={{ fontSize: '0.65rem', color: isOnline ? '#4ade80' : '#8fa2c4', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveFriend(friend.uid)}
                                        style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '6px', padding: '6px 8px', color: '#ff4d4d', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Trash2 size={12} /> Remove
                                      </button>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* INCOMING REQUESTS TAB */
                        <div>
                          {incomingFriendRequests.length === 0 ? (
                            <div style={{ color: '#8fa2c4', fontSize: '0.8rem', textAlign: 'center', padding: '40px 20px' }}>
                              No incoming friend requests.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {incomingFriendRequests.map(request => (
                                <div key={request.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 211, 42, 0.03)', border: '1px solid rgba(255, 211, 42, 0.15)', borderRadius: '8px', padding: '8px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={request.fromPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromId}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255, 211, 42, 0.2)' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{request.fromName}</span>
                                      <span style={{ fontSize: '0.6rem', color: '#ffd32a' }}>Sent you a request</span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => handleAcceptFriendRequest(request)}
                                      style={{ background: '#10b981', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRejectFriendRequest(request.id)}
                                      style={{ background: '#ff4d4d', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                </div>

              </div>

            </div>
          </div>
        ) : renderedActiveModal && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(3, 8, 20, 0.85)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(6px)' }}>
            <div style={{ 
              background: renderedActiveModal === 'settings' ? 'linear-gradient(180deg, #020611, #0a1329)' : '#0a1329', 
              border: renderedActiveModal === 'settings' ? 'none' : '2px solid rgba(67, 245, 255, 0.4)', 
              borderRadius: renderedActiveModal === 'settings' ? '0' : '16px', 
              width: '100%',
              maxWidth: renderedActiveModal === 'settings' ? '100vw' : (renderedActiveModal === 'car_shop' || renderedActiveModal === 'stadium_select' ? '650px' : '480px'),
              height: renderedActiveModal === 'settings' ? '100vh' : 'auto',
              position: 'relative', 
              overflow: 'hidden', 
              boxShadow: '0 20px 45px rgba(0,0,0,0.6)', 
              transition: 'all 0.2s ease-in-out' 
            }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(67, 245, 255, 0.15)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#43f5ff' }}>
                  {renderedActiveModal === 'car_shop' ? '🚀 Rocket Car Dealership' : 
                   renderedActiveModal === 'stadium_select' ? '🏟️ Arena Stadium Selection' : 
                   renderedActiveModal === 'settings' ? '⚙️ SYSTEM & CONTROL SETTINGS' :
                   renderedActiveModal === 'replay' ? '🎬 REPLAY ARCHIVE' :
                   renderedActiveModal === 'chat' ? '💬 STADIUM CHAT' :
                   renderedActiveModal === 'news' ? '📰 NEWS CENTER' :
                   `${renderedActiveModal?.toUpperCase()} PANEL`}
                </span>
                <button 
                  onClick={() => setActiveModal(null)} 
                  style={{ background: 'none', border: 'none', color: '#8fa2c4', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              {/* Dynamic Modals Body content (Clean high-contrast wireframe / white structures) */}
              <div style={{ padding: renderedActiveModal === 'settings' ? '0' : '20px', maxHeight: renderedActiveModal === 'settings' ? '100vh' : '60vh', height: renderedActiveModal === 'settings' ? '100%' : 'auto', display: renderedActiveModal === 'settings' ? 'flex' : 'block', flexDirection: 'column', overflowY: 'auto', fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.45' }}>
                
                {/* CAR SHOP PANEL */}
                {renderedActiveModal === 'car_shop' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Welcome message with balance display */}
                    <div style={{ background: 'rgba(67, 245, 255, 0.05)', border: '1px solid rgba(67, 245, 255, 0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                          <strong style={{ color: '#43f5ff', display: 'block', fontSize: '0.9rem', letterSpacing: '0.5px' }}>UPGRADE YOUR GARAGE SHOWROOM</strong>
                          <span style={{ fontSize: '0.75rem', color: '#8fa2c4' }}>Unlocked cars will become selectable in your main lobby carousel!</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#070f22', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ffd32a' }}>
                          <Coins style={{ width: '14px', height: '14px', color: '#ffd32a', marginRight: '6px' }} />
                          <span style={{ fontWeight: 900, color: '#ffffff' }}>{coins}</span>
                        </div>
                      </div>
                      
                      {/* Navigation link to My Garage */}
                      <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid rgba(67, 245, 255, 0.15)', paddingTop: '8px', marginTop: '2px' }}>
                        <button
                          onClick={() => {
                            setActiveModal('my_garage');
                          }}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1.2px solid #10b981',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          className="hover:scale-105 active:scale-95"
                        >
                          <Car size={12} />
                          PAINT & ALIGN 3D MODELS (GO TO MY GARAGE) ➔
                        </button>
                      </div>
                    </div>

                    {/* Upload Custom Car */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(67, 245, 255, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)', border: '1px solid rgba(67, 245, 255, 0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus style={{ width: '18px', height: '18px', color: '#43f5ff' }} />
                        <strong style={{ color: '#43f5ff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Import Custom 3D Car (.GLB)</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#8fa2c4', marginTop: '-4px' }}>
                        Upload any 3D vehicle model (.glb file) to instantly add it to your personal garage for free!
                      </span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#8fa2c4', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Car Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. My Pagani" 
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            style={{ width: '100%', background: '#050a16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '0.8rem', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#8fa2c4', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Choose .GLB File</label>
                          <input 
                            type="file" 
                            accept=".glb" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setUploadFile(file);
                                if (!uploadName) {
                                  const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                                  setUploadName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
                                }
                              }
                            }}
                            style={{ display: 'none' }}
                            id="custom-car-file-upload"
                          />
                          <button
                            onClick={() => document.getElementById('custom-car-file-upload')?.click()}
                            style={{
                              width: '100%',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px dashed rgba(67, 245, 255, 0.4)',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              color: uploadFile ? '#43f5ff' : '#8fa2c4',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {uploadFile ? `📁 ${uploadFile.name}` : 'Select .glb file'}
                          </button>
                        </div>
                      </div>

                      {/* Power Stats Configuration */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1.2px solid rgba(67, 245, 255, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.7rem', color: '#ffd32a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Configure Car Performance Stats</strong>
                          <span style={{ fontSize: '0.6rem', color: '#8fa2c4' }}>(Range: 50 - 150)</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                              <span style={{ color: '#8fa2c4', fontWeight: 'bold' }}>SPEED</span>
                              <strong style={{ color: '#43f5ff' }}>{uploadSpeed}</strong>
                            </div>
                            <input 
                              type="range" 
                              min="50" 
                              max="150" 
                              value={uploadSpeed} 
                              onChange={(e) => setUploadSpeed(parseInt(e.target.value))}
                              style={{ width: '100%', accentColor: '#43f5ff', cursor: 'pointer', height: '4px' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                              <span style={{ color: '#8fa2c4', fontWeight: 'bold' }}>BOOST</span>
                              <strong style={{ color: '#43f5ff' }}>{uploadBoost}</strong>
                            </div>
                            <input 
                              type="range" 
                              min="50" 
                              max="150" 
                              value={uploadBoost} 
                              onChange={(e) => setUploadBoost(parseInt(e.target.value))}
                              style={{ width: '100%', accentColor: '#43f5ff', cursor: 'pointer', height: '4px' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                              <span style={{ color: '#8fa2c4', fontWeight: 'bold' }}>HANDLING</span>
                              <strong style={{ color: '#43f5ff' }}>{uploadHandling}</strong>
                            </div>
                            <input 
                              type="range" 
                              min="50" 
                              max="150" 
                              value={uploadHandling} 
                              onChange={(e) => setUploadHandling(parseInt(e.target.value))}
                              style={{ width: '100%', accentColor: '#43f5ff', cursor: 'pointer', height: '4px' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', justifyContent: 'flex-end' }}>
                        <button
                          disabled={!uploadFile || !uploadName || uploading}
                          onClick={async () => {
                            if (!uploadFile || !uploadName) return;
                            setUploading(true);
                            try {
                              const id = 'custom_' + Date.now();
                              const newCar: CustomCar = {
                                id,
                                name: uploadName,
                                blob: uploadFile,
                                speed: uploadSpeed,
                                boost: uploadBoost,
                                handling: uploadHandling,
                                pitch: 0,
                                yaw: 0,
                                roll: 0
                              };
                              
                              await saveCustomCar(newCar);
                              setUploadName('');
                              setUploadFile(null);
                              await loadAllCustomCars();
                              alert(`🎉 Success! "${newCar.name}" has been imported to your garage! Select it and align its orientation or update stats to your liking.`);
                            } catch (err) {
                              console.error(err);
                              alert('❌ Failed to import custom car file. Please try again.');
                            } finally {
                              setUploading(false);
                            }
                          }}
                          style={{
                            background: (!uploadFile || !uploadName || uploading) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00d2ff 0%, #00a8ff 100%)',
                            border: '1px solid #00d2ff',
                            color: (!uploadFile || !uploadName || uploading) ? '#8fa2c4' : '#000000',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: (!uploadFile || !uploadName || uploading) ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s'
                          }}
                        >
                          {uploading ? 'Importing...' : 'Add Car To Garage'}
                        </button>
                      </div>
                    </div>

                    {/* Cards grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                      {allCarPresets.map((car) => {
                        const isOwned = ownedCarIds.includes(car.id);
                        const isActive = selectedCar.id === car.id;
                        
                        return (
                          <div 
                            key={car.id} 
                            style={{ 
                              background: isActive ? 'rgba(0, 210, 255, 0.07)' : 'rgba(0,0,0,0.3)', 
                              border: isActive ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.08)', 
                              borderRadius: '12px', 
                              padding: '14px', 
                              display: 'flex', 
                              flexDirection: 'column',
                              gap: '10px',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                          >
                            {/* Car Header info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {car.name}
                                  {isActive && <span style={{ background: '#00d2ff', color: '#000000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>}
                                  {isOwned && !isActive && <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.65rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px' }}>OWNED</span>}
                                  {car.isCustom && <span style={{ background: 'rgba(67, 245, 255, 0.2)', color: '#43f5ff', border: '1px solid #43f5ff', fontSize: '0.65rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px' }}>CUSTOM IMPORT</span>}
                                </h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#8fa2c4', lineHeight: '1.3' }}>{car.description}</p>
                              </div>
                              
                              {/* Price or Buy action */}
                              <div>
                                {car.isCustom ? (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {deletingCarId === car.id ? (
                                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const targetId = car.id;
                                            setDeletingCarId(null);
                                            
                                            // 1. Select a safe standard car first so Three.js can cleanly unmount/dispose the model
                                            setSelectedOwnedCarIndex(0);
                                            localStorage.setItem('selectedOwnedCarIndex', '0');
                                            
                                            // 2. Perform actual deletion after short timeout to let Three.js transition first
                                            setTimeout(async () => {
                                              try {
                                                await deleteCustomCar(targetId);
                                                
                                                const updatedOwned = ownedCarIds.filter(id => id !== targetId);
                                                setOwnedCarIds(updatedOwned);
                                                localStorage.setItem('ownedCarIds', JSON.stringify(updatedOwned));
                                                
                                                await loadAllCustomCars();
                                              } catch (err) {
                                                console.error("Error deleting custom car:", err);
                                              }
                                            }, 150);
                                          }}
                                          style={{
                                            background: '#ef4444',
                                            border: 'none',
                                            color: '#ffffff',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase'
                                          }}
                                        >
                                          Delete?
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingCarId(null);
                                          }}
                                          style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#ffffff',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase'
                                          }}
                                        >
                                          No
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingCarId(car.id);
                                        }}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid #ef4444',
                                          color: '#ef4444',
                                          borderRadius: '6px',
                                          padding: '6px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.2s',
                                        }}
                                        title="Delete Custom Car"
                                      >
                                        <Trash2 style={{ width: '14px', height: '14px' }} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const ownedIndex = ownedCarPresets.findIndex(p => p.id === car.id);
                                        if (ownedIndex !== -1) {
                                          setSelectedOwnedCarIndex(ownedIndex);
                                          localStorage.setItem('selectedOwnedCarIndex', ownedIndex.toString());
                                        }
                                        setCustomPrimaryColor('');
                                        setCustomAccentColor('');
                                        setActiveModal(null);
                                      }}
                                      style={{
                                        background: isActive ? 'rgba(0,210,255,0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        border: isActive ? '1px solid #00d2ff' : '1px solid #10b981',
                                        color: isActive ? '#00d2ff' : '#10b981',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textTransform: 'uppercase'
                                      }}
                                    >
                                      {isActive ? 'Active' : 'Drive'}
                                    </button>
                                  </div>
                                ) : isOwned ? (
                                  <button
                                    onClick={() => {
                                      const ownedIndex = ownedCarPresets.findIndex(p => p.id === car.id);
                                      if (ownedIndex !== -1) {
                                        setSelectedOwnedCarIndex(ownedIndex);
                                        localStorage.setItem('selectedOwnedCarIndex', ownedIndex.toString());
                                      }
                                      setCustomPrimaryColor('');
                                      setCustomAccentColor('');
                                      setActiveModal(null);
                                    }}
                                    style={{
                                      background: isActive ? 'rgba(0,210,255,0.1)' : 'rgba(16, 185, 129, 0.1)',
                                      border: isActive ? '1px solid #00d2ff' : '1px solid #10b981',
                                      color: isActive ? '#00d2ff' : '#10b981',
                                      borderRadius: '6px',
                                      padding: '6px 12px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    {isActive ? 'Active' : 'Drive'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (coins >= car.price) {
                                        const newCoins = coins - car.price;
                                        const newOwned = [...ownedCarIds, car.id];
                                        
                                        setCoins(newCoins);
                                        localStorage.setItem('coins', newCoins.toString());
                                        setOwnedCarIds(newOwned);
                                        localStorage.setItem('ownedCarIds', JSON.stringify(newOwned));
                                        
                                        const updatedOwnedPresets = allCarPresets.filter(p => p.id === car.id || ownedCarIds.includes(p.id));
                                        const newIndex = updatedOwnedPresets.findIndex(p => p.id === car.id);
                                        
                                        setSelectedOwnedCarIndex(newIndex >= 0 ? newIndex : 0);
                                        localStorage.setItem('selectedOwnedCarIndex', (newIndex >= 0 ? newIndex : 0).toString());
                                        
                                        setCustomPrimaryColor('');
                                        setCustomAccentColor('');
                                        
                                        alert(`🎉 CONGRATULATIONS!\nYou purchased ${car.name} for ${car.price} coins!\nIt is now selectable in your main lobby using the arrows!`);
                                        setActiveModal(null);
                                      } else {
                                        alert(`❌ NOT ENOUGH COINS!\nThis car costs ${car.price} coins, but you only have ${coins} coins.\n\nPlay more solo matches (+150 coins/match) or watch broadcasts in the lobby to earn free gold!`);
                                      }
                                    }}
                                    style={{
                                      background: 'linear-gradient(135deg, #ffd32a 0%, #ff9f1a 100%)',
                                      border: '1px solid #ffd32a',
                                      color: '#000000',
                                      borderRadius: '6px',
                                      padding: '6px 14px',
                                      fontSize: '0.75rem',
                                      fontWeight: 900,
                                      cursor: 'pointer',
                                      boxShadow: '0 0 10px rgba(255, 211, 42, 0.3)',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    <Lock style={{ width: '10px', height: '10px' }} /> Buy ({car.price})
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Stats mini-bars */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                              {/* Speed */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                                  <span style={{ color: '#8fa2c4' }}>SPEED:</span>
                                  <strong style={{ color: '#ffffff' }}>{car.speed}</strong>
                                </div>
                                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${car.speed}%`, height: '100%', background: '#ff3f3f', borderRadius: '2px' }} />
                                </div>
                              </div>
                              {/* Boost */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                                  <span style={{ color: '#8fa2c4' }}>BOOST:</span>
                                  <strong style={{ color: '#ffffff' }}>{car.boost}</strong>
                                </div>
                                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${car.boost}%`, height: '100%', background: '#ff9f1a', borderRadius: '2px' }} />
                                </div>
                              </div>
                              {/* Handling */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                                  <span style={{ color: '#8fa2c4' }}>STEER:</span>
                                  <strong style={{ color: '#ffffff' }}>{car.handling}</strong>
                                </div>
                                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${car.handling}%`, height: '100%', background: '#00d2ff', borderRadius: '2px' }} />
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STADIUM SELECTION PANEL */}
                {renderedActiveModal === 'stadium_select' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Welcome banner */}
                    <div style={{ background: 'rgba(67, 245, 255, 0.05)', border: '1px solid rgba(67, 245, 255, 0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ color: '#43f5ff', display: 'block', fontSize: '0.9rem', letterSpacing: '0.5px' }}>CHOOSE YOUR MATCH ARENA</strong>
                      <span style={{ fontSize: '0.75rem', color: '#8fa2c4' }}>
                        Select any standard stadium or upload custom 3D stadium files (.glb) to test lights, LCD displays, audience, and mechanics!
                      </span>
                    </div>

                    {/* Arena Stadium Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <strong style={{ fontSize: '0.75rem', color: '#43f5ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Arenas</strong>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Standard Emerald Forest */}
                        <div 
                          onClick={() => {
                            setSelectedStadium('emerald');
                            localStorage.setItem('selectedStadium', 'emerald');
                          }}
                          style={{
                            background: selectedStadium === 'emerald' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.3)',
                            border: selectedStadium === 'emerald' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            boxShadow: selectedStadium === 'emerald' ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: selectedStadium === 'emerald' ? '#10b981' : '#ffffff', fontSize: '0.85rem' }}>Emerald Forest</strong>
                            {selectedStadium === 'emerald' && <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} />}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#8fa2c4', display: 'block', minHeight: '32px' }}>
                            Lush green fields surrounded by nature. Perfect for classic day matches.
                          </span>
                        </div>

                        {/* Standard Neon Cyberdome */}
                        <div 
                          onClick={() => {
                            setSelectedStadium('cyber');
                            localStorage.setItem('selectedStadium', 'cyber');
                          }}
                          style={{
                            background: selectedStadium === 'cyber' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(0,0,0,0.3)',
                            border: selectedStadium === 'cyber' ? '2px solid #00d2ff' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            boxShadow: selectedStadium === 'cyber' ? '0 0 15px rgba(0, 210, 255, 0.3)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: selectedStadium === 'cyber' ? '#00d2ff' : '#ffffff', fontSize: '0.85rem' }}>Neon Cyberdome</strong>
                            {selectedStadium === 'cyber' && <CheckCircle style={{ width: '14px', height: '14px', color: '#00d2ff' }} />}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#8fa2c4', display: 'block', minHeight: '32px' }}>
                            Futuristic high-tech dome with dynamic laser lights, skybeams, and neon boards.
                          </span>
                        </div>
                      </div>

                      {/* Custom Stadiums list */}
                      {customStadiums.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#8fa2c4', fontWeight: 'bold', textTransform: 'uppercase' }}>Your Custom 3D Arenas</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {customStadiums.map((stadium) => {
                              const isSelected = selectedStadium === stadium.id;
                              return (
                                <div 
                                  key={stadium.id}
                                  onClick={() => {
                                    setSelectedStadium(stadium.id);
                                    localStorage.setItem('selectedStadium', stadium.id);
                                  }}
                                  style={{
                                    background: isSelected ? 'rgba(67, 245, 255, 0.12)' : 'rgba(0,0,0,0.3)',
                                    border: isSelected ? '2px solid #43f5ff' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    boxShadow: isSelected ? '0 0 15px rgba(67, 245, 255, 0.3)' : 'none'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <strong style={{ color: isSelected ? '#43f5ff' : '#ffffff', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                      {stadium.name}
                                    </strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Are you sure you want to delete stadium "${stadium.name}"?`)) {
                                            try {
                                              await deleteCustomStadium(stadium.id);
                                              if (selectedStadium === stadium.id) {
                                                setSelectedStadium('emerald');
                                                localStorage.setItem('selectedStadium', 'emerald');
                                              }
                                              await loadAllCustomStadiums();
                                            } catch (err) {
                                              console.error("Error deleting custom stadium:", err);
                                            }
                                          }
                                        }}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.15)',
                                          border: '1px solid rgba(239, 68, 68, 0.4)',
                                          borderRadius: '4px',
                                          padding: '4px',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        className="hover:bg-red-600 hover:text-white transition-all"
                                      >
                                        <Trash2 style={{ width: '11px', height: '11px' }} />
                                      </button>
                                      {isSelected && <CheckCircle style={{ width: '14px', height: '14px', color: '#43f5ff' }} />}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.65rem', color: '#8fa2c4', display: 'block' }}>
                                    Custom uploaded stadium file. Click to select.
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Import Custom Stadium Section */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(67, 245, 255, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)', border: '1px solid rgba(67, 245, 255, 0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus style={{ width: '18px', height: '18px', color: '#43f5ff' }} />
                        <strong style={{ color: '#43f5ff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Import Custom 3D Stadium (.GLB)</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#8fa2c4', marginTop: '-4px' }}>
                        Upload any 3D stadium scene model (.glb file) to test its geometry, lights, displays, boundaries, and performance!
                      </span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#8fa2c4', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Stadium Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Neon Arena" 
                            value={uploadStadiumName}
                            onChange={(e) => setUploadStadiumName(e.target.value)}
                            style={{ width: '100%', background: '#050a16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '0.8rem', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#8fa2c4', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Choose .GLB File</label>
                          <input 
                            type="file" 
                            accept=".glb" 
                            id="custom-stadium-file-upload"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setUploadStadiumFile(file);
                                if (!uploadStadiumName) {
                                  const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                                  setUploadStadiumName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
                                }
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <button
                            onClick={() => document.getElementById('custom-stadium-file-upload')?.click()}
                            style={{
                              width: '100%',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px dashed rgba(67, 245, 255, 0.4)',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              color: uploadStadiumFile ? '#43f5ff' : '#8fa2c4',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {uploadStadiumFile ? `📁 ${uploadStadiumFile.name}` : 'Select stadium .glb file'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', justifyContent: 'flex-end' }}>
                        <button
                          disabled={!uploadStadiumFile || !uploadStadiumName || uploadingStadium}
                          onClick={async () => {
                            if (!uploadStadiumFile || !uploadStadiumName) return;
                            setUploadingStadium(true);
                            try {
                              const id = 'stadium_' + Date.now();
                              const newStadium: CustomStadium = {
                                id,
                                name: uploadStadiumName,
                                blob: uploadStadiumFile
                              };
                              
                              await saveCustomStadium(newStadium);
                              setUploadStadiumName('');
                              setUploadStadiumFile(null);
                              await loadAllCustomStadiums();
                              setSelectedStadium(id);
                              localStorage.setItem('selectedStadium', id);
                              alert(`🎉 Success! Stadium "${newStadium.name}" has been uploaded & selected successfully! Start a practice match or casual match to test your stadium.`);
                            } catch (err) {
                              console.error(err);
                              alert('❌ Failed to upload custom stadium file. Please make sure it is a valid .glb model.');
                            } finally {
                              setUploadingStadium(false);
                            }
                          }}
                          style={{
                            background: (!uploadStadiumFile || !uploadStadiumName || uploadingStadium) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00d2ff 0%, #00a8ff 100%)',
                            border: '1px solid #00d2ff',
                            color: (!uploadStadiumFile || !uploadStadiumName || uploadingStadium) ? '#8fa2c4' : '#000000',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: (!uploadStadiumFile || !uploadStadiumName || uploadingStadium) ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s'
                          }}
                        >
                          {uploadingStadium ? 'Importing Stadium...' : 'Add Stadium Arena'}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                                {/* SETTINGS PANEL */}
                {renderedActiveModal === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}>
                      {/* SIDEBAR TABS */}
                      <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '8px', borderRight: '1px solid rgba(67, 245, 255, 0.1)', overflowY: 'auto' }}>
                        {[
                          { id: 'account', icon: User, label: 'Account', color: '#43f5ff' },
                          { id: 'in-match', icon: Gamepad2, label: 'In-Match', color: '#43f5ff' },
                          { id: 'display', icon: Monitor, label: 'Display', color: '#ff4d94' },
                          { id: 'sound', icon: Volume2, label: 'Sound', color: '#ffd32a' },
                          { id: 'recording', icon: Video, label: 'Recording', color: '#00e575' },
                          { id: 'notification', icon: Bell, label: 'Notification', color: '#bf5aff' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setSettingsTab(tab.id as any)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: '12px',
                              padding: '16px 12px',
                              background: settingsTab === tab.id ? 'rgba(67, 245, 255, 0.08)' : 'transparent',
                              border: 'none',
                              borderLeft: settingsTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent',
                              color: settingsTab === tab.id ? tab.color : '#8fa2c4',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderRadius: '0 8px 8px 0',
                              outline: 'none'
                            }}
                          >
                            <tab.icon style={{ width: '24px', height: '24px', flexShrink: 0, color: settingsTab === tab.id ? tab.color : '#8fa2c4', filter: settingsTab === tab.id ? `drop-shadow(0 0 8px ${tab.color})` : 'none' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tab.label}</span>
                          </button>
                        ))}
                      </div>

                                            {/* CONTENT AREA */}
                      <div style={{ flex: 1, background: 'linear-gradient(135deg, rgba(5, 12, 25, 0.95), rgba(10, 18, 35, 0.95))', border: '1px solid rgba(67, 245, 255, 0.25)', boxShadow: 'inset 0 0 30px rgba(67, 245, 255, 0.05)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                        
                        {settingsTab === 'in-match' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
                            <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(67, 245, 255, 0.5)' }}>In-Match Settings</span>
                            
                            <div style={{ display: 'flex', gap: '32px' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Sensitivity Slider */}
                                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', border: '1px solid rgba(67,245,255,0.15)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 700, color: '#c4d1eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Steering Sensitivity:</span>
                                    <span style={{ color: '#43f5ff', fontWeight: 900, textShadow: '0 0 8px rgba(67, 245, 255, 0.4)' }}>{sensitivity}%</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="100" step="1" value={sensitivity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      setSensitivity(val);
                                      localStorage.setItem('sensitivity', val.toString());
                                    }}
                                    style={{ width: '100%', accentColor: '#43f5ff', height: '6px', cursor: 'pointer', filter: 'drop-shadow(0 0 5px rgba(67, 245, 255, 0.5))' }}
                                  />
                                </div>

                                {/* HUD Buttons Customization Header */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <span style={{ fontSize: '0.9rem', color: '#ffd32a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 8px rgba(255, 211, 42, 0.4)' }}>HUD Button Layout</span>
                                  <p style={{ fontSize: '0.75rem', color: '#8fa2c4', margin: 0 }}>Select a button below and adjust its position using the sliders, or preview it on the right.</p>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  {[
                                    { id: 'steerLeft', label: '◀ Steer Left' },
                                    { id: 'steerRight', label: '▶ Steer Right' },
                                    { id: 'forward', label: '▲ Throttle' },
                                    { id: 'reverse', label: '▼ Reverse' },
                                    { id: 'boost', label: '⚡ Boost' },
                                    { id: 'jump', label: '🚀 Jump' }
                                  ].map((btn) => (
                                    <button
                                      key={btn.id}
                                      onClick={() => setSelectedHudBtn(btn.id)}
                                      style={{
                                        padding: '10px 16px',
                                        background: selectedHudBtn === btn.id ? 'linear-gradient(90deg, #00d2ff, #43f5ff)' : 'rgba(0,0,0,0.3)',
                                        border: '1px solid',
                                        borderColor: selectedHudBtn === btn.id ? '#ffffff' : 'rgba(67, 245, 255, 0.2)',
                                        color: selectedHudBtn === btn.id ? '#000000' : '#c4d1eb',
                                        fontWeight: 900,
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: selectedHudBtn === btn.id ? '0 0 15px rgba(67, 245, 255, 0.4)' : 'none',
                                        outline: 'none',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </div>

                                {/* Position Sliders */}
                                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', border: '1px solid rgba(67, 245, 255, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '12px', color: '#c4d1eb' }}>
                                      <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Horizontal Position (X-Axis):</span>
                                      <span style={{ color: '#43f5ff', fontWeight: 900, textShadow: '0 0 8px rgba(67, 245, 255, 0.4)' }}>{btnPositions[selectedHudBtn]?.x || 0}%</span>
                                    </div>
                                    <input
                                      type="range" min="2" max="95" step="1"
                                      value={btnPositions[selectedHudBtn]?.x || 0}
                                      onChange={(e) => {
                                        const newPos = { ...btnPositions };
                                        newPos[selectedHudBtn] = { ...newPos[selectedHudBtn], x: parseInt(e.target.value) };
                                        setBtnPositions(newPos);
                                        localStorage.setItem('mobileBtnPositions', JSON.stringify(newPos));
                                      }}
                                      style={{ width: '100%', accentColor: '#ffd32a', height: '6px', cursor: 'pointer', filter: 'drop-shadow(0 0 5px rgba(255, 211, 42, 0.5))' }}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '12px', color: '#c4d1eb' }}>
                                      <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vertical Position (Y-Axis):</span>
                                      <span style={{ color: '#43f5ff', fontWeight: 900, textShadow: '0 0 8px rgba(67, 245, 255, 0.4)' }}>{btnPositions[selectedHudBtn]?.y || 0}%</span>
                                    </div>
                                    <input
                                      type="range" min="2" max="90" step="1"
                                      value={btnPositions[selectedHudBtn]?.y || 0}
                                      onChange={(e) => {
                                        const newPos = { ...btnPositions };
                                        newPos[selectedHudBtn] = { ...newPos[selectedHudBtn], y: parseInt(e.target.value) };
                                        setBtnPositions(newPos);
                                        localStorage.setItem('mobileBtnPositions', JSON.stringify(newPos));
                                      }}
                                      style={{ width: '100%', accentColor: '#ffd32a', height: '6px', cursor: 'pointer', filter: 'drop-shadow(0 0 5px rgba(255, 211, 42, 0.5))' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Right side preview */}
                              <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#8fa2c4', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Layout Preview</span>
                                <div style={{
                                  width: '100%',
                                  height: '180px',
                                  background: '#02050a',
                                  border: '2px solid rgba(67, 245, 255, 0.3)',
                                  borderRadius: '12px',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 20px rgba(67, 245, 255, 0.1)'
                                }}>
                                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(67, 245, 255, 0.15) 1px, transparent 0)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px dashed rgba(67, 245, 255, 0.2)' }} />
                                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed rgba(67, 245, 255, 0.2)' }} />
                                  {Object.entries(btnPositions).map(([id, posVal]) => {
                                    const pos = posVal as { x: number, y: number };
                                    const isActive = selectedHudBtn === id;
                                    const labels: Record<string, string> = { steerLeft: '◀', steerRight: '▶', forward: '▲', reverse: '▼', boost: '⚡', jump: '🚀' };
                                    return (
                                      <div
                                        key={id}
                                        style={{
                                          position: 'absolute',
                                          left: `${pos.x}%`,
                                          bottom: `${pos.y}%`,
                                          transform: 'translate(-50%, 50%)',
                                          width: isActive ? '40px' : '30px', 
                                          height: isActive ? '40px' : '30px', 
                                          borderRadius: '50%',
                                          background: isActive ? 'linear-gradient(135deg, #00d2ff, #43f5ff)' : 'rgba(10, 19, 41, 0.8)',
                                          border: isActive ? '2px solid #ffffff' : '1px solid rgba(67, 245, 255, 0.3)',
                                          color: isActive ? '#000000' : '#43f5ff',
                                          fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          boxShadow: isActive ? '0 0 20px rgba(67, 245, 255, 0.8)' : '0 0 10px rgba(0,0,0,0.5)', zIndex: isActive ? 10 : 2,
                                          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                      >
                                        {labels[id]}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <button
                                    onClick={() => {
                                      const defaults = { steerLeft: { x: 10, y: 25 }, steerRight: { x: 25, y: 25 }, forward: { x: 80, y: 40 }, reverse: { x: 80, y: 15 }, boost: { x: 92, y: 40 }, jump: { x: 92, y: 15 } };
                                      setBtnPositions(defaults);
                                      localStorage.setItem('mobileBtnPositions', JSON.stringify(defaults));
                                    }}
                                    style={{
                                      background: 'rgba(255, 77, 148, 0.1)', border: '1px solid rgba(255, 77, 148, 0.4)', borderRadius: '8px', color: '#ff4d94', padding: '14px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', outline: 'none', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 77, 148, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 77, 148, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 77, 148, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                  >
                                    Reset to Default Layout
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'display' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
                            <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(67, 245, 255, 0.5)' }}>Display Settings</span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(67,245,255,0.15)' }}>
                                <span style={{ fontSize: '0.9rem', color: '#c4d1eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Graphics Quality</span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                  {(['Smooth', 'Standard', 'Ultra', 'Max'] as const).map(q => (
                                    <button
                                      key={q}
                                      onClick={() => setQualityPreset(q as any)}
                                      style={{
                                        background: qualityPreset === q ? 'linear-gradient(135deg, #00d2ff, #43f5ff)' : 'rgba(0,0,0,0.4)',
                                        color: qualityPreset === q ? '#000000' : '#8fa2c4',
                                        border: '1px solid',
                                        borderColor: qualityPreset === q ? '#ffffff' : 'rgba(67,245,255,0.2)',
                                        padding: '16px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        outline: 'none',
                                        boxShadow: qualityPreset === q ? '0 0 20px rgba(67,245,255,0.5)' : 'none',
                                        transition: 'all 0.2s',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '20px 24px', borderRadius: '12px', border: '1px solid rgba(67,245,255,0.15)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Color Blind Mode</span>
                                  <span style={{ fontSize: '0.75rem', color: '#8fa2c4' }}>Adjust neon colors for better visibility</span>
                                </div>
                                <div 
                                  onClick={() => setColorBlindMode(!colorBlindMode)}
                                  style={{ width: '56px', height: '28px', background: colorBlindMode ? '#43f5ff' : 'rgba(0,0,0,0.5)', borderRadius: '14px', border: '1px solid rgba(67,245,255,0.3)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', boxShadow: colorBlindMode ? '0 0 15px rgba(67,245,255,0.4)' : 'none' }}
                                >
                                  <div style={{ position: 'absolute', top: '3px', left: colorBlindMode ? '31px' : '3px', width: '20px', height: '20px', background: colorBlindMode ? '#0a1329' : '#8fa2c4', borderRadius: '50%', transition: 'left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'sound' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
                            <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(67, 245, 255, 0.5)' }}>Audio Config</span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                              
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '20px 24px', borderRadius: '12px', border: '1px solid rgba(67,245,255,0.15)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Master Sound</span>
                                  <span style={{ fontSize: '0.75rem', color: '#8fa2c4' }}>Toggle all game sounds globally</span>
                                </div>
                                <div 
                                  onClick={() => { setMasterVolume(!masterVolume); localStorage.setItem('masterVolume', (!masterVolume).toString()); }}
                                  style={{ width: '56px', height: '28px', background: masterVolume ? '#43f5ff' : 'rgba(0,0,0,0.5)', borderRadius: '14px', border: '1px solid rgba(67,245,255,0.3)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', boxShadow: masterVolume ? '0 0 15px rgba(67,245,255,0.4)' : 'none' }}
                                >
                                  <div style={{ position: 'absolute', top: '3px', left: masterVolume ? '31px' : '3px', width: '20px', height: '20px', background: masterVolume ? '#0a1329' : '#8fa2c4', borderRadius: '50%', transition: 'left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(0,0,0,0.3)', padding: '28px', borderRadius: '12px', border: '1px solid rgba(67,245,255,0.15)' }}>
                                {[
                                  { label: 'Background Music Volume', value: musicVolume, setter: setMusicVolume, store: 'musicVolume' },
                                  { label: 'Sound Effects (SFX)', value: soundVolume, setter: setSoundVolume, store: 'soundVolume' },
                                  { label: 'Engine Sound', value: engineVolume, setter: setEngineVolume, store: 'engineVolume' }
                                ].map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: '0.85rem', color: '#c4d1eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                                      <span style={{ fontSize: '0.85rem', color: '#43f5ff', fontWeight: 900, textShadow: '0 0 8px rgba(67, 245, 255, 0.4)' }}>{item.value}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" max="100" step="1"
                                      value={item.value}
                                      onChange={(e) => {
                                        const v = parseInt(e.target.value);
                                        item.setter(v);
                                        localStorage.setItem(item.store, v.toString());
                                      }}
                                      style={{ width: '100%', accentColor: '#ffd32a', height: '6px', cursor: 'pointer', opacity: masterVolume ? 1 : 0.4, pointerEvents: masterVolume ? 'auto' : 'none', filter: 'drop-shadow(0 0 5px rgba(255, 211, 42, 0.5))' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'recording' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
                            <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(67, 245, 255, 0.5)' }}>Recording Config</span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                              <div style={{ background: 'linear-gradient(135deg, rgba(0, 229, 117, 0.15), rgba(0, 229, 117, 0.05))', border: '1px solid rgba(0, 229, 117, 0.4)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', boxShadow: 'inset 0 0 20px rgba(0, 229, 117, 0.1)' }}>
                                <Video style={{ width: '32px', height: '32px', color: '#00e575', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(0, 229, 117, 0.6))' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <span style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Match Recording</span>
                                  <span style={{ color: '#8fa2c4', fontSize: '0.8rem', lineHeight: '1.6' }}>When enabled, all your matches will be automatically recorded and saved locally to your device's gallery. This feature requires Gallery / Storage permissions to save video files.</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '20px 24px', borderRadius: '12px', border: '1px solid rgba(67,245,255,0.15)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Auto-Record Matches</span>
                                  <span style={{ fontSize: '0.75rem', color: '#8fa2c4' }}>Save gameplay to device gallery</span>
                                </div>
                                <div 
                                  onClick={() => {
                                    if (!recordingEnabled) {
                                      const confirm = window.confirm('Game needs permission to access your Gallery to save match recordings. Allow?');
                                      if (confirm) {
                                        setRecordingEnabled(true);
                                        localStorage.setItem('recordingEnabled', 'true');
                                      }
                                    } else {
                                      setRecordingEnabled(false);
                                      localStorage.setItem('recordingEnabled', 'false');
                                    }
                                  }}
                                  style={{ width: '56px', height: '28px', background: recordingEnabled ? '#00e575' : 'rgba(0,0,0,0.5)', borderRadius: '14px', border: '1px solid rgba(0, 229, 117, 0.3)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', boxShadow: recordingEnabled ? '0 0 15px rgba(0,229,117,0.4)' : 'none' }}
                                >
                                  <div style={{ position: 'absolute', top: '3px', left: recordingEnabled ? '31px' : '3px', width: '20px', height: '20px', background: recordingEnabled ? '#0a1329' : '#8fa2c4', borderRadius: '50%', transition: 'left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'notification' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
                            <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(67, 245, 255, 0.5)' }}>Notifications</span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(67,245,255,0.15)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>General Notifications</span>
                                  <span style={{ fontSize: '0.8rem', color: '#8fa2c4', lineHeight: '1.5', maxWidth: '80%' }}>Enable or disable general stadium alerts (friend logins, matchmaking ready, new updates).</span>
                                </div>
                                <div 
                                  onClick={() => {
                                    const val = !generalNotifications;
                                    setGeneralNotifications(val);
                                    localStorage.setItem('generalNotifications', val.toString());
                                  }}
                                  style={{ width: '56px', height: '28px', background: generalNotifications ? '#bf5aff' : 'rgba(0,0,0,0.5)', borderRadius: '14px', border: '1px solid rgba(191, 90, 255, 0.3)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', boxShadow: generalNotifications ? '0 0 15px rgba(191, 90, 255, 0.4)' : 'none' }}
                                >
                                  <div style={{ position: 'absolute', top: '3px', left: generalNotifications ? '31px' : '3px', width: '20px', height: '20px', background: generalNotifications ? '#0a1329' : '#8fa2c4', borderRadius: '50%', transition: 'left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'account' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', height: '100%', animation: 'fadeIn 0.3s ease-out' }}>
                            <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(67, 245, 255, 0.5)' }}>Account Portal</span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '600px' }}>
                              
                              {/* Account Info Card */}
                              <div style={{ background: 'linear-gradient(135deg, rgba(67, 245, 255, 0.15), rgba(0,0,0,0.6))', padding: '28px', borderRadius: '16px', border: '1px solid rgba(67,245,255,0.3)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'inset 0 0 20px rgba(67, 245, 255, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                  <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#0a1329', border: '2px solid #43f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(67, 245, 255, 0.3)' }}>
                                    <User style={{ width: '32px', height: '32px', color: '#43f5ff' }} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.5px' }}>{user ? user.displayName || 'Guest Player' : 'Not Logged In'}</span>
                                    <span style={{ color: '#8fa2c4', fontSize: '0.85rem' }}>Linked ID: <span style={{ color: '#c4d1eb' }}>{user ? user.email || 'Anonymous' : 'None'}</span></span>
                                  </div>
                                </div>
                                {user && (
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '6px', fontSize: '0.75rem', color: '#ffd32a', fontWeight: 900, textTransform: 'uppercase', border: '1px solid rgba(255, 211, 42, 0.2)' }}>
                                      UID: {user.uid.substring(0, 10)}...
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '6px', fontSize: '0.75rem', color: '#00e575', fontWeight: 900, textTransform: 'uppercase', border: '1px solid rgba(0, 229, 117, 0.2)' }}>
                                      Verified Cyber-Racer
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Links */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <a href="?page=terms" target="_blank" style={{ display: 'block', textDecoration: 'none', padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(67,245,255,0.15)', borderRadius: '12px', color: '#c4d1eb', fontSize: '0.85rem', fontWeight: 800, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }} onMouseOver={(e) => { e.currentTarget.style.background='rgba(67,245,255,0.1)'; e.currentTarget.style.color='#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background='rgba(0,0,0,0.3)'; e.currentTarget.style.color='#c4d1eb'; }}>
                                  📜 Terms & Services
                                </a>
                                <a href="?page=privacy" target="_blank" style={{ display: 'block', textDecoration: 'none', padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(67,245,255,0.15)', borderRadius: '12px', color: '#c4d1eb', fontSize: '0.85rem', fontWeight: 800, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }} onMouseOver={(e) => { e.currentTarget.style.background='rgba(67,245,255,0.1)'; e.currentTarget.style.color='#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background='rgba(0,0,0,0.3)'; e.currentTarget.style.color='#c4d1eb'; }}>
                                  🛡️ Privacy Policy
                                </a>
                                <button onClick={() => setRenderedActiveModal('permissions')} style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(67,245,255,0.15)', borderRadius: '12px', color: '#c4d1eb', fontSize: '0.85rem', fontWeight: 800, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }} onMouseOver={(e) => { e.currentTarget.style.background='rgba(67,245,255,0.1)'; e.currentTarget.style.color='#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background='rgba(0,0,0,0.3)'; e.currentTarget.style.color='#c4d1eb'; }}>
                                  🔐 Game Permissions
                                </button>
                                <button onClick={() => setRenderedActiveModal('delete_account')} style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 800, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }} onMouseOver={(e) => { e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'; e.currentTarget.style.boxShadow='0 0 10px rgba(239, 68, 68, 0.3)'; }} onMouseOut={(e) => { e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'; e.currentTarget.style.boxShadow='none'; }}>
                                  ⚠️ Delete Account
                                </button>
                              </div>

                              <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '16px' }}>
                                {user ? (
                                  <button
                                    onClick={() => {
                                      auth.signOut();
                                      setScreen('login');
                                      setActiveModal(null);
                                    }}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                      width: '100%', padding: '18px', background: 'rgba(255, 77, 148, 0.15)', border: '1px solid rgba(255, 77, 148, 0.5)',
                                      borderRadius: '12px', color: '#ff4d94', fontSize: '0.95rem', fontWeight: 900, cursor: 'pointer', outline: 'none', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background='rgba(255, 77, 148, 0.25)'; e.currentTarget.style.boxShadow='0 0 20px rgba(255, 77, 148, 0.4)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background='rgba(255, 77, 148, 0.15)'; e.currentTarget.style.boxShadow='none'; }}
                                  >
                                    <LogOut size={20} />
                                    SYSTEM LOGOUT
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setRenderedActiveModal('auth')}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                      width: '100%', padding: '18px', background: 'linear-gradient(90deg, #00d2ff, #43f5ff)', border: 'none',
                                      borderRadius: '12px', color: '#0a1329', fontSize: '0.95rem', fontWeight: 900, cursor: 'pointer', outline: 'none', transition: 'all 0.2s', boxShadow: '0 0 20px rgba(67,245,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px'
                                    }}
                                  >
                                    <User size={20} />
                                    INITIALIZE LOGIN SEQUENCE
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                    {/* BOTTOM ACTION BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px' }}>
                      <button 
                        onClick={() => setRenderedActiveModal(null)}
                        style={{
                          background: 'transparent',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          padding: '12px 32px',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          outline: 'none',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setRenderedActiveModal(null)}
                        style={{
                          background: '#43f5ff',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#0a1329',
                          padding: '12px 48px',
                          fontSize: '0.9rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 0 20px rgba(67, 245, 255, 0.5)',
                          outline: 'none',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s'
                        }}
                      >
                        Apply Settings
                      </button>
                    </div>

                  </div>
                )}

                {/* REPLAY HISTORY */}
                {renderedActiveModal === 'replay' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { match: 'VS Striker Bot', date: 'Just now', score: '5 - 3 (WIN)', pts: '+120 pts' },
                      { match: 'VS Striker Bot', date: '10m ago', score: '2 - 5 (LOSS)', pts: '-45 pts' },
                      { match: 'VS Striker Bot', date: '1h ago', score: '5 - 0 (WIN)', pts: '+180 pts' }
                    ].map((rep, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                        <div>
                          <strong style={{ display: 'block', color: '#ffffff' }}>{rep.match}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#8fa2c4' }}>{rep.date}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', color: rep.score.includes('WIN') ? '#10b981' : '#ef4444', fontWeight: 800 }}>{rep.score}</span>
                          <span style={{ fontSize: '0.72rem', color: '#ffd32a' }}>{rep.pts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* GLOBAL LOBBY CHAT */}
                {renderedActiveModal === 'chat' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ height: '160px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(67,245,255,0.1)', borderRadius: '8px', padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><strong style={{ color: '#ffd32a' }}>[NitroSlayer]:</strong> Anyone up for a fast 1v1 match?</div>
                      <div><strong style={{ color: '#00d2ff' }}>[SpeedyCar]:</strong> Your Vision GT looks sick PoorestDrift79!</div>
                      <div><strong style={{ color: '#10b981' }}>[Matchmaker]:</strong> Matchmaking queue active: 42 users driving.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Type stadium chat message..." 
                        style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(67,245,255,0.2)', padding: '8px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '0.8rem' }}
                      />
                      <button style={{ background: '#43f5ff', border: 'none', color: '#0a1329', padding: '0 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>SEND</button>
                    </div>
                  </div>
                )}

                {/* NEWS & UPDATES */}
                {renderedActiveModal === 'news' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ borderLeft: '3px solid #ffd32a', paddingLeft: '10px' }}>
                      <strong style={{ color: '#ffffff', display: 'block' }}>JULY TOURNAMENT ACTIVE</strong>
                      <span style={{ fontSize: '0.72rem', color: '#8fa2c4' }}>Win exclusive custom body styles by ranking in the top 100 users.</span>
                    </div>
                    <div style={{ borderLeft: '3px solid #43f5ff', paddingLeft: '10px' }}>
                      <strong style={{ color: '#ffffff', display: 'block' }}>NEW 'TITAN' TRUCK RELEASED!</strong>
                      <span style={{ fontSize: '0.72rem', color: '#8fa2c4' }}>Unlock the Titan Truck armored model at level 10 or obtain instantly with VIP Access!</span>
                    </div>
                  </div>
                )}

                {/* WATCH VIDEO */}
                {renderedActiveModal === 'credits' && (
                  <div style={{ textTransform: 'uppercase', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px' }}>
                    <Tv style={{ width: '42px', height: '42px', color: '#ef4444' }} />
                    <strong>Watch promotional broadcast</strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#8fa2c4' }}>
                      Watch a 15-second stadium broadcast loop to earn +200 free gold coins and +5 battery energy cells!
                    </p>
                    <button 
                      onClick={() => {
                        alert('Earning credits... Loop completed! +200 Coins granted.');
                        setActiveModal(null);
                      }}
                      style={{ background: '#ef4444', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '30px', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' }}
                    >
                      Stream broadcast
                    </button>
                  </div>
                )}

                {/* FREE NOS */}
                {renderedActiveModal === 'nos' && (
                  <div style={{ textTransform: 'uppercase', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px' }}>
                    <Zap style={{ width: '42px', height: '42px', color: '#ff5e00' }} />
                    <strong>Refill booster supplies</strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#8fa2c4' }}>
                      Instant stadium supply drop refuels your garage reserves back to +99 canisters!
                    </p>
                    <button 
                      onClick={() => {
                        alert('Booster supply box dropped! Reserves filled to +99.');
                        setActiveModal(null);
                      }}
                      style={{ background: '#ff5e00', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '30px', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' }}
                    >
                      Deploy supplies
                    </button>
                  </div>
                )}

                {/* FACEBOOK */}
                {renderedActiveModal === 'facebook' && (
                  <div style={{ textTransform: 'uppercase', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px' }}>
                    <CheckCircle style={{ width: '42px', height: '42px', color: '#177dff' }} />
                    <strong>Link Social profile</strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#8fa2c4' }}>
                      Synchronize your rating scores, unlocks, and custom car garages to the cloud so you never lose progress!
                    </p>
                    <button 
                      onClick={() => {
                        alert('Connecting to social hub... Account linked successfully.');
                        setActiveModal(null);
                      }}
                      style={{ background: '#177dff', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '30px', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' }}
                    >
                      Authorize Connection
                    </button>
                  </div>
                )}

                {/* VIP */}
                {renderedActiveModal === 'vip' && (
                  <div style={{ textTransform: 'uppercase', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px' }}>
                    <Trophy style={{ width: '42px', height: '42px', color: '#ffd32a' }} />
                    <strong>VIP Stadium Pass Benefits</strong>
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', width: '100%' }}>
                      <div>⭐ Unlock and drive any premium car model (Vision GT, Titan) instantly.</div>
                      <div>⭐ Custom exclusive paints and decal sliders enabled.</div>
                      <div>⭐ Double currency drop multiplier after every online or solo match!</div>
                    </div>
                    <button 
                      onClick={() => setActiveModal(null)}
                      style={{ background: '#ffd32a', border: 'none', color: '#0a1329', padding: '10px 24px', borderRadius: '30px', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer', marginTop: '10px' }}
                    >
                      Awesome!
                    </button>
                  </div>
                )}

                {renderedActiveModal === 'terms' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    <h3 style={{ color: '#43f5ff', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Terms & Services</h3>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      Welcome to Car Football Arena! By playing this game, you agree to our terms. 
                      This game is in development. Your stats and data may be wiped during beta phases. 
                      Do not use any unauthorized third-party mods, hacks, or cheats that alter gameplay.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      Respect other players in chat. We reserve the right to ban accounts for toxic behavior.
                    </p>
                    <button onClick={() => setRenderedActiveModal('settings')} style={{ background: 'linear-gradient(135deg, #00d2ff, #43f5ff)', border: 'none', color: '#0a1329', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>BACK TO SETTINGS</button>
                  </div>
                )}

                {renderedActiveModal === 'privacy' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    <h3 style={{ color: '#43f5ff', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Privacy Policy</h3>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      We collect basic player data including your chosen display name, linked email, and match statistics to provide matchmaking and leaderboards. 
                      Your email is never shared publicly.
                    </p>
                    <button onClick={() => setRenderedActiveModal('settings')} style={{ background: 'linear-gradient(135deg, #00d2ff, #43f5ff)', border: 'none', color: '#0a1329', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>BACK TO SETTINGS</button>
                  </div>
                )}

                {renderedActiveModal === 'permissions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    <h3 style={{ color: '#43f5ff', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Game Permissions</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(67, 245, 255, 0.15)' }}>
                       <div>
                         <strong style={{ color: '#ffffff' }}>Storage / Gallery</strong>
                         <div style={{ fontSize: '0.75rem', color: '#8fa2c4', marginTop: '4px' }}>Required to save recorded match highlights locally.</div>
                       </div>
                       <span style={{ color: '#00e575', fontWeight: 900, fontSize: '0.8rem' }}>GRANTED</span>
                    </div>
                    <button onClick={() => setRenderedActiveModal('settings')} style={{ background: 'linear-gradient(135deg, #00d2ff, #43f5ff)', border: 'none', color: '#0a1329', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>BACK TO SETTINGS</button>
                  </div>
                )}

                {renderedActiveModal === 'delete_account' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ color: '#ef4444', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Delete Account</h3>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      Are you sure you want to permanently delete your account? All your cars, stats, and VIP passes will be lost forever. This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => setRenderedActiveModal('settings')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>CANCEL</button>
                      <button onClick={() => { auth.currentUser?.delete().then(() => setRenderedActiveModal(null)).catch(e => { alert(e.message); setRenderedActiveModal('settings'); }); }} style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>PERMANENT DELETE</button>
                    </div>
                  </div>
                )}

              </div>

              {/* Close Footer */}
              <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(67, 245, 255, 0.15)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setActiveModal(null)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', padding: '8px 20px', borderRadius: '24px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  DISMISS
                </button>
              </div>

            </div>
          </div>
        )}

        {/* INCOMING MATCHMAKING/PARTY INVITATIONS BANNER POPUP */}
        {incomingInvitation && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0e1e38 0%, #060d1a 100%)',
            border: '2px solid #43f5ff',
            borderRadius: '12px',
            padding: '16px',
            width: '300px',
            zIndex: 200,
            boxShadow: '0 10px 30px rgba(67, 245, 255, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(67, 245, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #43f5ff' }}>
                <Users size={18} color="#43f5ff" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.75rem', color: '#88a2cd', textTransform: 'uppercase', letterSpacing: '1px' }}>MATCH INVITATION</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 'bold' }}>{incomingInvitation.fromName}</p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#88a2cd', lineHeight: '1.4' }}>
              Invited you to join their team for a 3v3 match!
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => handleAcceptInvitation(incomingInvitation)}
                style={{ flex: 1, background: '#43f5ff', color: '#030814', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Check size={14} /> ACCEPT
              </button>
              <button
                onClick={() => handleRejectInvitation(incomingInvitation)}
                style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.3)', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <X size={14} /> REJECT
              </button>
            </div>
          </div>
        )}

        {/* LOBBY / ONLINE FRIENDS SELECTION DRAWER */}
        {showInviteModal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 8, 20, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 150,
            display: 'flex',
            justifyContent: 'flex-end',
            pointerEvents: 'auto'
          }}>
            <div style={{
              width: '320px',
              height: '100%',
              background: 'linear-gradient(180deg, #071124 0%, #020710 100%)',
              borderLeft: '2px solid rgba(67, 245, 255, 0.3)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#88a2cd', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 900 }}>INVITE DRIVERS</h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#43f5ff' }}>Select active users to invite to your match</p>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search by Name or User ID..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(67, 245, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 36px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s'
                  }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(67, 245, 255, 0.6)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                {friendSearchQuery && (
                  <button
                    onClick={() => setFriendSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#88a2cd',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* List of active users and friends */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
                
                {friendSearchQuery.trim() !== '' ? (
                  /* SEARCH RESULTS MODE */
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.7rem', color: '#88a2cd', textTransform: 'uppercase', letterSpacing: '1px' }}>SEARCH RESULTS</h4>
                    
                    {isSearchingFriends ? (
                      <div style={{ color: 'rgba(67, 245, 255, 0.6)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>Searching database...</div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ color: '#88a2cd', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>No users found. Try another term.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {searchResults.map((user) => {
                          const isAlreadyFriend = friendsList.some(f => f.uid === user.uid);
                          const isOnline = onlineUsers.some(op => op.uid === user.uid);
                          const isInvited = invitedUids.includes(user.uid);
                          const isInOurLobby = matchTeams?.blue.includes(user.displayName) || matchTeams?.orange.includes(user.displayName);

                          return (
                            <div key={user.uid} style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(67, 245, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(67, 245, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(67, 245, 255, 0.3)' }}>
                                    <User size={18} color="#43f5ff" />
                                  </div>
                                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? '#4cd137' : '#95a5a6', border: '2px solid #071124' }} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.displayName}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#88a2cd', fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>ID: {user.uid.slice(0, 10)}...</div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {!isAlreadyFriend ? (
                                  <button
                                    onClick={() => handleAddFriend(user)}
                                    style={{
                                      background: 'rgba(67, 245, 255, 0.1)',
                                      color: '#43f5ff',
                                      border: '1px solid rgba(67, 245, 255, 0.4)',
                                      fontSize: '0.7rem',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ADD FRIEND
                                  </button>
                                ) : isInOurLobby ? (
                                  <span style={{ fontSize: '0.7rem', color: '#4cd137', fontWeight: 'bold', background: 'rgba(76, 209, 55, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>LOBBY</span>
                                ) : isInvited ? (
                                  <span style={{ fontSize: '0.7rem', color: '#ffd32a', fontWeight: 'bold', background: 'rgba(255, 211, 42, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>INVITED</span>
                                ) : isOnline ? (
                                  <button
                                    onClick={() => handleSendInvitation(user)}
                                    style={{
                                      background: '#43f5ff',
                                      color: '#030814',
                                      border: 'none',
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer'
                                    }}
                                    title="Invite to lobby"
                                  >
                                    <Plus size={16} />
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: '#88a2cd', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>OFFLINE</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* FRIENDS & BOTS LIST MODE */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '0.7rem', color: '#88a2cd', textTransform: 'uppercase', letterSpacing: '1px' }}>MY FRIENDS</h4>
                      
                      {friendsList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed rgba(67, 245, 255, 0.15)', borderRadius: '8px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#88a2cd' }}>No friends added yet!</p>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(67, 245, 255, 0.5)', lineHeight: '1.3' }}>Search for users above to add them as friends.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(() => {
                            // Sort: online first
                            const processed = friendsList.map(friend => ({
                              ...friend,
                              isOnline: onlineUsers.some(op => op.uid === friend.uid)
                            }));
                            const sorted = [...processed].sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1));

                            return sorted.map((friend) => {
                              const isInvited = invitedUids.includes(friend.uid);
                              const isInOurLobby = matchTeams?.blue.includes(friend.displayName) || matchTeams?.orange.includes(friend.displayName);

                              return (
                                <div key={friend.uid} style={{
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(67, 245, 255, 0.1)',
                                  borderRadius: '8px',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(67, 245, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(67, 245, 255, 0.3)' }}>
                                        <User size={18} color="#43f5ff" />
                                      </div>
                                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: friend.isOnline ? '#4cd137' : '#95a5a6', border: '2px solid #071124' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{friend.displayName}</div>
                                      <div style={{ fontSize: '0.7rem', color: friend.isOnline ? '#43f5ff' : '#88a2cd' }}>{friend.isOnline ? 'Online' : 'Offline'}</div>
                                    </div>
                                  </div>

                                  <div>
                                    {isInOurLobby ? (
                                      <span style={{ fontSize: '0.7rem', color: '#4cd137', fontWeight: 'bold', background: 'rgba(76, 209, 55, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>LOBBY</span>
                                    ) : isInvited ? (
                                      <span style={{ fontSize: '0.7rem', color: '#ffd32a', fontWeight: 'bold', background: 'rgba(255, 211, 42, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>INVITED</span>
                                    ) : friend.isOnline ? (
                                      <button
                                        onClick={() => handleSendInvitation(friend)}
                                        style={{
                                          background: '#43f5ff',
                                          color: '#030814',
                                          border: 'none',
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          boxShadow: '0 0 10px rgba(67, 245, 255, 0.3)'
                                        }}
                                      >
                                        <Plus size={16} />
                                      </button>
                                    ) : (
                                      <button
                                        disabled
                                        style={{
                                          background: 'rgba(255,255,255,0.05)',
                                          color: 'rgba(255,255,255,0.2)',
                                          border: 'none',
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'not-allowed'
                                        }}
                                      >
                                        <Plus size={16} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '0.7rem', color: '#88a2cd', textTransform: 'uppercase', letterSpacing: '1px' }}>PRACTICE BOTS</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { uid: 'bot_viper', displayName: 'Viper_99', level: 12, isBot: true },
                          { uid: 'bot_nitro', displayName: 'NitroBoost', level: 25, isBot: true },
                          { uid: 'bot_turbo', displayName: 'TurboCharge', level: 34, isBot: true },
                          { uid: 'bot_drift', displayName: 'DriftKing', level: 19, isBot: true },
                          { uid: 'bot_apex', displayName: 'ApexRacer', level: 42, isBot: true }
                        ].map((bot) => {
                          const isInvited = invitedUids.includes(bot.uid);
                          const isInOurLobby = matchTeams?.blue.includes(bot.displayName) || matchTeams?.orange.includes(bot.displayName);

                          return (
                            <div key={bot.uid} style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ position: 'relative' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <User size={18} color="#88a2cd" />
                                  </div>
                                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#4cd137', border: '2px solid #071124' }} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{bot.displayName}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#88a2cd' }}>Level {bot.level} • AI Bot</div>
                                </div>
                              </div>

                              <div>
                                {isInOurLobby ? (
                                  <span style={{ fontSize: '0.7rem', color: '#4cd137', fontWeight: 'bold', background: 'rgba(76, 209, 55, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>LOBBY</span>
                                ) : isInvited ? (
                                  <span style={{ fontSize: '0.7rem', color: '#ffd32a', fontWeight: 'bold', background: 'rgba(255, 211, 42, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>INVITED</span>
                                ) : (
                                  <button
                                    onClick={() => handleSendInvitation(bot)}
                                    style={{
                                      background: 'rgba(255,255,255,0.1)',
                                      color: '#fff',
                                      border: 'none',
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Plus size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
        {showModeSelector && (
          <ModeSelector
            currentMode={matchMode}
            onSelect={(mode) => {
              setMatchMode(mode);
              setShowModeSelector(false);
            }}
            onClose={() => setShowModeSelector(false)}
          />
        )}

        {/* ==================== 4. PREMIUM TOP-CENTER MATCHMAKING HUD ==================== */}
        {isSearching && (
          <div style={{
            position: 'absolute',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'linear-gradient(180deg, #ffd32a 0%, #f39c12 100%)',
            borderLeft: '1px solid #ffe082',
            borderRight: '1px solid #ffe082',
            borderBottom: '3px solid #d35400',
            clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 15px) 100%, 15px 100%)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
            width: '240px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            pointerEvents: 'auto',
            animation: 'fadeInDown 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            {/* Main content row */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              width: '100%',
              padding: '0 24px',
              boxSizing: 'border-box'
            }}>
              {/* Spacer on the left to balance the cancel button on the right */}
              <div style={{ width: '16px' }} />

              {/* Timer info centered */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '1px',
                flex: 1
              }}>
                <span style={{ 
                  color: '#111827', 
                  fontSize: '0.62rem', 
                  fontWeight: 800, 
                  letterSpacing: '0.5px', 
                  textTransform: 'uppercase',
                  lineHeight: '1.2'
                }}>
                  ESTIMATED: 00:15
                </span>
                <span style={{ 
                  color: '#000000', 
                  fontSize: '1.25rem', 
                  fontWeight: 900, 
                  letterSpacing: '0.5px',
                  lineHeight: '1'
                }}>
                  {formatTime(matchmakingTime)}
                </span>
              </div>

              {/* Cancel Button '✕' on the right */}
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchTimer(0);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#111827',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '14px',
                  padding: 0,
                  outline: 'none',
                  transition: 'transform 0.1s ease',
                  opacity: 0.85
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.2)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.opacity = '0.85';
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ==================== 5. COUNTDOWN START OVERLAY ==================== */}
        {matchCountdown !== null && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 8, 20, 0.85)',
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
            animation: 'fadeIn 0.2s'
          }}>
            <div style={{ 
              color: '#43f5ff', 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              letterSpacing: '4px', 
              textTransform: 'uppercase', 
              marginBottom: '10px',
              textShadow: '0 0 10px rgba(67, 245, 255, 0.5)'
            }}>
              All Drivers Assembled
            </div>
            <div style={{ 
              color: '#fff', 
              fontSize: '8rem', 
              fontWeight: 900, 
              lineHeight: '1',
              textShadow: '0 0 30px #43f5ff, 0 0 60px #0050ff',
              transform: 'scale(1)',
              animation: 'countdownZoom 1s infinite ease-in-out'
            }}>
              {matchCountdown}
            </div>
            <div style={{ 
              color: '#ffd32a', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              letterSpacing: '2px', 
              textTransform: 'uppercase',
              marginTop: '15px'
            }}>
              Match Commencing
            </div>
          </div>
        )}


        <ScreenGate gateState={gateState} />
      </div>
    );
  }

  // Touchscreen Button simulation helpers
  const handleTouchButtonDown = (btnId: string) => {
    const mapping: Record<string, { key: string, code: string }[]> = {
      steerLeft: [
        { key: 'a', code: 'KeyA' },
        { key: 'arrowleft', code: 'ArrowLeft' }
      ],
      steerRight: [
        { key: 'd', code: 'KeyD' },
        { key: 'arrowright', code: 'ArrowRight' }
      ],
      forward: [
        { key: 'w', code: 'KeyW' },
        { key: 'arrowup', code: 'ArrowUp' }
      ],
      reverse: [
        { key: 's', code: 'KeyS' },
        { key: 'arrowdown', code: 'ArrowDown' }
      ],
      boost: [
        { key: 'shift', code: 'ShiftLeft' }
      ],
      jump: [
        { key: ' ', code: 'Space' }
      ]
    };

    const keysToTrigger = mapping[btnId];
    if (keysToTrigger) {
      keysToTrigger.forEach(({ key, code }) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
      });
    }
  };

  const handleTouchButtonUp = (btnId: string) => {
    const mapping: Record<string, { key: string, code: string }[]> = {
      steerLeft: [
        { key: 'a', code: 'KeyA' },
        { key: 'arrowleft', code: 'ArrowLeft' }
      ],
      steerRight: [
        { key: 'd', code: 'KeyD' },
        { key: 'arrowright', code: 'ArrowRight' }
      ],
      forward: [
        { key: 'w', code: 'KeyW' },
        { key: 'arrowup', code: 'ArrowUp' }
      ],
      reverse: [
        { key: 's', code: 'KeyS' },
        { key: 'arrowdown', code: 'ArrowDown' }
      ],
      boost: [
        { key: 'shift', code: 'ShiftLeft' }
      ],
      jump: [
        { key: ' ', code: 'Space' }
      ]
    };

    const keysToTrigger = mapping[btnId];
    if (keysToTrigger) {
      keysToTrigger.forEach(({ key, code }) => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
      });
    }
  };

  // Active Gameplay rendering screen
  return (
    <div ref={mountRef} className="boostball-root" style={{ position: 'fixed', inset: 0 }}>
      {/* 3D WebGL Canvas is appended into mountRef container dynamically */}

      {/* Floating HUD controls on top of standard gameplay canvas */}
      <div className="boostball-ui">
        {/* TOP SCOREBOARD OVERLAY */}
        <div className="gameplay-scoreboard">
          {/* Blue team (YOU) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="gameplay-team-label" style={{ color: '#00d2ff' }}>BLUE</span>
            <div 
              data-overlay-player-score 
              className="gameplay-score"
              style={{ color: '#00d2ff', textShadow: '0 0 12px rgba(0, 210, 255, 0.75)' }}
            >
              0
            </div>
          </div>

          {/* Divider/Timer */}
          <div className="gameplay-timer-container">
            <span 
              data-overlay-clock 
              className="gameplay-clock"
              style={{ color: '#ffffff', textShadow: '0 0 10px rgba(255, 255, 255, 0.65)' }}
            >
              3:00
            </span>
            <span 
              data-overlay-status 
              className="gameplay-status"
            >
              PLAYING
            </span>
          </div>

          {/* Orange team (AI) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              data-overlay-ai-score 
              className="gameplay-score"
              style={{ color: '#ff3d3d', textShadow: '0 0 12px rgba(255, 61, 61, 0.75)' }}
            >
              0
            </div>
            <span className="gameplay-team-label" style={{ color: '#ff3d3d' }}>ORANGE</span>
          </div>
        </div>

        {/* SPECTATING ALERT */}
        <div 
          data-spectating-overlay 
          style={{
            display: 'none',
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.9)',
            border: '2px solid #ef4444',
            borderRadius: '24px',
            padding: '8px 24px',
            color: '#ffffff',
            fontWeight: '900',
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
            zIndex: 15,
            pointerEvents: 'none'
          }}
        >
          📺 SPECTATING TEAMMATE
        </div>

        {/* Pause Match Button */}
        <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'auto', zIndex: 15 }}>
          <button 
            onClick={() => setShowPauseMenu(true)}
            style={{ 
              background: 'rgba(5, 12, 28, 0.85)', 
              border: '2.5px solid rgba(67, 245, 255, 0.8)', 
              color: '#43f5ff', 
              width: '44px',
              height: '44px',
              borderRadius: '50%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer', 
              boxShadow: '0 0 15px rgba(67, 245, 255, 0.4), inset 0 0 8px rgba(67, 245, 255, 0.2)',
              transition: 'all 0.1s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.borderColor = '#ffffff';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(67, 245, 255, 0.8)';
              e.currentTarget.style.color = '#43f5ff';
            }}
            title="Pause Match"
          >
            {/* Elegant high-contrast SVG pause bars */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>

        {/* Camera Toggle Button */}
        <div style={{ position: 'absolute', top: 20, left: 72, pointerEvents: 'auto', zIndex: 15 }}>
          <button 
            data-cam-toggle
            style={{ 
              background: 'rgba(5, 12, 28, 0.85)', 
              border: '2.5px solid rgba(67, 245, 255, 0.8)', 
              color: '#43f5ff', 
              width: '44px',
              height: '44px',
              borderRadius: '50%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer', 
              boxShadow: '0 0 15px rgba(67, 245, 255, 0.4), inset 0 0 8px rgba(67, 245, 255, 0.2)',
              transition: 'all 0.1s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.borderColor = '#ffffff';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(67, 245, 255, 0.8)';
              e.currentTarget.style.color = '#43f5ff';
            }}
            title="Toggle Camera Mode"
          >
            {/* Elegant modern SVG camera icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {/* PAUSE MENU OVERLAY */}
        {showPauseMenu && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            pointerEvents: 'auto',
            fontFamily: '"Space Grotesk", sans-serif'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(10, 20, 42, 0.98), rgba(4, 8, 20, 0.98))',
              border: '3px solid rgba(67, 245, 255, 0.7)',
              padding: '36px 44px',
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(67, 245, 255, 0.45), inset 0 0 20px rgba(67, 245, 255, 0.15)',
              minWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              <h2 style={{ 
                color: '#00d2ff', 
                fontSize: '1.9rem', 
                fontWeight: '950', 
                letterSpacing: '2px', 
                textTransform: 'uppercase', 
                textShadow: '0 0 15px rgba(0, 210, 255, 0.65)',
                margin: '0 0 4px 0'
              }}>
                MATCH PAUSED
              </h2>
              <p style={{ color: '#8fa2c4', fontSize: '11px', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                The match is still running in background
              </p>

              <button
                onClick={() => setShowPauseMenu(false)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '900',
                  fontSize: '13px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.1s ease',
                  outline: 'none'
                }}
              >
                ▶ RESUME MATCH
              </button>

              <button
                onClick={async () => {
                  setShowPauseMenu(false);
                  await handleBackToLobby();
                }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #ff4d4d 0%, #cc0000 100%)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '900',
                  fontSize: '13px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.1s ease',
                  outline: 'none'
                }}
              >
                🚪 QUIT MATCH
              </button>
            </div>
          </div>
        )}

        {/* DANGER LOW-HP VIGNETTE OVERLAY */}
        <div data-danger-vignette style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 0px rgba(255, 0, 0, 0)',
          transition: 'box-shadow 0.12s ease',
          zIndex: 10
        }} />

        {/* Boost & Power Dash (Dual Indicator Panel - integrated into top-right of the viewport) */}
        <div className="gameplay-dash">
          {/* Boost section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span className="dash-label" style={{ color: '#ff9f1a', textShadow: '0 0 8px rgba(255, 159, 26, 0.6)' }}>BST</span>
            <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.7)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,159,26,0.25)', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.8)' }}>
              <div data-boost-bar style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #ffd32a, #ff9f1a)', transformOrigin: 'left center', transform: 'scaleX(1)', transition: 'transform 0.08s ease', boxShadow: '0 0 8px #ff9f1a' }} />
            </div>
            <span data-boost-text className="dash-text" style={{ color: '#ffd32a', textShadow: '0 0 5px rgba(255, 211, 42, 0.4)' }}>100%</span>
          </div>

          {/* Divider line */}
          <div style={{ width: '1px', height: '18px', background: 'rgba(67, 245, 255, 0.3)' }} />

          {/* Power / HP section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span className="dash-label" style={{ color: '#10b981', textShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}>HP</span>
            <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.7)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.8)' }}>
              <div data-hp-bar style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', transformOrigin: 'left center', transform: 'scaleX(1)', transition: 'transform 0.08s ease', boxShadow: '0 0 8px #10b981' }} />
            </div>
            <span data-hp-text className="dash-text" style={{ color: '#10b981', textShadow: '0 0 5px rgba(16, 185, 129, 0.4)' }}>100%</span>
          </div>
        </div>
        
        {/* Game Notifications / Goal Announcements */}
        <div className="boostball-toast" data-toast></div>
        
        {/* Score resolution overlay */}
        <div className="boostball-resolve hidden" data-resolve>
          <strong data-result-title></strong>
          <span data-result-sub></span>
          
          <button 
            onClick={handleBackToLobby}
            style={{ 
              background: 'linear-gradient(135deg, #ffd32a 0%, #ca9b00 100%)', 
              border: '2px solid #ffffff', 
              color: '#050a14', 
              padding: '12px 36px', 
              borderRadius: '30px', 
              fontWeight: 950, 
              fontSize: '1rem', 
              letterSpacing: '2px', 
              textTransform: 'uppercase', 
              cursor: 'pointer', 
              boxShadow: '0 0 25px rgba(255, 211, 42, 0.6)',
              marginTop: '20px',
              pointerEvents: 'auto'
            }}
          >
            RETURN TO LOBBY
          </button>
        </div>
        
        {/* Internal loading overlays */}
        <div className="boostball-loading hidden" data-loading>
          Charging rockets...
        </div>

        {/* On-screen Mobile / Touch Controls HUD Layer */}
        {mobileControlsEnabled && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 12, pointerEvents: 'none', opacity: mobileControlsOpacity / 100 }}>
            {[
              { id: 'steerLeft', label: '◀', color: '#00d2ff', size: 58 },
              { id: 'steerRight', label: '▶', color: '#00d2ff', size: 58 },
              { id: 'forward', label: '▲', color: '#10b981', size: 58 },
              { id: 'reverse', label: '▼', color: '#ef4444', size: 58 },
              { id: 'boost', label: '⚡', color: '#ffd32a', size: 72 },
              { id: 'jump', label: '🚀', color: '#c084fc', size: 72 }
            ].map((btn) => {
              if (tiltControlsEnabled && (btn.id === 'steerLeft' || btn.id === 'steerRight')) {
                return null;
              }
              const pos = btnPositions[btn.id] || { x: 50, y: 50 };
              
              // Get custom SVG icons matching Sideswipe
              let btnIcon = null;
              if (btn.id === 'steerLeft') {
                btnIcon = (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                );
              } else if (btn.id === 'steerRight') {
                btnIcon = (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                );
              } else if (btn.id === 'forward') {
                btnIcon = (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                );
              } else if (btn.id === 'reverse') {
                btnIcon = (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                );
              } else if (btn.id === 'boost') {
                btnIcon = (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.1 2.5 7.6 6 9.1v-2.1C5.2 17.6 3.5 15 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5c0 3-1.7 5.6-4.5 7v2.1c3.5-1.5 6-5 6-9.1 0-5.5-4.5-10-10-10zm.5 5.5l-4.5 6.5h3.5v4.5l4.5-6.5h-3.5v-4.5z" />
                  </svg>
                );
              } else if (btn.id === 'jump') {
                btnIcon = (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 11 12 6 7 11" />
                    <polyline points="17 17 12 12 7 17" />
                  </svg>
                );
              }

              return (
                <button
                  key={btn.id}
                  onTouchStart={(e) => { e.preventDefault(); handleTouchButtonDown(btn.id); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleTouchButtonUp(btn.id); }}
                  onMouseDown={(e) => { e.preventDefault(); handleTouchButtonDown(btn.id); }}
                  onMouseUp={(e) => { e.preventDefault(); handleTouchButtonUp(btn.id); }}
                  onMouseLeave={(e) => { handleTouchButtonUp(btn.id); }}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    bottom: `${pos.y}%`,
                    transform: 'translate(-50%, 50%)',
                    width: `${btn.size}px`,
                    height: `${btn.size}px`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(10, 25, 50, 0.95) 0%, rgba(3, 8, 20, 0.95) 100%)',
                    border: `3px solid ${btn.color}`,
                    color: btn.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    boxShadow: `0 0 18px ${btn.color}80, inset 0 0 10px ${btn.color}40`,
                    userSelect: 'none',
                    outline: 'none',
                    transition: 'all 0.1s ease',
                    transformOrigin: 'center center'
                  }}
                  className="game-touch-btn"
                >
                  {btnIcon}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showModeSelector && (
        <ModeSelector
          currentMode={matchMode}
          onSelect={(mode) => {
            setMatchMode(mode);
            setShowModeSelector(false);
          }}
          onClose={() => setShowModeSelector(false)}
        />
      )}

      {showQuitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            background: '#071124',
            border: '2px solid #00d2ff',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.5)'
          }}>
            <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 'bold' }}>Quit Game?</h2>
            <p style={{ color: '#8fa2c4', marginBottom: '24px' }}>Are you sure you want to exit the game?</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowQuitModal(false)}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowQuitModal(false);
                  try {
                    window.close();
                    window.history.go(-2);
                  } catch(e) {}
                }}
                style={{
                  padding: '10px 24px',
                  background: '#ff003c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 10px rgba(255, 0, 60, 0.5)'
                }}
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {lobbyNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 8, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          fontFamily: '"Space Grotesk", sans-serif'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 24, 42, 0.98), rgba(7, 12, 28, 0.98))',
            border: '2.5px solid rgba(67, 245, 255, 0.8)',
            padding: '36px',
            borderRadius: '24px',
            textAlign: 'center',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 0 40px rgba(67, 245, 255, 0.45), inset 0 0 20px rgba(67, 245, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <h2 style={{ 
              color: '#43f5ff', 
              fontSize: '1.6rem', 
              fontWeight: '950', 
              letterSpacing: '2px', 
              textTransform: 'uppercase', 
              textShadow: '0 0 15px rgba(67, 245, 255, 0.6)',
              margin: '0 0 4px 0'
            }}>
              ARENA NOTIFICATION
            </h2>
            <p style={{ 
              color: '#ffffff', 
              fontSize: '1.05rem', 
              fontWeight: '600',
              lineHeight: '1.6', 
              margin: '0 0 8px 0',
              whiteSpace: 'pre-line'
            }}>
              {lobbyNotice}
            </p>
            <button
              onClick={() => setLobbyNotice(null)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #43f5ff 0%, #00d2ff 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '950',
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: '0 0 15px rgba(67, 245, 255, 0.4)',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}

      <ScreenGate gateState={gateState} />

      {/* INTERACTION GATE - Ensure Fullscreen & Audio */}
      {!hasInteracted && !isPortrait && (
        <div 
          onClick={() => {
            setHasInteracted(true);
            const docEl = document.documentElement as any;
            const requestFullscreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
            if (requestFullscreen) {
              requestFullscreen.call(docEl).then(() => {
                if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
                  (window.screen.orientation as any).lock('landscape').catch(() => {});
                }
              }).catch(() => {});
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 20, 0.95)',
            zIndex: 3000000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ 
            padding: '24px 48px', 
            background: 'linear-gradient(135deg, #43f5ff 0%, #00d2ff 100%)', 
            borderRadius: '12px',
            color: '#000',
            fontWeight: 900,
            fontSize: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            boxShadow: '0 0 30px rgba(67, 245, 255, 0.4)',
            animation: 'pulse 2s infinite'
          }}>
            Tap to Play Fullscreen
          </div>
          <p style={{ color: '#8fa2c4', marginTop: '20px', fontFamily: 'Inter, sans-serif' }}>Click anywhere to enter Car Football Arena</p>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(67, 245, 255, 0.4); }
              50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(67, 245, 255, 0.6); }
            }
          `}</style>
        </div>
      )}

      {/* PORTRAIT OVERLAY - Force Landscape Experience */}
      {isPortrait && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#030814',
          zIndex: 2000000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(67, 245, 255, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '24px',
            border: '2px solid #43f5ff'
          }}>
            <Monitor size={40} color="#43f5ff" style={{ transform: 'rotate(90deg)', animation: 'wiggle 2s ease-in-out infinite' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rotate Your Device</h2>
          <p style={{ color: '#8fa2c4', fontSize: '1rem', lineHeight: '1.5', maxWidth: '300px', marginBottom: '24px' }}>
            Please rotate your phone to <b>Landscape Mode</b> to play Car Football Arena.
          </p>
          
          <button 
            onClick={() => {
              const docEl = document.documentElement as any;
              const requestFullscreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
              if (requestFullscreen) {
                requestFullscreen.call(docEl).then(() => {
                  if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
                    (window.screen.orientation as any).lock('landscape').catch(() => {});
                  }
                }).catch(() => {});
              }
              setHasInteracted(true);
            }}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid #43f5ff',
              color: '#43f5ff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
          >
            I have rotated / Enter Fullscreen
          </button>

          <style>{`
            @keyframes wiggle {
              0%, 100% { transform: rotate(90deg); }
              25% { transform: rotate(110deg); }
              75% { transform: rotate(70deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Product, Order, User, ProductReview, SystemSettings } from './types';
import Navigation from './components/Navigation';
import AdminPanel from './components/AdminPanel';
import ReservationModal from './components/ReservationModal';
import AuthModal from './components/AuthModal';
import SocialPreviewMockup from './components/SocialPreviewMockup';
import { 
  Flame, Search, ArrowRight, ShieldAlert,
  ShoppingBag, Calendar, Phone, MapPin, Sparkles, Check, Info, Share2, HelpCircle, Star, Ticket, ShieldCheck, Mail, Clock,
  Facebook, Instagram, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessBeep } from './utils/audio';
import * as authService from './services/auth';
import * as productsService from './services/products';
import * as ordersService from './services/orders';
import * as reviewsService from './services/reviews';
import * as settingsService from './services/settings';

export default function App() {
  // Application Global States
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  
  const [currentUser, setCurrentUser] = useState<{ 
    email: string; 
    name: string; 
    role: 'admin' | 'cliente';
    isGoogleAuth?: boolean;
    photoURL?: string;
    isGuest?: boolean;
  }>(() => {
    const saved = localStorage.getItem('treck_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      email: 'annierfq01@gmail.com',
      name: 'Annier FQ',
      role: 'admin'
    };
  });

  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'admin' | 'my-orders'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      if (accessToken) {
        fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken }),
        })
          .then(r => r.json())
          .then(user => {
            setCurrentUser(user);
            localStorage.setItem('treck_user', JSON.stringify(user));
            localStorage.setItem('supabase_session', JSON.stringify({ user }));
            window.location.hash = '';
            history.replaceState(null, '', window.location.pathname);
          })
          .catch(err => console.error('[Google Auth] Callback error:', err));
      }
    }

    const saved = localStorage.getItem('supabase_session');
    if (saved && !hash) {
      try {
        const session = JSON.parse(saved);
        if (session.user) {
          setCurrentUser(prev => ({
            ...prev,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          }));
        }
      } catch (e) {}
    }
  }, []);

  const handleLoginWithGoogle = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('Supabase URL not configured for Google auth');
        return;
      }
      window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
    } catch (err) {
      console.error("Failed to handle Google auth redirect:", err);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('treck_user');
      localStorage.removeItem('supabase_session');
      const guestUser = {
        email: 'invitado@treckmotors.com',
        name: 'Invitado',
        role: 'cliente' as const,
        isGuest: true
      };
      setCurrentUser(guestUser);
      localStorage.setItem('treck_user', JSON.stringify(guestUser));
      playSuccessBeep();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const handleLoginSuccess = (user: { email: string; name: string; role: 'admin' | 'cliente'; session?: { access_token?: string } }) => {
    setCurrentUser(user);
    localStorage.setItem('treck_user', JSON.stringify(user));
    if (user.session?.access_token) {
      localStorage.setItem('supabase_session', JSON.stringify({ access_token: user.session.access_token }));
    }
    playSuccessBeep();
  };
  
  // Catalog Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todo');
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'moto' | 'pieza'>('all');
  
  // Interactive Overlays
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [socialShareProduct, setSocialShareProduct] = useState<Product | null>(null);
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);

  // Review Form state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const loadCatalog = async () => {
    try {
      const data = await productsService.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading catalogue", err);
      setProducts([]);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewsService.getReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading reviews", err);
      setReviews([]);
    }
  };

  const loadCustomerOrders = async () => {
    try {
      const data = await ordersService.getOrders();
      if (Array.isArray(data)) {
        const matching = data.filter(o => o.userEmail === currentUser.email);
        setCustomerOrders(matching);
      } else {
        setCustomerOrders([]);
      }
    } catch (err) {
      console.error("Error loading customer orders", err);
      setCustomerOrders([]);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      if (data && !(data as any).error) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Error loading settings", err);
    }
  };

  const handlePublishToFacebook = async (productId: string) => {
    try {
      const fbService = await import('./services/facebook');
      const result = await fbService.postToFacebook(productId);
      if (result.success) {
        playSuccessBeep();
        alert(`✅ Publicado correctamente en Facebook.`);
      }
    } catch (err: any) {
      alert('Error al publicar: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleSubmitReview = async (productId: string) => {
    if (!newReviewComment.trim()) return;
    setIsReviewSubmitting(true);
    try {
      await reviewsService.createReview({
        productId,
        userEmail: currentUser.email,
        userName: currentUser.name,
        rating: newReviewRating,
        comment: newReviewComment.trim()
      });
      loadReviews();
      setNewReviewComment('');
      setNewReviewRating(5);
      playSuccessBeep();
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Lifecycle Syncs
  useEffect(() => {
    loadCatalog();
    loadReviews();
    loadCustomerOrders();
    loadSettings();
  }, [currentUser.email]);

  // Handler to swap user roles dynamically
  const handleSwitchUser = (email: string, name: string, role: 'admin' | 'cliente') => {
    setCurrentUser({ email, name, role });
    playSuccessBeep();
  };

  // Helper selectors
  const getProductRatingInfo = (productId: string) => {
    const prodReviews = reviews.filter(r => r.productId === productId);
    if (prodReviews.length === 0) return { avg: null, count: 0 };
    const sum = prodReviews.reduce((s, r) => s + r.rating, 0);
    return {
      avg: parseFloat((sum / prodReviews.length).toFixed(1)),
      count: prodReviews.length
    };
  };

  const categories = ['todo', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'todo' || p.category === selectedCategory;
    const matchesType = selectedProductType === 'all' || p.type === selectedProductType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-650 selection:bg-red-600">
      
      {/* Sticky Premium Header navigation */}
      <Navigation
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'my-orders') loadCustomerOrders();
          if (view === 'admin' || view === 'home') loadSettings();
        }}
        currentUser={currentUser}
          onLogout={handleLogout}
        onLoginWithGoogle={handleLoginWithGoogle}
        onSwitchUser={handleSwitchUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        contactPhone={settings?.contactPhone}
      />

      {/* Main Core Body Views switch wrapper */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* VIEW 0: SECCIÓN HOME DE CONFIANZA Y PRESTIGIO */}
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
            
            {/* HERO MOTOCICLETAS TRECK CAROUSEL HIGHLIGHT */}
            <div className="relative rounded-3xl overflow-hidden min-h-[460px] md:min-h-[520px] flex items-center bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-805 border-zinc-800 p-6 md:p-12 relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#dc2626_1px,#000_1px)] bg-[size:16px_16px]" />
              
              {/* Decorative sport motorbike image */}
              <div className="absolute right-0 bottom-0 top-0 w-[55%] hidden lg:block z-0">
                <div 
                  className="w-full h-full bg-cover bg-center scale-105" 
                  style={{ 
                    backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1000&auto=format&fit=crop&q=80')`,
                    clipPath: 'polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
              </div>

              <div className="max-w-xl space-y-6 relative z-10 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 text-red-500 text-[10px] font-mono font-bold uppercase tracking-widest border border-red-500/20">
                  <Sparkles size={11} className="animate-pulse" />
                  Sucursal Premium Cuba — Distribución Autorizada
                </div>
                
                <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tighter leading-none">
                  TRECK <span className="text-red-600">MOTORS</span> <br />
                  <span className="text-zinc-400">PASIÓN</span> EN CUBA
                </h1>
                
                <p className="font-sans text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
                  El proveedor líder en motocicletas de alta gama, repuestos originales y servicio de taller certificado. Reserva tus productos de manera digital sin pagos por adelantado y ven a retirarlos con total confianza.
                </p>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setCurrentView('catalog')}
                    className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-black tracking-tight transition-all cursor-pointer shadow-lg shadow-red-600/20 flex items-center gap-2 group hover:scale-[1.02]"
                  >
                    <span>Explorar Catálogo</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href={`tel:${settings?.contactPhone || '+53 5212 3456'}`}
                    className="px-5 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-neutral-200 hover:text-white font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Llamar al Showroom</span>
                  </a>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE DATOS DE CONFIANZA / BENEFICIOS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Garantía Real',
                  desc: 'Respaldamos cada moto y repuesto vendido en Cuba con póliza oficial de reemplazo y mantenimiento.',
                  icon: <ShieldCheck className="text-red-500" size={24} />
                },
                {
                  title: 'Reservas sin Adelanto',
                  desc: 'Reserva tus piezas o motocicleta en línea sin compromisos financieros. Paga solo al momento de la recogida.',
                  icon: <Ticket className="text-red-505 text-red-500" size={24} />
                },
                {
                  title: 'Taller Autorizado',
                  desc: 'Mecánicos calificados listos en Bayamo para instalar tus repuestos y realizar diagnósticos avanzados.',
                  icon: <Flame className="text-red-505 text-red-500" size={24} />
                },
                {
                  title: 'Entrega en Mano',
                  desc: 'Inspecciona, prueba y retira tus repuestos físicamente en nuestro showroom ubicado en Bayamo, Granma.',
                  icon: <MapPin className="text-red-505 text-red-500" size={24} />
                }
              ].map((b, idx) => (
                <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl space-y-3 hover:border-zinc-700 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center border border-red-500/10">
                    {b.icon}
                  </div>
                  <h3 className="font-sans font-black text-white text-xs uppercase tracking-wider">{b.title}</h3>
                  <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>

            {/* POR QUE CONFIAR CONTENIDO */}
            <div className="relative rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-8 sm:p-10 overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                    ¿POR QUÉ CONFIAR EN <span className="text-red-600">TRECK MOTORS</span>?
                  </h2>
                  <p className="font-sans text-xs leading-relaxed text-zinc-400">
                    Sabemos lo valioso que es tu tiempo y tus fondos en Cuba. Por eso, hemos adaptado un modelo 100% transparente: no simulamos pagos de tarjeta falsas ni intermediaciones lentas. Haces tu pedido online en 10 segundos, aseguramos tu stock en el almacén de Bayamo, y vienes a buscarlo tranquilamente pagando con tu método favorito del día (CUP, MLC, USD o Transferencia).
                  </p>
                  <p className="font-sans text-xs leading-relaxed text-zinc-400">
                    Además, contamos con un sólido equipo de soporte posventa para guiarte en el montaje o cualquier duda mecánica que surja.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { val: '1,200+', label: 'MOTOCICLETAS EN CUBA' },
                    { val: '15,000+', label: 'COMPONENTE Y PIEZAS' },
                    { val: '99%', label: 'ÍNDICE DE CONFIANZA' },
                    { val: '5+ AÑOS', label: 'DE SOPORTE LOCAL' }
                  ].map((m, idx) => (
                    <div key={idx} className="bg-black/40 border border-zinc-850 p-4 rounded-xl text-center">
                      <div className="font-mono font-black text-2xl sm:text-3xl text-red-500">{m.val}</div>
                      <div className="font-sans text-[9px] font-bold text-zinc-500 tracking-wider mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LOS MÁS VALORADOS - PRODUCT HIGHLIGHTS */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <h2 className="font-sans font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="text-red-500 fill-red-500 animate-pulse" size={14} />
                    Motos y Repuestos Destacados
                  </h2>
                  <p className="font-sans text-[10px] text-zinc-400 mt-1">Los vehículos y componentes altamente calificados para clientes exigentes en Bayamo.</p>
                </div>
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="font-sans font-black text-[10px] text-red-550 text-red-505 text-red-500 hover:text-red-400 uppercase tracking-widest cursor-pointer select-none"
                >
                  Ver Catálogo Completo &rarr;
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 border border-zinc-800 rounded-2xl">
                  <p className="text-xs text-zinc-500">Cargando destacados...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {products.slice(0, 3).map((p, pIdx) => {
                    const r = getProductRatingInfo(p.id);
                    return (
                      <motion.div 
                        key={p.id} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10px" }}
                        transition={{ duration: 0.5, delay: pIdx * 0.1, ease: "easeOut" }}
                        className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-red-600/30 transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="relative overflow-hidden aspect-video bg-zinc-950">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[8px] font-mono text-amber-500 flex items-center gap-1">
                            <Star size={9} className="fill-amber-500" />
                            <span>{r.avg || "5.0"}</span>
                            <span className="text-zinc-500">({r.count} reseñas)</span>
                          </div>
                          <span className="absolute top-2.5 right-2.5 bg-red-600 text-white font-mono font-bold text-[8px] px-2 py-0.5 rounded uppercase">
                            MLC / USD
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSocialShareProduct(p);
                            }}
                            className="absolute bottom-2.5 right-2.5 bg-black/70 hover:bg-red-600 p-2 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur border border-zinc-800"
                            title="Simular visualización en redes"
                          >
                            <Share2 size={11} />
                          </button>
                        </div>

                        <div className="p-4 space-y-3 text-left flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">{p.category}</span>
                            <h3 
                              onClick={() => setSelectedProduct(p)}
                              className="font-sans font-black text-sm text-zinc-100 hover:text-red-555 hover:text-red-500 cursor-pointer line-clamp-1 transition-colors"
                            >
                              {p.name}
                            </h3>
                            <p className="font-sans text-[11px] text-zinc-400 line-clamp-2 leading-relaxed h-8">{p.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-zinc-500 font-bold uppercase">PRECIO</span>
                              <span className="font-sans font-black text-red-500 font-mono text-sm">${p.price.toLocaleString()}</span>
                            </div>
                            
                            <button
                              onClick={() => {
                                if (settings && settings.reservationsEnabled === false) {
                                  setSelectedProduct(p);
                                } else {
                                  setBookingProduct(p);
                                }
                              }}
                              disabled={p.stock <= 0}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-sans text-[10px] font-bold transition-all cursor-pointer"
                            >
                              {p.stock <= 0 ? 'Sin existencias' : (settings && settings.reservationsEnabled === false ? 'Ver Detalles' : 'Reservar')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN GUÍA DE COMPRA */}
            <div className="bg-gradient-to-br from-neutral-905 to-neutral-950 border border-zinc-805 border-neutral-800/60 rounded-3xl p-6 sm:p-8 text-left space-y-6">
              <div>
                <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">¿CÓMO ADQUIRIR MIS MOTOS O PIEZAS EN CUBA?</h3>
                <p className="text-zinc-500 text-xs mt-1">Sigue esta sencilla guía de 3 pasos seguros:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: '01', title: 'Selecciona y Reserva', desc: 'Explora nuestro catálogo en la siguiente pestaña y solicita tu reserva en 1 segundo con tu nombre y teléfono.' },
                  { step: '02', title: 'Coordinación Inmediata', desc: 'Guardamos tu stock de almacén inmediatamente. Nuestro equipo te llama al teléfono provisto para confirmar la fecha de visita.' },
                  { step: '03', title: 'Inspección y Retiro', desc: 'Asiste a nuestro showroom certificado en Bayamo, evalúa tus piezas en mano y completa el pago en efectivo o transferencia.' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-black/45 border border-zinc-850 p-4 rounded-xl space-y-2 relative">
                    <span className="absolute top-2 right-3 font-mono font-black text-xl text-red-600/31 text-red-500/20">{s.step}</span>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wide">{s.title}</h4>
                    <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* OFICINA UBICACIÓN Y HORARIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4 text-left">
              <div className="lg:col-span-5 bg-neutral-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="font-sans font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={15} className="text-red-500" />
                    UBICACIÓN OFICIAL EN BAYAMO, CUBA
                  </h3>
                  <div className="space-y-2 bg-black/40 border border-zinc-850 p-4 rounded-xl leading-relaxed">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin size={12} className="text-red-500 shrink-0" />
                      <span>{settings?.shopAddress || "Calle General García #102, e/ Lora y Masó, Bayamo, Granma, Cuba"}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-2">
                      <Clock size={12} className="text-zinc-500 shrink-0" />
                      <span>{settings?.shopHours || "Lunes a Viernes: 8:30 AM - 5:30 PM | Sábados: 9:00 AM - 1:00 PM"}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 border border-zinc-850 p-3 rounded-xl">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wide block">TELÉFONO</span>
                    <a href={`tel:${settings?.contactPhone || '+53 5212 3456'}`} className="block text-xs font-mono font-bold text-red-500 hover:underline mt-0.5">
                      {settings?.contactPhone || '+53 5212 3456'}
                    </a>
                  </div>
                  <div className="bg-black/30 border border-zinc-850 p-3 rounded-xl truncate">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wide block">COMPROMISO CORREO</span>
                    <a href={`mailto:${settings?.contactEmail || 'cuba@treckmotors.com'}`} className="block text-xs font-sans font-bold text-red-500 hover:underline mt-0.5 truncate">
                      {settings?.contactEmail || 'cuba@treckmotors.com'}
                    </a>
                  </div>
                </div>

                {/* SOCIAL MEDIA AND DIRECT MESSAGING ICONS */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">REDES Y MENSAJERÍA AL INSTANTE</span>
                  <div className="grid grid-cols-3 gap-2">
                    <a 
                      href={settings?.facebookUrl || "https://facebook.com/treckmotorscuba"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-black/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 py-2 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-all shadow-md active:scale-95 text-center cursor-pointer"
                    >
                      <Facebook size={14} className="text-blue-500" />
                      <span className="text-[8.5px] font-bold uppercase tracking-tight">Facebook</span>
                    </a>
                    <a 
                      href={settings?.instagramUrl || "https://instagram.com/treckmotorscuba"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-black/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 py-2 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-all shadow-md active:scale-95 text-center cursor-pointer"
                    >
                      <Instagram size={14} className="text-pink-500" />
                      <span className="text-[8.5px] font-bold uppercase tracking-tight">Instagram</span>
                    </a>
                    <a 
                      href={`https://wa.me/${(settings?.whatsappNumber || "5352123456").replace(/\+/g, '').replace(/\s/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-black/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 py-2 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-all shadow-md active:scale-95 text-center cursor-pointer"
                    >
                      <MessageCircle size={14} className="text-emerald-500" />
                      <span className="text-[8.5px] font-bold uppercase tracking-tight">WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* SIMULADO MAPS CARD */}
              <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-zinc-800 relative bg-neutral-900/40 p-6 flex flex-col justify-center items-center text-center space-y-4">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,#000000_1px)] bg-[size:10px_10px]" />
                
                <MapPin className="text-red-500 animate-bounce" size={40} />
                <div className="max-w-md space-y-1.5 z-10">
                  <h4 className="font-sans font-black text-white text-base">¿Listo para visitarnos?</h4>
                  <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                    Estamos ubicados en nuestro showroom oficial de Bayamo, Granma, Cuba. Contamos con estacionamiento seguro para tu vehículo y repuestos listos para ser mostrados en mesa de examen antes de que pagues un solo centavo.
                  </p>
                </div>
                <div className="flex gap-4 z-10 pt-2">
                  <a 
                    href={`tel:${settings?.contactPhone || '+53 5212 3456'}`}
                    className="px-5 py-2.5 rounded-xl bg-red-655 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-black cursor-pointer shadow-md"
                  >
                    Llamar y Coordinar
                  </a>
                  <button 
                    onClick={() => {
                      setCurrentView('catalog');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black border border-zinc-800 text-zinc-300 hover:text-white font-sans text-xs font-bold cursor-pointer"
                  >
                    Ver Catálogo Completo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 1: CATALOGUE SHOP (PRODUCTS EN OTRA PÁGINA) */}
        {currentView === 'catalog' && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12 text-left"
          >
            
            {/* SEARCH AND FILTERS */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                    Catálogo de Motocicletas y Repuestos
                  </h2>
                  <p className="font-sans text-xs text-zinc-400 mt-1">
                    Productos premium de alta gama listos para reserva inmediata y recogida presencial en Bayamo.
                  </p>
                </div>
              </div>

              {/* FILTER BAR GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Search query box */}
                <div className="lg:col-span-4 relative flex items-center bg-black border border-zinc-800 focus-within:border-red-600 rounded-xl transition-colors">
                  <span className="pl-3 text-zinc-500">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar moto o pieza original..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none py-2.5 px-3 font-sans text-xs text-white focus:outline-none"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="pr-3 text-zinc-500 hover:text-white font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Product type filter tabs (Moto vs Pieza vs All) */}
                <div className="lg:col-span-5 flex p-1 bg-black border border-zinc-800 rounded-xl select-none">
                  {[
                    { id: 'all', name: 'Todo' },
                    { id: 'moto', name: 'Motos' },
                    { id: 'pieza', name: 'Componentes' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedProductType(tab.id as any)}
                      className={`flex-1 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                        selectedProductType === tab.id 
                          ? 'bg-zinc-900 text-white shadow-md' 
                          : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Sub-Category dropdown */}
                <div className="lg:col-span-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-black border border-zinc-805 border-zinc-800 rounded-xl px-3 py-2.5 font-sans text-xs text-zinc-300 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-zinc-950 uppercase text-[10px]">
                        {c === 'todo' ? 'Filtrar Categoría: TODO' : `Categoría: ${c}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT CATALOG GRID LISTING */}
            <div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-black/45 border border-dashed border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-3xl block">🔍</span>
                  <p className="font-sans text-xs text-zinc-400">Ningún artículo en el catálogo coincide con los filtros establecidos.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('todo');
                      setSelectedProductType('all');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-sans text-[11px] font-bold"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p, pIdx) => {
                    const r = getProductRatingInfo(p.id);
                    return (
                      <motion.div 
                        key={p.id} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10px" }}
                        transition={{ duration: 0.45, delay: Math.min((pIdx % 4) * 0.08, 0.3), ease: "easeOut" }}
                        className="bg-black/45 hover:bg-black/95 rounded-2xl border border-zinc-805 border-zinc-800 hover:border-red-650 hover:border-red-600/40 flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 group"
                      >
                        {/* Imagelink wrapper */}
                        <div className="relative aspect-square overflow-hidden bg-zinc-900 border-b border-zinc-850">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            onClick={() => setSelectedProduct(p)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Live simulator open graph social preview mockup */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSocialShareProduct(p);
                            }}
                            className="absolute bottom-2.5 right-2.5 bg-black/70 hover:bg-red-600 p-2 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur border border-zinc-800"
                            title="Simular visualización en redes"
                          >
                            <Share2 size={13} />
                          </button>
                          
                          <span className="absolute top-2.5 left-2.5 bg-zinc-950/90 border border-zinc-800 text-[10px] text-zinc-300 px-2 py-0.5 rounded uppercase font-bold tracking-tight">
                            {p.type === 'moto' ? 'MOTO' : 'PIEZA'}
                          </span>
                        </div>

                        {/* Content text */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest block leading-none">{p.category}</span>
                                {r.count > 0 ? (
                                  <div className="flex items-center gap-0.5 mt-1">
                                    <Star size={10} className="text-amber-500 fill-amber-500" />
                                    <span className="text-[9px] font-mono font-black text-amber-500">{r.avg}</span>
                                    <span className="text-[8px] text-zinc-500">({r.count})</span>
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-zinc-500 mt-1 uppercase font-mono block">★ Sin valorar</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-mono font-semibold ${p.stock <= 3 ? 'text-red-550 text-red-500' : 'text-zinc-500'}`}>
                                {p.stock <= 0 ? 'Agotado' : p.stock <= 3 ? `¡Sólo ${p.stock} u!` : `${p.stock} disp.`}
                              </span>
                            </div>

                            <h3 
                              onClick={() => setSelectedProduct(p)}
                              className="font-sans font-black text-sm text-zinc-200 group-hover:text-red-500 cursor-pointer transition-colors line-clamp-1 pt-1"
                            >
                              {p.name}
                            </h3>
                            <p className="font-sans text-[11px] text-zinc-400 line-clamp-2 h-8 leading-relaxed">
                              {p.description}
                            </p>
                          </div>

                          {/* Order actions and price display */}
                          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wide">PRECIO</span>
                              <span className="font-sans font-black text-white text-base leading-tight">${p.price.toLocaleString()}</span>
                            </div>

                            <button
                              onClick={() => {
                                if (settings && settings.reservationsEnabled === false) {
                                  setSelectedProduct(p);
                                } else {
                                  setBookingProduct(p);
                                }
                              }}
                              disabled={p.stock <= 0}
                              className={`px-4 py-2 rounded-xl font-sans text-[10px] font-extrabold cursor-pointer transition-all ${
                                p.stock <= 0 
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-none shadow-none' 
                                  : 'bg-red-600/10 hover:bg-red-600 border border-red-500/10 text-red-400 hover:text-white shadow shadow-red-500/5'
                              }`}
                            >
                              {p.stock <= 0 ? 'Sin Stock' : (settings && settings.reservationsEnabled === false ? 'Ver Detalles' : 'Reservar')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: CUSTOMER MY ORDERS OR RESERVATIONS (RESERVAS) */}
        {currentView === 'my-orders' && (
          <motion.div
            key="my-orders"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 text-left"
          >
            <div>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight">Mis Reservaciones en Cuba</h2>
              <p className="font-sans text-xs text-zinc-400 mt-1">Lista de pedidos de recogida física para el cliente: <span className="font-mono text-zinc-200 font-bold">{currentUser.email}</span></p>
            </div>

            {/* INLINE AUTH MOTIVATION BANNER */}
            {!currentUser?.isGoogleAuth ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/20 via-zinc-900 to-black border border-red-500/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#dc2626_1px,#000_1px)] bg-[size:16px_16px]" />
                <div className="relative space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-red-600/10 text-red-500 font-extrabold uppercase px-2 py-0.5 rounded font-mono border border-red-500/10">PERFIL DEMO INTERACTIVO</span>
                    <span className="text-xs text-zinc-300 font-semibold">¿Quieres usar tu cuenta real?</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Regístrate o Inicia Sesión con tu Cuenta de Google</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Vincula tu identidad oficial de Google para conservar tus reservas de motocicletas y opiniones autorizadas con total seguridad en la base de datos de la tienda.
                  </p>
                </div>
                <button
                  onClick={handleLoginWithGoogle}
                  className="relative shrink-0 py-2.5 px-4 rounded-xl bg-white text-zinc-950 hover:bg-neutral-200 text-xs font-black transition-all flex items-center justify-center gap-2 shadow shadow-white/5 cursor-pointer border border-zinc-200 self-start md:self-auto"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Vincular Cuenta de Google</span>
                </button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/20 via-zinc-900 to-black border border-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-0 flex items-center justify-center text-emerald-500 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-tight">Acceso Google Protegido</h3>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Has autenticado de forma segura tu cuenta. Tus reservas y opiniones pertenecen únicamente a: <span className="font-mono text-zinc-200 font-semibold">{currentUser.email}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogoutGoogle}
                  className="px-3 py-1.5 border border-zinc-805 border-zinc-800 text-zinc-400 hover:text-white hover:border-red-500/30 text-[10px] font-bold rounded-lg transition-all cursor-pointer self-start sm:self-auto"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}

            {customerOrders.length === 0 ? (
              <div className="text-center py-20 bg-black/40 border border-zinc-810 border-zinc-800 rounded-3xl space-y-4 max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 animate-pulse">
                  <Ticket size={20} />
                </div>
                <div className="space-y-1">
                  <p className="font-sans text-xs text-zinc-300 font-bold uppercase">No tienes reservas activas</p>
                  <p className="font-sans text-[11px] text-zinc-500 leading-relaxed">
                    Las reservas registradas se asocian a tu correo. Explora nuestro catálogo y presiona "Reservar" en cualquier producto para congelar existencias.
                  </p>
                </div>
                <button 
                  onClick={() => setCurrentView('catalog')}
                  className="px-5 py-2 rounded-xl bg-red-655 bg-red-600 text-white font-sans text-xs font-bold"
                >
                  Ver Catálogo de Productos
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                
                {/* Warning about in-store pick ups */}
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-3 text-xs text-zinc-400 leading-relaxed">
                  <Info size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-200 uppercase tracking-widest text-[10px] block mb-1">Guía para Retirar Reservas</span>
                    Dirígete a nuestro Showroom ubicado en <span className="font-semibold text-neutral-200">{settings?.shopAddress || "Calle General García #102, Bayamo"}</span> portando tu código de reserva. Estás exento de pagar por adelantado; verificas el producto en persona y completas la compra mediante el método de pago que prefieras. Horario comercial: {settings?.shopHours || "Lunes a Sábado"}.
                  </div>
                </div>

                {customerOrders.map(o => (
                  <div key={o.id} className="bg-zinc-900/60 rounded-2xl border border-zinc-805 border-zinc-800 p-5 space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block">Identificación de Reserva</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Ticket size={13} className="text-red-505 text-red-500" />
                          <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">{o.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">Estado:</span>
                        <span className="text-[9px] bg-red-600/10 text-red-500 font-black px-2.5 py-1 rounded-sm uppercase tracking-wider border border-red-500/10">
                          Recogida Física: {o.status === 'pendiente' ? 'Pendiente' : o.status}
                        </span>
                      </div>
                    </div>

                    {/* Order items detail */}
                    <div className="space-y-3">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3.5 bg-black/30 p-2.5 rounded-xl border border-zinc-850">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-lg bg-zinc-90 w-12 h-12 bg-zinc-800 border border-zinc-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-100 truncate uppercase mt-0.5">{item.name}</h4>
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1 font-mono">
                              <span>Cantidad: {item.quantity} ud.</span>
                              <span className="text-red-500 font-bold">${item.price.toLocaleString()} MLC</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Store phone click block */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400">
                      <div>
                        <div className="font-bold text-zinc-300">¿Deseas confirmar la recogida física ya?</div>
                        <div className="text-[11px] text-zinc-500">Llama directamente al showroom para agilizar tu pedido.</div>
                      </div>
                      
                      <a 
                        href={`tel:${o.phone || settings?.contactPhone || '+53 5212 3456'}`}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600/30 font-mono font-bold text-xs text-red-500 hover:text-white transition-all shadow-md shrink-0"
                      >
                        <Phone size={12} />
                        <span>Llamar Ahora</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 3: ADMINISTRATIVE PRIVILEGE VIEW CONTAINER */}
        {currentView === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-left"
          >
            {currentUser.role === 'admin' ? (
              <AdminPanel currentAdminEmail={currentUser.email} />
            ) : (
              <div className="max-w-md mx-auto text-center py-16 space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-900/10">
                  <ShieldAlert size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-xl text-white uppercase tracking-tight">Acceso Restringido</h3>
                  <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                    Tu dirección de correo actual (<span className="text-white font-semibold font-mono">{currentUser.email}</span>) no tiene permisos de administrador registrados para esta tienda.
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-400 space-y-3">
                  <p>
                    💡 <span className="font-bold text-red-400">¿Deseas evaluar el panel de administración?</span> Es muy sencillo: desliza el puntero de tu cursor sobre el selector de perfil en la barra superior (Nav) y cámbiate a:
                  </p>
                  <p className="font-bold text-white uppercase font-mono bg-black rounded p-2 text-[10px] border border-zinc-800">
                    🔑 Annier FQ (Admin)
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="px-6 py-2.5 bg-red-600 hover:bg-gradient-to-r from-red-600 to-red-700 text-white font-bold font-sans text-xs rounded-xl shadow-lg shadow-red-900/15"
                >
                  Volver al Catálogo
                </button>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* DYNAMIC PRODUCT DETAIL SPEC MODAL COMPONENT */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-40 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-y-auto max-h-[92vh] shadow-2xl custom-scrollbar flex flex-col font-sans"
            >
              {/* Layout detail header */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 shrink-0 relative text-left">
                {/* Close modal */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center font-bold text-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                >
                  &times;
                </button>

                {/* Left Product media */}
                <div className="md:col-span-5 relative aspect-square bg-zinc-955 rounded-2xl overflow-hidden border border-zinc-800">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-3 left-3 bg-red-600 text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded-md uppercase border border-red-700/30">
                    Soporte Cuba
                  </span>
                </div>

                {/* Right detailed specifications */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/10">
                      Motor de Rendimiento Original {selectedProduct.category}
                    </span>
                    <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight leading-snug">
                      {selectedProduct.name}
                    </h2>
                    
                    {/* Status stock info */}
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-bold uppercase ${selectedProduct.stock > 0 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10' : 'text-red-500 bg-red-500/10 border-red-500/10'} px-2 py-0.5 rounded border`}>
                        {selectedProduct.stock > 0 ? 'En Almacén Cuba' : 'Agotado'}
                      </span>
                      <span className="text-[10.5px] font-medium text-zinc-400">
                        ({selectedProduct.stock} unidades disponibles para reserva)
                      </span>
                    </div>

                    <p className="font-sans text-[11.5px] text-zinc-400 leading-relaxed pt-1.5">
                      {selectedProduct.description}
                    </p>

                    {/* Features list */}
                    {selectedProduct.features && selectedProduct.features.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block">Especificaciones Técnicas:</span>
                        <div className="grid grid-cols-2 gap-1.5 font-sans text-[10.5px] text-zinc-350 text-zinc-300">
                          {selectedProduct.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 truncate">
                              <Check size={11} className="text-red-500 shrink-0" />
                              <span className="truncate">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions reservation footer inside dialog */}
                  <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Monto Reserva Física</span>
                      <span className="font-sans font-black text-red-500 text-lg font-mono">
                        ${selectedProduct.price.toLocaleString()} MLC / USD
                      </span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setSocialShareProduct(selectedProduct);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-sans text-xs font-black transition-all cursor-pointer border border-zinc-700 flex items-center justify-center gap-1.5 shadow-lg shadow-black/10 w-full sm:w-auto"
                      >
                        <Share2 size={13} className="text-red-500" />
                        <span>Compartir</span>
                      </button>

                      {currentUser.role === 'admin' && settings?.facebookPageId && (
                        <button
                          onClick={() => handlePublishToFacebook(selectedProduct.id)}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-black transition-all cursor-pointer border border-blue-700 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/15 w-full sm:w-auto"
                        >
                          <Facebook size={13} />
                          <span>Publicar en FB</span>
                        </button>
                      )}

                      {settings && settings.reservationsEnabled === false ? (
                        <div className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-[11px] text-zinc-300 w-full sm:max-w-xs">
                          <span className="font-black text-red-500 block">⚠️ RESERVAS ONLINE PAUSADAS</span>
                          Para reservar este artículo, contáctenos en <span className="font-mono text-white text-xs">{settings.contactPhone}</span>.
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setBookingProduct(selectedProduct);
                            setSelectedProduct(null);
                          }}
                          disabled={selectedProduct.stock <= 0}
                          className="px-6 py-2.5 rounded-xl bg-red-655 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-sans text-xs font-black transition-all cursor-pointer shadow-lg shadow-red-600/15 w-full sm:w-auto"
                        >
                          {selectedProduct.stock <= 0 ? 'Sin existencias' : 'Reservar para Recogida'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* REVIEWS SEGMENT */}
              <div className="p-6 sm:p-8 bg-zinc-950/85 space-y-6 text-left shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
                  <div className="space-y-1">
                    <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">Valoraciones de la Comunidad</h4>
                    <p className="text-[10px] text-zinc-400 font-sans">Opiniones técnicas y experiencias de uso aportadas por mecánicos y aficionados.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 shrink-0">
                    <Star className="text-amber-500 fill-amber-500" size={14} />
                    <span className="font-mono text-xs font-black text-amber-500">
                      {getProductRatingInfo(selectedProduct.id).avg !== null ? getProductRatingInfo(selectedProduct.id).avg : '5.0'}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-sans">({getProductRatingInfo(selectedProduct.id).count} reseñas)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Reviews lists columns */}
                  <div className="lg:col-span-7 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {reviews.filter(r => r.productId === selectedProduct.id).length === 0 ? (
                      <div className="text-center py-12 space-y-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                        <Star size={20} className="text-zinc-700 mx-auto" />
                        <p className="text-[10px] text-zinc-500 font-sans">Este producto aún no cuenta con reseñas escritas. ¡Añade tu opinión abajo!</p>
                      </div>
                    ) : (
                      reviews.filter(r => r.productId === selectedProduct.id).map(rev => (
                        <div key={rev.id} className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/40 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="text-[11px] font-bold text-zinc-200 truncate">{rev.userName}</div>
                              <div className="text-[9px] text-zinc-500 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map(st => (
                                <Star 
                                  key={st} 
                                  size={9} 
                                  className={st <= rev.rating ? "text-amber-500 fill-amber-500 font-black" : "text-zinc-700"} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="font-sans text-[11px] text-zinc-350 leading-relaxed text-zinc-305">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add review form column */}
                  <div className="lg:col-span-5 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-1">
                      <h5 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">Añadir tu Opinión Técnica</h5>
                      <p className="text-[10px] text-zinc-500">Compón una valoración pública sincera para orientar a otros compradores.</p>
                    </div>

                    <div className="space-y-3.5">
                      {/* Rating selection stars */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400">Puntaje estrellas:</span>
                        <div className="flex gap-1 select-none">
                          {[1, 2, 3, 4, 5].map(sc => (
                            <button
                              key={sc}
                              onClick={() => setNewReviewRating(sc)}
                              className="text-zinc-600 hover:scale-110 active:scale-90 transition-all cursor-pointer font-black shrink-0"
                            >
                              <Star size={16} className={sc <= newReviewRating ? "text-amber-500 fill-amber-500" : "text-zinc-700 hover:text-amber-500/60"} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <textarea
                        required
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Ej. Excelente compresión de cilindro en Ducati, encajó perfectamente en Bayamo..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 font-sans text-xs text-zinc-300 focus:outline-none focus:border-red-500 h-20 resize-none"
                      />

                      <button
                        onClick={() => handleSubmitReview(selectedProduct.id)}
                        disabled={isReviewSubmitting || !newReviewComment.trim()}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-sans text-xs font-bold rounded-xl cursor-pointer shadow-md select-none transition-all flex items-center justify-center gap-2"
                      >
                        {isReviewSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={11} />
                            <span>Enviar Reseña Autorizada</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER ACTIVE RESERVATION MODAL OVERLAY */}
      <AnimatePresence>
        {bookingProduct && (
          <ReservationModal
            product={bookingProduct}
            userEmail={currentUser.email}
            userName={currentUser.name}
            contactPhone={settings?.contactPhone || '+53 5212 3456'}
            contactEmail={settings?.contactEmail || 'cuba@treckmotors.com'}
            shopAddress={settings?.shopAddress || 'Calle General García #102, e/ Lora y Masó, Bayamo, Granma, Cuba'}
            shopHours={settings?.shopHours || 'Lunes a Viernes: 8:30 AM - 5:30 PM | Sábados: 9:00 AM - 1:00 PM'}
            onSuccess={(newOrder) => {
              setCustomerOrders(prev => [newOrder, ...prev]);
              setBookingProduct(null);
              setCurrentView('my-orders');
            }}
            onClose={() => setBookingProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* RENDER SOCIAL OPEN GRAPH SIMULATOR */}
      <AnimatePresence>
        {socialShareProduct && (
          <SocialPreviewMockup
            product={socialShareProduct}
            onClose={() => setSocialShareProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* RENDER AUTH MODAL OVERLAY */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            onClose={() => setIsAuthOpen(false)}
            onSuccess={(user) => {
              handleLoginSuccess(user);
              setIsAuthOpen(false);
            }}
            onLoginWithGoogle={() => {
              handleLoginWithGoogle();
              setIsAuthOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Foot Footer info bar */}
      <footer className="bg-neutral-950/40 p-6 text-center border-t border-neutral-900 text-[11px] text-neutral-550 text-neutral-500 mt-12 space-y-1 select-none">
        <p>© 2026 Treck Motors Cuba - Subcursal Oficial. Todos los derechos reservados.</p>
        <p className="text-[9px]">Garantía oficial certificada para distribución física en todo el territorio nacional.</p>
      </footer>
    </div>
  );
}

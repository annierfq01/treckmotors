import React from 'react';
import { LogOut, User, Shield, Compass, RotateCcw, Home, PhoneCall, ChevronDown, UserPlus, LogIn, Settings } from 'lucide-react';
import { Product } from '../types';
import TreckLogo from './TreckLogo';

interface NavigationProps {
  currentView: 'home' | 'catalog' | 'admin' | 'my-orders';
  onNavigate: (view: 'home' | 'catalog' | 'admin' | 'my-orders') => void;
  currentUser: { email: string; name: string; role: 'admin' | 'cliente'; isGoogleAuth?: boolean; photoURL?: string; isGuest?: boolean } | null;
  onLogout: () => void;
  onLoginWithGoogle: () => void;
  onOpenAuth: () => void;
  contactPhone?: string;
}

export default function Navigation({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  onLoginWithGoogle,
  onOpenAuth,
  contactPhone = "+53 5212 3456"
}: NavigationProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigateClick = (view: 'home' | 'catalog' | 'admin' | 'my-orders') => {
    onNavigate(view);
    setDropdownOpen(false);
  };

  const isGuest = !currentUser || currentUser.isGuest;

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => handleNavigateClick('home')}
            className="flex items-center gap-2 cursor-pointer group select-none mr-2"
          >
            <div className="flex items-center hover:opacity-95 active:scale-98 transition-all">
              <TreckLogo className="h-8 sm:h-9 w-auto" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleNavigateClick('home')}
              className={`px-4 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'home' 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Home size={13} className="inline" />
              Inicio
            </button>
            <button
              onClick={() => handleNavigateClick('catalog')}
              className={`px-4 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'catalog' 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Compass size={13} className="inline" />
              Catálogo
            </button>
            <button
              onClick={() => handleNavigateClick('my-orders')}
              className={`px-4 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'my-orders' 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <RotateCcw size={13} className="inline" />
              Mis Reservas
            </button>
            
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleNavigateClick('admin')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                    : 'text-zinc-400 hover:text-red-500'
                }`}
              >
                <Shield size={13} className="inline" />
                Administración
              </button>
            )}
          </div>

          {/* User Profile & Brand Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Click Activated Dropdown container */}
            <div className="relative font-sans" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex bg-zinc-900/90 hover:bg-zinc-850 active:scale-98 border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl px-3 py-2 items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none"
              >
                {currentUser?.isGoogleAuth && currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Perfil" 
                    className="w-5 h-5 rounded-full border border-emerald-500 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-inner ${
                    isGuest ? 'bg-zinc-800 text-zinc-400' : currentUser?.role === 'admin' ? 'bg-red-655 bg-red-600' : 'bg-zinc-700'
                  }`}>
                    {isGuest ? 'I' : currentUser?.name[0].toUpperCase()}
                  </div>
                )}
                
                <div className="text-left leading-none max-w-[110px] hidden sm:block">
                  <div className="font-extrabold text-[10.5px] text-zinc-100 truncate">
                    {currentUser ? currentUser.name : 'Invitado'}
                  </div>
                  <div className="text-[8.5px] text-zinc-500 mt-0.5 truncate">
                    {isGuest ? 'Modo Visita' : currentUser?.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </div>
                </div>

                <ChevronDown size={12} className={`text-zinc-500 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Overlay body */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full pt-2 w-72 transition-all z-50">
                  <div className="bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3.5">
                    
                    {/* User Info Header block */}
                    <div className="bg-zinc-900/65 rounded-xl p-3 border border-zinc-900 flex items-center gap-3">
                      {currentUser?.isGoogleAuth && currentUser?.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full border border-emerald-500/50" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full text-white font-black flex items-center justify-center text-sm shadow-md ${
                          isGuest ? 'bg-zinc-800 text-zinc-500' : currentUser?.role === 'admin' ? 'bg-red-600' : 'bg-zinc-700'
                        }`}>
                          {isGuest ? '?' : currentUser?.name[0].toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white truncate leading-tight">
                          {isGuest ? 'Usuario Invitado' : currentUser?.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {isGuest ? 'Regístrate para reservar' : currentUser?.email}
                        </div>
                        <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase mt-1 border ${
                          isGuest 
                            ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700/20' 
                            : currentUser?.role === 'admin' 
                            ? 'bg-red-600/10 text-red-500 border-red-500/25' 
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                        }`}>
                          {isGuest ? 'Invitado' : currentUser?.role}
                        </span>
                      </div>
                    </div>

                    {/* Classic Options block */}
                    <div className="space-y-1">
                      
                      {isGuest ? (
                        // Not Logged In Options
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onOpenAuth();
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-white bg-red-655 bg-red-600 hover:bg-red-700 flex items-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-red-600/15"
                          >
                            <LogIn size={13} className="shrink-0" />
                            <span>Iniciar Sesión</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onOpenAuth();
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-900 flex items-center gap-2.5 transition-all cursor-pointer border border-zinc-850 hover:border-zinc-800 mt-1.5"
                          >
                            <UserPlus size={13} className="shrink-0 text-red-500" />
                            <span>Registrar Cuenta</span>
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onLoginWithGoogle();
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl text-[11px] font-black text-zinc-900 bg-white hover:bg-zinc-100 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1.5 border border-zinc-200 shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Ingresar con Google</span>
                          </button>
                        </>
                      ) : (
                        // Standard Logged In Options
                        <>
                          <button
                            onClick={() => handleNavigateClick('my-orders')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-900 flex items-center gap-2.5 transition-all cursor-pointer"
                          >
                            <RotateCcw size={13} className="shrink-0 text-zinc-400" />
                            <span>Mis Reservaciones</span>
                          </button>

                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => handleNavigateClick('admin')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-900 flex items-center gap-2.5 transition-all cursor-pointer"
                            >
                              <Shield size={13} className="shrink-0 text-red-500" />
                              <span>Panel Administrativo</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/10 flex items-center gap-2.5 transition-all cursor-pointer mt-1"
                          >
                            <LogOut size={13} className="shrink-0" />
                            <span>Cerrar Sesión</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="text-[8px] text-zinc-500 leading-normal text-center border-t border-zinc-900/60 pt-3 select-none">
                      {isGuest 
                        ? 'Registra una cuenta de cliente oficial o utiliza Google para realizar reservas.' 
                        : 'Sesión iniciada con éxito en Treck Motors Cuba.'}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* In-store Contact Badge */}
            <a 
              href={`tel:${contactPhone}`}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-red-600/30 text-[10px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg select-none"
            >
              <PhoneCall size={11} className="text-red-505 text-red-500 shrink-0" />
              <span>{contactPhone}</span>
            </a>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation rail headers (small screen fallbacks) */}
      <div className="md:hidden flex h-11 border-t border-zinc-900 bg-zinc-950 text-xs font-bold text-zinc-400 select-none">
        <button 
          onClick={() => handleNavigateClick('home')}
          className={`flex-1 flex items-center justify-center gap-1.5 border-r border-zinc-900/60 ${currentView === 'home' ? 'text-white bg-zinc-900/20' : ''}`}
        >
          <Home size={12} />
          Inicio
        </button>
        <button 
          onClick={() => handleNavigateClick('catalog')}
          className={`flex-1 flex items-center justify-center gap-1.5 border-r border-zinc-900/60 ${currentView === 'catalog' ? 'text-white bg-zinc-900/20' : ''}`}
        >
          <Compass size={12} />
          Catálogo
        </button>
        <button 
          onClick={() => handleNavigateClick('my-orders')}
          className={`flex-1 flex items-center justify-center gap-1.5 border-r border-zinc-900/60 ${currentView === 'my-orders' ? 'text-white bg-zinc-900/20' : ''}`}
        >
          <RotateCcw size={12} />
          Reservas
        </button>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => handleNavigateClick('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-red-500 bg-red-500/5 ${currentView === 'admin' ? 'text-white bg-red-650' : ''}`}
          >
            <Shield size={12} />
            Admin
          </button>
        )}
      </div>
    </nav>
  );
}

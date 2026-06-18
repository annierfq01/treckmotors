import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User, Shield, Info, LogIn, AlertCircle } from 'lucide-react';
import * as authService from '../services/auth';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: { email: string; name: string; role: 'admin' | 'cliente'; isGoogleAuth?: boolean }) => void;
  onLoginWithGoogle: () => void;
}

export default function AuthModal({ onClose, onSuccess, onLoginWithGoogle }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'cliente' | 'admin'>('cliente');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (!isLogin && !name)) {
      setError('Por favor, rellene todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    try {
      const data = isLogin
        ? await authService.login(email, password)
        : await authService.register(email, name, password, role);

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header inside card */}
        <div className="p-6 pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-red-500">CONEXIÓN OFICIAL</span>
          </div>
          <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
            {isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta'}
          </h3>
          <p className="font-sans text-xs text-zinc-400 mt-1">
            {isLogin 
              ? 'Accede a tus pedidos y configuraciones de Treck Motors.' 
              : 'Únete hoy para gestionar reservas y valoraciones originales.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tabs switch */}
          <div className="grid grid-cols-2 bg-black border border-zinc-850 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isLogin ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isLogin ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Form Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-xs text-red-400"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Nombre Completo</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Annier FQ"
                    className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono font-bold">Correo Electrónico</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono font-bold">Contraseña</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl bg-red-655 bg-red-650 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/15 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <LogIn size={14} />
            <span>{loading ? 'Procesando...' : isLogin ? 'Ingresar Ahora' : 'Confirmar Registro'}</span>
          </button>

          {/* Google Sign-in Alternative */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="flex-shrink mx-4 text-[9px] text-zinc-550 text-zinc-300 font-bold uppercase font-mono">O continúa con</span>
            <div className="flex-grow border-t border-zinc-900"></div>
          </div>

          <button
            type="button"
            onClick={() => {
              onLoginWithGoogle();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-white text-zinc-950 hover:bg-neutral-200 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Iniciar con Google</span>
          </button>
        </form>

        <div className="p-4 bg-zinc-950 font-sans border-t border-zinc-900/50 flex gap-2 text-[9.5px] text-zinc-500">
          <Info size={14} className="shrink-0 text-red-500" />
          <p>
            Tus datos de acceso están encriptados y protegidos por las políticas de seguridad de Treck Motors Cuba.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

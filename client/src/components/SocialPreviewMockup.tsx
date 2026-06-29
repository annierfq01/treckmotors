import React, { useState } from 'react';
import { Product } from '../types';
import { Share2, Check, Copy, MessageSquare, Twitter, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessBeep } from '../utils/audio';

interface SocialPreviewMockupProps {
  product: Product;
  onClose: () => void;
}

export default function SocialPreviewMockup({ product, onClose }: SocialPreviewMockupProps) {
  const [copied, setCopied] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<'whatsapp' | 'twitter' | 'facebook'>('whatsapp');
  
  const productUrl = `${window.location.origin}/producto/${product.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    playSuccessBeep();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReal = () => {
    if (activeNetwork === 'whatsapp') {
      const text = `Mira este increíble producto en Treck Motors Cuba: *${product.name}*\n${product.description}\n\nPrecios y detalles aquí:\n${productUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (activeNetwork === 'twitter') {
      const text = `Mira lo nuevo en Treck Motors Cuba: ${product.name} 🏁🇨🇺`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`, '_blank');
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-start justify-center pt-8 pb-8 px-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950/50 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <h3 className="font-sans font-medium text-lg text-white">Generador y Vista Previa Social</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700/80 p-2 rounded-lg transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="font-sans text-xs text-neutral-400 leading-relaxed">
            Nuestro servidor Express intercepta el enlace del producto e inyecta dinámicamente etiquetas 
            <span className="text-red-500 font-mono"> Open Graph </span> y 
            <span className="text-red-500 font-mono"> Twitter Cards</span>. Al compartir este enlace en redes sociales, los chats y plataformas leerán la imagen del producto, título y descripción directamente.
          </p>

          {/* Copy Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800/60">
            <span className="font-mono text-xs text-red-500 bg-red-500/10 px-2.5 py-1.5 rounded truncate select-all flex-1 text-center sm:text-left">
              {productUrl}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-sans text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShareReal}
                className="flex-1 sm:flex-initial px-4 py-1.5 rounded-lg bg-red-655 bg-red-600 hover:bg-red-700 text-white font-sans text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold shadow-lg shadow-red-600/15"
              >
                <Share2 size={14} />
                <span>Compartir Real</span>
              </button>
            </div>
          </div>

          {/* Network Selector Tabs */}
          <div className="flex gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800/40">
            <button
              onClick={() => setActiveNetwork('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-sans text-xs font-semibold transition-all cursor-pointer ${
                activeNetwork === 'whatsapp' 
                  ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare size={14} />
              <span>WhatsApp / Chat</span>
            </button>
            <button
              onClick={() => setActiveNetwork('twitter')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-sans text-xs font-semibold transition-all cursor-pointer ${
                activeNetwork === 'twitter' 
                  ? 'bg-sky-600/10 text-sky-400 border border-sky-500/20' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Twitter size={14} />
              <span>X / Twitter</span>
            </button>
            <button
              onClick={() => setActiveNetwork('facebook')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-sans text-xs font-semibold transition-all cursor-pointer ${
                activeNetwork === 'facebook' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Facebook size={14} />
              <span>Facebook</span>
            </button>
          </div>

          {/* Live Mockups with AnimatePresence */}
          <div className="bg-neutral-950/50 rounded-2xl p-4 md:p-6 border border-neutral-800/80 flex justify-center items-center">
            <AnimatePresence mode="wait">
              {activeNetwork === 'whatsapp' && (
                <motion.div
                  key="whatsapp"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[#0b141a] rounded-xl max-w-sm w-full border border-neutral-800 overflow-hidden shadow-xl"
                >
                  <div className="bg-[#1f2c34] px-4 py-2 flex items-center gap-2 text-white/50 text-[10px]">
                    <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-[8px]">TM</span>
                    <div>
                      <div className="text-white font-medium text-xs">Soporte Treck Motors</div>
                      <div>en línea</div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0b141a] space-y-2">
                    <div className="bg-[#202c33] text-white p-2 rounded-lg rounded-tl-none text-xs inline-block max-w-[85%] shadow">
                      Mira este producto que encontré en Treck Motors Cuba, es espectacular 🏁⭐
                    </div>
                    
                    {/* Rich Link Card Mockup */}
                    <div 
                      onClick={handleShareReal}
                      className="bg-[#111b21] hover:bg-[#1a242a] border-l-4 border-emerald-500 p-2.5 rounded-lg max-w-[90%] float-left shadow-md cursor-pointer transition-colors"
                    >
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-0.5">
                        Treck Motors Cuba
                      </div>
                      <div className="text-xs font-bold text-[#e9edef] truncate mb-1">
                        {product.name}
                      </div>
                      
                      <div className="relative aspect-video rounded-md overflow-hidden bg-neutral-900 border border-neutral-800/50 mb-1.5">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 bg-red-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded shadow">
                          ${product.price.toLocaleString()} {product.currency || 'USD'}
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-[#8696a0] line-clamp-2 leading-relaxed mb-1">
                        {product.description}
                      </p>
                      <span className="text-[9px] text-[#8696a0] font-mono select-none">
                        {window.location.host}/producto/{product.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeNetwork === 'twitter' && (
                <motion.div
                  key="twitter"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="bg-black text-white rounded-xl border border-neutral-800 max-w-sm w-full p-4 shadow-xl font-sans"
                >
                  <div className="flex gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white">TM</div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        <span>Treck Motors Cuba</span>
                        <span className="text-sky-400">☑</span>
                        <span className="text-neutral-500 font-normal">@TreckMotorsCuba</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">Acabo de encontrar esta joya en la tienda virtual de Treck Motors Cuba. ¡Los precios en MLC y repuestos originales son increíbles! 🔥🔥🏁</div>
                    </div>
                  </div>

                  {/* Summary Card Large Image Twitter Mockup */}
                  <div 
                    onClick={handleShareReal}
                    className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950 cursor-pointer"
                  >
                    <div className="aspect-video relative bg-neutral-900">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] text-neutral-500 font-mono mb-0.5">{window.location.host}</div>
                      <div className="text-xs font-bold font-sans text-neutral-200 line-clamp-1">{product.name}</div>
                      <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{product.description}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeNetwork === 'facebook' && (
                <motion.div
                  key="facebook"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[#18191a] text-[#e4e6eb] rounded-xl border border-neutral-800 max-w-sm w-full shadow-xl font-sans"
                >
                  <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-xs text-white">TM</div>
                    <div>
                      <div className="font-bold text-xs">Treck Motors Cuba - Sucursal Oficial</div>
                      <div className="text-[9px] text-[#b0b3b8]">Publicado por Admin • Hace 2 min</div>
                    </div>
                  </div>
                  <div className="px-3 pb-3 text-xs">
                    ¡Tenemos existencias disponibles de {product.name} en Bayamo! Facilidades para reservas físicas en todo el territorio nacional. 🛒🏁
                  </div>
                  
                  {/* FB Preview Card */}
                  <div 
                    onClick={handleShareReal}
                    className="border-t border-b border-neutral-800 bg-[#242526] cursor-pointer"
                  >
                    <div className="aspect-video relative bg-neutral-900">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] text-[#b0b3b8] uppercase font-mono">{window.location.host.toUpperCase()}</div>
                      <div className="text-xs font-bold text-white mt-0.5 line-clamp-1">{product.name}</div>
                      <div className="text-[10px] text-[#b0b3b8] line-clamp-1 mt-0.5">{product.description}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950/50 border-t border-neutral-800/80 flex justify-end gap-2 text-xs text-neutral-400 font-sans">
          <span>Servidor SEO Dinámico:</span>
          <span className="text-emerald-400 font-semibold font-mono font-bold animate-pulse">ACTIVO</span>
        </div>
      </motion.div>
    </div>
  );
}

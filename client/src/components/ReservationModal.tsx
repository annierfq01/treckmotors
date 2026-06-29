import React, { useState } from 'react';
import { Product, Order, OrderItem } from '../types';
import { Landmark, Wallet, ShieldCheck, CheckCircle2, Ticket, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessBeep } from '../utils/audio';
import * as ordersService from '../services/orders';

interface ReservationModalProps {
  product: Product;
  userEmail: string;
  userName: string;
  onSuccess: (order: Order) => void;
  onClose: () => void;
  contactPhone: string;
  contactEmail: string;
  shopAddress: string;
  shopHours: string;
}

export default function ReservationModal({
  product,
  userEmail,
  userName,
  onSuccess,
  onClose,
  contactPhone,
  contactEmail,
  shopAddress,
  shopHours
}: ReservationModalProps) {
  const [customerName, setCustomerName] = useState(userName || '');
  const [customerEmail, setCustomerEmail] = useState(userEmail || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); // optionally used as Notes
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [processing, setProcessing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      alert("Por favor, ingresa tu teléfono para poder coordinar la recogida física.");
      return;
    }

    setProcessing(true);

    // Simulated short delay for registration
    setTimeout(async () => {
      const orderItems: OrderItem[] = [{
        id: `ord-item-0-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }];

      // Create Reservation Order Payload
      const orderPayload: Partial<Order> = {
        userEmail: customerEmail,
        userName: customerName,
        items: orderItems,
        total: product.price,
        paymentMethod: selectedMethod,
        status: 'pendiente', // physical pick-up is pending
        shippingAddress: customerAddress || `Recogida física en Showroom, ${shopAddress}`,
        phone: customerPhone
      };

      try {
        const data = await ordersService.createOrder(orderPayload as any);
        setCreatedOrder(data);
        setFinished(true);
        playSuccessBeep();
      } catch (err) {
        console.error("Failed to create reservation", err);
        alert("No se pudo registrar la reserva. Inténtalo de nuevo.");
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        {!finished ? (
          <motion.div
            key="reserve-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 font-sans text-neutral-200"
          >
            {/* Left Column: Product Info & Store guide */}
            <div className="lg:col-span-5 bg-neutral-950 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-800/80">
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/10">
                    Reserva Física en Cuba 🇨🇺
                  </span>
                  <h3 className="font-sans font-black text-xl text-white mt-3 leading-tight">Resumen de tu Reserva</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-1">Asegura tu artículo online; compras físicamente en tienda.</p>
                </div>

                {/* Main Product Selection Card */}
                <div className="flex items-center gap-3.5 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/50">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-14 h-14 rounded-lg object-cover bg-neutral-800 border border-neutral-700/50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-neutral-100 truncate uppercase tracking-wider">{product.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">Categoría: {product.category}</span>
                    <div className="flex items-center justify-between text-xs text-neutral-300 mt-1 font-bold">
                      <span>Precio:</span>
                      <span className="text-red-500 font-mono">${product.price.toLocaleString()} {product.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>

                {/* Showroom Physical coordinates */}
                <div className="p-4 bg-neutral-900/40 border border-neutral-800/40 rounded-xl space-y-2.5 text-xs text-neutral-400">
                  <div className="font-bold text-neutral-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <MapPin size={12} className="text-red-500" />
                    <span>Showroom Treck Motors Cuba</span>
                  </div>
                  <div className="leading-relaxed">
                    <p className="text-neutral-300 font-medium">{shopAddress}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{shopHours}</p>
                  </div>
                  <div className="pt-2 border-t border-neutral-850 text-[10px] text-zinc-500 italic">
                    Puedes contactarnos llamando al <span className="font-semibold text-neutral-300">{contactPhone}</span> para respuestas urgentes.
                  </div>
                </div>
              </div>

              {/* Physical Booking Guidelines */}
              <div className="pt-6 border-t border-neutral-800/80 mt-6 lg:mt-0 space-y-3">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Garantía de stock reservado</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">CERTIFICADO</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xs text-neutral-300 font-medium">Monto a abonar en tienda</span>
                  <span className="text-xl font-black font-sans text-red-500 font-mono">
                    ${product.price.toLocaleString()} {product.currency || 'USD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Info Entry */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="font-sans font-extrabold text-lg text-white">Completa tus datos de Reserva</h3>
                  <p className="font-sans text-xs text-neutral-400">Introduce lo requerido para registrar tu orden de recogida física.</p>
                </div>

                {/* Fields details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 mb-1">TU NOMBRE COMPLETO</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Sofía Medina"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">TELÉFONO DE CONTACTO CUBA</label>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej: +53 5212 3456"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">CORREO ELECTRÓNICO</label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Ej: tu-correo@gmail.com"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 mb-1">MÉTODO PREFERIDO DE PAGO EN TIENDA</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('cash')}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          selectedMethod === 'cash'
                            ? 'bg-red-500/10 border-red-500 text-red-500'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Wallet size={14} />
                        <span>Efectivo (USD/CUP/EUR)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('bank_transfer')}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          selectedMethod === 'bank_transfer'
                            ? 'bg-red-500/10 border-red-500 text-red-500'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Landmark size={14} />
                        <span>Transferencia CUP/MLC</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 mb-1">NOTAS O COMENTARIOS ADICIONALES (OPCIONAL)</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Ej: Pasaríais a recogerla el próximo lunes por la tarde, o requiere embalaje especial..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors h-16 resize-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-red-500/5 text-[10.5px] text-zinc-400 border border-red-500/10 rounded-xl leading-relaxed flex gap-2">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p>
                    <span className="font-bold text-zinc-300">Aviso:</span> Esta reserva te asiste congelando el precio y stock durante un lapso de 5 días hábiles. El pago definitivo se efectúa en persona después de evaluar físicamente el producto en nuestra sede principal de Bayamo.
                  </p>
                </div>

                {/* Actions buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800/60">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl font-sans text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Salir
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer select-none transition-all"
                  >
                    {processing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registrando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Confirmar Solicitud de Reserva</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          /* Success Screen */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 md:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="font-sans font-extrabold text-2xl text-white">¡Reserva Registrada!</h3>
              <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                Hemos bloqueado el stock para ti con éxito. Visítanos en nuestra oficina física de Bayamo para retirar y finiquitar tu compra.
              </p>
            </div>

            {/* Booking Slip Card */}
            {createdOrder && (
              <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 text-left space-y-2 font-mono text-[11px] text-neutral-400">
                <div className="flex justify-between items-center border-b border-neutral-800/60 pb-1.5 uppercase font-black text-white text-[10px]">
                  <span>RESERVA CÓDIGO</span>
                  <span className="text-red-500">{createdOrder.id}</span>
                </div>
                <div><span className="text-zinc-500 font-sans">CLIENTE:</span> <span className="font-bold text-zinc-300 font-sans">{customerName}</span></div>
                <div><span className="text-zinc-500 font-sans">PRODUCTO:</span> <span className="font-bold text-zinc-300 font-sans truncate block">{product.name}</span></div>
                <div><span className="text-zinc-500 font-sans">RECIBO FISCAL:</span> <span className="text-red-500 font-bold">${createdOrder.total.toLocaleString()} MLC / USD</span></div>
                <div className="pt-1.5 border-t border-neutral-850 text-[10px] leading-relaxed font-sans text-zinc-500">
                  <span className="font-bold text-zinc-400 block mb-0.5">📍 Sucursal Showroom:</span>
                  {shopAddress}
                </div>
              </div>
            )}

            <div className="pt-2 text-xs text-neutral-500 flex items-center justify-center gap-1">
              <Sparkles size={11} className="text-red-500 shrink-0" />
              <span>Código guardado en tu panel personal de reservas.</span>
            </div>

            <button
              onClick={() => {
                if (createdOrder) {
                  onSuccess(createdOrder);
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/15 cursor-pointer mt-2"
            >
              Cerrar y Ver Mis Reservas
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { Product, SystemSettings, Order, OrderItem } from '../types';
import { CreditCard, Landmark, Truck, Wallet, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessBeep } from '../utils/audio';
import * as settingsService from '../services/settings';
import * as ordersService from '../services/orders';

interface PaymentGatewayProps {
  items: { product: Product; quantity: number }[];
  total: number;
  userEmail: string;
  userName: string;
  shippingAddress: string;
  phone: string;
  onSuccess: (order: Order) => void;
  onClose: () => void;
}

export default function PaymentGateway({
  items,
  total,
  userEmail,
  userName,
  shippingAddress,
  phone,
  onSuccess,
  onClose
}: PaymentGatewayProps) {
  // Config state loaded from backend settings
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('credit_card');
  const [processing, setProcessing] = useState(false);
  const [paymentFinished, setPaymentFinished] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocused, setCardFocused] = useState<'front' | 'back'>('front');

  // Bank Transfer Form State
  const [bankRef, setBankRef] = useState('');

  useEffect(() => {
    settingsService.getSettings()
      .then((data: SystemSettings) => {
        setSettings(data);
        if (data.paymentsEnabled) {
          const firstEnabled = data.paymentMethods.find(m => m.enabled);
          if (firstEnabled) {
            setSelectedMethod(firstEnabled.id);
          }
        }
        setLoadingConfig(false);
      })
      .catch(err => {
        console.error("Failed to load payment settings", err);
        setLoadingConfig(false);
      });
  }, []);

  // Format Card Number (space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const formatted = rawVal.match(/.{1,4}/g)?.join(' ') || '';
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    let formatted = rawVal;
    if (rawVal.length > 2) {
      formatted = `${rawVal.slice(0, 2)}/${rawVal.slice(2, 4)}`;
    }
    if (formatted.length <= 5) {
      setCardExpiry(formatted);
    }
  };

  // Handle Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.paymentsEnabled) return;

    setProcessing(true);

    // Simulate validation delay
    setTimeout(async () => {
      // Craft Order Items
      const orderItems: OrderItem[] = items.map((item, index) => ({
        id: `ord-item-${index}-${Date.now()}`,
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      }));

      // Create Order Payload
      const orderPayload: Partial<Order> = {
        userEmail,
        userName,
        items: orderItems,
        total,
        paymentMethod: selectedMethod,
        status: selectedMethod === 'credit_card' ? 'pagado' : 'pendiente', // Credit card is paid instantly
        shippingAddress,
        phone
      };

      try {
        const data = await ordersService.createOrder(orderPayload as any);
        setCreatedOrder(data);
        setPaymentFinished(true);
        playSuccessBeep();
      } catch (err) {
        console.error("Failed to create order on server", err);
        alert("Error al procesar el pedido. Intente nuevamente.");
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  // Render Status
  if (loadingConfig) {
    return (
      <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-sans text-xs text-neutral-400">Verificando canales de pago seguros...</p>
        </div>
      </div>
    );
  }

  const isPaymentsOn = settings?.paymentsEnabled;
  const methods = settings?.paymentMethods || [];
  const activeMethodsCount = methods.filter(m => m.enabled).length;

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <AnimatePresence mode="wait">
        {!paymentFinished ? (
          <motion.div
            key="payment-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12"
          >
            {/* Left side: Order Resume */}
            <div className="lg:col-span-5 bg-neutral-950 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-800/80">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full">
                    Transacción Segura
                  </span>
                  <h3 className="font-sans font-bold text-xl text-white mt-3">Resumen de Tu Pedido</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-1">Garantía oficial y envío inmediato</p>
                </div>

                {/* Items Mini List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/40">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-lg object-cover bg-neutral-800 border border-neutral-700/40"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-200 truncate">{product.name}</h4>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-0.5">
                          <span>Cant: {quantity}</span>
                          <span className="text-red-500 font-mono font-medium">${(product.price * quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deliver details summary */}
                <div className="p-3.5 bg-neutral-900/40 border border-neutral-800/40 rounded-xl space-y-2 text-[11px] text-neutral-400">
                  <div className="font-semibold text-neutral-300">Detalles de Entrega:</div>
                  <div className="truncate"><span className="text-neutral-500">Comprador:</span> {userName} ({userEmail})</div>
                  <div className="truncate"><span className="text-neutral-500">Dirección:</span> {shippingAddress}</div>
                  <div><span className="text-neutral-500">Teléfono:</span> {phone}</div>
                </div>
              </div>

              {/* Total Display */}
              <div className="pt-6 border-t border-neutral-800/80 mt-6 lg:mt-0">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span>Subtotal Envío</span>
                  <span className="text-emerald-500 font-semibold font-sans">¡GRATIS!</span>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-sm text-neutral-300 font-medium">Total a Pagar</span>
                  <span className="text-2xl font-bold font-sans text-red-500 tracking-tight">
                    ${total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-4 text-[10px] text-neutral-500">
                  <ShieldCheck size={12} className="text-red-500" />
                  <span>Cifrado SSL de 256 bits y manejo de datos seguro</span>
                </div>
              </div>
            </div>

            {/* Right side: Payment Method Selection and Input Forms */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col bg-neutral-900 justify-between">
              {!isPaymentsOn || activeMethodsCount === 0 ? (
                /* Payments Disabled Screen */
                <div className="flex-1 flex flex-col justify-center items-center text-center py-10 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <AlertCircle size={30} />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="font-sans font-bold text-lg text-white">Pasarela en Mantenimiento</h4>
                    <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                      El administrador ha desactivado temporalmente la pasarela de pagos integrados. Por favor contacta al equipo de ventas o inténtalo más tarde.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-xs transition-colors cursor-pointer"
                  >
                    Regresar al Catálogo
                  </button>
                </div>
              ) : (
                /* Payment is Enabled */
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-sans font-bold text-lg text-white">Selecciona método de pago</h3>
                    <p className="font-sans text-xs text-neutral-400">Canales autorizados por la administración</p>
                  </div>

                  {/* Payment Method Selector Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {methods.map(m => {
                      if (!m.enabled) return null;
                      
                      const isSelected = selectedMethod === m.id;
                      let Icon = CreditCard;
                      if (m.id === 'bank_transfer') Icon = Landmark;
                      if (m.id === 'cash') Icon = Truck;
                      if (m.id === 'paypal') Icon = Wallet;

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMethod(m.id);
                            if (m.id !== 'credit_card') {
                              setCardFocused('front'); // Reset
                            }
                          }}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-red-500/10 border-red-500 text-red-500 scale-[1.02]' 
                              : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="font-sans text-[10px] font-bold tracking-tight">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Method Description */}
                  <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40">
                    <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                      {methods.find(m => m.id === selectedMethod)?.description}
                    </p>
                  </div>

                  {/* Form fields based on selected method */}
                  <div className="space-y-4">
                    {selectedMethod === 'credit_card' && (
                      <div className="space-y-5">
                        {/* Interactive Simulated Card */}
                        <div className="relative h-44 w-full max-w-sm mx-auto perspective-1000 select-none">
                          <motion.div
                            animate={{ rotateY: cardFocused === 'back' ? 180 : 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full h-full preserve-3d relative rounded-xl shadow-xl border border-red-600/30 overflow-hidden"
                          >
                            {/* Card Front Side */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-neutral-905 via-red-950/90 to-neutral-950 p-5 flex flex-col justify-between">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold tracking-wider text-red-500 font-mono">TRECK PLATINUM</span>
                                  <div className="w-8 h-6 bg-amber-500/20 border border-amber-500/50 rounded-md" />
                                </div>
                                <span className="font-sans font-black tracking-tighter text-red-600 text-xl italic px-3 py-1 bg-black/40 rounded">
                                  VISA
                                </span>
                              </div>

                              <div className="font-mono text-base md:text-lg tracking-wider text-neutral-200 text-center py-2">
                                {cardNumber || '•••• •••• •••• ••••'}
                              </div>

                              <div className="flex justify-between items-end">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] text-neutral-500 block">TITULAR</span>
                                  <span className="font-sans text-xs font-semibold uppercase text-neutral-300 tracking-wider truncate max-w-[180px] block">
                                    {cardName || 'NOMBRE APELLIDO'}
                                  </span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] text-neutral-500 block">VENCE</span>
                                  <span className="font-mono text-xs font-semibold text-neutral-300">
                                    {cardExpiry || 'MM/AA'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Back Side */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-955/80 p-5 flex flex-col justify-between [transform:rotateY(180deg)]">
                              <div className="w-full h-9 bg-neutral-800 -mx-5 mt-2" />
                              <div className="flex justify-end pr-2">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] text-neutral-500 text-right block">CVV</span>
                                  <div className="bg-neutral-800 text-neutral-200 font-mono text-xs px-2.5 py-1 rounded">
                                    {cardCvv || '•••'}
                                  </div>
                                </div>
                              </div>
                              <p className="text-[8px] text-neutral-500 leading-tight">
                                Firma autorizada por el titular. No transferible. Respaldado por el sistema de pagos integrados de Treck Motors Cuba.
                              </p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Card Input Fields */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-400 mb-1">NÚMERO DE TARJETA</label>
                            <input
                              type="text"
                              required
                              placeholder="4000 1234 5678 9010"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              onFocus={() => setCardFocused('front')}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-400 mb-1">NOMBRE DEL TITULAR</label>
                            <input
                              type="text"
                              required
                              placeholder="JUAN PEREZ"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              onFocus={() => setCardFocused('front')}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors uppercase"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-neutral-400 mb-1">VENCIMIENTO</label>
                              <input
                                type="text"
                                required
                                placeholder="MM/AA"
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                onFocus={() => setCardFocused('front')}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-neutral-400 mb-1">CÓDIGO CVV / CVV2</label>
                              <input
                                type="password"
                                required
                                placeholder="123"
                                maxLength={3}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                onFocus={() => setCardFocused('back')}
                                onBlur={() => setCardFocused('front')}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'bank_transfer' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                          <div className="font-bold text-neutral-200 text-xs flex items-center gap-1">
                            <Landmark size={14} className="text-red-500" />
                            <span>Datos oficiales de Cuenta de la Empresa:</span>
                          </div>
                          
                          <div className="space-y-1.5 font-sans text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2.5">
                            {methods.find(m => m.id === 'bank_transfer')?.details ? (
                              <div className="whitespace-pre-line leading-relaxed text-neutral-300">
                                {methods.find(m => m.id === 'bank_transfer')?.details}
                              </div>
                            ) : (
                              <p>Cargando detalles de cuenta...</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-400 mb-1">CÓDIGO DE REFERENCIA O N° DE TRANSACCIÓN</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. REF-829381 o Código de Operación"
                            value={bankRef}
                            onChange={(e) => setBankRef(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'cash' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-red-500/5 text-xs text-neutral-300 border border-red-500/10 rounded-xl space-y-2 leading-relaxed">
                          <p className="font-bold flex items-center gap-1 text-red-500">
                            <Truck size={14} />
                            <span>Condiciones de Contra-Entrega (Efectivo)</span>
                          </p>
                          <p>
                            Tu pedido se pondrá en preparación de forma inmediata. Al momento de la entrega por parte del repartidor oficial de Treck Motors, deberás abonar la cantidad exacta de <span className="text-red-500 font-mono font-bold">${total.toLocaleString()}</span> en efectivo.
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            Nos pondremos en contacto contigo vía telefónica ({phone}) antes de despachar el reparto para coordinar horarios.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'paypal' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-500/5 text-xs text-zinc-300 border border-blue-500/10 rounded-2xl space-y-2 leading-relaxed">
                          <p className="font-bold flex items-center gap-1.5 text-blue-400">
                            <Wallet size={14} />
                            <span>Pasarela PayPal Activa</span>
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Estás pagando mediante la cuenta oficial de PayPal de la empresa. Modo de entorno: <span className="font-mono font-black text-amber-500 uppercase">{methods.find(m => m.id === 'paypal')?.sandboxMode ? 'SANDBOX (PRUEBAS)' : 'PRODUCCIÓN (EN VIVO)'}</span>
                          </p>
                          <div className="space-y-0.5 text-[10px] text-zinc-500 font-mono">
                            <div><span className="text-zinc-400 font-sans">Email Receptor:</span> {methods.find(m => m.id === 'paypal')?.email || 'pagos@treckmotors.com'}</div>
                            <div><span className="text-zinc-400 font-sans">Client ID:</span> {methods.find(m => m.id === 'paypal')?.clientId || 'sb-treck-demo-123'}</div>
                          </div>
                        </div>

                        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                          <label className="block text-[11px] font-bold text-neutral-400">PAGO RÁPIDO CON PAYPAL (SIMULACIÓN SEGURA)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="email"
                              required
                              placeholder="correo@ejemplo-paypal.com"
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-white focus:outline-none focus:border-blue-500"
                              defaultValue={userEmail}
                            />
                            <input
                              type="password"
                              required
                              placeholder="Contraseña PayPal"
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800/60">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={onClose}
                      className="px-5 py-2.5 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl font-sans text-xs transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer select-none transition-all"
                    >
                      {processing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Procesando pago...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Confirmar Compra</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        ) : (
          /* Payment Success Modal Screen */
          <motion.div
            key="payment-success"
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
              <h3 className="font-sans font-bold text-2xl text-white">¡Compra Exitosa!</h3>
              <p className="font-sans text-xs text-neutral-400">
                Tu transacción ha sido procesada de forma segura por el sistema de Treck Motors Cuba.
              </p>
            </div>

            {/* Receipt Summary */}
            {createdOrder && (
              <div className="bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800 text-left space-y-3 font-sans">
                <div className="flex justify-between items-center text-[10px] text-neutral-500 border-b border-neutral-800/60 pb-2">
                  <span>TRANSACCIÓN ID</span>
                  <span className="font-mono text-neutral-300 font-bold">{createdOrder.id}</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500">MÉTODO DE PAGO</span>
                  <div className="text-xs text-neutral-300 font-medium">
                    {methods.find(m => m.id === createdOrder.paymentMethod)?.name}
                  </div>
                </div>

                <div className="space-y-1 pb-2 border-b border-neutral-800/40">
                  <span className="text-[10px] text-neutral-500">DIRECCIÓN DE ENVÍO</span>
                  <div className="text-xs text-neutral-300 font-medium truncate">{createdOrder.shippingAddress}</div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-xs text-neutral-400">Total transaccionado:</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    ${createdOrder.total.toLocaleString()} USD
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 text-xs text-neutral-500 flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-red-500" />
              <span>Se ha enviado una notificación en tiempo real a la central.</span>
            </div>

            <button
              onClick={() => {
                if (createdOrder) {
                  onSuccess(createdOrder);
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/15 cursor-pointer mt-2"
            >
              Cerrar y ver Pedidos
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

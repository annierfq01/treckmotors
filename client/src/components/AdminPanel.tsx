import React, { useState, useEffect, useRef } from 'react';
import { Product, Order, User, SystemSettings, OrderStatus, ProductType, Currency, Branch } from '../types';
import { 
  BarChart3, Plus, Edit2, Trash2, Shield, UserX, UserCheck, Settings, 
  TrendingUp, CreditCard, ShoppingBag, Users, Layers, AlertCircle, 
  Sparkles, Check, Database, RefreshCw, Eye, Facebook, Image, MapPin, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessBeep } from '../utils/audio';
import * as productsService from '../services/products';
import * as ordersService from '../services/orders';
import * as usersService from '../services/users';
import * as settingsService from '../services/settings';
import * as branchesService from '../services/branches';

interface AdminPanelProps {
  currentAdminEmail: string;
}

export default function AdminPanel({ currentAdminEmail }: AdminPanelProps) {
  // DB states loaded from backend APIs
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'settings'>('dashboard');

  const [draftSettings, setDraftSettings] = useState<SystemSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveFeedback, setSettingsSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', email: '', schedule: '', image: '' });
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Interactive Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'pieza' as ProductType,
    price: 0,
    currency: 'USD' as Currency,
    image: '',
    description: '',
    category: '',
    stock: 10,
    featureInput: '',
    features: [] as string[]
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const imageFileRef = useRef<File | null>(null);

  // Notifications channel state
  const [sseConnected, setSseConnected] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, usersData, settingsData, branchesData] = await Promise.all([
        productsService.getProducts(),
        ordersService.getOrders(),
        usersService.getUsers(),
        settingsService.getSettings(),
        branchesService.getBranches(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      const loadedSettings = settingsData && !(settingsData as any).error ? settingsData : null;
      setSettings(loadedSettings);
      setDraftSettings(loadedSettings);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (err) {
      console.error("Failed to load administrative panels", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const eventSource = ordersService.subscribeToOrders((payload) => {
      if (payload.type === 'new_order') {
        import('../utils/audio').then(m => m.playNotificationSound());
        setNewOrderAlert(payload.message);
        setTimeout(() => setNewOrderAlert(null), 8500);

        setOrders(prev => [payload.order, ...prev]);

        const orderItems = payload.order.items || [];
        setProducts(prev => prev.map(p => {
          const item = orderItems.find((o: any) => o.productId === p.id);
          if (item) {
            return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
        }));
      }
    });

    eventSource.onopen = () => setSseConnected(true);
    eventSource.onerror = () => setSseConnected(false);

    return () => eventSource.close();
  }, []);

  // Calculate statistics
  const totalIncome = orders
    .filter(o => o.status === 'pagado' || o.status === 'enviado')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingIncome = orders
    .filter(o => o.status === 'pendiente')
    .reduce((sum, o) => sum + o.total, 0);

  const totalSalesCount = orders.filter(o => o.status !== 'cancelado').length;

  // Render Loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw size={32} className="text-red-500 animate-spin" />
        <p className="font-sans text-xs text-neutral-400">Iniciando base de datos y entorno administrativo...</p>
      </div>
    );
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      playSuccessBeep();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleToggleUserRole = async (user: User) => {
    if (user.email === currentAdminEmail) {
      alert("No puedes revocar tu propio rango de administrador.");
      return;
    }
    const updatedRole = user.role === 'admin' ? 'cliente' : 'admin';
    try {
      await usersService.updateUser(user.id, { role: updatedRole as 'admin' | 'cliente' });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: updatedRole } : u));
      playSuccessBeep();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (user: User) => {
    if (user.email === currentAdminEmail) {
      alert("No puedes bloquear tu propia cuenta.");
      return;
    }
    const updatedActive = !user.active;
    try {
      await usersService.updateUser(user.id, { active: updatedActive } as any);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: updatedActive } : u));
      playSuccessBeep();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    if (!draftSettings) return;
    setIsSavingSettings(true);
    setSettingsSaveFeedback(null);
    try {
      await settingsService.updateSettings(draftSettings);
      setSettings(draftSettings);
      setSettingsSaveFeedback({ type: 'success', message: 'Configuracion guardada correctamente.' });
      playSuccessBeep();
      setTimeout(() => setSettingsSaveFeedback(null), 3500);
    } catch (err) {
      console.error(err);
      setSettingsSaveFeedback({ type: 'error', message: 'Error al guardar la configuracion.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleSettingsPayment = () => {
    if (!draftSettings) return;
    setDraftSettings({ ...draftSettings, paymentsEnabled: !draftSettings.paymentsEnabled });
  };

  const handleToggleSettingsMethod = (methodId: string) => {
    if (!draftSettings) return;
    const updatedMethods = draftSettings.paymentMethods.map(m => 
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    );
    setDraftSettings({ ...draftSettings, paymentMethods: updatedMethods });
  };

  const handleUpdateMethodDetails = (methodId: string, details: string) => {
    if (!draftSettings) return;
    const updatedMethods = draftSettings.paymentMethods.map(m => 
      m.id === methodId ? { ...m, details: details } : m
    );
    setDraftSettings({ ...draftSettings, paymentMethods: updatedMethods });
  };

  const handleUpdatePaypalField = (field: 'email' | 'clientId' | 'sandboxMode', value: any) => {
    if (!draftSettings) return;
    const updatedMethods = draftSettings.paymentMethods.map(m => 
      m.id === 'paypal' ? { ...m, [field]: value } : m
    );
    setDraftSettings({ ...draftSettings, paymentMethods: updatedMethods });
  };

  const handleUpdateContactField = (
    field: 'contactPhone' | 'contactEmail' | 'shopAddress' | 'shopHours' | 'facebookUrl' | 'instagramUrl' | 'whatsappNumber' | 'shopImage',
    value: string
  ) => {
    if (!draftSettings) return;
    setDraftSettings({ ...draftSettings, [field]: value });
  };

  const handleToggleReservations = () => {
    if (!draftSettings) return;
    setDraftSettings({ ...draftSettings, reservationsEnabled: !draftSettings.reservationsEnabled });
  };

  // Product CRUD
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        type: product.type,
        price: product.price,
        currency: product.currency || 'USD',
        image: product.image,
        description: product.description,
        category: product.category,
        stock: product.stock,
        featureInput: '',
        features: [...product.features]
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        type: 'pieza',
        price: 0,
        currency: 'USD',
        image: '',
        description: '',
        category: '',
        stock: 10,
        featureInput: '',
        features: []
      });
    }
    setImagePreview('');
    imageFileRef.current = null;
    setShowProductModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageFileRef.current = file;
      setProductForm(prev => ({ ...prev, image: file.name }));
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddFeature = () => {
    if (productForm.featureInput.trim()) {
      setProductForm(prev => ({
        ...prev,
        features: [...prev.features, prev.featureInput.trim()],
        featureInput: ''
      }));
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setProductForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category.trim()) {
      alert("Por favor rellena los campos requeridos.");
      return;
    }

    let imageUrl = productForm.image;

    const file = imageFileRef.current;
    if (file) {
      setIsUploadingImage(true);
      try {
        const { uploadImage } = await import('../services/storage');
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await uploadImage('products', fileName, base64, file.type);
        imageUrl = result.url;
      } catch (err) {
        console.error('[Upload] Error:', err);
        alert('Error al subir la imagen. Intenta de nuevo.');
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    if (!imageUrl.trim()) {
      alert("Debes agregar una URL de imagen o seleccionar un archivo.");
      return;
    }

    const payload: Partial<Product> = {
      name: productForm.name,
      type: productForm.type,
      price: Number(productForm.price),
      currency: productForm.currency,
      image: imageUrl,
      description: productForm.description,
      category: productForm.category,
      stock: Number(productForm.stock),
      features: productForm.features
    };

    try {
      if (editingProduct) {
        const updated = await productsService.updateProduct(editingProduct.id, payload as any);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
        setShowProductModal(false);
        playSuccessBeep();
      } else {
        const generatedId = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        payload.id = generatedId + "-" + Date.now().toString().slice(-4);
        const created = await productsService.createProduct(payload as any);
        setProducts(prev => [created, ...prev]);
        setShowProductModal(false);
        playSuccessBeep();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás completamente seguro de que deseas eliminar este artículo del catálogo?")) return;
    try {
      await productsService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      playSuccessBeep();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Order Alert Toast - Slide In */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 left-4 md:left-auto md:right-10 md:w-96 bg-red-600 border border-neutral-900 rounded-2xl shadow-2xl p-4 z-50 flex items-start gap-3 text-white"
          >
            <div className="bg-black/20 p-2 rounded-xl">
              <Sparkles size={20} className="text-amber-300 animate-spin" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-sans font-extrabold text-[#FFF0] leading-none text-xs flex justify-between items-center text-white">
                <span>¡NUEVO PEDIDO RECIBIDO!</span>
                <span className="text-[9px] bg-black/30 px-2 py-0.5 rounded">ONLINE</span>
              </h4>
              <p className="font-sans text-xs font-semibold">{newOrderAlert}</p>
              <p className="text-[10px] text-red-200">Revisa la pestaña de pedidos para procesar el envío.</p>
            </div>
            <button 
              onClick={() => setNewOrderAlert(null)}
              className="text-white hover:text-red-100 font-sans font-bold"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Title & SSE Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans font-black text-2xl text-white tracking-tight uppercase">
              Consola Administrativa
            </h2>
            <span className="text-[10px] font-mono bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">
              PRO ACCESS
            </span>
          </div>
          <p className="font-sans text-xs text-zinc-400 mt-1">
            Logueado como: <span className="text-red-400 font-semibold">{currentAdminEmail}</span>
          </p>
        </div>

        {/* Real-time SSE Connection Indicator */}
        <div className="flex items-center gap-2 bg-black px-3.5 py-1.5 rounded-xl border border-zinc-850 border-zinc-800">
          <div className={`w-2.5 h-2.5 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-mono text-[10px] text-zinc-400 font-medium">
            Notificaciones en tiempo real: <span className={sseConnected ? 'text-emerald-400 font-bold' : 'text-red-500'}>
              {sseConnected ? 'CONECTADO (SSE)' : 'DESCONECTADO'}
            </span>
          </span>
              </div>
        </div>

      {/* Tabs list navigation */}
      <div className="flex gap-1 bg-black p-1.5 rounded-xl border border-zinc-800 overflow-x-auto select-none">
        {[
          { id: 'dashboard', name: 'Estadísticas de Venta', icon: BarChart3 },
          { id: 'products', name: 'Catálogo de Inventario', icon: Layers },
          { id: 'orders', name: 'Gestor de Pedidos', icon: ShoppingBag },
          { id: 'users', name: 'Usuarios Registrados', icon: Users },
          { id: 'settings', name: 'Configuración Tienda', icon: Settings }
        ].map(tab => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playSuccessBeep();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer inline-flex whitespace-nowrap ${
                isSelected 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/15' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel Body */}
      <div className="bg-zinc-950/20 rounded-2xl border border-zinc-800 p-4 md:p-6 min-h-[300px]">
        
        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-neutral-400 text-xs">
                  <span>Ventas Totales</span>
                  <TrendingUp size={16} className="text-red-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-white font-mono">
                  ${totalIncome.toLocaleString()}
                </div>
                <div className="text-[10px] text-neutral-500">Ingresos ingresados y enviados</div>
              </div>
              {/* Stat 2 */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-neutral-400 text-xs">
                  <span>Monto Pendiente</span>
                  <AlertCircle size={16} className="text-amber-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-white font-mono">
                  ${pendingIncome.toLocaleString()}
                </div>
                <div className="text-[10px] text-neutral-500">En espera de transferencia o contraentrega</div>
              </div>
              {/* Stat 3 */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-neutral-400 text-xs">
                  <span>Pedidos Concluidos</span>
                  <ShoppingBag size={16} className="text-red-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-white font-mono">{totalSalesCount}</div>
                <div className="text-[10px] text-neutral-500">Excluye pedidos cancelados</div>
              </div>
              {/* Stat 4 */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-neutral-400 text-xs">
                  <span>Productos en Línea</span>
                  <Layers size={16} className="text-red-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-white font-mono">{products.length}</div>
                <div className="text-[10px] text-neutral-500">Motos, piezas y otros</div>
              </div>
            </div>

            {/* Custom Visual Premium Chart (CSS SVG) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Chart line/bars */}
              <div className="lg:col-span-8 bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-4 md:p-6 space-y-4">
                <h3 className="font-sans font-bold text-sm text-neutral-200">Ingresos por Tipo de Producto</h3>
                
                {/* Simulated Chart Bars */}
                <div className="h-48 flex items-end justify-around gap-2 px-2 border-b border-neutral-800 pt-5">
                  {/* Category 1 */}
                  <div className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] font-mono font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                      ${products.filter(p => p.type === 'moto').reduce((s, p) => s + p.price, 0).toLocaleString()}
                    </div>
                    <div className="h-32 bg-red-600 w-12 md:w-16 rounded-t-lg shadow-lg shadow-red-600/10 hover:bg-red-500 transition-all cursor-pointer relative" />
                    <span className="text-[10px] text-neutral-400 mt-2 font-medium">Motocicletas</span>
                  </div>

                  {/* Category 2 */}
                  <div className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] font-mono font-bold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                      ${products.filter(p => p.type === 'pieza').reduce((s, p) => s + p.price, 0).toLocaleString()}
                    </div>
                    <div className="h-16 bg-neutral-800 w-12 md:w-16 rounded-t-lg hover:bg-neutral-700 transition-all cursor-pointer" />
                    <span className="text-[10px] text-neutral-400 mt-2 font-medium">Piezas y Repuestos</span>
                  </div>

                  {/* Category 3 */}
                  <div className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] font-mono font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                      ${products.filter(p => p.type === 'otros').reduce((s, p) => s + p.price, 0).toLocaleString()}
                    </div>
                    <div className="h-12 bg-amber-700 w-12 md:w-16 rounded-t-lg shadow-lg shadow-amber-700/15 hover:bg-amber-600 transition-all cursor-pointer" />
                    <span className="text-[10px] text-neutral-400 mt-2 font-medium">Otros</span>
                  </div>

                  {/* Category 4 */}
                  <div className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] font-mono font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                      ${totalIncome.toLocaleString()}
                    </div>
                    <div className="h-40 bg-red-700 w-12 md:w-16 rounded-t-lg shadow-lg shadow-red-700/15 hover:bg-red-600 transition-all cursor-pointer" />
                    <span className="text-[10px] text-neutral-400 mt-2 font-medium">Ventas Reales</span>
              </div>
            </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGER */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-bold text-sm text-neutral-200">Inventario de Productos</h3>
              <button
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/10 select-none cursor-pointer"
              >
                <Plus size={14} />
                <span>Agregar Producto</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto bg-neutral-900/40 rounded-2xl border border-neutral-800/60">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] text-neutral-400 font-bold uppercase select-none bg-neutral-950/60">
                    <th className="px-4 py-3">Artículo</th>
                    <th className="px-4 py-3">Tipo / Categoría</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40 text-xs text-neutral-300">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-950/40 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-800 border border-neutral-700/50"
                          referrerPolicy="no-referrer"
                        />
                        <div className="max-w-[200px] md:max-w-[300px]">
                          <div className="font-bold text-neutral-200 truncate">{p.name}</div>
                          <div className="text-[10px] text-neutral-500 truncate">{p.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                          p.type === 'moto' ? 'bg-red-500/10 text-red-400' :
                          p.type === 'pieza' ? 'bg-neutral-800 text-neutral-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.type.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-neutral-500 mt-1">{p.category}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        ${p.price.toLocaleString()} {p.currency || 'USD'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                          p.stock <= 3 ? 'bg-red-600/20 text-red-500' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {p.stock} u.
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="p-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
              {settings?.facebookPageId && (
                            <button
                              onClick={async () => {
                                try {
                                  const fbService = await import('../services/facebook');
                                  const result = await fbService.postToFacebook(p.id);
                                  if (result.success) {
                                    playSuccessBeep();
                                    alert(`✅ Publicado en Facebook correctamente.`);
                                  }
                                } catch (err: any) {
                                  alert('Error al publicar: ' + (err.message || 'Error desconocido'));
                                }
                              }}
                              className="p-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-lg transition-colors cursor-pointer"
                              title="Publicar en Facebook"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-neutral-900 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS MONITOR */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <h3 className="font-sans font-bold text-sm text-neutral-200">Monitor de Pedidos y Ventas</h3>
            
            <div className="overflow-x-auto bg-neutral-900/40 rounded-2xl border border-neutral-800/60">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] text-neutral-400 font-bold uppercase select-none bg-neutral-950/60">
                    <th className="px-4 py-3">Pedido ID</th>
                    <th className="px-4 py-3">Cliente / Datos</th>
                    <th className="px-4 py-3">Artículos</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Mèt. Pago</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Modificar Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40 text-xs text-neutral-300">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-neutral-950/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-black text-white">
                        {o.id}
                        <div className="text-[9px] text-neutral-500 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-200">{o.userName}</div>
                        <div className="text-[10px] text-neutral-400">{o.userEmail}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">{o.phone}</div>
                        <div className="text-[9px] text-neutral-500 truncate max-w-[150px]" title={o.shippingAddress}>{o.shippingAddress}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-neutral-800 text-[8px] font-mono font-bold rounded flex items-center justify-center border border-neutral-700 px-1 text-white">{item.quantity}x</span>
                              <span className="text-[10px] text-neutral-300 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-red-500">
                        ${o.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-400 capitalize">
                        {o.paymentMethod === 'credit_card' ? '💳 Tarjeta' : o.paymentMethod === 'bank_transfer' ? '🏦 Banco' : '🚚 Contraentrega'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                          o.status === 'pagado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          o.status === 'enviado' ? 'bg-indigo-500/10 text-indigo-400' :
                          o.status === 'cancelado' ? 'bg-red-600/10 text-red-500' : 'bg-amber-600/10 text-amber-500'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className="bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1 text-[11px] text-neutral-300 focus:outline-none focus:border-red-500 transition-colors pointer-events-auto cursor-pointer"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="enviado">Enviado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS MANAGER */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <h3 className="font-sans font-bold text-sm text-neutral-200">Control de Usuarios Registrados</h3>

            <div className="overflow-x-auto bg-neutral-900/40 rounded-2xl border border-neutral-800/60">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] text-neutral-400 font-bold uppercase select-none bg-neutral-950/60">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo Electrónico</th>
                    <th className="px-4 py-3">Rango / Permisos</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha Registro</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40 text-xs text-neutral-300">
                  {users.map(u => {
                    const isSelf = u.email === currentAdminEmail;
                    return (
                      <tr key={u.id} className="hover:bg-neutral-950/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-neutral-200">
                          {u.name} {isSelf && <span className="text-[10px] text-red-500 font-mono italic">(Tú)</span>}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 font-mono">
                          {u.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            u.role === 'admin' ? 'bg-red-600/10 text-red-500 border border-red-500/20' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500 line-through'
                          }`}>
                            {u.active ? 'ACTIVO' : 'BLOQUEADO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-500 text-[10px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Previo'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {/* Toggle Role Button */}
                            <button
                              onClick={() => handleToggleUserRole(u)}
                              disabled={isSelf}
                              className={`px-2 py-1 rounded-lg border font-sans text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                u.role === 'admin' 
                                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400' 
                                  : 'bg-red-600/5 hover:bg-red-600/10 text-red-500 border-red-500/10'
                              } cursor-pointer`}
                              title="Toggear Rango"
                            >
                              Toggle Rango
                            </button>
                            
                            {/* Toggle active / Block account */}
                            <button
                              onClick={() => handleToggleUserActive(u)}
                              disabled={isSelf}
                              className={`p-1 border rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                                u.active 
                                  ? 'border-neutral-800 text-neutral-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5' 
                                  : 'border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/5'
                              }`}
                              title={u.active ? 'Bloquear Usuario' : 'Desbloquear Usuario'}
                            >
                              {u.active ? <UserX size={12} /> : <UserCheck size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENT GATEWAYS CONFIG (SETTINGS) */}
        {activeTab === 'settings' && settings && draftSettings && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="font-sans font-extrabold text-base text-white">Configuración de Treck Motors Cuba</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-1">Gestiona las opciones de contacto, dirección de la sucursal y medios de pago para la tienda en Bayamo.</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-xs font-bold text-neutral-400">
                      Pasarela Online:
                    </span>
                    <button
                      onClick={handleToggleSettingsPayment}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                        draftSettings.paymentsEnabled
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/15'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {draftSettings.paymentsEnabled ? 'HABILITADA' : 'DESHABILITADA'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 lg:border-l lg:border-neutral-800 lg:pl-6">
                    <span className="font-sans text-xs font-bold text-neutral-400 text-white">
                      Panel de Reservas:
                    </span>
                    <button
                      onClick={handleToggleReservations}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                        draftSettings.reservationsEnabled
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {draftSettings.reservationsEnabled ? 'ACTIVO (Habilitado)' : 'ALMACÉN (Deshabilitado)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* UBICACIÓN Y CONTACTO CUBA EDITABLE SECTION */}
            <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-5 space-y-4">
              <div>
                <h4 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-red-500 animate-pulse" />
                  Datos de Contacto y Ubicación de la Tienda (Cuba)
                </h4>
                <p className="font-sans text-[11px] text-neutral-400 mt-1">
                  Establece la ubicación física y los datos de contacto de la sucursal de Treck Motors en Cuba. Esta información se actualiza automáticamente en el catálogo y portal principal para que los clientes asistan físicamente a realizar sus compras.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">TELÉFONO DE CONTACTO</label>
                  <input
                    type="text"
                    value={draftSettings.contactPhone || ''}
                    onChange={(e) => handleUpdateContactField('contactPhone', e.target.value)}
                    placeholder="Ej: +53 5212 3456"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-mono text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={draftSettings.contactEmail || ''}
                    onChange={(e) => handleUpdateContactField('contactEmail', e.target.value)}
                    placeholder="Ej: cuba@treckmotors.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">DIRECCIÓN FÍSICA DEL SHOWROOM (BAYAMO)</label>
                  <input
                    type="text"
                    value={draftSettings.shopAddress || ''}
                    onChange={(e) => handleUpdateContactField('shopAddress', e.target.value)}
                    placeholder="Ej: Calle General García #102, e/ Lora y Masó, Bayamo, Granma, Cuba"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">HORARIO COMERCIAL DE ATENCIÓN</label>
                  <input
                    type="text"
                    value={draftSettings.shopHours || ''}
                    onChange={(e) => handleUpdateContactField('shopHours', e.target.value)}
                    placeholder="Ej: Lunes a Viernes: 8:30 AM - 5:30 PM | Sábados: 9:00 AM - 1:00 PM"
                    className="w-full bg-neutral-950 border border-neutral-805 border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">ENLACE DE FACEBOOK (BOTÓN ICONO)</label>
                  <input
                    type="url"
                    value={draftSettings.facebookUrl || ''}
                    onChange={(e) => handleUpdateContactField('facebookUrl', e.target.value)}
                    placeholder="Ej: https://facebook.com/treckmotorscuba"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">ENLACE DE INSTAGRAM (BOTÓN ICONO)</label>
                  <input
                    type="url"
                    value={draftSettings.instagramUrl || ''}
                    onChange={(e) => handleUpdateContactField('instagramUrl', e.target.value)}
                    placeholder="Ej: https://instagram.com/treckmotorscuba"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">NÚMERO DE WHATSAPP (CON PREFIJO DE PAÍS, SIN SIGNOS NI ESPACIOS)</label>
                  <input
                    type="text"
                    value={draftSettings.whatsappNumber || ''}
                    onChange={(e) => handleUpdateContactField('whatsappNumber', e.target.value)}
                    placeholder="Ej: 5352123456"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-mono text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* SHOP IMAGE */}
              <div className="pt-4 border-t border-zinc-800">
                <label className="block text-[10px] font-bold text-neutral-400 mb-2">IMAGEN DE LA TIENDA (FOTO DEL LOCAL / SHOWROOM)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={draftSettings.shopImage || ''}
                    onChange={(e) => handleUpdateContactField('shopImage', e.target.value)}
                    placeholder="https://ejemplo.com/imagen-del-local.jpg"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-sans text-xs text-neutral-300 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const { uploadImage } = await import('../services/storage');
                        const ext = file.name.split('.').pop() || 'jpg';
                        const fileName = `shop/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve) => {
                          reader.onload = () => resolve((reader.result as string).split(',')[1]);
                          reader.readAsDataURL(file);
                        });
                        try {
                          const result = await uploadImage('products', fileName, base64, file.type);
                          setDraftSettings({ ...draftSettings, shopImage: result.url });
                          playSuccessBeep();
                        } catch (err) {
                          console.error(err);
                          alert('Error al subir la imagen.');
                        }
                      }}
                    />
                    Subir Foto
                  </label>
                </div>
                {draftSettings.shopImage && (
                  <div className="mt-2 relative w-full h-32 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
                    <img
                      src={draftSettings.shopImage}
                      alt="Vista previa de la tienda"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* SAVE SETTINGS BUTTON */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                <div>
                  {settingsSaveFeedback && (
                    <span className={`text-xs font-bold font-sans ${
                      settingsSaveFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {settingsSaveFeedback.message}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-sans text-xs font-black rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-red-600/15 flex items-center gap-2"
                >
                  {isSavingSettings ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Methods Configuration Panels */}
            <div className="space-y-4">
              <h4 className="font-sans font-bold text-sm text-neutral-200">Métodos de Pago Admitidos</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {draftSettings.paymentMethods.map(method => (
                  <div key={method.id} className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-sans font-bold text-xs text-white">{method.name}</span>
                        <button
                          onClick={() => handleToggleSettingsMethod(method.id)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                            method.enabled ? 'bg-red-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            method.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      <p className="font-sans text-[11px] text-neutral-400 leading-relaxed">{method.description}</p>
                    </div>

                    {method.id === 'bank_transfer' && method.enabled && (
                      <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                        <label className="block text-[10px] font-bold text-neutral-500">INSTRUCCIONES DE TRANSFERENCIA</label>
                        <textarea
                          rows={3}
                          value={method.details || ''}
                          onChange={(e) => handleUpdateMethodDetails(method.id, e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 font-sans text-[10px] text-neutral-300 focus:outline-none focus:border-red-500 transition-colors resize-none"
                          placeholder="Coloca aquí los datos CBU, Banco, Número de cuenta, RUT, etc."
                        />
                      </div>
                    )}

                    {method.id === 'paypal' && method.enabled && (
                      <div className="space-y-2.5 border-t border-neutral-800 pt-3 text-left">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 mb-1">EMAIL DE NEGOCIO RECEPTORES</label>
                          <input
                            type="email"
                            placeholder="pagos@tuempresa.com"
                            value={method.email || ''}
                            onChange={(e) => handleUpdatePaypalField('email', e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 font-sans text-[10px] text-neutral-300 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 mb-1">CLIENT ID DE PAYPAL</label>
                          <input
                            type="text"
                            placeholder="sb-treck-demo-foo"
                            value={method.clientId || ''}
                            onChange={(e) => handleUpdatePaypalField('clientId', e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 font-mono text-[9px] text-neutral-300 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div className="flex justify-between items-center bg-black/60 p-2 rounded-xl border border-neutral-800/60 mt-1">
                          <span className="text-[9px] font-bold text-neutral-400">¿ENTORNO EN MODO SANDBOX?</span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaypalField('sandboxMode', !method.sandboxMode)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                              method.sandboxMode 
                                ? 'bg-amber-600/15 text-amber-500 border border-amber-500/25' 
                                : 'bg-red-650 bg-red-600/15 text-red-500 border border-red-500/25'
                            }`}
                          >
                            {method.sandboxMode ? 'SANDBOX' : 'LIVE'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FACEBOOK INTEGRATION SECTION */}
            <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-5 space-y-4">
              <div>
                <h4 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Facebook size={14} className="text-blue-500" />
                  Integración con Facebook (Publicación Automática)
                </h4>
                <p className="font-sans text-[11px] text-neutral-400 mt-1">
                  Conecta una página de Facebook para publicar productos automáticamente desde el panel de administración.
                  Necesitas una <strong>Aplicación de Facebook</strong> configurada en <strong>developers.facebook.com</strong>.
                </p>
              </div>

              <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl space-y-3">
                {draftSettings.facebookPageId ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Facebook size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{draftSettings.facebookPageName || 'Página conectada'}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">✓ Conectado</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('¿Desconectar página de Facebook? Las configuradas se eliminarán.')) {
                            setDraftSettings({
                              ...draftSettings,
                              facebookPageId: '',
                              facebookPageAccessToken: '',
                              facebookPageName: '',
                            });
                            playSuccessBeep();
                          }
                        }}
                        className="px-3 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/10 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Desconectar
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      <span className="text-zinc-500">Page ID: </span>
                      <span className="font-mono text-zinc-300">{draftSettings.facebookPageId}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>No hay ninguna página de Facebook conectada</span>
                    </div>

                    <div className="bg-neutral-950/60 border border-dashed border-zinc-700 rounded-xl p-4 space-y-2">
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        <strong className="text-zinc-300">Pasos para conectar:</strong>
                      </p>
                      <ol className="text-[10px] text-zinc-400 space-y-1 list-decimal list-inside">
                        <li>Crea una App en <strong>developers.facebook.com</strong></li>
                        <li>Agrega el producto "Facebook Login" y "Pages API"</li>
                        <li>Configura la URI de redirección: <span className="font-mono text-zinc-300">{window.location.origin}/admin</span></li>
                        <li>Guarda <strong>FACEBOOK_APP_ID</strong> y <strong>FACEBOOK_APP_SECRET</strong> en el archivo <span className="font-mono">server/.env</span></li>
                      </ol>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const fbService = await import('../services/facebook');
                          const result = await fbService.getFacebookAuthUrl();
                          if (result.authUrl) {
                            window.open(result.authUrl, '_blank', 'width=800,height=700');
                          }
                        } catch (err: any) {
                          alert('Error: ' + (err.message || 'No se pudo obtener la URL de autenticación'));
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/15"
                    >
                      <Facebook size={13} />
                      <span>Conectar Página de Facebook</span>
                    </button>

                    <div className="border-t border-zinc-800 pt-3 mt-2">
                      <p className="text-[10px] text-zinc-500 mb-2">¿Ya autorizaste la app? Ingresa el código de autorización:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="fb-auth-code"
                          placeholder="Código de autorización de Facebook..."
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 font-mono text-[10px] text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                          onClick={async () => {
                            const codeInput = document.getElementById('fb-auth-code') as HTMLInputElement;
                            const code = codeInput?.value?.trim();
                            if (!code) {
                              alert('Ingresa el código de autorización');
                              return;
                            }
                            try {
                              const fbService = await import('../services/facebook');
                              const result = await fbService.handleFacebookCallback(code);
                              alert(result.message);
                              fetchAllData();
                              playSuccessBeep();
                            } catch (err: any) {
                              alert('Error: ' + (err.message || 'No se pudo completar la autorización'));
                            }
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Verificar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {draftSettings.facebookPageId && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <p className="text-[10px] text-emerald-400 leading-relaxed">
                    Facebook está conectado. Ahora puedes publicar productos directamente en tu página desde
                    el catálogo o la sección de productos del panel de administración.
                  </p>
                </div>
              )}
            </div>

            {/* SUCRUSALES / ALMACENES */}
            <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Store size={14} className="text-red-500" />
                    Sucursales y Almacenes
                  </h4>
                  <p className="font-sans text-[11px] text-neutral-400 mt-1">
                    Gestiona las diferentes sucursales y puntos de recogida físicos en Cuba.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingBranch(null);
                    setBranchForm({ name: '', address: '', phone: '', email: '', schedule: '', image: '' });
                    setShowBranchModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Agregar Sucursal</span>
                </button>
              </div>

              {branches.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                  <Store size={24} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-[11px] text-zinc-500">No hay sucursales registradas. Agrega la primera.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {branches.map(b => (
                    <div key={b.id} className="bg-black/40 border border-zinc-800 rounded-xl p-3 flex gap-3">
                      {b.image && (
                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                          <img src={b.image} alt={b.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white truncate">{b.name}</h5>
                          <span className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1"><MapPin size={10} />{b.address}</p>
                        {b.phone && <p className="text-[10px] text-zinc-500 font-mono">{b.phone}</p>}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setEditingBranch(b);
                              setBranchForm({ name: b.name, address: b.address, phone: b.phone, email: b.email, schedule: b.schedule, image: b.image });
                              setShowBranchModal(true);
                            }}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`¿Eliminar la sucursal "${b.name}"?`)) {
                                try {
                                  await branchesService.deleteBranch(b.id);
                                  setBranches(prev => prev.filter(x => x.id !== b.id));
                                  playSuccessBeep();
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-500 hover:text-red-400 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Modal wrapper for Add/Edit products */}
      {showProductModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="font-sans font-bold text-base text-white">
                {editingProduct ? 'Editar Producto del Catálogo' : 'Añadir Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="text-neutral-400 hover:text-white font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">NOMBRE DEL PRODUCTO *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">TIPO DE PRODUCTO *</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="moto">Motocicleta (Vehículo)</option>
                    <option value="pieza">Pieza, Repuesto o Accesorio</option>
                    <option value="otros">Otros (Misceláneos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">PRECIO *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">MONEDA</label>
                  <select
                    value={productForm.currency}
                    onChange={(e) => setProductForm({ ...productForm, currency: e.target.value as Currency })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="MLC">MLC</option>
                    <option value="CUP">CUP ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">DISTR. CATEGORÍA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Superbike, Escapes, Llantas"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">STOCK DISPONIBLE</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">FOTO DEL PRODUCTO *</label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageFileRef.current ? '' : productForm.image}
                    onChange={(e) => {
                      imageFileRef.current = null;
                      setImagePreview('');
                      setProductForm({ ...productForm, image: e.target.value });
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    Subir
                  </label>
                </div>

                {(imagePreview || productForm.image.startsWith('http')) && (
                  <div className="relative w-full h-32 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
                    <img
                      src={imagePreview || productForm.image}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">DESCRIPCIÓN COMERCIAL</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                  placeholder="Escribe los detalles de presentación al público..."
                />
              </div>

              {/* Specifications / Features constructor */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-neutral-400">CARACTERÍSTICAS TÉCNICAS (FEATURES)</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Frenos ABS, Motor de 4 cilindros, Aleación de titanio..."
                    value={productForm.featureInput}
                    onChange={(e) => setProductForm({ ...productForm, featureInput: e.target.value })}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors select-none cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>

                {/* Features List Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {productForm.features.map((feat, idx) => (
                    <span key={idx} className="bg-neutral-955 text-neutral-300 border border-neutral-850 px-2.5 py-1 rounded text-[10px] flex items-center gap-1.5">
                      <span>{feat}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-red-500 hover:text-red-400 font-extrabold font-sans"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 rounded-xl font-sans text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Branch Add/Edit Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="font-sans font-bold text-base text-white">
                {editingBranch ? 'Editar Sucursal' : 'Agregar Nueva Sucursal'}
              </h3>
              <button 
                onClick={() => setShowBranchModal(false)}
                className="text-neutral-400 hover:text-white font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!branchForm.name.trim()) {
                alert('El nombre de la sucursal es requerido.');
                return;
              }
              try {
                if (editingBranch) {
                  const updated = await branchesService.updateBranch(editingBranch.id, branchForm);
                  setBranches(prev => prev.map(b => b.id === editingBranch.id ? updated : b));
                } else {
                  const created = await branchesService.createBranch(branchForm);
                  setBranches(prev => [...prev, created]);
                }
                setShowBranchModal(false);
                playSuccessBeep();
              } catch (err) {
                console.error(err);
                alert('Error al guardar la sucursal.');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">NOMBRE DE LA SUCURSAL *</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="Ej: Sucursal Bayamo Centro"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">DIRECCIÓN</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Ej: Calle Principal #123, Bayamo, Granma"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">TELÉFONO</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+53 5212 3456"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">CORREO</label>
                  <input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="sucursal@treckmotors.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">HORARIO DE ATENCIÓN</label>
                <input
                  type="text"
                  value={branchForm.schedule}
                  onChange={(e) => setBranchForm({ ...branchForm, schedule: e.target.value })}
                  placeholder="Lun-Vie: 8:30-17:30, Sáb: 9:00-13:00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">IMAGEN DE LA SUCURSAL (OPCIONAL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={branchForm.image}
                    onChange={(e) => setBranchForm({ ...branchForm, image: e.target.value })}
                    placeholder="https://ejemplo.com/foto-sucursal.jpg"
                    className="flex-1 w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const { uploadImage } = await import('../services/storage');
                        const ext = file.name.split('.').pop() || 'jpg';
                        const fileName = `branches/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve) => {
                          reader.onload = () => resolve((reader.result as string).split(',')[1]);
                          reader.readAsDataURL(file);
                        });
                        try {
                          const result = await uploadImage('products', fileName, base64, file.type);
                          setBranchForm({ ...branchForm, image: result.url });
                          playSuccessBeep();
                        } catch (err) {
                          console.error(err);
                          alert('Error al subir la imagen.');
                        }
                      }}
                    />
                    Subir Foto
                  </label>
                </div>
                {branchForm.image && (
                  <div className="mt-2 h-24 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
                    <img src={branchForm.image} alt="Preview sucursal" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-5 py-2.5 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 rounded-xl font-sans text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingBranch ? 'Actualizar Sucursal' : 'Crear Sucursal'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

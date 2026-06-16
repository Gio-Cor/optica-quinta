import React, { useState, useEffect } from 'react';
import {
  Trash2, CheckCircle, X, Edit2, Save,
  LayoutDashboard, Package, Users, BarChart3, LogOut, Search, Sliders, Calendar,
  TrendingUp, UserPlus, AlertCircle, ShoppingBag, Plus, Eye, Check, ShieldAlert, RefreshCw
} from 'lucide-react';
import { Product, Appointment, User, LensOption, WorkOrder } from '../types';
import { api } from '../services/api';

export const AdminPanel = ({ loggedInUser, onLogin, onLogout }: { loggedInUser?: User | null, onLogin?: (token: string, user: User) => void, onLogout?: () => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [lensOptions, setLensOptions] = useState<LensOption[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [view, setView] = useState<'dashboard' | 'products' | 'lens_options' | 'appointments' | 'reports'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  // Lens Options CRUD State
  const [isAddingLensOption, setIsAddingLensOption] = useState(false);
  const [newLensOption, setNewLensOption] = useState({ name: '', price_add: 0, is_active: true });
  const [editingLensOptionId, setEditingLensOptionId] = useState<number | null>(null);
  const [editLensOptionData, setEditLensOptionData] = useState<Partial<LensOption>>({});

  // Products CRUD State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', price: 0, image: '', description: '', stock: 0, category: 'lente', ar_image: '', model_3d: '', is_featured: false, discount_percent: 0 });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductData, setEditProductData] = useState<Partial<Product>>({});

  // Bulk actions state
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(0);

  // Appointments CRUD State
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [editApptData, setEditApptData] = useState<Partial<Appointment>>({});

  const isAuthenticated = !!loggedInUser;

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    try {
      const [p, a, l, w] = await Promise.all([
        api.getProducts().catch(err => { console.error("Error cargando productos:", err); return []; }),
        api.getAppointments().catch(err => { console.error("Error cargando citas:", err); return []; }),
        api.getLensOptions().catch(err => { console.error("Error cargando cristales:", err); return []; }),
        api.getWorkOrders().catch(err => { console.error("Error cargando órdenes:", err); return []; })
      ]);
      setProducts(p);
      setAppointments(a);
      setLensOptions(l);
      setWorkOrders(w);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('¿Eliminar producto?')) {
      await api.deleteProduct(id);
      refreshData();
    }
  };

  const handleUpdateStatus = async (id: number, status: Appointment["status"]) => {
    await api.updateAppointment(id, { status });
    refreshData();
  };

  const handleSaveAppointment = async (id: number) => {
    await api.updateAppointment(id, editApptData);
    setEditingAppointmentId(null);
    refreshData();
  };

  const handleSaveProduct = async (id: number) => {
    try {
      await api.updateProduct(id, editProductData);
      setEditingProductId(null);
      refreshData();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el producto');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct(newProduct);
      refreshData();
      setIsAddingProduct(false);
      setNewProduct({ name: '', brand: '', price: 0, image: '', description: '', stock: 0, category: 'lente', ar_image: '', model_3d: '', is_featured: false, discount_percent: 0 });
    } catch (error: any) {
      console.error(error);
      alert('Error al guardar el producto. Puede que la imagen sea demasiado grande o haya un problema de conexión.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleArFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, ar_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, model_3d: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProductData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditArFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProductData(prev => ({ ...prev, ar_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProductData(prev => ({ ...prev, model_3d: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLensOption = async (id: number) => {
    if (confirm('¿Eliminar opción de cristal?')) {
      await api.deleteLensOption(id);
      refreshData();
    }
  };

  const handleSaveLensOption = async (id: number) => {
    try {
      await api.updateLensOption(id, editLensOptionData);
      setEditingLensOptionId(null);
      refreshData();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar la opción');
    }
  };

  const handleCreateLensOption = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLensOption(newLensOption);
      refreshData();
      setIsAddingLensOption(false);
      setNewLensOption({ name: '', price_add: 0, is_active: true });
    } catch (error) {
      console.error(error);
      alert('Error al guardar la opción de cristal');
    }
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (filteredProducts: Product[]) => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkDiscount = async (remove = false) => {
    const finalPercent = remove ? 0 : bulkDiscountPercent;
    if (!remove && (finalPercent <= 0 || finalPercent > 100)) return alert('Porcentaje inválido. Usa un valor de 1 a 100.');
    if (selectedProductIds.length === 0) return alert('Selecciona al menos un producto.');
    try {
      for (const id of selectedProductIds) {
        await api.updateProduct(id, { discount_percent: finalPercent });
      }
      refreshData();
      setSelectedProductIds([]);
      setBulkDiscountPercent(0);
      alert(remove ? 'Descuentos eliminados correctamente.' : '¡Descuento aplicado masivamente!');
    } catch (error) {
      console.error(error);
      alert('Error al aplicar descuentos');
    }
  };

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return (
      <div className="pt-32 pb-20 px-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-ink/10 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-sans font-bold text-ink tracking-tight mb-4">Acceso Denegado</h2>
          <p className="text-ink/60 font-medium mb-8">No tienes permisos de administrador para acceder al Panel de Control.</p>
          <button
            onClick={() => { if (onLogout) onLogout(); }}
            className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Derived Stats for Dashboard (100% Real and Connected)
  const totalSalesSum = workOrders.reduce((sum, w) => sum + Number(w.total_amount), 0);
  const totalSalesStr = `$${totalSalesSum.toLocaleString('es-CL')}`;
  const salesCount = workOrders.length;

  const totalCitasCount = appointments.length;
  const pendingCitasCount = appointments.filter(a => a.status === 'pending').length;

  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const criticalStockCount = products.filter(p => (p.stock || 0) < 5).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;

  const filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!showOnlyFeatured || p.is_featured)
  );
  // --- Dynamic Dashboard Data ---
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const weeklySales = last7Days.map(date => {
    const total = workOrders
      .filter(w => w.created_at && typeof w.created_at === 'string' && w.created_at.startsWith(date))
      .reduce((sum, w) => sum + Number(w.total_amount), 0);
    const dayName = new Date(date).toLocaleDateString('es-CL', { weekday: 'short', timeZone: 'UTC' });
    return { day: dayName.charAt(0).toUpperCase() + dayName.slice(1), total };
  });
  const maxSale = Math.max(...weeklySales.map(d => d.total), 1);

  const topProducts = [...products]
    .filter(p => p.category === 'lente')
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))
    .slice(0, 3);

  return (
    <div className="flex min-h-screen bg-[#f4f4f4] text-ink font-sans pt-20">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-ink/5 flex flex-col justify-between py-8 px-6 fixed top-20 h-[calc(100vh-5rem)] z-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-ink text-white p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M2.002 12c.324-1.583 1.4-3 3-4h14c1.6 1 2.676 2.417 3 4-.324 1.583-1.4 3-3 4H5.002c-1.6-1-2.676-2.417-3-4z" /><circle cx="8" cy="12" r="2.5" /><circle cx="16" cy="12" r="2.5" /></svg>
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-ink">Óptica Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${view === 'dashboard'
                  ? 'bg-ink text-white shadow-md'
                  : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setView('products')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${view === 'products' || view === 'lens_options'
                  ? 'bg-ink text-white shadow-md'
                  : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                }`}
            >
              <Package className="w-5 h-5" />
              <span>Inventario</span>
            </button>
            <button
              onClick={() => setView('appointments')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${view === 'appointments'
                  ? 'bg-ink text-white shadow-md'
                  : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                }`}
            >
              <Users className="w-5 h-5" />
              <span>Gestión Usuarios</span>
            </button>
            <button
              onClick={() => setView('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${view === 'reports'
                  ? 'bg-ink text-white shadow-md'
                  : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Reportes</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div>
          <button
            onClick={() => { if (onLogout) onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        {/* Top Header Bar Removed to save space */}

        {/* Dashboard Pages */}
        <div className="p-10 flex-1 flex flex-col gap-8">
          {view === 'dashboard' ? (
            <>
              {/* Dashboard Title */}
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-ink/5 shadow-sm">
                <div>
                  <h1 className="text-3xl font-bold font-sans tracking-tight text-ink mb-1">Dashboard General</h1>
                  <p className="text-ink/50 text-sm font-medium">Resumen operativo de la Óptica.</p>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Ventas Totales */}
                <div className="bg-white rounded-2xl p-5 xl:p-6 shadow-sm border border-ink/5 flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-ink/50">Ventas Totales</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">+{salesCount} Ventas</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl xl:text-3xl font-bold tracking-tight whitespace-nowrap">{totalSalesStr}</span>
                    <div className="p-2 bg-ink/5 rounded-xl text-ink">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Citas Registradas */}
                <div className="bg-white rounded-2xl p-5 xl:p-6 shadow-sm border border-ink/5 flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-ink/50">Citas Registradas</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${pendingCitasCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {pendingCitasCount} Pendientes
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl xl:text-3xl font-bold tracking-tight">{totalCitasCount}</span>
                      <span className="text-xs xl:text-sm font-semibold text-ink">Citas</span>
                    </div>
                    <div className="p-2 bg-ink/5 rounded-xl text-ink">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Total Productos */}
                <div className="bg-white rounded-2xl p-5 xl:p-6 shadow-sm border border-ink/5 flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-ink/50">Total Productos</span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{totalStockUnits} Unidades</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl xl:text-3xl font-bold tracking-tight">{totalProductsCount}</span>
                      <span className="text-xs xl:text-sm font-semibold text-ink">Modelos</span>
                    </div>
                    <div className="p-2 bg-ink/5 rounded-xl text-ink">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Stock Crítico */}
                <div className="bg-white rounded-2xl p-5 xl:p-6 shadow-sm border border-ink/5 flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-ink/50">Stock Crítico</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${outOfStockCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {outOfStockCount} Agotados
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl xl:text-3xl font-bold tracking-tight">{criticalStockCount}</span>
                      <span className="text-xs xl:text-sm font-semibold text-ink">Alertas</span>
                    </div>
                    <div className="p-2 bg-ink/5 rounded-xl text-ink">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Actividad Semanal Chart (2/3 width) */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-ink/5 lg:col-span-2 flex flex-col justify-between">
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-ink">Ingresos de la Semana</h3>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">Real-Time</span>
                  </div>

                  {/* Dynamic rounded SVG bar chart */}
                  <div className="h-64 relative flex items-end justify-between px-4 pb-6 pt-4">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12">
                      <div className="border-b border-dashed border-ink/5 w-full h-0"></div>
                      <div className="border-b border-dashed border-ink/5 w-full h-0"></div>
                      <div className="border-b border-dashed border-ink/5 w-full h-0"></div>
                      <div className="border-b border-dashed border-ink/5 w-full h-0"></div>
                    </div>

                    {/* Chart Bars */}
                    {weeklySales.map((b, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 z-10 w-12 h-full justify-end group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-ink text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none transition-opacity whitespace-nowrap z-20">
                          ${b.total.toLocaleString('es-CL')}
                        </div>
                        <div
                          className="w-10 bg-ink rounded-lg hover:bg-accent transition-all duration-300"
                          style={{ height: `${Math.max(5, (b.total / maxSale) * 100)}%` }}
                        ></div>
                        <span className="text-xs font-bold text-ink/40 mt-1">{b.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 3 Productos (1/3 width) */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-ink/5 flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-ink">Productos Estrella</h3>
                    <p className="text-xs text-ink/50 mt-1 font-medium">Modelos más solicitados</p>
                  </div>

                  <div className="flex flex-col gap-4 flex-1">
                    {topProducts.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-ink/40 text-sm font-semibold border-2 border-dashed border-ink/5 rounded-2xl">Sin datos</div>
                    ) : (
                      topProducts.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-ink/5">
                          <div className="w-8 h-8 rounded-full bg-ink text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                            #{i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-ink text-sm truncate">{p.name}</h4>
                            <p className="text-xs font-semibold text-accent truncate">{p.brand}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-ink bg-white px-2 py-1 rounded-md shadow-sm border border-ink/5">
                              {p.stock} ud.
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : view === 'products' || view === 'lens_options' ? (
            <>
              {/* Inventario Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Inventario General</h1>
                  <p className="text-ink/50 text-sm">Gestiona tus productos y existencias de la tienda.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {selectedProductIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full border border-accent/20">
                      <span className="text-xs font-bold whitespace-nowrap hidden sm:inline">{selectedProductIds.length} selec.</span>
                      <div className="flex items-center gap-1 sm:border-l border-accent/20 sm:pl-2">
                        <input
                          type="number"
                          placeholder="% Desc"
                          min="0" max="100"
                          value={bulkDiscountPercent || ''}
                          onChange={e => setBulkDiscountPercent(Number(e.target.value))}
                          className="w-16 h-7 text-xs px-2 rounded bg-white border border-accent/20 text-ink focus:outline-none"
                        />
                        <button
                          onClick={() => handleBulkDiscount(false)}
                          className="bg-accent text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded hover:bg-accent/80 transition-colors"
                        >
                          Aplicar
                        </button>
                        <button
                          onClick={() => handleBulkDiscount(true)}
                          className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded hover:bg-red-600 transition-colors ml-1"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer text-ink/70 hover:text-ink transition-colors">
                    <input
                      type="checkbox"
                      checked={showOnlyFeatured}
                      onChange={e => setShowOnlyFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-ink/20 text-accent focus:ring-accent"
                    />
                    Solo Destacados
                  </label>
                  <div className="relative flex-1 md:w-auto">
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-white border border-ink/10 focus:border-ink/30 rounded-full py-2.5 pl-11 pr-4 text-sm w-full md:w-72 transition-all focus:outline-none shadow-sm"
                    />
                    <Search className="w-4 h-4 text-ink/40 absolute left-4 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-ink/5 overflow-hidden">
                <div className="p-6 border-b border-ink/5 flex justify-between items-center bg-white">
                  <h3 className="text-lg font-bold text-ink">Catálogo de Artículos</h3>
                  <button
                    onClick={() => setIsAddingProduct(!isAddingProduct)}
                    className="bg-ink text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-accent transition-colors flex items-center gap-1.5"
                  >
                    {isAddingProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{isAddingProduct ? 'Cancelar' : 'Agregar Producto'}</span>
                  </button>
                </div>

                {isAddingProduct && (
                  <div className="p-6 bg-paper/30 border-b border-ink/10">
                    <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Nombre</label>
                        <input required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full border border-ink/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-ink/30 bg-white" placeholder="Ej: Lentes Aviador" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Marca</label>
                        <input required value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} className="w-full border border-ink/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-ink/30 bg-white" placeholder="Ej: Ray-Ban" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Precio ($)</label>
                        <input required type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className="w-full border border-ink/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-ink/30 bg-white" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Stock</label>
                        <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="w-full border border-ink/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-ink/30 bg-white" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Categoría</label>
                        <select required value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value as 'lente' | 'accesorio' })} className="w-full border border-ink/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-ink/30 bg-white">
                          <option value="lente">Lente</option>
                          <option value="accesorio">Accesorio</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">% Descuento</label>
                        <input type="number" min="0" max="100" value={newProduct.discount_percent || 0} onChange={e => setNewProduct({ ...newProduct, discount_percent: Number(e.target.value) })} className="w-full border border-ink/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-ink/30 bg-white" />
                      </div>
                      <div className="flex items-center h-full md:pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-ink">
                          <input type="checkbox" checked={newProduct.is_featured || false} onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })} className="w-5 h-5 rounded border-ink/20 text-accent focus:ring-accent" />
                          Producto Destacado
                        </label>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Imagen del Producto (Catálogo)</label>
                        <input required type="file" accept="image/*" onChange={handleFileChange} className="w-full border border-ink/10 rounded-lg p-2 text-xs file:mr-4 file:py-1.5 file:px-3.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer" />
                        {newProduct.image && (
                          <div className="mt-3">
                            <img src={newProduct.image} alt="Vista previa" className="h-16 rounded-lg object-cover border border-ink/10 shadow-sm" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Foto Modelo Probador Virtual (PNG Transparente)</label>
                        <input type="file" accept="image/png,image/webp" onChange={handleArFileChange} className="w-full border border-ink/10 rounded-lg p-2 text-xs file:mr-4 file:py-1.5 file:px-3.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer" />
                        {newProduct.ar_image && (
                          <div className="mt-3">
                            <img src={newProduct.ar_image} alt="Vista previa probador" className="h-16 rounded-lg object-contain border border-ink/10 shadow-sm bg-slate-100 p-1" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2 block">Modelo 3D Anteojos (Archivo .GLB)</label>
                        <input type="file" accept=".glb" onChange={handleModelFileChange} className="w-full border border-ink/10 rounded-lg p-2 text-xs file:mr-4 file:py-1.5 file:px-3.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer" />
                        {newProduct.model_3d && (
                          <div className="mt-3 text-xs text-green-600 font-bold flex items-center gap-1.5">
                            <span>✓ Modelo 3D cargado correctamente ({Math.round(newProduct.model_3d.length / 1024)} KB base64)</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-full flex justify-end">
                        <button type="submit" className="bg-ink text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-accent transition-colors">Guardar Producto</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-xs uppercase tracking-widest font-bold border-b border-ink/5">
                        <th className="px-6 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                            onChange={() => toggleSelectAll(filteredProducts)}
                            className="w-4 h-4 rounded border-ink/20 text-accent focus:ring-accent cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Marca</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4 text-center">Stock</th>
                        <th className="px-6 py-4">Precio</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {filteredProducts.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-ink/50 font-bold">No se encontraron productos.</td></tr>
                      ) : filteredProducts.map(p => {
                        const isEditing = editingProductId === p.id;

                        if (isEditing) {
                          return (
                            <tr key={p.id} className="bg-slate-50 text-sm">
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.includes(p.id)}
                                  onChange={() => toggleProductSelection(p.id)}
                                  className="w-4 h-4 rounded border-ink/20 text-accent focus:ring-accent cursor-pointer"
                                />
                              </td>
                              <td className="px-6 py-4 flex flex-col gap-3 min-w-[280px]">
                                <input className="w-full border border-ink/10 p-2 rounded-lg bg-white font-semibold" value={editProductData.name || ''} onChange={e => setEditProductData({ ...editProductData, name: e.target.value })} placeholder="Nombre" />

                                <div className="flex flex-col gap-1 border-t border-ink/5 pt-2">
                                  <span className="text-[10px] font-bold text-ink/40 uppercase">Imagen Catálogo</span>
                                  <input className="w-full border border-ink/10 p-1.5 rounded-lg text-[10px] bg-white mb-1" value={editProductData.image || ''} onChange={e => setEditProductData({ ...editProductData, image: e.target.value })} placeholder="URL Imagen Catálogo" />
                                  <input type="file" accept="image/*" onChange={handleEditFileChange} className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer" />
                                </div>

                                <div className="flex flex-col gap-1 border-t border-ink/5 pt-2">
                                  <span className="text-[10px] font-bold text-ink/40 uppercase">Foto Modelo AR (PNG)</span>
                                  <input className="w-full border border-ink/10 p-1.5 rounded-lg text-[10px] bg-white mb-1" value={editProductData.ar_image || ''} onChange={e => setEditProductData({ ...editProductData, ar_image: e.target.value })} placeholder="URL Foto Modelo (PNG Transparente)" />
                                  <input type="file" accept="image/png,image/webp" onChange={handleEditArFileChange} className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer" />
                                </div>

                                <div className="flex flex-col gap-1 border-t border-ink/5 pt-2">
                                  <span className="text-[10px] font-bold text-ink/40 uppercase">Modelo 3D (GLB)</span>
                                  <input className="w-full border border-ink/10 p-1.5 rounded-lg text-[10px] bg-white mb-1" value={editProductData.model_3d || ''} onChange={e => setEditProductData({ ...editProductData, model_3d: e.target.value })} placeholder="URL Modelo 3D (GLB o Base64)" />
                                  <input type="file" accept=".glb" onChange={handleEditModelFileChange} className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer" />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <input className="w-full border border-ink/10 p-2 rounded-lg bg-white" value={editProductData.brand || ''} onChange={e => setEditProductData({ ...editProductData, brand: e.target.value })} placeholder="Marca" />
                              </td>
                              <td className="px-6 py-4">
                                <select className="w-full border border-ink/10 p-2 rounded-lg bg-white text-sm mb-2" value={editProductData.category || 'lente'} onChange={e => setEditProductData({ ...editProductData, category: e.target.value as 'lente' | 'accesorio' })}>
                                  <option value="lente">Lente</option>
                                  <option value="accesorio">Accesorio</option>
                                </select>
                                <input className="w-full border border-ink/10 p-2 rounded-lg bg-white text-sm mb-2" type="number" min="0" max="100" value={editProductData.discount_percent || 0} onChange={e => setEditProductData({ ...editProductData, discount_percent: Number(e.target.value) })} placeholder="% Desc." />
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink/70">
                                  <input type="checkbox" checked={editProductData.is_featured || false} onChange={e => setEditProductData({ ...editProductData, is_featured: e.target.checked })} className="w-4 h-4 rounded border-ink/20 text-accent focus:ring-accent" />
                                  Destacar
                                </label>
                              </td>
                              <td className="px-6 py-4">
                                <input className="w-full border border-ink/10 p-2 rounded-lg text-center w-20 bg-white" type="number" value={editProductData.stock ?? 0} onChange={e => setEditProductData({ ...editProductData, stock: Number(e.target.value) })} placeholder="Stock" />
                              </td>
                              <td className="px-6 py-4">
                                <input className="w-full border border-ink/10 p-2 rounded-lg w-24 bg-white" type="number" value={editProductData.price || 0} onChange={e => setEditProductData({ ...editProductData, price: Number(e.target.value) })} placeholder="Precio" />
                              </td>
                              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                <button onClick={() => handleSaveProduct(p.id)} className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                                  <Save className="w-5 h-5" />
                                </button>
                                <button onClick={() => setEditingProductId(null)} className="p-2 text-ink/50 hover:bg-ink/10 rounded-lg">
                                  <X className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => toggleProductSelection(p.id)}
                                className="w-4 h-4 rounded border-ink/20 text-accent focus:ring-accent cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="relative">
                                <img src={p.image} className="w-12 h-12 rounded-xl object-cover border border-ink/5" />
                                {p.is_featured && <span className="absolute -top-2 -right-2 bg-accent text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">⭐</span>}
                              </div>
                              <span className="font-bold text-ink">{p.name}</span>
                            </td>
                            <td className="px-6 py-4 text-ink/60 text-sm font-semibold">{p.brand}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.category === 'accesorio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {p.category === 'accesorio' ? 'Accesorio' : 'Lente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock && p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                {p.stock ?? 0} u.
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                {p.discount_percent && p.discount_percent > 0 ? (
                                  <>
                                    <span className="text-xs text-ink/40 line-through font-semibold">${p.price.toLocaleString('es-CL')}</span>
                                    <span className="text-sm font-bold text-red-500">${(p.price * (1 - p.discount_percent / 100)).toLocaleString('es-CL')} <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded ml-1">-{p.discount_percent}%</span></span>
                                  </>
                                ) : (
                                  <span className="text-sm font-bold">${p.price.toLocaleString('es-CL')}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right flex gap-3 justify-end items-center h-full pt-7">
                              <button onClick={() => { setEditingProductId(p.id); setEditProductData(p); }} className="text-blue-500 hover:bg-blue-50 rounded-lg p-2" title="Editar">
                                <Edit2 className="w-4.5 h-4.5" />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:bg-red-50 rounded-lg p-2" title="Eliminar">
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : view === 'appointments' ? (
            <>
              {/* Gestión Usuarios Header */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Citas & Turnos</h1>
                <p className="text-ink/50 text-sm font-medium">Administra las citas registradas de tus clientes.</p>
              </div>

              {/* Kanban Board Citas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-8">
                {[
                  { id: 'pending', title: 'Pendientes', color: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700' },
                  { id: 'confirmed', title: 'Confirmados', color: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
                  { id: 'cancelled', title: 'Cancelados', color: 'bg-red-400', badge: 'bg-red-100 text-red-700' }
                ].map(col => {
                  const colAppts = appointments.filter(a => a.status === col.id);
                  return (
                    <div key={col.id} className="flex flex-col gap-4 bg-white/50 border border-ink/5 rounded-3xl p-5 min-h-[500px]">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                        <h3 className="font-bold text-ink uppercase tracking-wider text-sm">{col.title}</h3>
                        <span className="bg-white border border-ink/5 text-ink/60 shadow-sm text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                          {colAppts.length}
                        </span>
                      </div>

                      {colAppts.length === 0 && (
                        <div className="text-center py-10 text-ink/40 font-semibold text-sm border-2 border-dashed border-ink/10 rounded-2xl">
                          No hay citas
                        </div>
                      )}

                      {colAppts.map(a => {
                        const isEditing = editingAppointmentId === a.id;
                        if (isEditing) {
                          return (
                            <div key={a.id} className="bg-white rounded-2xl p-5 shadow-lg border border-ink/10 flex flex-col gap-3 relative z-10">
                              <input className="w-full border border-ink/10 p-2.5 rounded-xl bg-slate-50 text-sm font-bold focus:outline-none focus:border-ink/30" value={editApptData.name || ''} onChange={e => setEditApptData({ ...editApptData, name: e.target.value })} placeholder="Nombre" />
                              <input className="w-full border border-ink/10 p-2.5 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-ink/30" value={editApptData.email || ''} onChange={e => setEditApptData({ ...editApptData, email: e.target.value })} placeholder="Correo" />
                              <input className="w-full border border-ink/10 p-2.5 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-ink/30" value={editApptData.phone || ''} onChange={e => setEditApptData({ ...editApptData, phone: e.target.value })} placeholder="Teléfono" />
                              <input className="w-full border border-ink/10 p-2.5 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-ink/30" value={editApptData.service || ''} onChange={e => setEditApptData({ ...editApptData, service: e.target.value })} placeholder="Servicio" />
                              <div className="flex gap-2">
                                <input className="w-full border border-ink/10 p-2.5 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-ink/30" type="date" value={editApptData.date || ''} onChange={e => setEditApptData({ ...editApptData, date: e.target.value })} />
                                <input className="w-full border border-ink/10 p-2.5 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-ink/30" type="time" value={editApptData.time || ''} onChange={e => setEditApptData({ ...editApptData, time: e.target.value })} />
                              </div>
                              <select className="border border-ink/10 p-2.5 rounded-xl bg-slate-50 w-full text-xs font-bold focus:outline-none focus:border-ink/30" value={editApptData.status || ''} onChange={e => setEditApptData({ ...editApptData, status: e.target.value as any })}>
                                <option value="pending">PENDIENTE</option>
                                <option value="confirmed">CONFIRMADO</option>
                                <option value="cancelled">CANCELADO</option>
                              </select>
                              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-ink/5">
                                <button onClick={() => setEditingAppointmentId(null)} className="px-3 py-2 text-xs font-bold text-ink/50 hover:bg-ink/10 rounded-xl transition-colors">Cancelar</button>
                                <button onClick={() => handleSaveAppointment(a.id)} className="px-4 py-2 text-xs font-bold text-white bg-ink rounded-xl hover:bg-accent transition-colors flex items-center gap-1.5 shadow-sm"><Save className="w-4 h-4" /> Guardar</button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-ink/5 hover:shadow-md transition-all group relative cursor-default">
                            <div className="flex justify-between items-start mb-3">
                              <span className="bg-ink/5 text-ink px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase truncate max-w-[140px]">{a.service}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-ink/5 shadow-sm">
                                <button onClick={() => { setEditingAppointmentId(a.id); setEditApptData(a); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md" title="Editar cita"><Edit2 className="w-3.5 h-3.5" /></button>
                                {col.id !== 'confirmed' && <button onClick={() => handleUpdateStatus(a.id, 'confirmed')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Confirmar cita"><CheckCircle className="w-3.5 h-3.5" /></button>}
                                {col.id !== 'cancelled' && <button onClick={() => handleUpdateStatus(a.id, 'cancelled')} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md" title="Cancelar cita"><X className="w-3.5 h-3.5" /></button>}
                              </div>
                            </div>

                            <h4 className="font-bold text-ink text-sm mb-1">{a.name}</h4>
                            <div className="text-xs text-ink/60 space-y-1 mb-5 font-medium">
                              <p>{a.email}</p>
                              <p>{a.phone}</p>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-ink/70 bg-slate-50 p-2.5 rounded-xl border border-ink/5">
                              <Calendar className="w-4 h-4 opacity-50" />
                              <span>{a.date}</span>
                              <span className="text-ink/30">•</span>
                              <span>{a.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Reports View */
            <>
              {/* Reportes Header */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Reportes & Ventas</h1>
                <p className="text-ink/50 text-sm font-medium">Descarga informes financieros y métricas oficiales de tu tienda.</p>
              </div>

              {/* Beautiful AI Report Downloader Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-ink/5 p-12 text-center max-w-2xl mx-auto mt-10">
                <div className="w-16 h-16 bg-ink/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-ink" />
                </div>
                <h3 className="text-2xl font-serif text-ink mb-4 font-bold">Reportes de Ventas del Mes</h3>
                <p className="text-ink/60 mb-10 text-sm max-w-md mx-auto leading-relaxed">
                  Descarga el resumen oficial de ventas, ingresos reales por señas cobradas, desglose de lentes con cristales dinámicos y métricas operativas del mes en curso.
                </p>

                <button
                  onClick={() => api.downloadMonthlyReport()}
                  className="bg-ink text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-accent hover:scale-105 transition-all text-sm flex items-center justify-center gap-3 mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Descargar PDF de Ventas del Mes</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

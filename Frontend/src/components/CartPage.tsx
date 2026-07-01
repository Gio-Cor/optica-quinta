import React, { useState } from 'react';
import { Product, CartItem, User } from '../types';
import { Trash2, MessageCircle, RefreshCw, ShieldCheck, Truck, CreditCard, Plus, CheckCircle2, Lock, QrCode, Building } from 'lucide-react';
import { api } from '../services/api';
import { showAlert } from '../utils/swal';

interface CartPageProps {
  items: CartItem[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onAddToCart: (product: Product) => void;
  loggedInUser?: User | null;
  onNavigateToTab?: (tab: string) => void;
}

export const CartPage = ({ items, onRemove, onUpdateQuantity, onCheckout, onContinueShopping, onAddToCart, loggedInUser, onNavigateToTab }: CartPageProps) => {
  const [selectedItems, setSelectedItems] = useState<boolean[]>(items.map(() => true));
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recFilter, setRecFilter] = useState<'all' | 'lente' | 'accesorio'>('all');

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Estados de pasarela de pago simulada
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardData, setCardData] = useState({ number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123', name: '' });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr' | 'transfer'>('card');

  React.useEffect(() => {
    // Refresh selected when items change
    setSelectedItems(prev => {
      const newSelected = [...prev];
      while (newSelected.length < items.length) newSelected.push(true);
      return newSelected.slice(0, items.length);
    });
  }, [items.length]);

  React.useEffect(() => {
    api.getProducts().then(products => {
      setRecommendedProducts(products);
    }).catch(console.error);
  }, []);

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);

      // Verificar si algún producto seleccionado requiere receta o agendamiento de cita
      const selectedCartItems = items.filter((_, idx) => selectedItems[idx]);
      const requiresPrescription = selectedCartItems.some(item => {
        const name = item.lensOption.name.toLowerCase();
        return name.includes('receta') || name.includes('cita');
      });

      if (requiresPrescription) {
        // 1. Debe estar registrado y con sesión iniciada
        if (!loggedInUser) {
          showAlert('Identificación Requerida', 'Para proceder con la compra de productos con receta o cristales personalizados, primero debes iniciar sesión o registrarte.', 'warning');
          if (onNavigateToTab) {
            onNavigateToTab('admin');
          }
          setIsCheckingOut(false);
          return;
        }

        // 2. Debe tener una cita registrada en Supabase
        let hasAppointment = false;
        try {
          const appointments = await api.getAppointments();
          hasAppointment = appointments.some(
            app => app.email.toLowerCase() === loggedInUser.email.toLowerCase()
          );
        } catch (err) {
          console.error("Error al validar citas en la base de datos:", err);
        }

        if (!hasAppointment) {
          showAlert('Cita Médica Requerida', 'Primero pide tu cita médica. Para comprar productos con receta o agendar cristales en tienda, el sistema requiere verificar que tengas una cita agendada.', 'warning');
          if (onNavigateToTab) {
            onNavigateToTab('appointments');
          }
          setIsCheckingOut(false);
          return;
        }
      }

      // En lugar de llamar a Stripe, abrimos la pasarela de pago simulada para la demostración
      setShowPaymentModal(true);
      setPaymentStep('form');
      setIsCheckingOut(false);
    } catch (error) {
      console.error(error);
      showAlert('Error al comprar', 'Hubo un error al procesar tu compra. Por favor intenta nuevamente.', 'error');
      setIsCheckingOut(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPaymentStep('processing');
    try {
      const selectedCartItems = items.filter((_, idx) => selectedItems[idx]);

      // Registrar la orden en Supabase
      await api.createWorkOrder(
        loggedInUser?.id || null, 
        selectedCartItems,
        totalPrice
      );

      // Reducir el stock de cada producto comprado
      for (const item of selectedCartItems) {
        const product = item.product;
        const newStock = Math.max(0, (product.stock ?? 0) - item.quantity);
        try {
          await api.updateProduct(product.id, { stock: newStock });
        } catch (stockErr) {
          console.error(`Error actualizando stock del producto ${product.id}:`, stockErr);
        }
      }
      
      setPaymentStep('success');
      setTimeout(() => {
        setShowPaymentModal(false);
        onCheckout();
      }, 1500);
    } catch (err) {
      console.error("Error al registrar la orden en Supabase:", err);
      showAlert('Error de Registro', 'Hubo un error al guardar tu compra en el sistema. Intenta de nuevo.', 'error');
      setPaymentStep('form');
    }
  };

  const toggleSelectAll = () => {
    const allSelected = selectedItems.every(Boolean);
    setSelectedItems(items.map(() => !allSelected));
  };

  const toggleItemSelection = (index: number) => {
    const newSelected = [...selectedItems];
    newSelected[index] = !newSelected[index];
    setSelectedItems(newSelected);
  };

  const updateQuantity = (index: number, delta: number) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(index, delta);
    }
  };

  const calculateItemTotal = (price: number, qty: number) => {
    const fullPriceUnits = Math.ceil(qty / 2);
    const halfPriceUnits = Math.floor(qty / 2);
    return (fullPriceUnits * price) + (halfPriceUnits * price * 0.5);
  };

  const calculateTotal = () => {
    return items.reduce((total, item, index) => {
      if (selectedItems[index]) {
        const basePrice = item.product.discount_percent && item.product.discount_percent > 0
          ? item.product.price * (1 - item.product.discount_percent / 100)
          : item.product.price;
        const unitPrice = basePrice + item.lensOption.price_add;
        return total + calculateItemTotal(unitPrice, item.quantity);
      }
      return total;
    }, 0);
  };

  const totalItemsSelected = selectedItems.filter(Boolean).length;
  const totalPrice = calculateTotal();

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen font-sans bg-paper/30">

      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-bold text-ink">Mi carrito de compras ({items.length})</h1>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={items.length > 0 && selectedItems.every(Boolean)}
          onChange={toggleSelectAll}
          className="w-5 h-5 rounded border-ink/20 text-accent focus:ring-accent"
        />
        <label className="text-ink/80 text-sm">Seleccionar todo</label>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Lado Izquierdo: Lista de Productos */}
        <div className="lg:col-span-2 space-y-6">
          {items.length === 0 ? (
            <div className="bg-white p-12 rounded-[24px] shadow-lg border border-ink/5 text-center">
              <p className="text-ink/60 text-lg mb-6">Su carrito está vacío</p>
              <button
                onClick={onContinueShopping}
                className="text-accent hover:underline font-bold"
              >
                Volver al catálogo
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] shadow-lg border border-ink/5 overflow-hidden p-6">
              {items.map((item, index) => (
                <div key={`${item.product.id}-${index}`} className={`flex flex-col md:flex-row gap-6 ${index !== items.length - 1 ? 'border-b border-ink/10 pb-8 mb-8' : ''}`}>

                  {/* Checkbox & Imagen */}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems[index]}
                      onChange={() => toggleItemSelection(index)}
                      className="w-5 h-5 mt-2 rounded border-ink/20 text-accent focus:ring-accent"
                    />
                    <img src={item.product.image} alt={item.product.name} className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-xl" />
                  </div>

                  {/* Detalles */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-ink/60 text-sm uppercase tracking-wider mb-1">Marco: <span className="font-bold text-ink">{item.product.name}</span></h3>
                        <p className="text-ink/60 text-sm">Color: <span className="text-ink">Carey</span></p>
                      </div>
                      <div className="text-right">
                        {item.product.discount_percent && item.product.discount_percent > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-ink/40 line-through">CLP${item.product.price.toLocaleString('es-CL')}</span>
                            <span className="font-bold text-red-500">CLP${(item.product.price * (1 - item.product.discount_percent / 100)).toLocaleString('es-CL')}</span>
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold mt-1">-{item.product.discount_percent}%</span>
                          </div>
                        ) : (
                          <span className="font-bold text-ink">CLP${item.product.price.toLocaleString('es-CL')}</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <button className="text-accent text-sm font-bold flex items-center gap-1 hover:underline mb-2">
                        Detalles del cristal <span className="text-xs">^</span> <span className="font-normal text-xs ml-2">Editar cristales</span>
                      </button>

                      <div className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
                        <span className="text-ink/60 uppercase text-xs font-bold tracking-wider">Tipo de lentes:</span>
                        <span className="text-ink font-bold text-xs uppercase text-right">{item.lensOption.name} {item.lensOption.price_add > 0 && `(+$${item.lensOption.price_add.toLocaleString('es-CL')})`}</span>

                        <span className="text-ink/60 text-xs">Tinte:</span>
                        <span className="text-ink text-xs text-right">Azul (Oscuro)</span>

                        <span className="text-ink/60 text-xs">Cristal:</span>
                        <span className="text-ink text-xs text-right">Esférico Delgado (1.56)</span>

                        <span className="text-ink/60 text-xs">Recubrimientos:</span>
                        <span className="text-ink text-xs text-right">Estándar</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center gap-4">
                        <span className="text-ink/60 text-sm">Cantidad:</span>
                        <div className="flex items-center border border-ink/20 rounded-lg">
                          <button onClick={() => updateQuantity(index, -1)} className="px-3 py-1 hover:bg-ink/5 transition-colors">-</button>
                          <span className="px-4 py-1 font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(index, 1)} className="px-3 py-1 text-accent hover:bg-ink/5 transition-colors">+</button>
                        </div>
                        <button
                          onClick={() => onRemove(index)}
                          className="text-accent hover:underline text-sm flex items-center gap-1 ml-4"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-ink/5 flex justify-between items-center">
                      <span className="font-bold text-ink">Subtotal {item.quantity > 1 && <span className="text-accent text-xs ml-2 font-normal">(50% dcto aplicado a segundas uds.)</span>}</span>
                      <span className="font-bold text-lg text-ink">
                        CLP${calculateItemTotal(
                          (item.product.discount_percent && item.product.discount_percent > 0
                            ? item.product.price * (1 - item.product.discount_percent / 100)
                            : item.product.price) + item.lensOption.price_add,
                          item.quantity
                        ).toLocaleString('es-CL')}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

            {/* Sección de Productos Recomendados */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-ink mb-6">Productos recomendados</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              <button 
                onClick={() => setRecFilter('all')}
                className={`px-6 py-2 rounded-full border whitespace-nowrap transition-all ${recFilter === 'all' ? 'border-accent text-accent font-bold bg-accent/5 ring-1 ring-accent' : 'border-ink/20 text-ink hover:border-ink/50 bg-transparent'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setRecFilter('lente')}
                className={`px-6 py-2 rounded-full border whitespace-nowrap transition-all ${recFilter === 'lente' ? 'border-accent text-accent font-bold bg-accent/5 ring-1 ring-accent' : 'border-ink/20 text-ink hover:border-ink/50 bg-transparent'}`}
              >
                Lentes
              </button>
              <button 
                onClick={() => setRecFilter('accesorio')}
                className={`px-6 py-2 rounded-full border whitespace-nowrap transition-all ${recFilter === 'accesorio' ? 'border-accent text-accent font-bold bg-accent/5 ring-1 ring-accent' : 'border-ink/20 text-ink hover:border-ink/50 bg-transparent'}`}
              >
                Accesorios
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {recommendedProducts
                .filter(p => !items.some(item => item.product.id === p.id)) // Excluir productos ya en el carrito
                .filter(p => recFilter === 'all' || p.category === recFilter)
                .slice(0, 4) // Mostrar hasta 4 recomendaciones
                .map((acc) => (
                  <div key={acc.id} className="bg-white rounded-2xl p-4 shadow-sm border border-ink/5 hover:shadow-md transition-shadow flex flex-col items-center text-center relative group">
                    <div className="w-full aspect-square bg-paper rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                      <img src={acc.image} alt={acc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${!acc.stock || acc.stock <= 0
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-700'
                        }`}>
                        {!acc.stock || acc.stock <= 0 ? 'Agotado' : `Stock: ${acc.stock}`}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-ink line-clamp-2 min-h-[40px]">{acc.name}</h4>
                    <p className="text-accent font-bold mt-1">CLP${acc.price.toLocaleString('es-CL')}</p>

                    {acc.stock && acc.stock > 0 ? (
                      <button
                        onClick={() => onAddToCart(acc)}
                        className="mt-3 w-full bg-ink text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-4 h-4" /> Agregar
                      </button>
                    ) : (
                      <button
                        disabled
                        className="mt-3 w-full bg-gray-300 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-4 h-4" /> Agotado
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[24px] shadow-lg border border-ink/5 p-8 sticky top-32">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-ink">Artículos:</span>
              <span className="font-bold text-ink">{totalItemsSelected}</span>
            </div>
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-ink/10">
              <span className="font-bold text-ink text-lg">Total:</span>
              <span className="font-bold text-ink text-2xl">CLP${totalPrice.toLocaleString('es-CL')}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={totalItemsSelected === 0 || isCheckingOut}
              className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isCheckingOut ? 'Procesando...' : 'Finalizar compra'}
            </button>

            <button
              onClick={onContinueShopping}
              className="w-full text-accent font-medium hover:underline text-sm mb-8"
            >
              Seguir comprando
            </button>

            <div className="space-y-4 pt-6 border-t border-ink/10">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-ink/60 shrink-0 mt-0.5" />
                <p className="text-xs text-ink/70">
                  <span className="font-bold">Envío estándar gratis en Chile desde CLP $69.990</span><br />
                  (Aplica antes de añadir los gastos de envío.)
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-ink/70">
                <RefreshCw className="w-5 h-5 text-ink/60" />
                <p>Cambio y devolución en 60 días</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink/70">
                <ShieldCheck className="w-5 h-5 text-ink/60" />
                <p>Garantía de 365 días</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-ink/10">
              <p className="text-xs font-bold text-ink mb-3">Aceptamos:</p>
              <div className="flex gap-2 flex-wrap text-ink/40">
                <CreditCard className="w-8 h-8" />
                {/* Simulación de logos */}
                <div className="w-8 h-8 rounded bg-ink/10 flex items-center justify-center text-[8px] font-bold">VISA</div>
                <div className="w-8 h-8 rounded bg-ink/10 flex items-center justify-center text-[8px] font-bold">MC</div>
                <div className="w-12 h-8 rounded bg-ink/10 flex items-center justify-center text-[8px] font-bold">MACH</div>
                <div className="w-12 h-8 rounded bg-ink/10 flex items-center justify-center text-[8px] font-bold">PayPal</div>
              </div>
              <p className="text-[10px] text-ink/50 mt-4 leading-relaxed">
                La forma más segura y fácil de pagar, aceptamos tarjeta de crédito. También puedes pagar con VISA o Mastercard a través de PayPal sin necesidad de registrarte en PayPal.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Pasarela de Pago Simulada */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          {/* Inyección de estilos de animación para el láser QR */}
          <style>{`
            @keyframes scan {
              0%, 100% { top: 0%; }
              50% { top: 100%; }
            }
            .laser-line {
              animation: scan 2s linear infinite;
            }
          `}</style>

          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-ink/5 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {paymentStep === 'form' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-600" /> Pasarela de Pago
                  </h3>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="text-ink/40 hover:text-ink text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="bg-paper p-4 rounded-2xl mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-ink/50 uppercase tracking-widest font-bold mb-0.5">Monto a pagar</p>
                    <p className="text-2xl font-bold text-accent">CLP${totalPrice.toLocaleString('es-CL')}</p>
                  </div>
                  <span className="text-[10px] bg-accent/10 text-accent font-bold px-2.5 py-1 rounded-full border border-accent/20">Modo Demo</span>
                </div>

                {/* Selector de métodos de pago (Pestañas) */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${paymentMethod === 'card' ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent' : 'border-ink/10 text-ink/60 hover:border-ink/20'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Tarjeta</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('qr')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${paymentMethod === 'qr' ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent' : 'border-ink/10 text-ink/60 hover:border-ink/20'}`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Pago QR</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${paymentMethod === 'transfer' ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent' : 'border-ink/10 text-ink/60 hover:border-ink/20'}`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Transferir</span>
                  </button>
                </div>

                {/* Tarjeta Bancaria */}
                {paymentMethod === 'card' && (
                  <div>
                    {/* Tarjeta Virtual Interactiva */}
                    <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-6 h-40 flex flex-col justify-between font-mono">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Tarjeta de Crédito</span>
                        <div className="w-9 h-6 bg-amber-400/80 rounded-md border border-amber-300 opacity-90"></div>
                      </div>
                      <div className="text-md sm:text-lg tracking-[0.2em] font-mono mt-3">
                        {cardData.number || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[8px] uppercase tracking-wider block opacity-50">Titular</span>
                          <span className="text-xs uppercase tracking-wider block truncate max-w-[150px]">{cardData.name || 'JUAN PEREZ'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase tracking-wider block opacity-50">Vence</span>
                          <span className="text-xs tracking-wider block">{cardData.expiry || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-ink/60 block mb-1">Nombre en la tarjeta</label>
                        <input 
                          type="text" 
                          placeholder="JUAN PEREZ"
                          className="w-full bg-paper border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-accent outline-none font-medium uppercase"
                          value={cardData.name}
                          onChange={e => setCardData({...cardData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-ink/60 block mb-1">Número de tarjeta</label>
                        <input 
                          type="text" 
                          className="w-full bg-paper border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-accent outline-none font-mono"
                          value={cardData.number}
                          onChange={e => setCardData({...cardData, number: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-ink/60 block mb-1">Fecha exp.</label>
                          <input 
                            type="text" 
                            placeholder="MM/AA"
                            className="w-full bg-paper border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-accent outline-none font-mono"
                            value={cardData.expiry}
                            onChange={e => setCardData({...cardData, expiry: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-ink/60 block mb-1">CVV</label>
                          <input 
                            type="password" 
                            placeholder="123"
                            maxLength={4}
                            className="w-full bg-paper border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-accent outline-none font-mono"
                            value={cardData.cvv}
                            onChange={e => setCardData({...cardData, cvv: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSimulatePayment}
                      className="w-full bg-accent text-white font-bold py-4 rounded-xl mt-6 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                    >
                      Confirmar Pago Seguro
                    </button>
                  </div>
                )}

                {/* Pago con Código QR */}
                {paymentMethod === 'qr' && (
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-semibold text-ink/65 text-center mb-6">
                      Escanea el código QR de prueba con tu aplicación bancaria o OnePay para realizar la transacción.
                    </p>

                    {/* Código QR Simulado */}
                    <div className="w-48 h-48 bg-slate-50 border border-ink/10 rounded-2xl p-4 flex items-center justify-center relative shadow-sm overflow-hidden mb-6">
                      {/* Línea láser de escaneo */}
                      <div className="laser-line absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_#8b5cf6]" />
                      
                      {/* Representación ficticia de QR con SVG */}
                      <svg viewBox="0 0 100 100" className="w-full h-full text-ink opacity-85">
                        <rect x="0" y="0" width="25" height="25" fill="currentColor"/>
                        <rect x="5" y="5" width="15" height="15" fill="white"/>
                        <rect x="75" y="0" width="25" height="25" fill="currentColor"/>
                        <rect x="80" y="5" width="15" height="15" fill="white"/>
                        <rect x="0" y="75" width="25" height="25" fill="currentColor"/>
                        <rect x="5" y="80" width="15" height="15" fill="white"/>
                        <path d="M 30,10 H 45 V 20 H 30 Z M 50,0 H 60 V 30 H 50 Z M 40,40 H 60 V 60 H 40 Z M 10,30 H 20 V 45 H 10 Z M 75,30 H 85 V 60 H 75 Z M 30,75 H 45 V 90 H 30 Z M 60,70 H 90 V 80 H 60 Z M 70,85 H 100 V 100 H 70 Z M 0,60 H 15 V 70 H 0 Z" fill="currentColor"/>
                      </svg>
                    </div>

                    <button 
                      onClick={handleSimulatePayment}
                      className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                    >
                      Confirmar Escaneo QR
                    </button>
                  </div>
                )}

                {/* Transferencia Bancaria */}
                {paymentMethod === 'transfer' && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-ink/65 mb-4">
                      Realiza una transferencia bancaria a los siguientes datos y haz clic en confirmar.
                    </p>

                    <div className="bg-paper p-4 rounded-2xl space-y-2.5 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-ink/50">Banco:</span>
                        <span className="text-ink font-bold">BancoEstado</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink/50">Tipo de Cuenta:</span>
                        <span className="text-ink font-bold">Cuenta Corriente</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink/50">Número:</span>
                        <span className="text-ink font-bold">129-038-102</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink/50">RUT Destino:</span>
                        <span className="text-ink font-bold">76.129.830-4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink/50">Correo:</span>
                        <span className="text-ink font-bold">pagos@opticasquinta.cl</span>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-ink/10 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                      <span className="text-xs font-bold text-ink/60 mb-1">Subir Comprobante de Transferencia</span>
                      <span className="text-[10px] text-ink/40">Opcional (PDF, PNG, JPG)</span>
                    </div>

                    <button 
                      onClick={handleSimulatePayment}
                      className="w-full bg-accent text-white font-bold py-4 rounded-xl mt-4 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                    >
                      Confirmar Transferencia
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-ink/40 text-center mt-4 flex items-center justify-center gap-1">
                  🔒 Conexión segura demo encriptada de 256 bits
                </p>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6" />
                <h4 className="text-lg font-bold text-ink mb-2">Procesando transacción</h4>
                <p className="text-sm text-ink/50">Por favor, no cierre esta ventana...</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-ink mb-2">¡Pago Aprobado!</h4>
                <p className="text-sm text-ink/50">Tu pedido ha sido procesado con éxito.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

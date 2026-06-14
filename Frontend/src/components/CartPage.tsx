import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { Trash2, MessageCircle, RefreshCw, ShieldCheck, Truck, CreditCard, Plus } from 'lucide-react';
import { api } from '../services/api';

interface CartPageProps {
  items: CartItem[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onAddToCart: (product: Product) => void;
}

export const CartPage = ({ items, onRemove, onUpdateQuantity, onCheckout, onContinueShopping, onAddToCart }: CartPageProps) => {
  const [selectedItems, setSelectedItems] = useState<boolean[]>(items.map(() => true));
  const [accessories, setAccessories] = useState<Product[]>([]);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
      setAccessories(products.filter(p => p.category === 'accesorio'));
    }).catch(console.error);
  }, []);

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      const checkoutItems = items
        .filter((_, idx) => selectedItems[idx])
        .map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          lensOptionName: item.lensOption.name,
          lensAddonPrice: item.lensOption.price_add
        }));
      
      const totalAmount = calculateTotal();
      
      // Obtener la URL de Stripe desde el backend
      const checkoutUrl = await api.checkout(checkoutItems, totalAmount);
      
      // Redirigir al usuario a Stripe
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      alert('Hubo un error al procesar tu compra. Por favor intenta nuevamente.');
      setIsCheckingOut(false);
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
        const unitPrice = item.product.price + item.lensOption.price_add;
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
        <button className="text-accent hover:underline text-sm font-medium flex items-center gap-2">
          Comparta su carrito
        </button>
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
                      <span className="font-bold text-ink">CLP${item.product.price.toLocaleString('es-CL')}</span>
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
                      <span className="font-bold text-lg text-ink">CLP${calculateItemTotal(item.product.price + item.lensOption.price_add, item.quantity).toLocaleString('es-CL')}</span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sección de Accesorios (Real) */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-ink mb-6">Accesorios para lentes <span className="text-ink/50 text-sm font-normal">({accessories.length} Artículos)</span></h2>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              <button className="px-6 py-2 rounded-full border border-accent text-accent font-bold bg-accent/5 whitespace-nowrap">Todos</button>
              <button className="px-6 py-2 rounded-full border border-ink/20 text-ink hover:border-ink/50 whitespace-nowrap transition-colors">Paños para Lentes</button>
              <button className="px-6 py-2 rounded-full border border-ink/20 text-ink hover:border-ink/50 whitespace-nowrap transition-colors">Cadena para Lentes</button>
              <button className="px-6 py-2 rounded-full border border-ink/20 text-ink hover:border-ink/50 whitespace-nowrap transition-colors">Estuche para Lentes</button>
              <button className="px-6 py-2 rounded-full border border-ink/20 text-ink hover:border-ink/50 whitespace-nowrap transition-colors">Otros Accesorios</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {accessories.map((acc) => (
                <div key={acc.id} className="bg-white rounded-2xl p-4 shadow-sm border border-ink/5 hover:shadow-md transition-shadow flex flex-col items-center text-center relative group">
                  <div className="w-full aspect-square bg-paper rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                    <img src={acc.image} alt={acc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      !acc.stock || acc.stock <= 0 
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
                  <span className="font-bold">Envío estándar gratis en Chile desde CLP $69.990</span><br/>
                  (Aplica antes de añadir los gastos de envío.)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink/70">
                <MessageCircle className="w-5 h-5 text-ink/60" />
                <p>¿Necesita ayuda? <button className="text-accent hover:underline">Iniciar un Chat en vivo</button></p>
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
    </div>
  );
};

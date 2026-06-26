import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, ChevronRight, CheckCircle2, Shield, Truck, ChevronDown } from 'lucide-react';
import { Product, LensOption } from '../types';
import { api } from '../services/api';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, quantity: number, lensOption?: LensOption) => void;
  onTryOn: (p: Product) => void;
  onReserveAndBook?: (p: Product) => void;
}

export const ProductDetailModal = ({ product, onClose, onAddToCart, onTryOn, onReserveAndBook }: ProductDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('details'); // details, measurements
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<'buy_only' | 'reserve_appointment'>('reserve_appointment');
  const [lensOptions, setLensOptions] = useState<LensOption[]>([]);
  const [selectedLensOptionId, setSelectedLensOptionId] = useState<number | null>(null);
  const [show3D, setShow3D] = useState(!!product.model_3d);

  React.useEffect(() => {
    api.getLensOptions().then(options => {
      const activeOptions = options.filter(o => o.is_active);
      setLensOptions(activeOptions);
      if (activeOptions.length > 0 && selectedLensOptionId === null) {
        setSelectedLensOptionId(activeOptions[0].id);
      }
    }).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (product.model_3d && !document.getElementById('model-viewer-script')) {
      const script = document.createElement('script');
      script.id = 'model-viewer-script';
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, [product.model_3d]);

  const selectedOption = lensOptions.find(o => o.id === selectedLensOptionId);
  const basePrice = product.price;
  const discountedPrice = product.discount_percent ? basePrice * (1 - product.discount_percent / 100) : basePrice;
  const currentPrice = discountedPrice + (selectedOption?.price_add || 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-0 z-[100] bg-white overflow-y-auto w-full h-full"
    >
      <div className="w-full max-w-7xl mx-auto bg-white pt-20 relative pb-20">
        <button 
          onClick={onClose} 
          className="fixed top-6 right-6 z-10 p-3 bg-paper border border-ink/10 rounded-full hover:bg-ink hover:text-white transition-all shadow-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Top Split */}
        <div className="grid lg:grid-cols-2 gap-12 px-6">
          {/* Image Section */}
          <div className="flex flex-col items-center justify-center relative bg-white min-h-[400px]">
            {product.model_3d && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 flex bg-ink/5 p-1 rounded-xl z-20 border border-ink/5 backdrop-blur-sm">
                <button
                  onClick={() => setShow3D(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!show3D ? 'bg-white text-ink shadow-sm' : 'text-ink/65 hover:text-ink'}`}
                >
                  Imagen
                </button>
                <button
                  onClick={() => setShow3D(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${show3D ? 'bg-white text-ink shadow-sm' : 'text-ink/65 hover:text-ink'}`}
                >
                  Vista 3D 🌐
                </button>
              </div>
            )}

            <button 
              onClick={() => { onClose(); onTryOn(product); }}
              className="absolute top-0 right-0 md:left-1/2 md:-translate-x-1/2 bg-ink/70 text-white backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 hover:bg-accent transition-colors text-sm font-semibold shadow-xl z-10"
            >
              <Camera className="w-4 h-4" /> Probar Anteojos
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-xl aspect-[4/3] flex items-center justify-center relative mix-blend-multiply px-4"
            >
              {show3D && product.model_3d ? (
                // @ts-ignore
                <model-viewer
                  src={product.model_3d}
                  alt={product.name}
                  auto-rotate
                  camera-controls
                  shadow-intensity="1.5"
                  style={{ width: '100%', height: '100%', minHeight: '350px' }}
                  touch-action="pan-y"
                // @ts-ignore
                ></model-viewer>
              ) : (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
              )}
            </motion.div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-center py-6">
            <div className="mb-2">
              <h2 className="text-2xl font-bold tracking-[0.2em] uppercase text-ink">{product.brand}</h2>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-ink/60 text-sm font-semibold">{product.name} • SKU: {product.id.toString().padStart(5, '0')}OQ</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                  !product.stock || product.stock <= 0 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {!product.stock || product.stock <= 0 ? 'Agotado' : `Stock: ${product.stock}`}
                </span>
              </div>
            </div>
            
            <p className="text-ink/70 text-sm mt-4 mb-4 leading-relaxed">
              {product.description}
            </p>

            <div className="flex gap-3 mb-8">
              {product.discount_percent && product.discount_percent > 0 ? (
                <div className="inline-block bg-red-50 text-red-600 px-4 py-2 rounded-md border border-red-100 text-xs font-bold">
                  {product.discount_percent}% DE DESCUENTO
                </div>
              ) : null}
              {product.is_featured && (
                <div className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-md border border-accent/20 text-xs font-bold">
                  DESTACADO
                </div>
              )}
            </div>

            <div className="space-y-6 mb-8 py-8 border-y border-ink/10">
              {/* Badge 1: descuento primera compra — solo si NO tiene descuento ya aplicado */}
              {(!product.discount_percent || product.discount_percent === 0) && (
                <>
                  <div className="flex gap-4 items-center">
                    <CheckCircle2 className="w-6 h-6 text-ink shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Obtén un 15% de descuento</p>
                      <p className="text-xs text-ink/60 underline cursor-pointer hover:text-accent">En tu primera compra aquí.</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-ink/5" />
                </>
              )}

              {/* Badge 2: garantía — solo para lentes, no accesorios */}
              {product.category === 'lente' && (
                <>
                  <div className="flex gap-4 items-center">
                    <Shield className="w-6 h-6 text-ink shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Garantía óptica y estética</p>
                      <p className="text-xs text-ink/60 underline cursor-pointer hover:text-accent">Para ver nuestras garantías, haz click aquí</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-ink/5" />
                </>
              )}

              {/* Badge 3: envío — siempre visible, pero texto diferente según stock */}
              <div className="flex gap-4 items-center">
                <Truck className="w-6 h-6 text-ink shrink-0" />
                <div>
                  {product.stock && product.stock > 0 ? (
                    <>
                      <p className="font-semibold text-sm">Envío gratis en todo Chile</p>
                      <p className="text-xs text-ink/60 underline cursor-pointer hover:text-accent">
                        {product.stock <= 3
                          ? `¡Solo quedan ${product.stock} unidades! Recibe en 24h con retiro en tienda*`
                          : 'Recibe en 24 horas con retiro en tienda*'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm text-red-600">Producto agotado temporalmente</p>
                      <p className="text-xs text-ink/60">Puedes agendar una cita para consultar disponibilidad.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Badge 4: cristales Rodenstock — solo si es lente */}
              {product.category === 'lente' && (
                <>
                  <div className="w-full h-px bg-ink/5" />
                  <div className="flex gap-4 items-center">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Compatible con cristales Rodenstock</p>
                      <p className="text-xs text-ink/60">Agenda tu cita para diseñar tus cristales alemanes a medida.</p>
                    </div>
                  </div>
                </>
              )}

              {/* Badge especial: promo 2x1 — si stock >= 10 */}
              {product.stock && product.stock >= 10 && (
                <>
                  <div className="w-full h-px bg-ink/5" />
                  <div className="flex gap-4 items-center">
                    <CheckCircle2 className="w-6 h-6 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-orange-600">Promoción 2x1 activa</p>
                      <p className="text-xs text-ink/60">Lleva dos unidades y paga solo una. Oferta por tiempo limitado.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mb-10 flex justify-between items-end">
              <div>
                <span className="text-xs font-bold tracking-widest text-ink/80 block mb-2">PRECIO:</span>
                <span className="text-sm text-ink/60">Hasta 12 cuotas sin interés - Valor cuota: ${(currentPrice / 12).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="text-right">
                {product.discount_percent && product.discount_percent > 0 && (
                  <span className="block text-lg line-through text-ink/40 font-semibold mb-1">
                    ${(product.price + (selectedOption?.price_add || 0)).toLocaleString('es-CL')}
                  </span>
                )}
                <span className="text-3xl font-sans font-bold text-ink">${currentPrice.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {product.stock && product.stock > 0 ? (
              <div className="flex flex-col gap-6">
                
                <div className="mb-2">
                  <span className="text-xs font-bold tracking-widest text-ink/80 block mb-3 uppercase">¿Cómo deseas adquirir tu armazón?</span>
                  <div className="flex flex-col gap-3">
                    
                    {/* Option 1: Reserve & Book Appointment (Recommended) */}
                    <label 
                      onClick={() => setPurchaseType('reserve_appointment')}
                      className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all ${purchaseType === 'reserve_appointment' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-ink/20 hover:border-ink/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="purchaseType" 
                            value="reserve_appointment" 
                            checked={purchaseType === 'reserve_appointment'}
                            onChange={() => setPurchaseType('reserve_appointment')}
                            className="w-4 h-4 text-accent focus:ring-accent"
                          />
                          <span className="text-sm font-bold text-ink">Reservar Armazón + Cita en Tienda</span>
                        </div>
                        <span className="bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Recomendado</span>
                      </div>
                      <p className="text-xs text-ink/60 mt-2 pl-7 font-medium">
                        Asegura tu armazón gratis para que no se agote, y agenda una asesoría personalizada en tienda física para diseñar tus cristales premium <strong>Rodenstock</strong> alemanes a medida.
                      </p>
                    </label>

                    {/* Option 2: Buy Frame Only */}
                    <label 
                      onClick={() => setPurchaseType('buy_only')}
                      className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all ${purchaseType === 'buy_only' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-ink/20 hover:border-ink/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="purchaseType" 
                            value="buy_only" 
                            checked={purchaseType === 'buy_only'}
                            onChange={() => setPurchaseType('buy_only')}
                            className="w-4 h-4 text-accent focus:ring-accent"
                          />
                          <span className="text-sm font-bold text-ink">Solo Armazón (Sin Cristales)</span>
                        </div>
                      </div>
                      <p className="text-xs text-ink/60 mt-2 pl-7 font-medium">
                        Compra únicamente el marco. Te lo enviaremos a domicilio o podrás retirarlo para ponerle cristales de forma externa.
                      </p>
                    </label>

                  </div>
                </div>

                {purchaseType === 'buy_only' ? (
                  <>
                    <div className="flex items-center justify-between border border-ink/20 rounded-xl px-4 py-3">
                      <span className="text-sm font-bold text-ink/70">CANTIDAD</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="text-2xl text-ink/50 hover:text-ink w-8 flex justify-center"
                        >-</button>
                        <span className="text-lg font-bold text-ink w-6 text-center">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="text-2xl text-ink/50 hover:text-ink w-8 flex justify-center"
                        >+</button>
                      </div>
                    </div>
                    <button 
                      onClick={() => { 
                        const defaultLensOption: LensOption = { id: 1, name: 'Solo Armazón', price_add: 0, is_active: true };
                        onAddToCart(product, quantity, defaultLensOption); 
                        onClose(); 
                      }}
                      className="w-full bg-ink text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-ink/80 transition-all shadow-xl shadow-ink/20 transform hover:-translate-y-1"
                    >
                      AGREGAR AL CARRITO
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { 
                      if (onReserveAndBook) {
                        onReserveAndBook(product);
                      } else {
                        const defaultLensOption: LensOption = { id: 999, name: 'Reserva para Cristales Rodenstock (Cita en Tienda)', price_add: 0, is_active: true };
                        onAddToCart(product, 1, defaultLensOption);
                        onClose();
                      }
                    }}
                    className="w-full bg-accent text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 transform hover:-translate-y-1 flex flex-col items-center justify-center gap-0.5"
                  >
                    <span>RESERVAR Y AGENDAR CITA EN TIENDA</span>
                    <span className="text-[11px] font-normal opacity-85">Reserva gratis + Redirección a Citas</span>
                  </button>
                )}
              </div>
            ) : (
              <button 
                disabled
                className="w-full bg-gray-300 text-white py-5 rounded-[2rem] font-bold text-lg cursor-not-allowed shadow-xl shadow-gray-200"
              >
                PRODUCTO AGOTADO
              </button>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

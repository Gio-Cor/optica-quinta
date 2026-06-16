import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

export const Catalog = ({ onTryOn, onAddToCart, onViewDetail }: { onTryOn: (p: Product) => void, onAddToCart: (p: Product) => void, onViewDetail: (p: Product) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'lente' | 'accesorio'>('todos');

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productos = await api.getProducts();
        setProducts(productos);
      } catch (error) {
        console.error("Error cargando catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarProductos();
  }, []);

  if (loading) return <div className="py-20 text-center">Cargando catálogo...</div>;

  return (
    <section id="catalog-section" className="pt-32 pb-20 px-6 bg-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-serif mb-2">Nuestro Catálogo</h2>
            <p className="text-ink/60">Selección premium de armazones y cristales.</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveFilter('todos')}
              className={`px-6 py-2 rounded-full border text-sm transition-colors whitespace-nowrap ${activeFilter === 'todos' ? 'border-accent bg-accent/5 text-accent font-bold' : 'border-ink/10 hover:border-accent'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setActiveFilter('lente')}
              className={`px-6 py-2 rounded-full border text-sm transition-colors whitespace-nowrap ${activeFilter === 'lente' ? 'border-accent bg-accent/5 text-accent font-bold' : 'border-ink/10 hover:border-accent'}`}
            >
              Lentes
            </button>
            <button 
              onClick={() => setActiveFilter('accesorio')}
              className={`px-6 py-2 rounded-full border text-sm transition-colors whitespace-nowrap ${activeFilter === 'accesorio' ? 'border-accent bg-accent/5 text-accent font-bold' : 'border-ink/10 hover:border-accent'}`}
            >
              Accesorios
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.filter(p => activeFilter === 'todos' || p.category === activeFilter).map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
              onClick={() => onViewDetail(product)}
            >
              <div className="aspect-square rounded-3xl flex items-center justify-center mb-4 bg-paper relative overflow-hidden mix-blend-multiply">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                    {product.brand}
                  </span>
                </div>
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTryOn(product); }}
                    className="bg-paper text-ink p-4 rounded-full hover:bg-accent hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg"
                    title="Pruébatelos virtualmente"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  {product.stock && product.stock > 0 ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                      className="bg-accent text-white p-4 rounded-full hover:bg-white hover:text-accent transition-all transform translate-y-4 group-hover:translate-y-0 duration-400 shadow-lg"
                      title="Agregar al carrito"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      className="bg-gray-400 text-white p-4 rounded-full cursor-not-allowed transform translate-y-4 group-hover:translate-y-0 duration-400 shadow-lg"
                      title="Agotado"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ShoppingCart className="w-5 h-5 opacity-50" />
                    </button>
                  )}
                </div>

                {product.is_featured && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-accent text-white shadow-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                      Destacado
                    </span>
                  </div>
                )}
                
                {product.discount_percent && product.discount_percent > 0 ? (
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-red-500 text-white shadow-md px-2 py-1 rounded-md text-xs font-bold">
                      -{product.discount_percent}%
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-between items-start mt-4 mb-1">
                <h3 className="font-serif text-xl">{product.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                  !product.stock || product.stock <= 0 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {!product.stock || product.stock <= 0 ? 'Agotado' : `Stock: ${product.stock}`}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {product.discount_percent && product.discount_percent > 0 ? (
                  <>
                    <p className="text-accent font-semibold">${(product.price * (1 - product.discount_percent / 100)).toLocaleString('es-CL')}</p>
                    <p className="text-sm text-ink/40 line-through">${product.price.toLocaleString('es-CL')}</p>
                  </>
                ) : (
                  <p className="text-accent font-semibold">${product.price.toLocaleString('es-CL')}</p>
                )}
              </div>
              <p className="text-sm text-ink/50 line-clamp-2">{product.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

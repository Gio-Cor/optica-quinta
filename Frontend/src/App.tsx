import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Product, User, CartItem, LensOption } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Catalog } from './components/Catalog';
import { AppointmentSection } from './components/AppointmentSection';
import { ContactSection } from './components/ContactSection';
import { AdminPanel } from './components/AdminPanel';
import { Chatbot } from './components/Chatbot';
import { Footer } from './components/Footer';
import { VirtualTryOnModal } from './components/VirtualTryOnModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartPage } from './components/CartPage';
import { AuthForm } from './components/AuthForm';
import { UserProfile } from './components/UserProfile';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('adminUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('adminUser');
      return null;
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, full_name, address, payment_method, id')
          .eq('auth_id', session.user.id)
          .single();

        if (userData) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: userData.role,
            full_name: userData.full_name || '',
            address: userData.address || '',
            payment_method: userData.payment_method || ''
          };
          setLoggedInUser(user);
          localStorage.setItem('adminUser', JSON.stringify(user));
          localStorage.setItem('adminToken', session.access_token);
        }
      } else {
        setLoggedInUser(null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
      setSessionLoading(false);
    });

    const handlePopState = (e: PopStateEvent) => {
      if (!e.state?.productId) setDetailProduct(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenDetail = (product: Product) => {
    setDetailProduct(product);
    const urlSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    window.history.pushState({ productId: product.id }, '', `/producto/${urlSlug}`);
  };

  const handleCloseDetail = () => {
    setDetailProduct(null);
    window.history.pushState({}, '', '/');
  };

  const handleAddToCart = (product: Product, quantity: number = 1, lensOption?: LensOption) => {
    const defaultLensOption: LensOption = { id: 1, name: 'Solo Armazón', price_add: 0, is_active: true };
    const optionToUse = lensOption || defaultLensOption;

    setCartItems(prev => {
      const existing = prev.findIndex(item => item.product.id === product.id && item.lensOption.id === optionToUse.id);
      if (existing >= 0) {
        const newCart = [...prev];
        newCart[existing].quantity += quantity;
        return newCart;
      }
      return [...prev, { product, quantity, lensOption: optionToUse }];
    });
    alert(`Se agregó ${product.name} al carrito con cristales: ${optionToUse.name}`);
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'catalog': return <Catalog onTryOn={setTryOnProduct} onAddToCart={handleAddToCart} onViewDetail={handleOpenDetail} />;
      case 'cart': return (
        <CartPage
          items={cartItems}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={(index, delta) => {
            const newCart = [...cartItems];
            newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
            setCartItems(newCart);
          }}
          onAddToCart={handleAddToCart}
          onCheckout={() => {
            alert('¡Gracias por tu compra!');
            setCartItems([]);
            setActiveTab('home');
          }}
          onContinueShopping={() => setActiveTab('catalog')}
        />
      );
      case 'appointments': return <AppointmentSection />;
      case 'contact': return <ContactSection />;
      case 'admin':
        if (sessionLoading) return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-ink/60 text-sm">Verificando sesión...</p>
            </div>
          </div>
        );

        if (!loggedInUser) {
          return <AuthForm onLogin={(token, user) => {
            setLoggedInUser(user);
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));
          }} />;
        }

        if (loggedInUser.role === 'admin') {
          return <AdminPanel
            loggedInUser={loggedInUser}
            onLogout={async () => {
              await supabase.auth.signOut();
              setLoggedInUser(null);
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminUser');
            }}
          />;
        }

        return <UserProfile
          user={loggedInUser}
          onUpdateUser={(updatedUser) => {
            setLoggedInUser(updatedUser);
            localStorage.setItem('adminUser', JSON.stringify(updatedUser));
          }}
          onLogout={async () => {
            await supabase.auth.signOut();
            setLoggedInUser(null);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
          }}
        />;

      default: return (
        <>
          <Hero onShopNow={() => setActiveTab('catalog')} />
          <div className="bg-accent text-white py-12 overflow-hidden whitespace-nowrap">
            <div className="animate-marquee flex gap-20 items-center">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-20 items-center">
                  <span className="font-serif italic text-3xl">Rodenstock Specialists</span>
                  <span className="font-serif italic text-3xl">Precisely German</span>
                  <span className="font-serif italic text-3xl">Optical Excellence</span>
                </div>
              ))}
            </div>
          </div>
          <Catalog onTryOn={setTryOnProduct} onAddToCart={handleAddToCart} onViewDetail={handleOpenDetail} />
          <AppointmentSection />
          <ContactSection />
        </>
      );
    }
  };

  return (
    <div className="min-h-screen">
      {!(activeTab === 'admin' && loggedInUser?.role === 'admin') && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onOpenCart={() => setActiveTab('cart')}
          loggedInUser={loggedInUser}
          onLogout={() => {
            setLoggedInUser(null);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
          }}
        />
      )}

      <main>
        {renderContent()}
      </main>

      {!(activeTab === 'admin' && loggedInUser?.role === 'admin') && <Footer setActiveTab={setActiveTab} />}
      {!(activeTab === 'admin' && loggedInUser?.role === 'admin') && <Chatbot />}

      <AnimatePresence>
        {tryOnProduct && (
          <VirtualTryOnModal
            product={tryOnProduct}
            onClose={() => setTryOnProduct(null)}
          />
        )}
        {detailProduct && (
          <ProductDetailModal
            product={detailProduct}
            onClose={handleCloseDetail}
            onAddToCart={handleAddToCart}
            onTryOn={(p) => { handleCloseDetail(); setTryOnProduct(p); }}
            onReserveAndBook={(p) => {
              const reservationOption: LensOption = {
                id: 999,
                name: 'Reserva para Cristales Rodenstock (Cita en Tienda)',
                price_add: 0,
                is_active: true
              };
              handleAddToCart(p, 1, reservationOption);
              handleCloseDetail();
              setActiveTab('appointments');
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
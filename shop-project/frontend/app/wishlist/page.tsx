"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Star, StarHalf } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { getProductImageUrl } from '../../services/image';
import { formatCurrency } from '../../utils/currency';

export default function WishlistPage() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCountTrigger, setCartCountTrigger] = useState(0);

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await api.wishlist.get();
      setWishlistItems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.wishlist.delete(productId);
      setWishlistItems(prev => prev.filter(item => item.id !== productId));
    } catch (err: any) {
      alert(err.message || 'Error removing item from wishlist');
    }
  };

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.cart.add(product.id, 1);
      setCartCountTrigger(prev => prev + 1);
      alert('Product added to cart!');
    } catch (err: any) {
      alert(err.message || 'Error adding item to cart');
    }
  };

  // Helper to render rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-slate-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col">
      <Navbar cartCount={cartCountTrigger} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="bg-white p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
            My Wishlist ({wishlistItems.length})
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-lg shadow-sm max-w-2xl mx-auto">
            <Heart className="h-16 w-16 text-slate-350 mx-auto mb-4" />
            <h3 className="font-extrabold text-slate-800 text-xl">Your Wishlist is Empty</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Explore our store catalog and click the heart icon on your favorite items to save them here.
            </p>
            <Link href="/" className="mt-6 inline-block bg-[#febd69] hover:bg-amber-400 text-[#131921] px-6 py-2.5 rounded font-bold transition-all shadow-sm">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative"
              >
                {/* Image Section - Portrait 4:5 aspect ratio */}
                <Link href={`/product/${product.id}`} className="bg-slate-50 relative aspect-[4/5] w-full flex items-center justify-center border-b border-slate-100 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={getProductImageUrl(product.image_url)}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs">No Image Available</div>
                  )}
                  {product.discount_percent > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-sm z-10">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                  <button
                    onClick={(e) => handleRemove(product.id, e)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 p-1.5 rounded-full shadow border border-slate-100/50 transition-colors duration-200 z-10"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>

                {/* Details Section */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                      {product.brand || 'Generic'}
                    </span>
                    <Link href={`/product/${product.id}`} className="mt-0.5 block">
                      <h4 className="font-extrabold text-slate-800 group-hover:text-amber-600 transition-colors text-sm line-clamp-2 min-h-[40px]">
                        {product.name}
                      </h4>
                    </Link>

                    {/* Ratings */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex items-center">
                        {renderStars(parseFloat(product.rating))}
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">({product.reviews_count})</span>
                    </div>

                    {/* Price & Stock */}
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-50 pt-2">
                      <span className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
                      )}
                    </div>

                    <div className="mt-2 text-xs">
                      {product.quantity > 0 ? (
                        <span className="text-emerald-700 font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {product.stock_status || 'In Stock'}
                        </span>
                      ) : (
                        <span className="text-rose-655 font-black uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    {product.quantity > 0 ? (
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full bg-[#febd69] hover:bg-amber-400 text-[#131921] py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add to Cart</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-slate-100 text-slate-400 py-2 rounded text-xs font-bold cursor-not-allowed border border-slate-200"
                      >
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

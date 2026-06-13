"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, ArrowLeft, Package, AlertCircle, Star, 
  StarHalf, Heart, Check, CreditCard, Sparkles 
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { api } from '../../../services/api';
import { getProductImageUrl } from '../../../services/image';
import { formatCurrency } from '../../../utils/currency';

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartCountTrigger, setCartCountTrigger] = useState(0);
  const [activeImage, setActiveImage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const productId = parseInt(params.id as string);

  useEffect(() => {
    fetchProduct();
    checkWishlistStatus();
    loadRecentlyViewed();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await api.products.get(productId);
      setProduct(data);
      setActiveImage(data.image_url || '');
      updateRecentlyViewed(data);
      fetchRelated(data.category);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product details.');
      const fallbacks = getFallbackProducts();
      const matched = fallbacks.find(p => p.id === productId);
      if (matched) {
        setProduct(matched);
        setActiveImage(matched.image_url || '');
        updateRecentlyViewed(matched);
        fetchRelated(matched.category);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!api.auth.getCurrentUser()) return;
    try {
      const wishlist = await api.wishlist.get();
      const match = wishlist.some((item: any) => item.id === productId);
      setIsWishlisted(match);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = async () => {
    if (!api.auth.getCurrentUser()) {
      router.push('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await api.wishlist.delete(productId);
        setIsWishlisted(false);
      } else {
        await api.wishlist.add(productId);
        setIsWishlisted(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update wishlist');
    }
  };

  const fetchRelated = async (category: string) => {
    try {
      const data = await api.products.list(undefined, category);
      const filtered = data.filter((p: any) => p.id !== productId).slice(0, 4);
      setRelatedProducts(filtered);
    } catch (err) {
      const fallbacks = getFallbackProducts();
      const filtered = fallbacks.filter((p: any) => p.category === category && p.id !== productId).slice(0, 4);
      setRelatedProducts(filtered);
    }
  };

  const loadRecentlyViewed = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('shopzone_recently_viewed');
      if (stored) {
        setRecentlyViewed(JSON.parse(stored).filter((p: any) => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateRecentlyViewed = (prod: any) => {
    if (typeof window === 'undefined' || !prod) return;
    try {
      const stored = localStorage.getItem('shopzone_recently_viewed');
      let list = stored ? JSON.parse(stored) : [];
      // Remove current product to avoid duplicates and place it first
      list = list.filter((item: any) => item.id !== prod.id);
      list.unshift(prod);
      // Keep max 5 recently viewed items
      list = list.slice(0, 5);
      localStorage.setItem('shopzone_recently_viewed', JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async () => {
    if (!api.auth.getCurrentUser()) {
      router.push('/login');
      return;
    }

    try {
      await api.cart.add(product.id, quantity);
      setCartCountTrigger(prev => prev + 1);
      alert(`${quantity} unit(s) added to cart!`);
    } catch (err: any) {
      alert(err.message || 'Error adding product to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (!api.auth.getCurrentUser()) {
      router.push('/login');
      return;
    }

    try {
      await api.cart.add(product.id, quantity);
      router.push('/cart');
    } catch (err: any) {
      alert(err.message || 'Error redirecting to purchase checkout.');
    }
  };

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
        stars.push(<Star key={i} className="h-4 w-4 text-slate-350" />);
      }
    }
    return stars;
  };

  // Split comma separated list of gallery images
  const gallery = product?.gallery_urls 
    ? product.gallery_urls.split(',').map((u: string) => u.trim()).filter(Boolean) 
    : [];
  
  if (product && gallery.length === 0 && product.image_url) {
    gallery.push(product.image_url);
  }

  // Parse specifications text into key-value items
  const specificationsList = product?.specifications
    ? product.specifications.split('\n').map((line: string) => {
        const parts = line.split(':');
        const key = parts[0] ? parts[0].trim() : '';
        const value = parts.slice(1).join(':').trim();
        return { key, value };
      }).filter((item: any) => item.key)
    : [];

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col">
      <Navbar cartCount={cartCountTrigger} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-amber-600 transition-colors mb-6 font-bold">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : !product ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-lg shadow-sm">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800 text-lg">Product Not Found</h3>
            <p className="text-sm text-slate-500 mt-1">The specified product ID does not exist.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Primary Details Block */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-8">
              
              {/* Product Gallery (Left) */}
              <div className="md:w-1/2 flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
                  {activeImage ? (
                    <img 
                      src={getProductImageUrl(activeImage)} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-all duration-300"
                    />
                  ) : (
                    <Package className="h-24 w-24 text-slate-350" />
                  )}
                  
                  {product.discount_percent > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded shadow-sm">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                  
                  <span className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-wider shadow-sm">
                    SKU: {product.sku}
                  </span>
                </div>

                {/* Thumbnails */}
                {gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {gallery.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`h-16 w-16 border rounded overflow-hidden flex-shrink-0 transition-all ${
                          activeImage === img ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img src={getProductImageUrl(img)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details Panel (Right) */}
              <div className="md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Brand: <span className="text-slate-600 font-black">{product.brand || 'GENERIC'}</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    {product.name}
                  </h1>

                  {/* Ratings */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex text-amber-400">
                      {renderStars(parseFloat(product.rating || 4.0))}
                    </div>
                    <span className="text-xs text-slate-500 font-bold">
                      {parseFloat(product.rating || 4.0).toFixed(1)} Rating ({product.reviews_count || 0} customer reviews)
                    </span>
                  </div>

                  {/* Pricing and Stock */}
                  <div className="mt-4 p-4 bg-slate-55 border border-slate-100 rounded-lg">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-slate-900">{formatCurrency(product.price)}</span>
                      {product.mrp > product.price && (
                        <span className="text-sm text-slate-400 line-through font-medium">
                          MRP: {formatCurrency(product.mrp)}
                        </span>
                      )}
                    </div>
                    {product.mrp > product.price && (
                      <p className="text-xs text-rose-500 font-bold mt-1">
                        You save: {formatCurrency(product.mrp - product.price)} ({product.discount_percent}% off)
                      </p>
                    )}

                    <div className="mt-3 text-xs flex items-center gap-2">
                      {product.quantity > 0 ? (
                        <>
                          <span className="text-emerald-700 font-black uppercase bg-emerald-105 border border-emerald-200 px-2.5 py-1 rounded">
                            {product.stock_status || 'In Stock'}
                          </span>
                          <span className="text-slate-500 font-medium">{product.quantity} items remaining in stock</span>
                        </>
                      ) : (
                        <span className="text-rose-600 font-black uppercase bg-rose-105 border border-rose-200 px-2.5 py-1 rounded">
                          Temporarily Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-extrabold text-slate-800 text-sm">Product Description</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Purchase Actions */}
                <div className="mt-8 border-t border-slate-100 pt-6">
                  {product.quantity > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-slate-500">Qty:</span>
                      <div className="flex items-center border border-slate-250 rounded bg-slate-55 h-9 overflow-hidden">
                        <button
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="px-2.5 text-slate-500 hover:text-slate-900 cursor-pointer font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 font-bold text-xs select-none">{quantity}</span>
                        <button
                          onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                          className="px-2.5 text-slate-500 hover:text-slate-900 cursor-pointer font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {product.quantity > 0 ? (
                      <>
                        <button
                          onClick={handleAddToCart}
                          className="flex-1 h-11 bg-[#febd69] hover:bg-amber-400 text-[#131921] font-bold text-sm rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          <span>Add to Cart</span>
                        </button>

                        <button
                          onClick={handleBuyNow}
                          className="flex-1 h-11 bg-[#f08804] hover:bg-orange-600 text-white font-bold text-sm rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                        >
                          <CreditCard className="h-5 w-5" />
                          <span>Buy Now</span>
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="w-full h-11 bg-slate-200 text-slate-400 font-bold text-sm rounded flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <span>Temporarily Out of Stock</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleWishlist}
                      className={`h-11 px-4 border rounded flex items-center justify-center transition-all ${
                        isWishlisted 
                          ? 'border-rose-250 bg-rose-50 text-rose-500 hover:bg-rose-105' 
                          : 'border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                      }`}
                      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Specifications Section */}
            {specificationsList.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                  Product Specifications
                </h3>
                <div className="overflow-hidden border border-slate-100 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      {specificationsList.map((spec: any, index: number) => (
                        <tr 
                          key={index}
                          className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}
                        >
                          <td className="w-1/3 px-6 py-3 font-bold text-slate-600 border-r border-slate-100">{spec.key}</td>
                          <td className="px-6 py-3 text-slate-500">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Related Products
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((p) => (
                    <Link
                      href={`/product/${p.id}`}
                      key={p.id}
                      className="group flex flex-col justify-between bg-white border border-slate-100 hover:border-slate-305 hover:shadow-sm rounded-lg p-3 transition-all"
                    >
                      <div>
                        <div className="bg-slate-50 h-36 rounded overflow-hidden flex items-center justify-center relative">
                          {p.image_url ? (
                            <img src={getProductImageUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Package className="h-8 w-8 text-slate-300" />
                          )}
                        </div>
                        <h4 className="mt-3 font-bold text-xs text-slate-700 line-clamp-2 min-h-[32px] group-hover:text-amber-600 transition-colors">
                          {p.name}
                        </h4>
                        <div className="flex text-amber-400 mt-1">
                          {renderStars(parseFloat(p.rating || 4.0))}
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2 pt-2 border-t border-slate-50">
                        <span className="font-extrabold text-sm text-slate-900">{formatCurrency(p.price)}</span>
                        {p.mrp > p.price && (
                          <span className="text-[10px] text-slate-400 line-through">{formatCurrency(p.mrp)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-6">
                  Recently Viewed Products
                </h3>
                <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {recentlyViewed.map((p) => (
                    <Link
                      href={`/product/${p.id}`}
                      key={p.id}
                      className="w-48 flex-shrink-0 group bg-white border border-slate-100 hover:border-slate-200 p-3 rounded-lg hover:shadow-sm transition-all"
                    >
                      <div className="bg-slate-50 h-28 rounded overflow-hidden flex items-center justify-center">
                        {p.image_url ? (
                          <img src={getProductImageUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package className="h-8 w-8 text-slate-350" />
                        )}
                      </div>
                      <h4 className="mt-2 font-bold text-xs text-slate-700 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {p.name}
                      </h4>
                      <span className="font-extrabold text-xs text-slate-950 mt-1 block">{formatCurrency(p.price)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

function getFallbackProducts() {
  return [
    {
      id: 1,
      name: 'Precision Pro 15 Laptop',
      description: '15.6-inch high-performance laptop with 16GB RAM, 512GB SSD, Intel Core i7 processor, and stunning FHD display. Perfect for productivity and creative workflows.',
      category: 'Electronics',
      price: 899.99,
      quantity: 15,
      sku: 'LAP-PRC-15',
      image_url: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80',
      brand: 'TechBrand',
      mrp: 1199.99,
      discount_percent: 25,
      stock_status: 'In Stock',
      rating: 4.8,
      reviews_count: 120,
      featured: 1,
      status: 'active'
    },
    {
      id: 2,
      name: 'Nova 12 Smartphone',
      description: '6.5-inch dual-camera smartphone featuring 128GB storage, 5G connectivity, 120Hz refresh rate display, and all-day battery life.',
      category: 'Electronics',
      price: 699.99,
      quantity: 20,
      sku: 'PHN-NOV-12',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
      brand: 'ApexPhone',
      mrp: 899.99,
      discount_percent: 22,
      stock_status: 'In Stock',
      rating: 4.5,
      reviews_count: 85,
      featured: 1,
      status: 'active'
    },
    {
      id: 3,
      name: 'Aura Wireless Headphones',
      description: 'Active noise-canceling over-ear wireless headphones. Provides premium studio sound quality, plush memory foam ear cups, and 40-hour battery life.',
      category: 'Electronics',
      price: 149.99,
      quantity: 30,
      sku: 'AUD-AUR-W',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      brand: 'AudioLux',
      mrp: 199.99,
      discount_percent: 25,
      stock_status: 'In Stock',
      rating: 4.6,
      reviews_count: 240,
      featured: 1,
      status: 'active'
    },
    {
      id: 11,
      name: 'Vintage Leather Jacket',
      description: '100% genuine dark brown leather jacket for men. Features classic asymmetric zip closure, multiple zippered utility pockets, and warm lining.',
      category: 'Fashion',
      price: 199.50,
      quantity: 15,
      sku: 'FASH-JKT-L',
      image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
      brand: 'RetroWear',
      mrp: 299.99,
      discount_percent: 33,
      stock_status: 'In Stock',
      rating: 4.4,
      reviews_count: 48,
      featured: 0,
      status: 'active'
    },
    {
      id: 13,
      name: 'Smart Air Fryer XL',
      description: '5.8-quart electric air fryer with 10-in-1 touchscreen presets. Uses rapid hot air circulation to cook with up to 85% less oil than deep fryers.',
      category: 'Home & Kitchen',
      price: 99.99,
      quantity: 18,
      sku: 'KTC-AF-XL',
      image_url: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=600&q=80',
      brand: 'ChefPro',
      mrp: 149.99,
      discount_percent: 33,
      stock_status: 'In Stock',
      rating: 4.8,
      reviews_count: 320,
      featured: 1,
      status: 'active'
    },
    {
      id: 15,
      name: 'The AI Revolution',
      description: 'A comprehensive look at the past, present, and future of Artificial Intelligence, deep learning systems, and societal implications. Paperback.',
      category: 'Books',
      price: 18.50,
      quantity: 100,
      sku: 'BOK-AI-REV',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      brand: 'PressBooks',
      mrp: 24.99,
      discount_percent: 26,
      stock_status: 'In Stock',
      rating: 4.3,
      reviews_count: 52,
      featured: 0,
      status: 'active'
    }
  ];
}

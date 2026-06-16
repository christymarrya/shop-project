"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShoppingCart, Info, Smartphone, Shirt, Utensils, BookOpen, 
  Activity, Package, Heart, Star, StarHalf, Eye, Sparkles, Filter, ArrowRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { getProductImageUrl } from '../services/image';
import { formatCurrency } from '../utils/currency';

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
  'Sports'
];

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.05 });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  );
}

const CAROUSEL_SLIDES = [
  {
    category: 'Electronics',
    title: 'Shop the Hottest Consumer Tech',
    subtitle: 'Get up to 40% off on Laptops, Smart Devices, and tech accessories. Free shipping on qualifying orders!',
    gradient: 'from-amber-600 via-amber-500 to-amber-700',
    badge: 'MEGA DEALS LIVE NOW'
  },
  {
    category: 'Fashion',
    title: 'Premium Apparel & Style Collections',
    subtitle: 'Step out in confidence with our premium jackets, sportswear, and fashion deals of the season.',
    gradient: 'from-indigo-950 via-indigo-900 to-slate-900',
    badge: 'NEW ARRIVALS IN FASHION'
  },
  {
    category: 'Books',
    title: 'Bestselling Literature & Tech Novels',
    subtitle: 'Unlock critical tech insights, stories, and educational guides at up to 30% discount.',
    gradient: 'from-teal-900 via-teal-850 to-emerald-950',
    badge: 'BESTSELLER SPECIALS'
  },
  {
    category: 'Home & Kitchen',
    title: 'Smart Home Cookware & Appliances',
    subtitle: 'Upgrade your dining and cooking experience with smart air fryers, utensils, and organizers.',
    gradient: 'from-rose-950 via-rose-900 to-orange-950',
    badge: 'HOME SPECIAL OFFERS'
  }
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cartCountTrigger, setCartCountTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const featuredSliderRef = React.useRef<HTMLDivElement>(null);
  const [isSliderHovered, setIsSliderHovered] = useState(false);

  // Carousel slide and hover states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Parallax Mouse offsets
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  const handleCarouselMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setParallaxOffset({ x, y });
    setIsCarouselHovered(true);
  };

  const handleCarouselMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
    setIsCarouselHovered(false);
  };

  // Auto-slide interval
  useEffect(() => {
    if (isCarouselHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isCarouselHovered]);

  // Auto-scroll animation for Featured deals
  useEffect(() => {
    const slider = featuredSliderRef.current;
    if (!slider || featuredProducts.length === 0) return;

    let animationFrameId: number;
    const scrollSpeed = 0.4;

    const scrollStep = () => {
      if (!isSliderHovered) {
        slider.scrollLeft += scrollSpeed;
        
        // Loop back if reached near the end
        if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 1) {
          slider.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [featuredProducts, isSliderHovered]);

  // Filter & Sorting state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

  // Sync state from query parameters
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    setSearchTerm(searchVal);
    fetchProducts(searchVal, selectedCategory === 'All Categories' ? undefined : selectedCategory);
  }, [searchParams, selectedCategory, sort]);

  useEffect(() => {
    fetchFeatured();
    fetchWishlist();
    setCurrentUser(api.auth.getCurrentUser());
  }, []);

  const fetchWishlist = async () => {
    if (!api.auth.getCurrentUser()) return;
    try {
      const data = await api.wishlist.get();
      setWishlistIds(new Set(data.map((item: any) => item.id)));
    } catch (err) {
      console.error('Failed to load wishlist IDs:', err);
    }
  };

  const fetchFeatured = async () => {
    try {
      const data = await api.products.list(undefined, undefined, { featured: true });
      setFeaturedProducts(data);
    } catch (err) {
      setFeaturedProducts(getFallbackProducts().filter(p => p.featured === 1));
    }
  };

  const fetchProducts = async (search?: string, cat?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const filters = {
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort: sort || undefined
      };
      const data = await api.products.list(search, cat, filters);
      setProducts(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to the database. Make sure MySQL is running.');
      // Fallback
      let fallback = getFallbackProducts();
      if (cat) fallback = fallback.filter(p => p.category === cat);
      if (search) {
        const query = search.toLowerCase();
        fallback = fallback.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.sku.toLowerCase().includes(query) || 
          p.brand.toLowerCase().includes(query)
        );
      }
      if (minPrice) fallback = fallback.filter(p => p.price >= parseFloat(minPrice));
      if (maxPrice) fallback = fallback.filter(p => p.price <= parseFloat(maxPrice));
      
      // Sort fallback
      if (sort === 'price_asc') fallback.sort((a,b) => a.price - b.price);
      else if (sort === 'price_desc') fallback.sort((a,b) => b.price - a.price);
      else if (sort === 'rating') fallback.sort((a,b) => b.rating - a.rating);

      setProducts(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleSearch = (term: string) => {
    router.push(`/?search=${encodeURIComponent(term)}`);
  };

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!api.auth.getCurrentUser()) {
      router.push('/login');
      return;
    }

    try {
      await api.cart.add(product.id, 1);
      setCartCountTrigger(prev => prev + 1); // Trigger navbar count refresh
      alert('Product added to cart!');
    } catch (err: any) {
      alert(err.message || 'Error adding product to cart.');
    }
  };

  const handleToggleWishlist = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!api.auth.getCurrentUser()) {
      router.push('/login');
      return;
    }

    const isWishlisted = wishlistIds.has(productId);
    try {
      if (isWishlisted) {
        await api.wishlist.delete(productId);
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.wishlist.add(productId);
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update wishlist');
    }
  };

  const handleApplyPriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchTerm, selectedCategory === 'All Categories' ? undefined : selectedCategory);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setSelectedCategory('All Categories');
    router.push('/');
  };

  // Render Star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-3.5 w-3.5 text-slate-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col">
      <Navbar onSearch={handleSearch} cartCount={cartCountTrigger} />

      {/* Hero Marketing Banner Carousel */}
      <section 
        onMouseMove={handleCarouselMouseMove}
        onMouseLeave={handleCarouselMouseLeave}
        onMouseEnter={() => setIsCarouselHovered(true)}
        className={`bg-gradient-to-r ${CAROUSEL_SLIDES[currentSlide].gradient} animated-gradient-hero p-8 text-center relative overflow-hidden text-white shadow-inner rounded-b-2xl h-[340px] flex items-center transition-all duration-700 ease-in-out`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] opacity-10 pointer-events-none"></div>
        
        {/* Floating background e-commerce shapes (5% opacity) with Parallax offset */}
        <ShoppingCart className="h-20 w-20 absolute left-6 top-8 opacity-5 text-white animate-float-cart pointer-events-none transition-transform duration-300 ease-out hidden md:block" style={{ transform: `translate(${parallaxOffset.x * 24}px, ${parallaxOffset.y * 24}px)` }} />
        <Package className="h-24 w-24 absolute right-8 top-12 opacity-5 text-white animate-float-package pointer-events-none transition-transform duration-300 ease-out hidden md:block" style={{ transform: `translate(${parallaxOffset.x * -30}px, ${parallaxOffset.y * -30}px)` }} />
        <Heart className="h-16 w-16 absolute left-[30%] bottom-8 opacity-5 text-white animate-float-heart pointer-events-none transition-transform duration-300 ease-out hidden md:block" style={{ transform: `translate(${parallaxOffset.x * 15}px, ${parallaxOffset.y * 15}px)` }} />
        <BookOpen className="h-14 w-14 absolute right-[25%] top-4 opacity-5 text-white animate-float-book pointer-events-none transition-transform duration-300 ease-out hidden md:block" style={{ transform: `translate(${parallaxOffset.x * -18}px, ${parallaxOffset.y * -18}px)` }} />
        <Shirt className="h-20 w-20 absolute left-12 bottom-6 opacity-5 text-white animate-float-shirt pointer-events-none transition-transform duration-300 ease-out hidden md:block" style={{ transform: `translate(${parallaxOffset.x * 20}px, ${parallaxOffset.y * 20}px)` }} />
        <Smartphone className="h-16 w-16 absolute right-16 bottom-2 opacity-5 text-white animate-float-mobile pointer-events-none transition-transform duration-300 ease-out hidden md:block" style={{ transform: `translate(${parallaxOffset.x * -22}px, ${parallaxOffset.y * -22}px)` }} />

        {/* Carousel slide content with staggered transition entrance keyframes */}
        <div className="max-w-4xl mx-auto relative z-10 w-full">
          <span 
            key={`badge-${currentSlide}`}
            className="text-white text-xs font-bold uppercase tracking-widest border border-white/40 px-3 py-1 rounded-full bg-white/10 flex items-center gap-1.5 w-fit mx-auto animate-pulse-badge"
            style={{ boxShadow: '0 0 15px rgba(255,255,255,0.3)' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin-slow" /> {CAROUSEL_SLIDES[currentSlide].badge}
          </span>
          <h1 
            key={`title-${currentSlide}`} 
            className="text-3xl font-black tracking-tight text-white mt-4 sm:text-5xl drop-shadow-sm transition-all duration-1000 ease-out opacity-0"
            style={{ animation: 'fadeInDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            {CAROUSEL_SLIDES[currentSlide].title}
          </h1>
          <p 
            key={`subtitle-${currentSlide}`} 
            className="mt-4 text-sm sm:text-base text-amber-50 max-w-2xl mx-auto font-medium transition-all duration-1000 ease-out opacity-0"
            style={{ animation: 'fadeInDown 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards' }}
          >
            {CAROUSEL_SLIDES[currentSlide].subtitle}
          </p>
        </div>

        {/* Manual navigation chevrons */}
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length); }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length); }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </section>

      {/* Personalized Welcome Banner */}
      {currentUser && (
        <div className="max-w-7xl w-full mx-auto px-4 mt-6 animate-fade-in-down">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center">
            <h2 className="text-2xl font-black text-slate-800">
              👋 Welcome Back, <span className="text-[#F59E0B]">{currentUser.username}</span>
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1.5">
              Ready to discover amazing deals today?
            </p>
          </div>
        </div>
      )}

      {/* Database Warning Banner */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-6 w-full">
          <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-lg p-4 flex flex-col sm:flex-row items-start gap-3 text-sm shadow-sm">
            <Info className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">Local Development Warning (Demo Mode Active)</h4>
              <p className="text-amber-800">
                The application could not establish a connection to MySQL database using current credentials. Currently displaying fallback sample products.
              </p>
              <div className="mt-2 text-xs font-mono bg-white border border-amber-200 p-2 rounded text-slate-600">
                To link actual database: Setup database credentials in <span className="text-amber-600">backend/.env</span> and initialize schemas in <span className="text-amber-600">database/schema.sql</span>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Products Shelf */}
      {featuredProducts.length > 0 && (
        <div className="max-w-7xl w-full mx-auto px-4 mt-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
              Featured Deals
            </h3>
            <div 
              ref={featuredSliderRef}
              onMouseEnter={() => setIsSliderHovered(true)}
              onMouseLeave={() => setIsSliderHovered(false)}
              className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-250/60"
            >
              {featuredProducts.map((p) => (
                <Link 
                  href={`/product/${p.id}`}
                  key={p.id}
                  className="w-56 flex-shrink-0 bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group p-3 relative flex flex-col justify-between"
                >
                  {/* Aspect Ratio 4:5 image covering 75% depth */}
                  <div className="bg-slate-50 relative aspect-[4/5] w-full rounded-xl overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img src={getProductImageUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : (
                      <Package className="h-10 w-10 text-slate-400" />
                    )}
                    {p.discount_percent > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm z-10">
                        {p.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{p.brand || 'GENERIC'}</span>
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors mt-0.5">
                      {p.name}
                    </h4>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex text-amber-400">
                        {renderStars(parseFloat(p.rating))}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">({p.reviews_count})</span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[10px] font-bold">
                      {p.quantity > 0 ? (
                        <span className="text-emerald-700">In Stock</span>
                      ) : (
                        <span className="text-rose-600">Out of Stock</span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mt-2 border-t border-slate-50 pt-2">
                      <span className="font-extrabold text-sm text-slate-900">{formatCurrency(p.price)}</span>
                      {p.mrp > p.price && (
                        <span className="text-[11px] text-slate-400 line-through">{formatCurrency(p.mrp)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          {/* Categories */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider mb-4 border-b border-slate-100 pb-2">
              Categories
            </h3>
            <ul className="space-y-1">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Filters (Price Range & Clear) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Filter className="h-4 w-4" /> Filters
            </h3>
            
            <form onSubmit={handleApplyPriceFilter} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full border border-slate-200 bg-white text-slate-900 p-2 rounded text-xs focus:border-amber-400 focus:outline-none"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full border border-slate-200 bg-white text-slate-900 p-2 rounded text-xs focus:border-amber-400 focus:outline-none"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#131921] hover:bg-slate-800 text-white py-2 rounded text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Apply Price Range
              </button>
            </form>

            <button
              onClick={handleClearFilters}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded text-xs font-bold transition-all shadow-sm cursor-pointer mt-3"
            >
              Clear All Filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <section className="flex-grow">
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white p-4 border border-slate-200 rounded-lg shadow-sm gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {selectedCategory} {searchTerm ? `matching "${searchTerm}"` : ''}
              </h2>
              <span className="text-xs text-slate-500 font-semibold">{products.length} items found</span>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between border-t sm:border-0 pt-3 sm:pt-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
              <select
                className="border border-slate-200 bg-white text-slate-800 text-xs p-2 rounded focus:border-amber-400 focus:outline-none font-bold"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-lg shadow-sm">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-extrabold text-slate-800 text-lg">No Products Found</h3>
              <p className="text-sm text-slate-500 mt-1">Try refining your search terms or choosing a different category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const isWishlisted = wishlistIds.has(product.id);
                return (
                  <ScrollReveal key={product.id}>
                    <div
                      className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative"
                    >
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => handleToggleWishlist(product.id, e)}
                        className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 p-2 rounded-full shadow-sm border border-slate-100/80 transition-all duration-200"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart className={`h-4.5 w-4.5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      </button>

                      {/* Card Image Graphic - Portrait ratio 4:5 */}
                      <Link href={`/product/${product.id}`} className="bg-slate-50 relative aspect-[4/5] w-full overflow-hidden border-b border-slate-100">
                        {product.image_url ? (
                          <img 
                            src={getProductImageUrl(product.image_url)} 
                            alt={product.name} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="text-slate-400 text-xs flex items-center justify-center h-full">No image available</div>
                        )}
                        
                        {product.discount_percent > 0 && (
                          <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-sm z-10">
                            {product.discount_percent}% OFF
                          </span>
                        )}
                      </Link>

                      {/* Card Content */}
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                              {product.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              {product.brand || 'GENERIC'}
                            </span>
                          </div>

                          <Link href={`/product/${product.id}`} className="mt-1 block">
                            <h4 className="font-extrabold text-slate-800 group-hover:text-amber-600 transition-colors text-sm line-clamp-2 min-h-[40px]">
                              {product.name}
                            </h4>
                          </Link>

                          {/* Star Rating */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex text-amber-400">
                              {renderStars(parseFloat(product.rating || 4.0))}
                            </div>
                            <span className="text-xs text-slate-500 font-semibold">
                              ({product.reviews_count || 0})
                            </span>
                          </div>

                          {/* Price Details */}
                          <div className="flex items-baseline gap-2 mt-3 border-t border-slate-50 pt-2">
                            <span className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</span>
                            {product.mrp > product.price && (
                              <span className="text-xs text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
                            )}
                          </div>

                          {/* Stock status tag */}
                          <div className="mt-2.5">
                            {product.quantity > 0 ? (
                              <span className="text-emerald-700 text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded">
                                {product.stock_status || 'In Stock'}
                              </span>
                            ) : (
                              <span className="text-rose-655 text-[10px] font-black uppercase tracking-wider bg-rose-50 border border-rose-150 px-2 py-0.5 rounded">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                          <Link
                            href={`/product/${product.id}`}
                            className="flex-1 border border-slate-200 hover:bg-slate-55 text-slate-700 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Details</span>
                          </Link>

                          {product.quantity > 0 ? (
                            <button
                              onClick={(e) => handleAddToCart(product, e)}
                              className="flex-1 bg-[#febd69] hover:bg-amber-400 text-[#131921] py-2 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              <span>Add to Cart</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 bg-slate-100 text-slate-400 py-2 rounded text-xs font-bold cursor-not-allowed border border-slate-200"
                            >
                              Unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

// Fallback products used if database connection is down
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#eaeded] text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
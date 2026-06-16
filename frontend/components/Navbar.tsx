"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingCart, ShoppingBag, LogOut, ClipboardList, User, Heart } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onSearch?: (term: string) => void;
  cartCount?: number;
}

export default function Navbar({ onSearch, cartCount = 0 }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [localCartCount, setLocalCartCount] = useState(cartCount);

  useEffect(() => {
    // Load user and cart on mount
    const currentUser = api.auth.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      api.cart.get()
        .then((items) => {
          const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
          setLocalCartCount(count);
        })
        .catch(() => {});
    }
  }, [cartCount]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      router.push(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-[#131921] text-white sticky top-0 z-50 shadow-md">
      <div className="w-full mx-auto px-4 md:px-8 flex items-center justify-between h-16 gap-4">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <ShoppingBag className="h-7 w-7 text-[#febd69] group-hover:text-amber-300 transition-colors" />
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-slate-200 transition-colors">
            Shop<span className="text-[#febd69]">Zone</span>
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-2xl h-10 rounded overflow-hidden bg-white">
          <input
            type="text"
            placeholder="Search for laptops, smartphones, headphones, fashion, books..."
            className="w-full px-4 text-black bg-white focus:outline-none text-sm placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="bg-[#febd69] hover:bg-amber-400 transition-colors px-6 text-[#131921] flex items-center justify-center cursor-pointer">
            <Search className="h-5 w-5 font-bold" />
          </button>
        </form>

        {/* Navigation Items */}
        <nav className="flex items-center gap-3 lg:gap-6 text-sm font-medium h-full align-middle">
          {/* Home Link */}
          <Link href="/" className={`flex items-center gap-1 hover:text-[#febd69] transition-all py-1.5 border-b-2 ${pathname === '/' ? 'border-[#F59E0B] text-[#febd69]' : 'border-transparent'}`}>
            <span>Home</span>
          </Link>

          {user ? (
            <>
              {/* Account info */}
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs text-[#febd69] font-bold">Welcome, {user.username}</span>
              </div>

              {/* Admin Dashboard */}
              {user.role === 'admin' && (
                <Link href="/admin" className={`flex items-center gap-1 text-[#febd69] hover:text-amber-300 transition-all py-1.5 border-b-2 ${pathname === '/admin' ? 'border-[#F59E0B]' : 'border-transparent'}`}>
                  <User className="h-4 w-4" />
                  <span>Admin<span className="hidden lg:inline"> Panel</span></span>
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/wishlist" className={`flex items-center gap-1 hover:text-[#febd69] transition-all py-1.5 border-b-2 ${pathname === '/wishlist' ? 'border-[#F59E0B] text-[#febd69]' : 'border-transparent'}`}>
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                <span className="hidden lg:inline">Wishlist</span>
              </Link>

              {/* Order History */}
              <Link href="/orders" className={`flex items-center gap-1 hover:text-[#febd69] transition-all py-1.5 border-b-2 ${pathname === '/orders' ? 'border-[#F59E0B] text-[#febd69]' : 'border-transparent'}`}>
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <span className="hidden lg:inline">My Orders</span>
              </Link>

              {/* Shopping Cart */}
              <Link href="/cart" className={`relative flex items-center gap-1 hover:text-slate-350 transition-all py-1.5 border-b-2 ${pathname === '/cart' ? 'border-[#F59E0B] text-[#febd69]' : 'border-transparent'}`}>
                <ShoppingCart className="h-6 w-6 text-[#febd69]" />
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                  {localCartCount}
                </span>
                <span className="hidden sm:inline font-bold mt-1.5 ml-1">Cart</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer bg-transparent border-0 p-0 text-slate-300"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`flex items-center gap-1 hover:text-slate-300 transition-all py-1.5 border-b-2 ${pathname === '/login' ? 'border-[#F59E0B] text-white' : 'border-transparent'}`}>
                <User className="h-4 w-4 text-slate-400" />
                <span>Login</span>
              </Link>
              <Link
                href="/register"
                className="bg-[#febd69] hover:bg-amber-400 transition-colors text-[#131921] px-4 py-2 rounded font-bold"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

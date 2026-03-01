import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Menu, X, Home, Cpu, Calculator, Package, Users, Mail, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "./components/SEOHead";
import CookieConsent from "./components/CookieConsent";
import { COMPANY } from "./config/company";

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const navigation = [
    { name: "Start", href: createPageUrl("Home"), icon: Home },
    { name: "Konfigurator", href: createPageUrl("Konfigurator"), icon: Calculator },
    { 
      name: "Dla Klienta", 
      icon: Package,
      isDropdown: true,
      items: [
        { name: "Panel Klienta", href: createPageUrl("StatusInwestycji"), icon: Users },
        { name: "Możliwości", href: createPageUrl("Instalator"), icon: Cpu },
        { name: "Co zyskasz", href: createPageUrl("CoZyskasz"), icon: Package },
        { name: "FAQ", href: createPageUrl("FAQ"), icon: Mail }
      ]
    },
    // { name: "Realizacje", href: createPageUrl("Realizacje"), icon: Home },
    { name: "Oferta", href: createPageUrl("Oferta"), icon: Package },
    { name: "O nas", href: createPageUrl("ONas"), icon: Users },
    { name: "Kontakt", href: createPageUrl("Kontakt"), icon: Mail },
  ];

  // Ulepszona funkcja sprawdzająca aktywność (obsługuje też podstrony dropdownu)
  const isItemActive = (item) => {
    if (item.href === location.pathname) return true;
    if (item.isDropdown && item.items) {
      return item.items.some(subItem => subItem.href === location.pathname);
    }
    return false;
  };

  const isSubItemActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-orange-50 overflow-x-hidden">
      <SEOHead />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link 
              to={createPageUrl("Home")} 
              className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 bg-clip-text text-transparent tracking-tight hover:scale-105 transition-transform duration-300 py-[5px]"
            >
              designiQ
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                item.isDropdown ? (
                  <div
                    key={item.name}
                    className="relative py-4"
                    onMouseEnter={() => setClientDropdownOpen(true)}
                    onMouseLeave={() => setClientDropdownOpen(false)}
                    onFocus={() => setClientDropdownOpen(true)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setClientDropdownOpen(false);
                      }
                    }}
                  >
                    <button
                      aria-expanded={clientDropdownOpen}
                      aria-haspopup="true"
                      className={`flex items-center gap-1 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                        isItemActive(item)
                          ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "text-slate-700 hover:bg-slate-100 hover:text-orange-600"
                      }`}
                    >
                      {item.name}
                      <motion.div
                        animate={{ rotate: clientDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {clientDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 min-w-[240px] bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                        >
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors whitespace-nowrap ${
                                isSubItemActive(subItem.href) ? "bg-orange-50 text-orange-600 font-semibold" : "text-slate-700"
                              }`}
                            >
                              <subItem.icon className="w-4 h-4" />
                              {subItem.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      isItemActive(item)
                        ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : "text-slate-700 hover:bg-slate-100 hover:text-orange-600"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  if (item.isDropdown) {
                    return (
                      <div key={item.name} className="flex flex-col">
                        <button
                          onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-medium transition-all ${
                            isItemActive(item) && !clientDropdownOpen
                              ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </div>
                          <motion.div animate={{ rotate: clientDropdownOpen ? 180 : 0 }}>
                            <ChevronDown className="w-4 h-4" />
                          </motion.div>
                        </button>
                        
                        <AnimatePresence>
                          {clientDropdownOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="ml-8 overflow-hidden space-y-1"
                            >
                              {item.items.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    setClientDropdownOpen(false);
                                  }}
                                  className={`flex items-center space-x-3 px-4 py-2 rounded-xl font-medium transition-all ${
                                    isSubItemActive(subItem.href)
                                      ? "bg-orange-100 text-orange-700 font-bold"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <subItem.icon className="w-4 h-4" />
                                  <span>{subItem.name}</span>
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        isItemActive(item)
                          ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-20">{children}</main>

      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="space-y-4">
              <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">designiQ</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Technologia w służbie Twojego domu. Profesjonalne systemy smart home i automatyka budynkowa.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Szybkie linki</h4>
              <ul className="space-y-2">
                {navigation.map((item) =>
                  item.isDropdown ? (
                    item.items.map((subItem) => (
                      <li key={subItem.name}>
                        <Link to={subItem.href} className="text-slate-300 hover:text-orange-300 transition-colors text-sm">{subItem.name}</Link>
                      </li>
                    ))
                  ) : (
                    <li key={item.name}>
                      <Link to={item.href} className="text-slate-300 hover:text-orange-300 transition-colors text-sm">{item.name}</Link>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Kontakt</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href={`mailto:${COMPANY.email}`} className="hover:text-orange-300 transition-colors">{COMPANY.email}</a></li>
                <li><a href={`tel:${COMPANY.phone}`} className="hover:text-orange-300 transition-colors">{COMPANY.phoneDisplay}</a></li>
                <li>{COMPANY.address}</li>
                <li>{COMPANY.city}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Social media</h4>
              <div className="flex space-x-4">
                <a href={COMPANY.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-orange-600 hover:to-orange-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href={`mailto:${COMPANY.email}`} aria-label="Email" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-slate-400">
            <p>&copy; 2025 designiQ. Wszelkie prawa zastrzeżone.</p>
            <p className="mt-2">
              <Link to={createPageUrl("PolitykaPrywatnosci")} className="hover:text-orange-300 transition-colors">Polityka Prywatności</Link>
            </p>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
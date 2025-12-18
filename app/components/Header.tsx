"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const serviceLinks = [
    { href: "/services/private-events", label: "Private Events" },
    { href: "/services/pick-up-delivery", label: "Pick Up & Delivery" },
  ];

  const mainNavLinks = [
    { href: "/menu", label: "Menu" },
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/reviews", label: "Reviews" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#3A2A24]/95 backdrop-blur-sm h-[90px]">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center h-full py-2 gap-0">
          <img src="/logo1.png" alt="Moto Kitchen" className="h-16 md:h-20 max-h-full object-contain" />
          <div className="flex flex-col -ml-2">
            <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
            <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {/* Services Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button style={{ fontFamily: 'var(--font-cinzel), serif' }} className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider flex items-center gap-1 py-2">
              Services
              <svg className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isServicesOpen && (
              <div className="absolute top-full left-0 mt-0 pt-2">
                <div className="w-48 bg-white rounded-md shadow-lg py-2 border border-[#E6D9C8]">
                  <Link
                    href="/services"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                    className="block px-4 py-2 text-[#1F1F1F] hover:bg-[#F1E7DA] text-sm font-medium"
                  >
                    All Services
                  </Link>
                  <div className="border-t border-[#E6D9C8] my-1"></div>
                  {serviceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{ fontFamily: 'var(--font-cinzel), serif' }}
                      className="block px-4 py-2 text-[#1F1F1F] hover:bg-[#F1E7DA] text-sm"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
              className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
            >
              {link.label}
            </Link>
          ))}
          
          <Link href="/contact" style={{ fontFamily: 'var(--font-cinzel), serif' }} className="btn-primary text-sm ml-2">
            Request a Quote
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="lg:hidden bg-[#3A2A24] border-t border-white/10 px-6 py-4 max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* Mobile CTA - Top */}
          <Link
            href="/contact"
            style={{ fontFamily: 'var(--font-cinzel), serif' }}
            className="btn-primary text-sm text-center block mb-6"
            onClick={() => setIsMenuOpen(false)}
          >
            Request a Quote
          </Link>

          {/* Services Section */}
          <div className="mb-4">
            <button
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
              className="w-full flex justify-between items-center py-3 text-white/80 text-sm uppercase tracking-wider"
            >
              Services
              <svg
                className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isServicesOpen && (
              <div className="pl-4 border-l border-white/10 ml-2 space-y-1">
                <Link
                  href="/services"
                  style={{ fontFamily: 'var(--font-cinzel), serif' }}
                  className="block py-2 text-white/60 hover:text-[#C9653B] transition-colors text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Services
                </Link>
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                    className="block py-2 text-white/60 hover:text-[#C9653B] transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Main Nav Links */}
          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
              className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider border-t border-white/5"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* FAQ Link */}
          <Link
            href="/faq"
            style={{ fontFamily: 'var(--font-cinzel), serif' }}
            className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider border-t border-white/5"
            onClick={() => setIsMenuOpen(false)}
          >
            FAQ
          </Link>
        </nav>
      )}
    </header>
  );
}

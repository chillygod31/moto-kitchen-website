"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const serviceLinks = [
    { href: "/services/weddings", label: "Weddings" },
    { href: "/services/corporate", label: "Corporate" },
    { href: "/services/private-events", label: "Private Events" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#3A2A24]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo2.png" alt="Moto Kitchen" className="h-12 md:h-14" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
          >
            Home
          </Link>
          
          {/* Services Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider flex items-center gap-1">
              Services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isServicesOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 border border-[#E6D9C8]">
                <Link
                  href="/services"
                  className="block px-4 py-2 text-[#1F1F1F] hover:bg-[#F1E7DA] text-sm"
                >
                  All Services
                </Link>
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-[#1F1F1F] hover:bg-[#F1E7DA] text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/menu"
            className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
          >
            Menu
          </Link>
          <Link
            href="/gallery"
            className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
          >
            Gallery
          </Link>
          <Link
            href="/about"
            className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
          >
            Contact
          </Link>
          <Link href="/contact" className="btn-primary text-sm">
            Request a Quote
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
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
        <nav className="md:hidden bg-[#3A2A24] border-t border-white/10 px-6 py-4">
          <Link
            href="/"
            className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          
          {/* Mobile Services */}
          <div className="py-3">
            <p className="text-white/80 text-sm uppercase tracking-wider mb-2">Services</p>
            <div className="pl-4 space-y-2">
              <Link
                href="/services"
                className="block py-2 text-white/60 hover:text-[#C9653B] transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                All Services
              </Link>
              {serviceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-white/60 hover:text-[#C9653B] transition-colors text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/menu"
            className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
            onClick={() => setIsMenuOpen(false)}
          >
            Menu
          </Link>
          <Link
            href="/gallery"
            className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
            onClick={() => setIsMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link
            href="/about"
            className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block py-3 text-white/80 hover:text-[#C9653B] transition-colors text-sm uppercase tracking-wider"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>
          <Link
            href="/contact"
            className="btn-primary text-sm mt-4 text-center block"
            onClick={() => setIsMenuOpen(false)}
          >
            Request a Quote
          </Link>
        </nav>
      )}
    </header>
  );
}

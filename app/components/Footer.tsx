import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#3A2A24] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo1.png" alt="Moto Kitchen" className="h-16 md:h-20 object-contain" />
              <div className="flex flex-col -ml-2">
                <span className="text-white text-lg md:text-xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
                <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
              </div>
            </div>
            <p className="text-white/70 mb-4 text-sm">
              Serving the Netherlands, Belgium, Germany, and beyond.
            </p>
            <p className="text-[#C9653B] font-medium">Karibu</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-3">
              <li><Link href="/services/private-events" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Private Events</Link></li>
              <li><Link href="/services/private-events" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Corporate</Link></li>
              <li><Link href="/services/private-events" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Weddings</Link></li>
              <li><Link href="/services/pick-up-delivery" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Pick-Up & Delivery</Link></li>
              <li><Link href="/menu" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Our Menu</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">About Us</Link></li>
              <li><Link href="/gallery" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Gallery</Link></li>
              <li><Link href="/reviews" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Reviews</Link></li>
              <li><Link href="/faq" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">FAQ</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3 text-white/70 text-sm">
              <li>
                <a href="mailto:contact@motokitchen.nl" className="hover:text-[#C9653B] transition-colors">
                  contact@motokitchen.nl
                </a>
              </li>
              <li>
                <a href="https://instagram.com/motokitchen.nl" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9653B] transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @motokitchen.nl
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@motokitchen.nl" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9653B] transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  TikTok
                </a>
              </li>
            </ul>
            <p className="text-white/50 text-xs mt-4">Serving across the Benelux and beyond</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>© 2023 Moto Kitchen. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#C9653B] transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-[#C9653B] transition-colors">Cookies</Link>
            <Link href="/terms" className="hover:text-[#C9653B] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

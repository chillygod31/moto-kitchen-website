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
                <span className="text-white/80 text-[8px] md:text-[10px] uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-body)' }}>East African Catering Service</span>
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
              <li><Link href="/services/weddings" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Weddings</Link></li>
              <li><Link href="/services/corporate" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Corporate Events</Link></li>
              <li><Link href="/services/private-events" className="text-white/70 hover:text-[#C9653B] transition-colors text-sm">Private Events</Link></li>
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
                <a href="https://instagram.com/motokitchen.nl" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9653B] transition-colors">
                  @motokitchen.nl
                </a>
              </li>
            </ul>
            <p className="text-white/50 text-xs mt-4">Serving across the Benelux and beyond</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Moto Kitchen. All rights reserved.</p>
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

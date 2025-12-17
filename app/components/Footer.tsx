import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#3A2A24] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src="/logo2.png" alt="Moto Kitchen" className="h-14 mb-4" />
            <p className="text-white/70 mb-6 max-w-md">
              Bringing the authentic flavours of Tanzania to your table. From intimate gatherings to grand celebrations, we cater with passion and tradition.
            </p>
            <p className="text-[#C9653B] font-medium">Karibu — Welcome</p>
            <p className="text-white/50 text-sm mt-4">Serving across the Netherlands</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/services" className="text-white/70 hover:text-[#C9653B] transition-colors">Services</Link></li>
              <li><Link href="/menu" className="text-white/70 hover:text-[#C9653B] transition-colors">Our Menu</Link></li>
              <li><Link href="/gallery" className="text-white/70 hover:text-[#C9653B] transition-colors">Gallery</Link></li>
              <li><Link href="/about" className="text-white/70 hover:text-[#C9653B] transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-[#C9653B] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3 text-white/70">
              <li>
                <a href="mailto:info@motokitchen.nl" className="hover:text-[#C9653B] transition-colors">
                  info@motokitchen.nl
                </a>
              </li>
              <li>
                <a href="https://wa.me/31600000000" className="hover:text-[#C9653B] transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="https://instagram.com/motokitchen" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9653B] transition-colors">
                  @motokitchen
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Moto Kitchen. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#C9653B] transition-colors">Privacy Policy</Link>
            <Link href="/cookies" className="hover:text-[#C9653B] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

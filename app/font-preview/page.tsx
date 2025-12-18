import { 
  Inter, 
  Source_Sans_3, 
  DM_Sans, 
  Work_Sans, 
  Lato, 
  Roboto,
  Noto_Sans,
  Montserrat
} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});

const fonts = [
  {
    name: "Inter",
    description: "Most popular, highly readable",
    variable: inter.variable,
  },
  {
    name: "Source Sans Pro",
    description: "Professional, friendly",
    variable: sourceSans.variable,
  },
  {
    name: "DM Sans",
    description: "Geometric, modern",
    variable: dmSans.variable,
  },
  {
    name: "Work Sans",
    description: "Clean, versatile",
    variable: workSans.variable,
  },
  {
    name: "Lato",
    description: "Friendly, balanced",
    variable: lato.variable,
  },
  {
    name: "Roboto",
    description: "Google default, neutral",
    variable: roboto.variable,
  },
  {
    name: "Noto Sans",
    description: "Excellent readability",
    variable: notoSans.variable,
  },
  {
    name: "Montserrat",
    description: "Modern, geometric",
    variable: montserrat.variable,
  },
];

export default function FontPreviewPage() {
  const getFontStyle = (fontVar: string) => ({
    fontFamily: `var(${fontVar}), system-ui, -apple-system, sans-serif`,
  });

  return (
    <div 
      className={`min-h-screen bg-[#FAF6EF] pt-32 pb-20 ${inter.variable} ${sourceSans.variable} ${dmSans.variable} ${workSans.variable} ${lato.variable} ${roboto.variable} ${notoSans.variable} ${montserrat.variable}`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-4">
            Font Preview - Body Text & Headings
          </h1>
          <p className="text-[#4B4B4B] text-lg mb-2">
            Preview how different fonts look for body text, headings, and all content.
          </p>
          <p className="text-[#4B4B4B] text-sm">
            <strong>Note:</strong> Header navigation (Cinzel) and hero area fonts will stay the same. Everything else shown here will change.
          </p>
        </div>

        <div className="space-y-16">
          {fonts.map((font) => {
            const fontStyle = getFontStyle(font.variable);
            return (
              <div 
                key={font.name} 
                className="bg-white border border-[#E6D9C8] rounded-lg p-8"
              >
                <div className="mb-6 pb-4 border-b border-[#E6D9C8]">
                  <h2 style={fontStyle} className="text-2xl font-bold text-[#1F1F1F] mb-2">{font.name}</h2>
                  <p style={fontStyle} className="text-[#4B4B4B] text-sm">{font.description}</p>
                </div>

                <div className="space-y-6">
                  {/* Heading Examples */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Heading Examples
                    </h3>
                    <h1 style={fontStyle} className="text-3xl font-bold text-[#1F1F1F] mb-2">
                      A Culinary Legacy
                    </h1>
                    <h2 style={fontStyle} className="text-2xl font-bold text-[#1F1F1F] mb-2">
                      Our Culinary Heritage
                    </h2>
                    <h3 style={fontStyle} className="text-xl font-semibold text-[#1F1F1F] mb-2">
                      Signature Dishes
                    </h3>
                  </div>

                  {/* About Section */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      About Section
                    </h3>
                    <p style={fontStyle} className="text-[#4B4B4B] text-lg leading-relaxed">
                      Moto Kitchen began the way many of our favourite meals begin. In a home kitchen, with a grandmother, a mother, and an aunt cooking for the people around them. The kind of cooking you learn by watching, tasting, and adjusting, until it feels right.
                    </p>
                  </div>

                  {/* Menu Item Description */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Menu Item Description
                    </h3>
                    <p style={fontStyle} className="text-[#4B4B4B] text-base leading-relaxed">
                      <strong style={fontStyle}>Goat meat/Mbuzi:</strong> Slow-cooked goat meat with traditional Tanzanian spices.
                    </p>
                    <p style={fontStyle} className="text-[#4B4B4B] text-base leading-relaxed mt-2">
                      <strong style={fontStyle}>Pilau Beef:</strong> Traditional spiced rice cooked with tender beef pieces.
                    </p>
                  </div>

                  {/* Service Description */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Service Description
                    </h3>
                    <p style={fontStyle} className="text-[#4B4B4B] text-base leading-relaxed">
                      At Moto Kitchen, we specialize in creating bespoke catering solutions designed to elevate your event. Whether it&apos;s an intimate gathering or a grand celebration, our offerings include buffets, shared dining, plated dinners, and thoughtful enhancements.
                    </p>
                  </div>

                  {/* Hero Section Text */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Hero Section (Main Page)
                    </h3>
                    <h1 style={fontStyle} className="text-4xl font-bold text-[#1F1F1F] mb-2">
                      Authentic Tanzanian Catering for Every Occasion
                    </h1>
                    <p style={fontStyle} className="text-[#4B4B4B] text-lg">
                      Private Events • Weddings • Corporate
                    </p>
                  </div>

                  {/* Form Label */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Form Label & Input Text
                    </h3>
                    <label style={fontStyle} className="block text-sm font-semibold text-[#1F1F1F] mb-1">
                      Event Type <span className="text-[#C9653B]">*</span>
                    </label>
                    <p style={fontStyle} className="text-[#4B4B4B] text-sm">
                      Please select the type of event you&apos;re planning.
                    </p>
                  </div>

                  {/* Button */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Button Text
                    </h3>
                    <button style={fontStyle} className="bg-[#C9653B] text-white px-6 py-3 rounded-md font-semibold text-base hover:bg-[#b5582f] transition-colors">
                      Request a Quote
                    </button>
                  </div>

                  {/* Footer */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      Footer Text
                    </h3>
                    <p style={fontStyle} className="text-[#4B4B4B] text-sm">
                      Serving the Netherlands, Belgium, Germany, and beyond.
                    </p>
                    <p style={fontStyle} className="text-[#4B4B4B] text-xs mt-1">
                      © 2024 Moto Kitchen. All rights reserved.
                    </p>
                  </div>

                  {/* List Items */}
                  <div>
                    <h3 style={fontStyle} className="text-sm font-semibold text-[#C9653B] uppercase tracking-wider mb-2">
                      List Items / Bullet Points
                    </h3>
                    <ul style={fontStyle} className="space-y-2 text-[#4B4B4B]">
                      <li style={fontStyle}>• Buffets: A diverse array of dishes that celebrate bold flavors</li>
                      <li style={fontStyle}>• Shared Dining: Interactive, communal meals that bring people together</li>
                      <li style={fontStyle}>• Plated Dinners: Elegantly presented courses for a refined dining experience</li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-6 bg-[#F1E7DA] rounded-lg border border-[#E6D9C8] text-center">
          <p className="text-[#1F1F1F] font-semibold mb-2">How to Choose</p>
          <p className="text-[#4B4B4B] text-sm">
            Scroll through each font option and see how it looks with your actual content. Consider readability 
            and the overall feel it gives your website. <strong>Remember:</strong> Only the header navigation (Cinzel) 
            and hero area fonts will stay the same - everything else shown here will use your selected font. 
            Once you&apos;ve decided, let me know which font you prefer!
          </p>
        </div>
      </div>
    </div>
  );
}


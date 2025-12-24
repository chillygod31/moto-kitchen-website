import Link from "next/link";

interface CTASectionProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  variant?: "primary" | "dark" | "light";
}

export default function CTASection({
  title,
  description,
  buttonText = "Request a Quote",
  buttonHref = "/contact",
  variant = "primary",
}: CTASectionProps) {
  const variants = {
    primary: {
      bg: "bg-[#C86A3A]",
      title: "text-white",
      description: "text-white/90",
      button: "btn-primary !bg-white !text-[#1E1B18] hover:!bg-[#FBF8F3] hover:!text-[#1E1B18]",
    },
    dark: {
      bg: "bg-[#2B1E1A]",
      title: "text-white",
      description: "text-white/80",
      button: "btn-primary",
    },
    light: {
      bg: "bg-[#FBF8F3]",
      title: "text-[#1E1B18]",
      description: "text-[#6B5B55]",
      button: "btn-primary",
    },
  };

  const styles = variants[variant];

  return (
    <section className={`section-padding ${styles.bg} relative overflow-hidden`}>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 
          className={`text-[32px] md:text-[36px] lg:text-[40px] font-bold mb-6 ${styles.title}`}
          style={{ 
            fontFamily: 'var(--font-inter), sans-serif', 
            fontWeight: 600,
            letterSpacing: '-0.01em'
          }}
        >
          {title}
        </h2>
        {description && (
          <p 
            className={`text-lg mb-10 ${styles.description}`}
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
          >
            {description}
          </p>
        )}
        <Link
          href={buttonHref}
          className={`btn-primary ${variant === "primary" ? "!bg-white !text-[#1E1B18] hover:!bg-[#FBF8F3] hover:!text-[#1E1B18]" : ""}`}
          style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}


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
      bg: "bg-[#C9653B]",
      title: "text-white",
      description: "text-white/90",
      button: "bg-white text-[#C9653B] hover:bg-[#FAF6EF]",
    },
    dark: {
      bg: "bg-[#3A2A24]",
      title: "text-white",
      description: "text-white/80",
      button: "btn-primary",
    },
    light: {
      bg: "bg-[#F1E7DA]",
      title: "text-[#1F1F1F]",
      description: "text-[#4B4B4B]",
      button: "btn-primary",
    },
  };

  const styles = variants[variant];

  return (
    <section className={`section-padding ${styles.bg}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${styles.title}`}>
          {title}
        </h2>
        {description && (
          <p className={`text-lg mb-10 ${styles.description}`}>
            {description}
          </p>
        )}
        <Link
          href={buttonHref}
          className={`px-8 py-4 rounded-md font-semibold text-lg transition-colors inline-block ${styles.button}`}
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}


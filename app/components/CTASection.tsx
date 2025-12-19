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
      button: "btn-primary !bg-white !text-[#1F1F1F] hover:!bg-[#FAF6EF] hover:!text-[#1F1F1F]",
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
    <section className={`section-padding ${styles.bg} relative overflow-hidden`}>
      {variant === "primary" && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      )}
      <div className="max-w-4xl mx-auto text-center relative z-10">
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
          className={`btn-primary ${variant === "primary" ? "bg-white text-[#C9653B] hover:bg-[#FAF6EF]" : ""}`}
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}


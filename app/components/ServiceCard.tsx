import Link from "next/link";

interface ServiceCardProps {
  href: string;
  title: string;
  description: string;
  image?: string;
  icon?: string;
  features?: string[];
  pricing?: string;
}

export default function ServiceCard({
  href,
  title,
  description,
  image,
  icon,
  features,
  pricing,
}: ServiceCardProps) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow group flex flex-col text-center">
      {/* Image or Icon */}
      {image ? (
        <div className="aspect-[4/3] bg-[#F1E7DA] rounded-lg mb-6 overflow-hidden border border-[#E6D9C8]">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : icon ? (
        <div className="text-5xl mb-6">{icon}</div>
      ) : null}

      {/* Content */}
      <h3 className="text-xl font-bold text-[#1F1F1F] mb-3 group-hover:text-[#C9653B] transition-colors">
        {title}
      </h3>
      <p className="text-[#4B4B4B] mb-4 flex-grow">
        {description}
      </p>

      {/* Features */}
      {features && features.length > 0 && (
        <ul className="space-y-2 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center justify-center gap-2 text-[#4B4B4B] text-sm">
              <svg className="w-4 h-4 text-[#C9653B] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {/* Pricing */}
      {pricing && (
        <p className="text-[#C9653B] font-semibold text-sm mb-4">
          {pricing}
        </p>
      )}

      {/* Link */}
      <span className="inline-flex items-center justify-center gap-1 text-[#C9653B] font-semibold text-sm mt-auto">
        Learn more
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}


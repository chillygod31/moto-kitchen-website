import { parseDishName } from '../../lib/utils';

interface DietaryTag {
  label: string;
  type: "vegetarian" | "vegan" | "gluten-free" | "halal" | "spicy";
}

interface DishCardProps {
  name: string;
  description: string;
  image?: string;
  tags?: DietaryTag[];
  category?: string;
}

const tagStyles: Record<string, string> = {
  vegetarian: "bg-[#e8f5e9] text-[#2e7d32]",
  vegan: "bg-[#e8f5e9] text-[#1b5e20]",
  "gluten-free": "bg-[#fff3e0] text-[#e65100]",
  halal: "bg-[#e3f2fd] text-[#1565c0]",
  spicy: "bg-[#ffebee] text-[#c62828]",
};

const tagLabels: Record<string, string> = {
  vegetarian: "V",
  vegan: "VG",
  "gluten-free": "GF",
  halal: "Halal",
  spicy: "🌶️",
};

export default function DishCard({
  name,
  description,
  image,
  tags = [],
}: DishCardProps) {
  const { swahili, english } = parseDishName(name);
  
  return (
    <div className="card group">
      {/* Image */}
      {image ? (
        <div className="aspect-[4/3] bg-[#F1E7DA] rounded-lg mb-4 overflow-hidden border border-[#E6D9C8]">
          <img src={image} alt={swahili || english} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-[#F1E7DA] rounded-lg mb-4 flex items-center justify-center border border-[#E6D9C8]">
          <span className="text-4xl">🍽️</span>
        </div>
      )}

      {/* Content */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {swahili ? (
            <>
              <h3 className="dish-name-swahili -mt-2">{swahili}</h3>
              <p className="dish-name-english">{english}</p>
            </>
          ) : (
            <h3 style={{ fontFamily: 'var(--font-heading-display), serif', fontWeight: 700 }} className="text-xl text-[#1F1F1F] -mt-2">
              {english}
            </h3>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1 flex-shrink-0">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-0.5 rounded font-medium ${tagStyles[tag.type] || "bg-gray-100 text-gray-600"}`}
                title={tag.label}
              >
                {tagLabels[tag.type] || tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-[#4B4B4B] text-sm leading-relaxed italic">{description}</p>
    </div>
  );
}


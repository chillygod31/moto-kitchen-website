interface Step {
  number: string;
  title: string;
  description?: string;
  bullets?: string[];
}

interface HowItWorksProps {
  steps?: Step[];
  title?: string;
  variant?: "dark" | "light";
}

const defaultSteps: Step[] = [
  { number: "1", title: "Inquiry", description: "Tell us about your event and requirements" },
  { number: "2", title: "Proposal", description: "Receive a custom menu and quote" },
  { number: "3", title: "Confirm", description: "Finalize details and secure your date" },
  { number: "4", title: "Event Day", description: "We deliver an unforgettable experience" },
];

export default function HowItWorks({
  steps = defaultSteps,
  title = "How It Works",
  variant = "dark",
}: HowItWorksProps) {
  const styles = {
    dark: {
      bg: "bg-[#2B1E1A]",
      title: "text-white",
      subtitle: "text-[#C86A3A]",
      stepTitle: "text-white",
      stepDesc: "text-white/70",
    },
    light: {
      bg: "bg-[#FBF8F3]",
      title: "text-[#1E1B18]",
      subtitle: "text-[#C86A3A]",
      stepTitle: "text-[#1E1B18]",
      stepDesc: "text-[#6B5B55]",
    },
  };

  const s = styles[variant];

  return (
    <section className={`section-padding ${s.bg}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className={`text-sm uppercase tracking-widest mb-4 ${s.subtitle}`}>Simple Process</p>
          <h2 
            className={`text-[32px] md:text-[36px] lg:text-[40px] font-bold ${s.title}`}
            style={{ 
              fontFamily: 'var(--font-inter), sans-serif', 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[#C86A3A] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">{step.number}</span>
              </div>
              <h3 
                className={`text-[16px] md:text-[18px] lg:text-[20px] font-semibold mb-4 ${s.stepTitle}`}
                style={{ 
                  fontFamily: 'var(--font-inter), sans-serif', 
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                {step.title}
              </h3>
              {step.bullets ? (
                <ul 
                  className={`${s.stepDesc} text-left space-y-2 max-w-xs mx-auto`}
                  style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
                >
                  {step.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start">
                      <span className="text-[#C86A3A] mr-2 mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p 
                  className={s.stepDesc}
                  style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, lineHeight: '1.7' }}
                >
                  {step.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


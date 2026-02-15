/**
 * PoweredByDevopz - React Component
 * 
 * Copy this file to your React/Next.js project's components folder.
 * 
 * Usage:
 * import PoweredByDevopz from '@/components/PoweredByDevopz';
 * 
 * // Fixed position (bottom-right corner)
 * <PoweredByDevopz />
 * 
 * // Inline (for footers)
 * <PoweredByDevopz variant="inline" />
 */

interface PoweredByDevopzProps {
  variant?: "fixed" | "inline";
  className?: string;
}

const PoweredByDevopz = ({ variant = "fixed", className = "" }: PoweredByDevopzProps) => {
  const baseStyles = "flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-300 transition-colors no-underline";
  
  const variantStyles = {
    fixed: "fixed bottom-3 right-3 z-50 opacity-60 hover:opacity-100",
    inline: "justify-center py-2",
  };

  return (
    <a
      href="https://devopz.ai"
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      title="Powered by Devopz - Multi-Cloud & DevOps Consultancy"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect width="32" height="32" rx="6" fill="#14B8A6" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          D
        </text>
      </svg>
      <span>Powered by <strong className="font-medium">devopz</strong></span>
    </a>
  );
};

export default PoweredByDevopz;

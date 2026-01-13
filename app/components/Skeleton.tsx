interface SkeletonProps {
  variant?: "text" | "card" | "circle" | "chart";
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded",
    card: "h-32 w-full rounded-xl",
    circle: "rounded-full",
    chart: "h-48 w-full rounded-xl",
  };

  const baseStyles = variantStyles[variant];
  const isCircle = variant === "circle";

  // For circle, ensure width and height are equal
  const circleSize = width || height || "40px";

  return (
    <div
      className={`
        bg-gray-700 
        overflow-hidden 
        relative
        ${isCircle ? "" : baseStyles}
        ${className}
      `}
      style={{
        width: width || (isCircle ? circleSize : undefined),
        height: height || (isCircle ? circleSize : undefined),
      }}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(107, 114, 128, 0.4) 50%,
            transparent 100%
          )`,
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

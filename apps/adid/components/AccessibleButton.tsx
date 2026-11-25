import { type ReactNode } from "react";

interface AccessibleButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  "aria-label"?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * Accessible button/link component with consistent styling
 *
 * Features:
 * - Visible focus ring for keyboard navigation
 * - Proper ARIA labels support
 * - Can render as button or link
 * - Accessible disabled states
 */
export default function AccessibleButton({
  children,
  href,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  "aria-label": ariaLabel,
  type = "button",
}: AccessibleButtonProps) {
  const variantClass =
    variant === "primary" ? "primary-button" : "secondary-button";
  const classes = [variantClass, className].filter(Boolean).join(" ");

  // Render as link if href is provided
  if (href && !disabled) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

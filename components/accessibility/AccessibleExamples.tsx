/**
 * Example Accessible Button Component
 *
 * Demonstrates best practices using the new accessibility hooks.
 */

import React from "react";
import { useFocusRing, useMotionPreferencesSafe } from "@/lib/accessibility";

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(({ children, variant = "primary", size = "md", className, ...props }, ref) => {
  const { isFocused, onFocus, onBlur, focusStyle } = useFocusRing();
  const { shouldAnimate, transitionDuration } = useMotionPreferencesSafe();

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      ref={ref}
      onFocus={(e) => {
        onFocus();
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        onBlur();
        props.onBlur?.(e);
      }}
      className={`
        rounded font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className || ""}
        transition-all ${transitionDuration} ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      style={
        isFocused
          ? {
              ...focusStyle,
              ...props.style,
            }
          : props.style
      }
      {...props}
    >
      {children}
    </button>
  );
});

AccessibleButton.displayName = "AccessibleButton";

/**
 * Example Accessible Form Field Component
 */
interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    ariaDescribedBy?: string;
    ariaInvalid: string;
  }) => React.ReactNode;
}

export function AccessibleFormField({
  label,
  error,
  required,
  children,
}: AccessibleFormFieldProps) {
  const { shouldAnimate, transitionDuration } = useMotionPreferencesSafe();
  const fieldId = React.useId();
  const errorId = `${fieldId}-error`;

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block font-medium text-gray-900 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

      {children({
        id: fieldId,
        ariaDescribedBy: error ? errorId : undefined,
        ariaInvalid: error ? "true" : "false",
      })}

      {error && (
        <div
          id={errorId}
          role="alert"
          className={`
            mt-1 text-sm text-red-600 font-medium
            transition-opacity ${transitionDuration} ease-in-out
          `}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Example Accessible Modal Component
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
}: AccessibleModalProps) {
  const { motionPrefs, transitionDuration } = useMotionPreferencesSafe();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const {
    focusFirstElement,
    focusElements,
  } = require("@/lib/accessibility").useFocusManager(modalRef, {
    initialFocusSelector: "[data-autofocus]",
    restoreFocus: true,
  });

  const { announce } = require("@/lib/accessibility")
    .useAccessibilityAnnouncement();

  React.useEffect(() => {
    if (isOpen) {
      announce(`${title} modal opened`, { priority: "assertive" });
      focusFirstElement();
    }
  }, [isOpen, title, announce, focusFirstElement]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity ${transitionDuration} ease-in-out
        `}
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${title}`}
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          bg-white rounded-lg shadow-lg p-6 z-50 max-w-md w-full
          transition-all ${transitionDuration} ease-in-out
        `}
      >
        <h2 id={`modal-title-${title}`} className="text-xl font-bold mb-4">
          {title}
        </h2>

        {children}

        <button
          onClick={onClose}
          data-autofocus
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </>
  );
}

/**
 * Example Component Using Accessibility Preferences
 */
export function AccessibleContentBlock() {
  const {
    useAccessibilityPreferences,
    useSemanticTokens,
    useMotionPreferencesSafe,
  } = require("@/lib/accessibility");

  const preferences = useAccessibilityPreferences();
  const tokens = useSemanticTokens();
  const { transitionDuration } = useMotionPreferencesSafe();

  return (
    <div
      style={{
        fontSize: `calc(16px * ${tokens.typography.scale})`,
        fontFamily: tokens.typography.fontFamily,
        lineHeight: `calc(1.5 * ${tokens.typography.lineHeightMultiplier})`,
        letterSpacing: `${tokens.typography.letterSpacingMultiplier * 0.1}em`,
        color: tokens.colors.textPrimary,
        backgroundColor: tokens.colors.backgroundPrimary,
        transition: `all ${transitionDuration} ease-in-out`,
      }}
      className="p-4 rounded"
    >
      <h3 className="font-bold mb-2">
        Accessible Content
        {preferences.contrastTheme === "high" && " (High Contrast)"}
      </h3>

      <p className="mb-2">
        This content respects user accessibility preferences:
      </p>

      <ul className="list-disc list-inside space-y-1">
        <li>Text scale: {preferences.textScale}%</li>
        <li>Font: {preferences.fontMode}</li>
        <li>Contrast: {preferences.contrastTheme}</li>
        <li>
          {preferences.reduceMotion ? "✓ Reduced motion" : "Motion enabled"}
        </li>
      </ul>

      {preferences.highlightFocus && (
        <p className="mt-2 text-sm italic">Focus highlighting is enabled</p>
      )}
    </div>
  );
}

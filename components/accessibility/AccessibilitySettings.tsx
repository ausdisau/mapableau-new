/**
 * Enhanced Accessibility Settings Page
 *
 * Demonstrates:
 * - Semantic tokens for theming
 * - Accessibility preferences display
 * - Accessibility needs summary
 * - Integration with new Zustand store
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AccessibilityProfileFormRefactored } from "@/components/forms/AccessibilityProfileFormRefactored";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAccessibilityPreferences,
  useAccessibilityNeeds,
  useSemanticTokens,
} from "@/lib/accessibility";
import type { DigitalPreferences, TransportRequirements } from "@/types/mapable";

const PRESET_DESCRIPTIONS = {
  "reduce-motion": {
    label: "Reduce Motion",
    description: "Minimizes animations and transitions for comfort",
    icon: "🎯",
  },
  "clearer-vision": {
    label: "Clearer Vision",
    description: "Higher contrast and larger text for visual clarity",
    icon: "👁️",
  },
  "focus-mode": {
    label: "Focus Mode",
    description: "Highlights focus indicators and simplifies interface",
    icon: "✨",
  },
  "reading-support": {
    label: "Reading Support",
    description: "Dyslexia-friendly font and text spacing",
    icon: "📖",
  },
  "comfort-mode": {
    label: "Comfort Mode",
    description: "Combination of ease-of-reading and motion preferences",
    icon: "☁️",
  },
};

interface AccessibilitySettingsProps {
  initialProfile?: {
    mobilityNeeds: string[];
    communicationPreferences: string[];
    transportRequirements: TransportRequirements;
    digitalPreferences: DigitalPreferences;
  };
}

export function AccessibilitySettings({
  initialProfile = {
    mobilityNeeds: [],
    communicationPreferences: [],
    transportRequirements: {},
    digitalPreferences: {},
  },
}: AccessibilitySettingsProps) {
  const [mounted, setMounted] = useState(false);

  // Use new accessibility hooks
  const preferences = useAccessibilityPreferences();
  const needs = useAccessibilityNeeds();
  const tokens = useSemanticTokens();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div
      className="space-y-8"
      style={{
        fontSize: `calc(16px * ${tokens.typography.scale})`,
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      {/* Header */}
      <header>
        <h1
          className="font-heading text-3xl font-bold mb-2"
          style={{ color: tokens.colors.textPrimary }}
        >
          Accessibility & Display Settings
        </h1>
        <p
          className="max-w-2xl"
          style={{ color: tokens.colors.textSecondary }}
        >
          Customize how MapAble appears and works for you. These settings apply
          across all MapAble services.
        </p>
      </header>

      {/* Current Settings Overview */}
      <Card
        style={{
          borderColor: tokens.colors.borderColor,
          backgroundColor: tokens.colors.backgroundSecondary,
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: tokens.colors.textPrimary }}>
            Your Current Display Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl
            className="grid grid-cols-2 gap-4 text-sm"
            style={{ color: tokens.colors.textPrimary }}
          >
            <div>
              <dt className="font-semibold mb-1">Text Size</dt>
              <dd className="text-lg">{preferences.textScale}%</dd>
            </div>
            <div>
              <dt className="font-semibold mb-1">Contrast</dt>
              <dd>
                {preferences.contrastTheme === "high"
                  ? "High Contrast"
                  : "Standard"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold mb-1">Font</dt>
              <dd>{preferences.fontMode}</dd>
            </div>
            <div>
              <dt className="font-semibold mb-1">Motion</dt>
              <dd>{preferences.reduceMotion ? "Reduced" : "Normal"}</dd>
            </div>
            <div>
              <dt className="font-semibold mb-1">Focus Highlights</dt>
              <dd>{preferences.highlightFocus ? "Enabled" : "Disabled"}</dd>
            </div>
            <div>
              <dt className="font-semibold mb-1">Color Scheme</dt>
              <dd>{preferences.colorScheme}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Accessibility Needs Summary */}
      {needs.allNeeds.length > 0 && (
        <Card
          style={{
            borderColor: tokens.colors.borderColor,
            backgroundColor: tokens.colors.backgroundSecondary,
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: tokens.colors.textPrimary }}>
              Your Accessibility Needs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-sm mb-4"
              style={{ color: tokens.colors.textSecondary }}
            >
              These needs help MapAble personalize support across care,
              transport, and other services.
            </p>

            <div className="space-y-3">
              {needs.allNeeds.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">All Needs</h4>
                  <div className="space-y-2">
                    {needs.allNeeds.map((need) => (
                      <div
                        key={`${need.domain}-${need.id}`}
                        className="pl-4 border-l-2 text-sm"
                        style={{
                          borderColor: tokens.colors.focusRing,
                          color: tokens.colors.textPrimary,
                        }}
                      >
                        <p className="font-medium">{need.description}</p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: tokens.colors.textSecondary }}
                        >
                          {need.domain} • {need.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {needs.mobilityNeeds.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Mobility</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {needs.mobilityNeeds.map((need) => (
                      <li key={need.id}>{need.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {needs.sensoryNeeds.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Sensory</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {needs.sensoryNeeds.map((need) => (
                      <li key={need.id}>{need.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Settings Form */}
      <Card
        style={{
          borderColor: tokens.colors.borderColor,
          backgroundColor: tokens.colors.backgroundSecondary,
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: tokens.colors.textPrimary }}>
            Edit Your Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccessibilityProfileFormRefactored initial={initialProfile} />
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <div>
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: tokens.colors.textPrimary }}
        >
          Quick Presets
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: tokens.colors.textSecondary }}
        >
          Choose a preset below to quickly adjust multiple settings at once.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PRESET_DESCRIPTIONS).map(([id, preset]) => (
            <Card
              key={id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              style={{
                borderColor: tokens.colors.borderColor,
                backgroundColor: tokens.colors.backgroundSecondary,
              }}
            >
              <CardContent className="p-4">
                <div className="text-2xl mb-2">{preset.icon}</div>
                <h3 className="font-semibold" style={{ color: tokens.colors.textPrimary }}>
                  {preset.label}
                </h3>
                <p
                  className="text-sm mt-2"
                  style={{ color: tokens.colors.textSecondary }}
                >
                  {preset.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Links */}
      <Card
        style={{
          borderColor: tokens.colors.borderColor,
          backgroundColor: tokens.colors.backgroundSecondary,
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: tokens.colors.textPrimary }}>
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p style={{ color: tokens.colors.textPrimary }}>
              Learn more about accessibility features:
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help/accessibility"
                  style={{ color: tokens.colors.focusRing }}
                  className="hover:underline"
                >
                  Accessibility features guide →
                </Link>
              </li>
              <li>
                <Link
                  href="/help/screen-readers"
                  style={{ color: tokens.colors.focusRing }}
                  className="hover:underline"
                >
                  Screen reader tips →
                </Link>
              </li>
              <li>
                <Link
                  href="/help/keyboard-shortcuts"
                  style={{ color: tokens.colors.focusRing }}
                  className="hover:underline"
                >
                  Keyboard shortcuts →
                </Link>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info (Dev Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-2 max-h-48 overflow-auto">
              <p>Preferences: {JSON.stringify(preferences, null, 2)}</p>
              <p>Needs: {needs.allNeeds.length} total</p>
              <p>
                Tokens Scale: {tokens.typography.scale} × 1.0 (text size)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Reference: blueprint:javascript_stripe
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Shield, Zap } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY - Stripe payment will be unavailable');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ tier }: { tier: "premium" | "cooperative" }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/browse?payment=success",
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: `Welcome to DisabilityFour+ ${tier === "premium" ? "Premium" : "Cooperative"}!`,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="form-stripe-checkout">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Subscribe to {tier === "premium" ? "Premium" : "Cooperative"}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [selectedTier, setSelectedTier] = useState<"premium" | "cooperative">("premium");
  const { toast } = useToast();

  // Tier pricing (display only - server validates)
  const TIER_PRICING = {
    premium: { amount: 10, interval: "month" },
    cooperative: { amount: 20, interval: "year" },
  };

  useEffect(() => {
    if (paymentMethod === "stripe") {
      // Create subscription using tier-based API (no amount from client)
      // Note: In production, userId and email would come from auth session
      apiRequest("POST", "/api/create-subscription", { 
        tier: selectedTier,
        userId: "demo-user-id", // TODO: Get from auth session
        email: "demo@example.com", // TODO: Get from auth session
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            if (data.message) {
              console.log(data.message);
            }
          } else {
            toast({
              title: "Payment Setup Failed",
              description: "Stripe is not configured. Please contact support.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("Failed to create subscription:", error);
          toast({
            title: "Payment Setup Failed",
            description: "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [paymentMethod, selectedTier]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-muted-foreground">
            Unlock ad-free streaming and exclusive content
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Select Your Tier
              </CardTitle>
              <CardDescription>Choose the membership level that's right for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tier Selection */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={selectedTier === "premium" ? "default" : "outline"}
                  onClick={() => setSelectedTier("premium")}
                  className="w-full justify-start"
                  data-testid="button-select-premium"
                >
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Premium</div>
                    <div className="text-sm opacity-90">${TIER_PRICING.premium.amount} AUD/{TIER_PRICING.premium.interval}</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={selectedTier === "cooperative" ? "default" : "outline"}
                  onClick={() => setSelectedTier("cooperative")}
                  className="w-full justify-start"
                  data-testid="button-select-cooperative"
                >
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Cooperative Member</div>
                    <div className="text-sm opacity-90">${TIER_PRICING.cooperative.amount} AUD/{TIER_PRICING.cooperative.interval}</div>
                  </div>
                </Button>
              </div>

              {/* Benefits for selected tier */}
              <div className="pt-4 border-t">
                <p className="font-medium mb-3">
                  {selectedTier === "premium" ? "Premium Benefits:" : "Cooperative Benefits:"}
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Ad-free streaming experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Access to {selectedTier === "premium" ? "Premium" : "all"} content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Early access to new releases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Support disability-focused media</span>
                  </li>
                  {selectedTier === "cooperative" && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Voting rights in cooperative decisions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Deeper community involvement</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription>Choose how you'd like to pay</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Payment Method Selector */}
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={paymentMethod === "stripe" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("stripe")}
                  className="flex-1"
                  data-testid="button-select-stripe"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "paypal" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("paypal")}
                  className="flex-1"
                  data-testid="button-select-paypal"
                >
                  PayPal
                </Button>
              </div>

              {/* Stripe Checkout */}
              {paymentMethod === "stripe" && (
                <>
                  {!stripePromise ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Stripe payment is not configured.</p>
                      <p className="text-sm mt-2">Please contact support.</p>
                    </div>
                  ) : !clientSecret ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm tier={selectedTier} />
                    </Elements>
                  )}
                </>
              )}

              {/* PayPal Checkout */}
              {paymentMethod === "paypal" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click the PayPal button below to complete your {selectedTier} subscription
                  </p>
                  <PayPalButton 
                    tier={selectedTier}
                    onSuccess={() => {
                      toast({
                        title: "Payment Successful",
                        description: `Welcome to DisabilityFour+ ${selectedTier === "premium" ? "Premium" : "Cooperative"}!`,
                      });
                      window.location.href = "/browse?payment=success";
                    }}
                    onError={() => {
                      toast({
                        title: "Payment Failed",
                        description: "Unable to process payment. Please try again.",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-6 text-center">
                <Shield className="inline h-3 w-3 mr-1" />
                Secure payment processing. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

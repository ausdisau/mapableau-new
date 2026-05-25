import { Button } from "@/components/ui/button";

interface SaveAndContinueButtonProps {
  loading?: boolean;
  label?: string;
}

export function SaveAndContinueButton({
  loading,
  label = "Save and continue",
}: SaveAndContinueButtonProps) {
  return (
    <Button
      type="submit"
      variant="default"
      size="lg"
      className="min-h-12 w-full sm:w-auto"
      loading={loading}
    >
      {label}
    </Button>
  );
}

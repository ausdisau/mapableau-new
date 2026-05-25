import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { AU_STATES } from "@/lib/registration/constants";

interface AddressLiteFieldsProps {
  country: "AU" | "NZ";
  stateOrTerritory: string;
  postcode: string;
  onCountryChange: (v: "AU" | "NZ") => void;
  onStateChange: (v: string) => void;
  onPostcodeChange: (v: string) => void;
  errors?: Record<string, string>;
}

export function AddressLiteFields({
  country,
  stateOrTerritory,
  postcode,
  onCountryChange,
  onStateChange,
  onPostcodeChange,
  errors = {},
}: AddressLiteFieldsProps) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-base font-semibold">Where you are based</legend>
      <p className="text-sm text-muted-foreground">
        Your postcode helps MapAble show services near you. You can add your full
        address later if you book a service.
      </p>

      <AccessibleFormField
        id="country"
        label="Country"
        required
        error={errors.country}
      >
        <select
          id="country"
          className={formInputClass}
          value={country}
          onChange={(e) => onCountryChange(e.target.value as "AU" | "NZ")}
        >
          <option value="AU">Australia</option>
          <option value="NZ">New Zealand</option>
        </select>
      </AccessibleFormField>

      {country === "AU" ? (
        <AccessibleFormField
          id="stateOrTerritory"
          label="State or territory"
          required
          error={errors.stateOrTerritory}
        >
          <select
            id="stateOrTerritory"
            className={formInputClass}
            value={stateOrTerritory}
            onChange={(e) => onStateChange(e.target.value)}
          >
            <option value="">Select…</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </AccessibleFormField>
      ) : (
        <AccessibleFormField
          id="stateOrTerritory"
          label="Region"
          required
          error={errors.stateOrTerritory}
        >
          <input
            id="stateOrTerritory"
            type="text"
            className={formInputClass}
            value={stateOrTerritory}
            onChange={(e) => onStateChange(e.target.value)}
          />
        </AccessibleFormField>
      )}

      <AccessibleFormField
        id="postcode"
        label="Postcode"
        required
        error={errors.postcode}
      >
        <input
          id="postcode"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          className={formInputClass}
          value={postcode}
          onChange={(e) => onPostcodeChange(e.target.value)}
        />
      </AccessibleFormField>
    </fieldset>
  );
}

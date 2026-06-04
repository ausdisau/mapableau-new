import type { UIMessage } from "ai";

import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

export type FinderInterpretationData = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
};

export type ProviderFinderChatUIMessage = UIMessage<
  never,
  {
    finderInterpretation: FinderInterpretationData;
  }
>;

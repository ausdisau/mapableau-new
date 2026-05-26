"use client";

let cachedLoader: Promise<JQueryStatic> | null = null;

export function loadJQueryAutocomplete(): Promise<JQueryStatic> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("jQuery autocomplete requires a browser."));
  }

  if (!cachedLoader) {
    cachedLoader = (async () => {
      const jqueryModule = await import("jquery");
      const $ = (jqueryModule.default ?? jqueryModule) as unknown as JQueryStatic;
      const browserWindow = window as typeof window & {
        $?: JQueryStatic;
        jQuery?: JQueryStatic;
      };
      const globalScope = globalThis as typeof globalThis & {
        $?: JQueryStatic;
        jQuery?: JQueryStatic;
      };

      browserWindow.$ = $;
      browserWindow.jQuery = $;
      globalScope.$ = $;
      globalScope.jQuery = $;

      await import("jquery-ui-dist/jquery-ui");

      return $;
    })();
  }

  return cachedLoader;
}

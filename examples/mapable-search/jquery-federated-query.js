/* Standalone, optional jQuery example. Requires a reviewed local jQuery load.
 * Not included in MapAble's production React bundle.
 * Never pass database keys, Supabase service_role or participant data here.
 */
(function ($) {
  "use strict";
  if (!$) return;
  const query = "query MapAbleDirectory($text: String!, $state: String, $limit: Int!) {\n  mapAbleDirectory(text: $text, state: $state, limit: $limit) {\n    providers {\n      id\n      name\n      state\n      locality\n      source\n      evidenceStatus\n      registrationStatus\n      availability\n    }\n    graph {\n      nodes { id label kind }\n      edges { sourceId targetId kind }\n    }\n    sources { neon supabase }\n  }\n}";
  $(function () {
    const $form = $("#mapable-directory-form");
    const $results = $("#mapable-directory-results");
    const $status = $("#mapable-directory-status");
    if (!$form.length || !$results.length) return;

    $form.on("submit", function (event) {
      event.preventDefault();
      const text = String($("#mapable-directory-query").val() || "").trim();
      const state = String($("#mapable-directory-state").val() || "").trim();
      if (text.length < 2 || text.length > 80) {
        $status.text("Please enter between 2 and 80 characters.");
        return;
      }
      $status.text("Searching public directory information…");
      $results.empty();
      const $submit = $form.find('button[type="submit"]').prop("disabled", true);

      $.ajax({
        url: "/api/mapable/search/graphql",
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        timeout: 10000,
        data: JSON.stringify({
          operationName: "MapAbleDirectory",
          query: query,
          variables: { text: text, state: state || null, limit: 10 },
        }),
      }).done(function (payload) {
        const response = payload && payload.data && payload.data.mapAbleDirectory;
        if (!response) {
          $status.text("The public directory response is unavailable.");
          return;
        }
        const providers = Array.isArray(response.providers) ? response.providers : [];
        const $list = $("<ul>").attr("aria-label", "Public directory matches");
        providers.forEach(function (provider) {
          $("<li>").text(
            provider.name + " (" + (provider.state || "area unknown") +
            ", " + provider.source + ") — registration and availability not verified"
          ).appendTo($list);
        });
        $results.append($list);
        const sources = response.sources || {};
        const notice = "Neon: " + (sources.neon || "unknown") +
          "; Supabase: " + (sources.supabase || "unknown");
        $status.text(
          providers.length + " directory entries. " + notice +
          ". Confirm current registration, accessibility and availability independently."
        );

        // Optional GraphGL view consumes this data. Do not use graph nodes as
        // evidence of support-worker screening, participant access or availability.
        if (window.MapAbleGraphGL && typeof window.MapAbleGraphGL.update === "function") {
          window.MapAbleGraphGL.update(response.graph || { nodes: [], edges: [] });
        }
      }).fail(function (request) {
        let message = "Public search is currently unavailable. Use the standard Provider Finder.";
        if (request.status === 404) message = "This preview search is disabled.";
        if (request.status === 429) message = "Too many requests. Try again later.";
        $status.text(message);
      }).always(function () {
        $submit.prop("disabled", false);
      });
    });
  });
})(typeof window !== "undefined" ? window.jQuery : undefined);

/**
 * MapAble embeddable accessibility widget bootstrapper.
 *
 * Usage (host site):
 * <div data-mapable-widget data-location-id="loc_123">
 *   <a href="https://mapable.com.au/embed/loc_123">View accessible map on MapAble</a>
 * </div>
 * <script src="https://mapable.com.au/embed.js" async></script>
 *
 * Also accepts data-place-id (location-id wins when both are set).
 * Preserves the SEO fallback <a> in the DOM (visually hidden) for no-JS crawlers.
 *
 * Dependency-free IIFE — does not pollute the host global scope.
 */
(function () {
  "use strict";

  var ATTR_WIDGET = "data-mapable-widget";
  var ATTR_LOCATION = "data-location-id";
  var ATTR_PLACE = "data-place-id";
  var ATTR_ORIGIN = "data-mapable-origin";
  var ATTR_ENHANCED = "data-mapable-enhanced";
  var DEFAULT_ORIGIN = "https://mapable.com.au";
  var MIN_HEIGHT_PX = 420;

  /**
   * @param {Element} el
   * @returns {string}
   */
  function resolveOrigin(el) {
    var fromEl = el.getAttribute(ATTR_ORIGIN);
    if (fromEl && /^https?:\/\//i.test(fromEl)) {
      return fromEl.replace(/\/$/, "");
    }
    var script = document.currentScript;
    if (script && script.src) {
      try {
        var u = new URL(script.src);
        return u.origin;
      } catch (_e) {
        /* fall through */
      }
    }
    return DEFAULT_ORIGIN;
  }

  /**
   * @param {string} locationId
   * @returns {boolean}
   */
  function isSafeLocationId(locationId) {
    return /^[A-Za-z0-9_-]{1,128}$/.test(locationId);
  }

  /**
   * Prefer data-location-id; fall back to data-place-id.
   * @param {HTMLElement} container
   * @returns {string}
   */
  function resolveLocationId(container) {
    var locationId = (container.getAttribute(ATTR_LOCATION) || "").trim();
    if (locationId) return locationId;
    return (container.getAttribute(ATTR_PLACE) || "").trim();
  }

  /**
   * Visually hide SEO fallback anchors without removing them from the DOM.
   * @param {HTMLElement} container
   */
  function hideSeoFallbackLinks(container) {
    var anchors = container.querySelectorAll("a");
    for (var i = 0; i < anchors.length; i++) {
      var a = /** @type {HTMLElement} */ (anchors[i]);
      a.setAttribute("aria-hidden", "true");
      a.setAttribute("tabindex", "-1");
      a.style.cssText =
        "position:absolute;width:1px;height:1px;padding:0;margin:-1px;" +
        "overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    }
  }

  /**
   * @param {HTMLElement} container
   * @param {string} locationId
   * @param {string} origin
   */
  function injectIframe(container, locationId, origin) {
    if (container.getAttribute(ATTR_ENHANCED) === "1") return;
    container.setAttribute(ATTR_ENHANCED, "1");

    // Keep SEO fallback <a> in the initial HTML tree for crawlers that skip JS.
    // Never clear the container; append the iframe as a sibling of the link.
    hideSeoFallbackLinks(container);

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    var iframe = document.createElement("iframe");
    iframe.src =
      origin + "/embed/" + encodeURIComponent(locationId) + "?utm_source=embed_widget";
    iframe.title = "MapAble accessible map";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox",
    );
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute("allow", "geolocation 'self'");
    iframe.style.cssText =
      "display:block;width:100%;min-height:" +
      MIN_HEIGHT_PX +
      "px;height:auto;aspect-ratio:16/10;border:0;border-radius:0;background:#0f172a;";

    container.appendChild(iframe);
  }

  /**
   * @param {HTMLElement} container
   */
  function enhanceContainer(container) {
    var locationId = resolveLocationId(container);
    if (!locationId || !isSafeLocationId(locationId)) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "[MapAble embed] missing or invalid data-location-id / data-place-id on widget container",
        );
      }
      return;
    }

    var origin = resolveOrigin(container);

    if (!("IntersectionObserver" in window)) {
      injectIframe(container, locationId, origin);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          observer.unobserve(container);
          injectIframe(container, locationId, origin);
          break;
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0.01 },
    );

    observer.observe(container);
  }

  function boot() {
    var nodes = document.querySelectorAll("[" + ATTR_WIDGET + "]");
    for (var i = 0; i < nodes.length; i++) {
      enhanceContainer(/** @type {HTMLElement} */ (nodes[i]));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

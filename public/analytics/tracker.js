/* OpenAA anonymous page analytics. No cookies, query strings, form values or click text. */
(function () {
  "use strict";
  if (window.__openaaAnalytics) return;
  window.__openaaAnalytics = true;
  var sites = [
    "openaa.com",
    "dmv.openaa.com",
    "tools.openaa.com",
    "go.openaa.com",
  ];
  if (location.protocol !== "https:" || sites.indexOf(location.hostname) < 0)
    return;
  var memoryId;
  var lastPath;
  var previousPath;
  function visitorId() {
    try {
      var id = localStorage.getItem("openaa:visitor_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("openaa:visitor_id", id);
      }
      return id;
    } catch {
      return memoryId || (memoryId = crypto.randomUUID());
    }
  }
  function track() {
    var path = location.pathname;
    if (
      document.visibilityState === "hidden" ||
      path === lastPath ||
      /^\/(admin|api|_next)(\/|$)/.test(path)
    )
      return;
    lastPath = path;
    var referrer = previousPath
      ? location.origin + previousPath
      : document.referrer;
    previousPath = path;
    try {
      fetch("https://openaa.com/api/analytics/page-view", {
        method: "POST",
        credentials:
          location.hostname === "openaa.com" ? "same-origin" : "omit",
        headers: { "Content-Type": "text/plain" },
        keepalive: true,
        body: JSON.stringify({
          path: path,
          title: document.title,
          visitor_id: visitorId(),
          event_id: crypto.randomUUID(),
          referrer: referrer || null,
        }),
      }).catch(function () {});
    } catch {
      /* Analytics must never interrupt the site. */
    }
  }
  function schedule() {
    setTimeout(track, 0);
  }
  ["pushState", "replaceState"].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      schedule();
      return result;
    };
  });
  window.addEventListener("popstate", schedule);
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) lastPath = null;
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  schedule();
})();

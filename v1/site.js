(function () {
  "use strict";

  var site = window.__IMAGE_PRIVACY_SITE__;
  if (!site) return;

  var EMAIL = "1257670186@qq.com";
  var links = {
    appleEula: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
    appleCancel: "https://support.apple.com/118428",
    googleManage: "https://support.google.com/googleplay/answer/7018481",
    appleRefund: "https://support.apple.com/118223",
    googleRefund: "https://support.google.com/googleplay/answer/15574897"
  };
  var documents = {
    home: "index.html",
    privacy: "privacy/index.html",
    terms: "terms/index.html",
    support: "support/index.html"
  };
  var page = document.documentElement.getAttribute("data-page") || "home";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function interpolate(value, appName) {
    return String(value).replaceAll("{appName}", appName).replaceAll("{email}", EMAIL);
  }

  function localeByCode(code) {
    return site.locales.find(function (locale) { return locale.code === code; });
  }

  function matchLocale(language) {
    var normalized = String(language || "").replaceAll("_", "-").toLowerCase();
    if (!normalized) return null;
    var exact = site.locales.find(function (locale) { return locale.code.toLowerCase() === normalized; });
    if (exact) return exact.code;
    if (normalized === "zh" || normalized.startsWith("zh-cn") || normalized.startsWith("zh-sg") || normalized.startsWith("zh-hans")) return "zh-Hans";
    if (normalized.startsWith("zh-tw") || normalized.startsWith("zh-hk") || normalized.startsWith("zh-mo") || normalized.startsWith("zh-hant")) return "zh-Hant";
    if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
    if (normalized === "fr" || normalized.startsWith("fr-")) return "fr";
    if (normalized === "es" || normalized.startsWith("es-")) return "es-ES";
    if (normalized === "pt" || normalized.startsWith("pt-")) return normalized.startsWith("pt-br") ? "pt-BR" : "pt-PT";
    var base = normalized.split("-")[0];
    var matched = site.locales.find(function (locale) { return locale.code.toLowerCase() === base; });
    return matched ? matched.code : null;
  }

  function detectedLocale() {
    var requested = new URLSearchParams(window.location.search).get("lang");
    if (requested) return matchLocale(requested) || "en-US";
    var languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var index = 0; index < languages.length; index += 1) {
      var matched = matchLocale(languages[index]);
      if (matched) return matched;
    }
    return "en-US";
  }

  function pageHref(target, locale) {
    return (page === "home" ? "./" : "../") + documents[target] + "?lang=" + encodeURIComponent(locale);
  }

  function sectionHtml(section, appName, copy) {
    var html = '<section class="legal-section"><h2>' + escapeHtml(interpolate(section.title, appName)) + "</h2>";
    if (section.callout) {
      html += '<aside class="callout"><strong>' + escapeHtml(interpolate(section.callout.title, appName)) + "</strong><br>" + escapeHtml(interpolate(section.callout.body, appName)) + "</aside>";
    }
    (section.paragraphs || []).forEach(function (paragraph) {
      html += "<p>" + escapeHtml(interpolate(paragraph, appName)) + "</p>";
    });
    if (section.bullets) {
      html += "<ul>" + section.bullets.map(function (bullet) { return "<li>" + escapeHtml(interpolate(bullet, appName)) + "</li>"; }).join("") + "</ul>";
    }
    if (section.links) {
      html += "<p>" + section.links.map(function (key) {
        return '<a href="' + links[key] + '" target="_blank" rel="noreferrer">' + escapeHtml(copy.linkLabels[key]) + "</a>";
      }).join(" · ") + "</p>";
    }
    return html + "</section>";
  }

  function homeHtml(copy, appName, locale) {
    var arrow = localeByCode(locale).direction === "rtl" ? "←" : "→";
    var cards = copy.home.cards.map(function (card, index) {
      var target = index === 0 ? "privacy" : index === 1 ? "terms" : "support";
      return '<a class="feature-card" href="' + pageHref(target, locale) + '"><span class="card-index">0' + (index + 1) + "</span><h2>" + escapeHtml(interpolate(card.title, appName)) + "</h2><p>" + escapeHtml(interpolate(card.description, appName)) + "</p><b>" + escapeHtml(interpolate(card.action, appName)) + ' <span aria-hidden="true">' + arrow + "</span></b></a>";
    }).join("");
    return '<main class="home-main"><section class="home-hero"><p class="eyebrow">' + escapeHtml(interpolate(copy.home.eyebrow, appName)) + "</p><h1>" + escapeHtml(interpolate(copy.home.title, appName)) + '</h1><p class="hero-copy">' + escapeHtml(interpolate(copy.home.lead, appName)) + '</p><div class="hero-points" aria-label="' + escapeHtml(interpolate(copy.home.eyebrow, appName)) + '">' + copy.home.points.map(function (point) { return "<span>" + escapeHtml(interpolate(point, appName)) + "</span>"; }).join("") + '</div></section><section class="home-cards" aria-label="' + escapeHtml(copy.nav.navigationLabel) + '">' + cards + "</section></main>";
  }

  function documentHtml(copy, appName, documentPage) {
    var documentCopy = copy[documentPage];
    return '<main class="document-main"><section class="document-hero"><p class="eyebrow">' + escapeHtml(appName + " · " + interpolate(documentCopy.title, appName)) + "</p><h1>" + escapeHtml(interpolate(documentCopy.title, appName)) + "</h1><p>" + escapeHtml(interpolate(documentCopy.lead, appName)) + '</p><span class="updated">' + (documentPage === "privacy" ? "2026-09-25" : "2026-08-08") + '</span></section><article class="document-content">' + documentCopy.sections.map(function (section) { return sectionHtml(section, appName, copy); }).join("") + "</article></main>";
  }

  function supportHtml(copy, appName) {
    var support = copy.support;
    var faq = support.faqs.map(function (item) {
      return '<article class="faq"><h2>' + escapeHtml(interpolate(item.question, appName)) + "</h2><p>" + escapeHtml(interpolate(item.answer, appName)) + "</p></article>";
    }).join("");
    var officialLinks = ["appleCancel", "appleRefund", "googleManage", "googleRefund"].map(function (key) {
      return '<a href="' + links[key] + '" target="_blank" rel="noreferrer">' + escapeHtml(copy.linkLabels[key]) + "</a>";
    }).join(" · ");
    return '<main class="document-main"><section class="document-hero"><p class="eyebrow">' + escapeHtml(appName + " · " + interpolate(support.title, appName)) + "</p><h1>" + escapeHtml(interpolate(support.title, appName)) + "</h1><p>" + escapeHtml(interpolate(support.lead, appName)) + '</p></section><article class="document-content"><section class="email-panel"><div><strong>' + escapeHtml(interpolate(support.emailTitle, appName)) + "</strong><p>" + escapeHtml(interpolate(support.emailLead, appName)) + '</p></div><a href="mailto:' + EMAIL + '">' + EMAIL + "</a></section>" + sectionHtml(support.beforeEmail, appName, copy) + '<section class="faq-grid">' + faq + '</section><section class="legal-section"><h2>' + escapeHtml(interpolate(support.officialHelpTitle, appName)) + "</h2><p>" + officialLinks + "</p></section></article></main>";
  }

  function updateNavigation(locale, copy, appName) {
    var brand = document.querySelector(".brand");
    brand.href = pageHref("home", locale);
    brand.setAttribute("aria-label", appName + "：" + copy.nav.privacy + "、" + copy.nav.terms + "、" + copy.nav.support);
    brand.querySelector("span").textContent = appName;
    var nav = document.querySelector("nav");
    nav.setAttribute("aria-label", copy.nav.navigationLabel);
    var navLinks = nav.querySelectorAll("a");
    ["privacy", "terms", "support"].forEach(function (target, index) {
      navLinks[index].href = pageHref(target, locale);
      navLinks[index].textContent = copy.nav[target];
    });
    var language = document.querySelector(".language-control");
    language.firstChild.nodeValue = copy.nav.language;
    var select = language.querySelector("select");
    select.setAttribute("aria-label", copy.nav.chooseLanguage);
    select.value = locale;
    var footer = document.querySelector("footer");
    footer.querySelector("span").textContent = "© 2026 " + appName;
    var footerLinks = footer.querySelectorAll("a");
    ["privacy", "terms", "support"].forEach(function (target, index) {
      footerLinks[index].href = pageHref(target, locale);
      footerLinks[index].textContent = copy.footer[target];
    });
  }

  function applyLocale(locale) {
    var language = localeByCode(locale);
    var copy = site.content[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = language && language.direction ? language.direction : "ltr";
    document.documentElement.setAttribute("data-selected-locale", locale);
    var select = document.querySelector("select");
    if (select) select.value = locale;
    if (!copy) return;
    var appName = language.appName;
    updateNavigation(locale, copy, appName);
    var main = document.querySelector("main");
    if (main) main.outerHTML = page === "home" ? homeHtml(copy, appName, locale) : page === "support" ? supportHtml(copy, appName) : documentHtml(copy, appName, page);
    document.title = page === "home" ? appName + " · Privacy, Terms & Support" : interpolate(copy[page].title, appName) + " · " + appName;
  }

  var selectedLocale = detectedLocale();
  applyLocale(selectedLocale);
  var select = document.querySelector("select");
  if (select) select.addEventListener("change", function () {
    var nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("lang", select.value);
    window.location.href = nextUrl.href;
  });
})();

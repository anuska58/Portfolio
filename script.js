(function () {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  function initHeaderState() {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;

    const updateHeaderState = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    window.addEventListener("scroll", updateHeaderState, { passive: true });
    updateHeaderState();
  }

  function initNavigation() {
    const header = document.querySelector("[data-site-header]");
    const toggle = document.querySelector("[data-nav-toggle]");
    const navigation = document.querySelector("[data-navigation]");

    if (!header || !toggle || !navigation) return;

    const toggleLabel = toggle.querySelector(".nav-toggle-label");
    const mobileQuery = window.matchMedia("(max-width: 780px)");
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';
    let isOpen = false;

    function setNavigationFocusable(isFocusable) {
      if ("inert" in navigation) {
        navigation.inert = !isFocusable;
        return;
      }

      navigation.querySelectorAll(focusableSelector).forEach((element) => {
        if (!isFocusable) {
          if (!element.hasAttribute("data-nav-tabindex")) {
            const previousValue = element.getAttribute("tabindex");
            element.setAttribute("data-nav-tabindex", previousValue ?? "none");
          }
          element.setAttribute("tabindex", "-1");
          return;
        }

        if (!element.hasAttribute("data-nav-tabindex")) return;

        const previousValue = element.getAttribute("data-nav-tabindex");
        element.removeAttribute("data-nav-tabindex");

        if (previousValue === "none") {
          element.removeAttribute("tabindex");
        } else {
          element.setAttribute("tabindex", previousValue);
        }
      });
    }

    function renderNavigation() {
      const expanded = mobileQuery.matches && isOpen;

      toggle.setAttribute("aria-expanded", String(expanded));
      navigation.dataset.open = String(expanded);
      navigation.classList.toggle("is-open", expanded);
      toggle.classList.toggle("is-active", expanded);
      header.classList.toggle("nav-open", expanded);
      document.body.classList.toggle("nav-open", expanded);

      if (toggleLabel) {
        toggleLabel.textContent = expanded ? "Close" : "Menu";
      }

      if (mobileQuery.matches) {
        navigation.setAttribute("aria-hidden", String(!expanded));
        setNavigationFocusable(expanded);
      } else {
        navigation.removeAttribute("aria-hidden");
        setNavigationFocusable(true);
      }
    }

    function closeNavigation({ restoreFocus = false } = {}) {
      isOpen = false;
      renderNavigation();

      if (restoreFocus && document.contains(toggle)) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      renderNavigation();
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeNavigation();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen && mobileQuery.matches) {
        closeNavigation({ restoreFocus: true });
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (isOpen && mobileQuery.matches && !header.contains(event.target)) {
        closeNavigation();
      }
    });

    const handleViewportChange = () => {
      isOpen = false;
      renderNavigation();
    };

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", handleViewportChange);
    } else {
      mobileQuery.addListener(handleViewportChange);
    }

    renderNavigation();
  }

  function initFindingTabs() {
    document.querySelectorAll("[data-finding-tabs]").forEach((explorer) => {
      const tabs = Array.from(explorer.querySelectorAll("[data-finding-tab]"));
      const panels = Array.from(explorer.querySelectorAll("[data-finding-panel]"));

      if (tabs.length < 2 || tabs.length !== panels.length) return;

      const activate = (name, moveFocus = false) => {
        tabs.forEach((tab) => {
          const isActive = tab.dataset.findingTab === name;
          tab.setAttribute("aria-selected", String(isActive));
          tab.tabIndex = isActive ? 0 : -1;
          if (isActive && moveFocus) tab.focus();
        });

        panels.forEach((panel) => {
          panel.hidden = panel.dataset.findingPanel !== name;
        });
      };

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(tab.dataset.findingTab));
        tab.addEventListener("keydown", (event) => {
          let nextIndex = null;
          if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
          if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = tabs.length - 1;
          if (nextIndex === null) return;

          event.preventDefault();
          activate(tabs[nextIndex].dataset.findingTab, true);
        });
      });

      const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
      explorer.classList.add("is-enhanced");
      activate(selectedTab.dataset.findingTab);
    });
  }

  function initCaseNavigation() {
    const navigation = document.querySelector(".case-nav");
    if (!navigation || !("IntersectionObserver" in window)) return;

    const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    if (!sections.length) return;

    const setCurrent = (id) => {
      links.forEach((link) => {
        if (link.getAttribute("href") === `#${id}`) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -62%", threshold: [0, 0.15, 0.4] }
    );

    sections.forEach((section) => observer.observe(section));
    setCurrent(sections[0].id);
  }

  function setCurrentYear() {
    const currentYear = String(new Date().getFullYear());

    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = currentYear;
    });
  }

  function init() {
    initHeaderState();
    initNavigation();
    initFindingTabs();
    initCaseNavigation();
    setCurrentYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

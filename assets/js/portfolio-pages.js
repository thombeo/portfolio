(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector(".nav-links");

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Mở menu");
    navigation.classList.remove("is-open");
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.setAttribute("aria-label", willOpen ? "Đóng menu" : "Mở menu");
      navigation.classList.toggle("is-open", willOpen);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("pointerdown", (event) => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  document.querySelectorAll(".liquid-glass").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      surface.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      let frame = 0;
      let nextTransform = "";

      const render = () => {
        card.style.transform = nextTransform;
        frame = 0;
      };

      card.addEventListener("pointerenter", () => {
        card.classList.add("is-active");
        card.style.transition = "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), border-color 280ms ease, box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1)";
      });

      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        nextTransform = `perspective(900px) translate3d(${x * 8}px, ${y * 6 - 14}px, 58px) rotateX(${y * -10}deg) rotateY(${x * 12}deg) scale(1.018)`;
        card.style.transition = "transform 100ms linear, border-color 280ms ease, box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1)";
        if (!frame) frame = requestAnimationFrame(render);
      });

      card.addEventListener("pointerleave", () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        card.classList.remove("is-active");
        card.style.transition = "transform 720ms cubic-bezier(0.22, 1, 0.36, 1), border-color 280ms ease, box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1)";
        card.style.transform = "perspective(900px) translate3d(0, 0, 0) rotateX(0) rotateY(0) scale(1)";
      });
    });
  }

  const revealElements = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const bucketOf = (category = "") => {
    if (/Giám Sát/i.test(category)) return "Giám sát thi công";
    if (/Quản Lý/i.test(category)) return "Quản lý dự án";
    return "Vận hành";
  };

  const renderWorkPage = () => {
    const list = document.querySelector("#project-list");
    const filters = document.querySelector("#project-filters");
    const count = document.querySelector("#project-count");
    const empty = document.querySelector("#project-empty");
    const projects = window.PORTFOLIO_DATA?.projects || [];

    if (!list || !filters || !count) return;

    const renderDetail = (title, text) => {
      if (!text) return "";
      return `
        <section class="detail-block">
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(text)}</p>
        </section>
      `;
    };

    const renderPlants = (plants = []) => {
      if (!plants.length) return "";
      return `
        <div class="plant-list" aria-label="Phạm vi nhà máy và trạm xử lý">
          ${plants.map((plant) => `
            <div class="plant">
              <span>${escapeHtml(plant.name)}</span>
              <strong>${escapeHtml(plant.cap)}</strong>
            </div>
          `).join("")}
        </div>
      `;
    };

    list.innerHTML = projects.map((project, index) => {
      const detailsId = `project-details-${index + 1}`;
      const detail = project.detail || {};
      return `
        <article class="project-card liquid-glass" id="${escapeHtml(project.id)}" data-project-bucket="${escapeHtml(bucketOf(project.category))}">
          <button class="project-summary-button" type="button" aria-expanded="false" aria-controls="${detailsId}">
            <span class="project-index">${String(index + 1).padStart(2, "0")}</span>
            <span>
              <span class="project-category">${escapeHtml(project.category)}</span>
              <span class="project-title">${escapeHtml(project.name)}</span>
              <span class="project-meta">
                <span>${escapeHtml(project.location)}</span>
                <span>${escapeHtml(project.capacity)}</span>
                <span>${escapeHtml(project.period)}</span>
                <span>${escapeHtml(project.role)}</span>
              </span>
            </span>
            <span class="project-arrow" aria-hidden="true">↗</span>
          </button>
          <div class="project-details" id="${detailsId}">
            <div class="project-details-inner">
              <div class="project-details-content">
                <p class="project-overview">${escapeHtml(project.summary)}</p>
                <div class="detail-grid">
                  ${renderDetail("Vai trò", detail.role)}
                  ${renderDetail("Vấn đề", detail.problem)}
                  ${renderDetail("Giải pháp", detail.solution)}
                  ${renderDetail("Kết quả & nghiệm thu", detail.result)}
                </div>
                ${renderPlants(project.plants)}
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    const cards = [...list.querySelectorAll(".project-card")];
    const buckets = ["Tất cả", ...new Set(projects.map((project) => bucketOf(project.category)))];

    const setCardOpen = (card, isOpen) => {
      const button = card?.querySelector(".project-summary-button");
      if (!card || !button) return;
      card.classList.toggle("is-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
    };

    if (finePointer) {
      cards.forEach((card) => {
        card.addEventListener("pointerenter", () => setCardOpen(card, true));
        card.addEventListener("pointerleave", () => setCardOpen(card, false));
      });
    }

    filters.innerHTML = buckets.map((bucket, index) => `
      <button class="filter-button" type="button" data-filter="${escapeHtml(bucket)}" aria-pressed="${index === 0}">
        ${escapeHtml(bucket)}
      </button>
    `).join("");

    const updateCount = () => {
      const visibleCards = cards.filter((card) => !card.hidden).length;
      count.textContent = `${visibleCards} / ${cards.length} dự án`;
      if (empty) empty.classList.toggle("is-visible", visibleCards === 0);
    };

    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".filter-button");
      if (!button) return;
      const filter = button.dataset.filter;
      filters.querySelectorAll(".filter-button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      cards.forEach((card) => {
        card.hidden = filter !== "Tất cả" && card.dataset.projectBucket !== filter;
      });
      updateCount();
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest(".project-summary-button");
      if (!button) return;
      const card = button.closest(".project-card");
      if (finePointer && event.detail > 0) {
        setCardOpen(card, true);
        return;
      }
      setCardOpen(card, !card.classList.contains("is-open"));
    });

    updateCount();

    const deepLink = decodeURIComponent(window.location.hash.slice(1));
    if (deepLink) {
      const target = document.getElementById(deepLink);
      const targetButton = target?.querySelector(".project-summary-button");
      if (target && targetButton) {
        setCardOpen(target, true);
        requestAnimationFrame(() => target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }));
      }
    }
  };

  const setupContactForm = () => {
    const form = document.querySelector("#contact-form");
    const status = document.querySelector("#form-status");
    if (!form) return;

    const requiredFields = ["name", "email", "phone", "message"];

    const fieldIsValid = (field) => {
      const value = field.value.trim();
      if (field.name === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (field.name === "phone") return value.replace(/\D/g, "").length >= 8;
      if (field.name === "message") return value.length >= 10;
      return value.length > 0;
    };

    const validateField = (field) => {
      const valid = fieldIsValid(field);
      field.setAttribute("aria-invalid", String(!valid));
      field.closest(".field")?.classList.toggle("is-invalid", !valid);
      return valid;
    };

    requiredFields.forEach((name) => {
      const field = form.elements.namedItem(name);
      field?.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const fields = requiredFields
        .map((name) => form.elements.namedItem(name))
        .filter(Boolean);
      const valid = fields.map(validateField).every(Boolean);

      if (!valid) {
        fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
        if (status) status.textContent = "Vui lòng kiểm tra các trường bắt buộc.";
        return;
      }

      const data = new FormData(form);
      const subject = `[Liên hệ Portfolio] ${data.get("subject")} — ${data.get("name")}`;
      const body = [
        `Họ và tên: ${data.get("name")}`,
        `Công ty / Đơn vị: ${data.get("company") || "—"}`,
        `Email: ${data.get("email")}`,
        `Số điện thoại: ${data.get("phone")}`,
        `Loại nhu cầu: ${data.get("subject")}`,
        "",
        "Nội dung:",
        data.get("message"),
        "",
        "— Gửi từ biểu mẫu liên hệ trên website portfolio"
      ].join("\n");

      if (status) status.textContent = "Đang mở ứng dụng email của bạn…";
      window.location.href = `mailto:thombeohau@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  };

  renderWorkPage();
  setupContactForm();
})();

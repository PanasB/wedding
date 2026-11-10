(function () {
  "use strict";
  const cfg = window.WEDDING;
  const byId = (id) => document.getElementById(id);

  /** อ่านค่าจาก config ด้วย path แบบ "venue.name" หรือ "names.0" */
  function pick(path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), cfg);
  }

  /** ส่วนที่ทุกหน้าใช้ร่วมกัน: ข้อความจาก config ชื่อแท็บ และอักษรย่อ */
  function renderShared() {
    document.querySelectorAll("[data-bind]").forEach((el) => {
      el.textContent = pick(el.dataset.bind) ?? "";
    });
    const couple = cfg.names.join(" & ");
    document.title = `${couple} — ${document.title}`;
    const initials = cfg.names.map((n) => n.charAt(0)).join("");
    document.querySelectorAll("[data-initials]").forEach((el) => {
      el.textContent = initials;
    });
  }

  /**
   * ปุ่ม "Go back" กลับไปหน้าที่เพิ่งมาจริง (เช่น RSVP ที่เข้าได้ทั้งจาก home และ details)
   * ถ้าหน้าก่อนหน้าไม่ใช่หน้าในเว็บนี้ (เปิดลิงก์ตรง · มาจาก LINE) ใช้ href ที่ตั้งไว้เป็นทางสำรอง
   */
  function initBackLinks() {
    document.querySelectorAll(".page-nav a").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!cameFromThisSite()) return;
        event.preventDefault();
        history.back();
      });
    });
  }

  function cameFromThisSite() {
    if (!document.referrer || history.length < 2) return false;
    try {
      const prev = new URL(document.referrer);
      const sitePath = location.pathname.replace(/[^/]*$/, "");
      return prev.origin === location.origin && prev.pathname.startsWith(sitePath)
        && prev.pathname !== location.pathname;
    } catch (err) {
      console.warn("referrer is not a valid URL", err);
      return false;
    }
  }

  /** ใส่ class is-visible ให้ [data-reveal] เมื่อเลื่อนมาถึง เพื่อเล่นอนิเมชันปรากฏ */
  function initReveal() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => observer.observe(el));
  }

  /** เวลาที่ฝาซองเปิดและกระดาษเลื่อนออกจนสุด ก่อนเปลี่ยนไปหน้า home */
  const OPEN_LETTER_MS = 2000;

  /** หน้า welcome: กดซองแล้วฝาซองเปิด กระดาษเลื่อนออก แล้วจึงไปหน้า home */
  function initWelcome() {
    const link = byId("open-letter");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function openLetter(event) {
      if (reduceMotion || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      if (link.classList.contains("is-open")) return;
      link.classList.add("is-open");
      setTimeout(() => {
        window.location.href = link.href;
      }, OPEN_LETTER_MS);
    }
    // กดซองหรือปุ่ม "Open the invitation" ก็เปิดซองแบบเดียวกัน
    link.addEventListener("click", openLetter);
    document.querySelectorAll("[data-open-letter]").forEach((el) => el.addEventListener("click", openLetter));

    // กลับมาจาก bfcache ซองยังเปิดค้าง: ปิดทันทีโดยไม่เล่นอนิเมชันย้อน
    // (ถ้าปล่อยให้ transition เล่นถอยหลัง ฝา กระดาษ และตราจะขยับสลับลำดับกันผิด)
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      const root = document.documentElement;
      root.classList.add("is-restoring");
      link.classList.remove("is-open");
      void link.offsetWidth; // ให้เบราว์เซอร์ใช้สถานะปิดก่อนเปิด transition กลับ
      requestAnimationFrame(() => root.classList.remove("is-restoring"));
    });
  }

  /** หน้า home: นับถอยหลังถึงวันงาน */
  function initHome() {
    startCountdown(byId("countdown"), new Date(cfg.date).getTime());
    addSparkles(document.querySelector(".mail-scene"));
  }

  /**
   * ประกายทองระยิบระยับร่วงลงจากช่อดอกไม้สองข้างของชุดซองจดหมาย
   * จุดเริ่มสุ่มอยู่ในช่อ (กรอบเป็น % ของชุดภาพ) · ประกายแต่ละเม็ดวนเล่นเองด้วย CSS
   */
  const SPARKLE_SOURCES = [
    { left: [5, 21], top: [86, 98] }, // ช่อซ้ายล่าง: เริ่มที่ปลายช่อ ไม่ทับดอกไม้
    { left: [76, 96], top: [30, 58] }, // ช่อขวาบน
  ];
  const SPARKLES_PER_SOURCE = 14;

  function addSparkles(scene) {
    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rand = (min, max) => min + Math.random() * (max - min);
    const layer = document.createElement("span");
    layer.className = "sparkles";
    layer.setAttribute("aria-hidden", "true");
    SPARKLE_SOURCES.forEach((src) => {
      for (let i = 0; i < SPARKLES_PER_SOURCE; i += 1) {
        const s = document.createElement("span");
        s.className = "sparkle";
        s.style.left = `${rand(...src.left).toFixed(1)}%`;
        s.style.top = `${rand(...src.top).toFixed(1)}%`;
        s.style.setProperty("--size", `${rand(9, 18).toFixed(1)}px`);
        s.style.setProperty("--fall", `${rand(60, 130).toFixed(0)}px`);
        s.style.setProperty("--drift", `${rand(-14, 14).toFixed(0)}px`);
        s.style.setProperty("--dur", `${rand(3.8, 5.6).toFixed(2)}s`);
        // เริ่มหลังดอกไม้ปรากฏ (ราว 1.6 วินาที) แล้วกระจายจังหวะไม่ให้ร่วงพร้อมกัน
        s.style.setProperty("--delay", `${rand(1.6, 5.6).toFixed(2)}s`);
        layer.append(s);
      }
    });
    scene.append(layer);
  }

  /** หน้า details: กำหนดการ Dress code และแผนที่ */
  function initDetails() {
    byId("map-link").href = cfg.venue.mapUrl;

    const swatches = byId("swatches");
    cfg.dressCode.forEach((item) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "swatch";
      dot.style.backgroundColor = item.color;
      const label = document.createElement("span");
      label.textContent = item.name;
      li.append(dot, label);
      swatches.append(li);
    });

    const timeline = byId("timeline");
    cfg.schedule.forEach((item, index) => {
      const li = document.createElement("li");
      li.style.setProperty("--i", String(index));
      const time = document.createElement("time");
      time.textContent = item.time;
      const title = document.createElement("span");
      title.textContent = item.title;
      li.append(time, title);
      timeline.append(li);
    });
  }

  /**
   * นับถอยหลังแบบ "383 : 03 : 31 : 12" ตามแบบ Canva
   * สร้างโครงครั้งเดียว แล้วเปลี่ยนเฉพาะตัวเลขทุกวินาที
   * ตำแหน่งในกริด: ตัวเลขอยู่แถว 1 ป้ายอยู่แถว 2 ใต้ตัวเลขของตัวเอง ส่วน ":" อยู่คอลัมน์คั่นกลาง
   */
  function startCountdown(el, target) {
    const units = [
      { label: "Days", ms: 86400000, pad: 1 },
      { label: "Hours", ms: 3600000, pad: 2 },
      { label: "Min", ms: 60000, pad: 2 },
      { label: "Sec", ms: 1000, pad: 2 },
    ];
    const numbers = units.map((unit, i) => {
      const column = String(i * 2 + 1);
      const num = document.createElement("span");
      num.className = "countdown-num";
      num.style.gridColumn = column;
      const label = document.createElement("span");
      label.className = "countdown-label";
      label.style.gridColumn = column;
      label.textContent = unit.label;
      el.append(num, label);
      if (i < units.length - 1) {
        const sep = document.createElement("span");
        sep.className = "countdown-sep";
        sep.style.gridColumn = String(i * 2 + 2);
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = ":";
        el.append(sep);
      }
      return num;
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let firstRender = true;

    function tick() {
      let diff = target - Date.now();
      if (diff <= 0) {
        el.textContent = "วันนี้คือวันสำคัญของเรา";
        el.classList.add("is-done");
        return;
      }
      units.forEach((unit, i) => {
        const n = Math.floor(diff / unit.ms);
        diff -= n * unit.ms;
        setDigits(numbers[i], String(n).padStart(unit.pad, "0"), !firstRender && !reduceMotion);
      });
      firstRender = false;
      setTimeout(tick, 1000);
    }
    tick();
  }

  /** ระยะเวลาที่ตัวเลขหนึ่งหลักเลื่อนขึ้นตอนค่าเปลี่ยน */
  const DIGIT_ROLL_MS = 500;

  function digitFace(char) {
    const face = document.createElement("span");
    face.className = "digit-face";
    face.textContent = char;
    return face;
  }

  /**
   * แสดงตัวเลขทีละหลัก · หลักที่ค่าเปลี่ยนจะเลื่อนขึ้น: ตัวเก่าออกด้านบน ตัวใหม่เข้าจากด้านล่าง
   * จำนวนหลักเปลี่ยน (เช่น วันจาก 100 เหลือ 99) สร้างใหม่ทั้งชุดโดยไม่เล่นอนิเมชัน
   */
  function setDigits(container, text, animate) {
    const chars = [...text];
    if (container.children.length !== chars.length) {
      container.replaceChildren(
        ...chars.map((char) => {
          const slot = document.createElement("span");
          slot.className = "digit";
          slot.dataset.value = char;
          slot.append(digitFace(char));
          return slot;
        })
      );
      return;
    }
    chars.forEach((char, i) => {
      const slot = container.children[i];
      if (slot.dataset.value === char) return;
      slot.dataset.value = char;
      rollDigit(slot, char, animate);
    });
  }

  function rollDigit(slot, char, animate) {
    const next = digitFace(char);
    if (!animate || typeof next.animate !== "function") {
      slot.replaceChildren(next);
      return;
    }
    // ตัดตัวที่ยังเลื่อนค้างจากรอบก่อนทิ้ง เหลือตัวที่แสดงอยู่ตัวเดียว
    const current = slot.lastElementChild;
    slot.replaceChildren(current);
    next.classList.add("is-entering");
    slot.append(next);
    const timing = { duration: DIGIT_ROLL_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
    current.animate(
      [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-100%)", opacity: 0 }],
      timing
    );
    next
      .animate(
        [{ transform: "translateY(100%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
        timing
      )
      .finished.then(() => {
        if (!next.isConnected) return;
        next.classList.remove("is-entering");
        slot.replaceChildren(next);
      })
      .catch(() => {
        // ถูกยกเลิกเพราะมีค่าใหม่เข้ามาก่อนเลื่อนจบ — รอบถัดไปจัดการต่อเอง
      });
  }

  /** หน้า RSVP: สร้างตัวเลือกจำนวนคน และส่งฟอร์ม */
  function initRsvp() {
    byId("rsvp-names").textContent = cfg.names.join(" & ");

    const guestOptions = byId("guest-options");
    for (let n = 1; n <= cfg.rsvpMaxGuests; n += 1) {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "guests";
      input.value = String(n);
      input.checked = n === 1;
      const text = document.createElement("span");
      text.textContent = String(n);
      label.append(input, text);
      guestOptions.append(label);
    }

    const form = byId("rsvp-form");
    const status = byId("form-status");
    const guestsField = byId("guests-field");

    /** kind: "error" | "success" | undefined (ข้อความระหว่างดำเนินการ) */
    function setStatus(text, kind) {
      status.textContent = text;
      status.classList.toggle("error", kind === "error");
      status.classList.toggle("success", kind === "success");
    }

    // ตอบว่าไม่มา: ซ่อนช่องจำนวนคน และไม่ส่งค่านี้ไปด้วย
    function syncGuestsField() {
      const notAttending = form.elements.attending.value === "no";
      guestsField.hidden = notAttending;
      guestsField.disabled = notAttending;
    }
    form.addEventListener("change", syncGuestsField);
    form.addEventListener("reset", () => setTimeout(syncGuestsField));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus("กรุณากรอกชื่อและเลือกว่าจะมาร่วมงานหรือไม่", "error");
        return;
      }
      if (!cfg.rsvpEndpoint) {
        setStatus("ระบบตอบรับยังไม่เปิด กรุณาติดต่อเจ้าภาพโดยตรง", "error");
        return;
      }
      const button = form.querySelector("button");
      button.disabled = true;
      setStatus("กำลังส่ง…");
      try {
        // Google Apps Script ไม่รองรับ CORS preflight จึงส่งแบบ no-cors
        await fetch(cfg.rsvpEndpoint, {
          method: "POST",
          mode: "no-cors",
          body: new FormData(form),
        });
        form.reset();
        setStatus("ขอบคุณสำหรับคำตอบ แล้วพบกันในงานนะ", "success");
      } catch (err) {
        console.error("RSVP submit failed", err);
        setStatus("ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  renderShared();
  initReveal();
  initBackLinks();
  const pages = { welcome: initWelcome, home: initHome, details: initDetails, rsvp: initRsvp };
  const init = pages[document.body.dataset.page];
  if (init) init();
})();

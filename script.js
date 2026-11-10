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

  /** เวลาที่ฝาซองเปิดและกระดาษเลื่อนออกจนสุด ก่อนเปลี่ยนไปหน้าข้อมูล */
  const OPEN_LETTER_MS = 1200;

  /** หน้าจดหมาย: กดซองแล้วฝาซองเปิด กระดาษเลื่อนออก แล้วจึงไปหน้าข้อมูล */
  function initLetter() {
    const link = byId("open-letter");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    link.addEventListener("click", (event) => {
      if (reduceMotion || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      if (link.classList.contains("is-open")) return;
      link.classList.add("is-open");
      setTimeout(() => {
        window.location.href = link.href;
      }, OPEN_LETTER_MS);
    });
    // กลับมาด้วยปุ่มย้อนกลับของเบราว์เซอร์ (bfcache) ให้ซองปิดเหมือนเดิม
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) link.classList.remove("is-open");
    });
  }

  /** หน้าข้อมูล: กำหนดการ Dress code แผนที่ และนับถอยหลัง */
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

    startCountdown(byId("countdown"), new Date(cfg.date).getTime());
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
        numbers[i].textContent = String(n).padStart(unit.pad, "0");
      });
      setTimeout(tick, 1000);
    }
    tick();
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
  const pages = { letter: initLetter, details: initDetails, rsvp: initRsvp };
  const init = pages[document.body.dataset.page];
  if (init) init();
})();

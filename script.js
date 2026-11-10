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

  /** หน้าจดหมาย: กดซองแล้วฝาซองเปิดก่อนไปหน้าข้อมูล */
  function initLetter() {
    const link = byId("open-letter");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    link.addEventListener("click", (event) => {
      if (reduceMotion || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      link.classList.add("is-open");
      setTimeout(() => {
        window.location.href = link.href;
      }, 650);
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
    cfg.schedule.forEach((item) => {
      const li = document.createElement("li");
      const time = document.createElement("time");
      time.textContent = item.time;
      const title = document.createElement("span");
      title.textContent = item.title;
      li.append(time, title);
      timeline.append(li);
    });

    startCountdown(byId("countdown"), new Date(cfg.date).getTime());
  }

  function startCountdown(el, target) {
    const units = [
      ["วัน", 86400000],
      ["ชั่วโมง", 3600000],
      ["นาที", 60000],
      ["วินาที", 1000],
    ];
    function tick() {
      let diff = target - Date.now();
      if (diff <= 0) {
        el.textContent = "วันนี้คือวันสำคัญของเรา";
        return;
      }
      el.replaceChildren(
        ...units.map(([label, ms]) => {
          const n = Math.floor(diff / ms);
          diff -= n * ms;
          const box = document.createElement("div");
          const strong = document.createElement("strong");
          strong.textContent = String(n);
          const span = document.createElement("span");
          span.textContent = label;
          box.append(strong, span);
          return box;
        })
      );
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

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle("error", Boolean(isError));
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
        setStatus("กรุณากรอกชื่อและเลือกว่าจะมาร่วมงานหรือไม่", true);
        return;
      }
      if (!cfg.rsvpEndpoint) {
        setStatus("ระบบตอบรับยังไม่เปิด กรุณาติดต่อเจ้าภาพโดยตรง", true);
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
        setStatus("ขอบคุณสำหรับคำตอบ แล้วพบกันในงานนะ");
      } catch (err) {
        console.error("RSVP submit failed", err);
        setStatus("ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", true);
      } finally {
        button.disabled = false;
      }
    });
  }

  renderShared();
  const pages = { letter: initLetter, details: initDetails, rsvp: initRsvp };
  const init = pages[document.body.dataset.page];
  if (init) init();
})();

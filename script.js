(function () {
  "use strict";
  const cfg = window.WEDDING;

  /** อ่านค่าจาก config ด้วย path แบบ "venue.name" */
  function pick(path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), cfg);
  }

  document.querySelectorAll("[data-bind]").forEach((el) => {
    el.textContent = pick(el.dataset.bind) ?? "";
  });
  document.title = `${cfg.groom} & ${cfg.bride} — การ์ดเชิญงานแต่ง`;
  document.getElementById("map-link").href = cfg.venue.mapUrl;
  // อักษรย่อบนตราครั่ง: อักษรแรกของชื่อทั้งสอง
  document.getElementById("seal").textContent =
    `${(cfg.groom || "").charAt(0)}${(cfg.bride || "").charAt(0)}`;

  const timeline = document.getElementById("timeline");
  cfg.schedule.forEach((item) => {
    const li = document.createElement("li");
    const time = document.createElement("time");
    time.textContent = item.time;
    const title = document.createElement("span");
    title.textContent = item.title;
    li.append(time, title);
    timeline.append(li);
  });

  // นับถอยหลัง
  const target = new Date(cfg.date).getTime();
  const countdown = document.getElementById("countdown");
  const units = [
    ["วัน", 86400000],
    ["ชั่วโมง", 3600000],
    ["นาที", 60000],
    ["วินาที", 1000],
  ];
  function tick() {
    let diff = target - Date.now();
    if (diff <= 0) {
      countdown.textContent = "วันนี้คือวันสำคัญของเรา";
      return;
    }
    countdown.replaceChildren(
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

  // ฟอร์ม RSVP
  const form = document.getElementById("rsvp-form");
  const status = document.getElementById("form-status");
  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle("error", Boolean(isError));
  }

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
})();

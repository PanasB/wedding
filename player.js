/**
 * เครื่องเล่นแผ่นเสียงหน้า home
 * เสียงมาจาก YouTube IFrame Player API (ตัวเล่นถูกซ่อนไว้) · หน้าตาเป็นแผ่นเสียงที่หมุนตอนเล่น
 * เบราว์เซอร์ไม่ยอมให้เล่นเสียงเอง จึงเริ่มเล่นเมื่อผู้ชมกดปุ่มเท่านั้น
 */
(function () {
  "use strict";
  const cfg = window.WEDDING;
  const root = document.getElementById("player");
  if (!root || !cfg.music || !cfg.music.youtubeId) return;

  const $ = (id) => document.getElementById(id);
  const toggleBtn = $("player-toggle");
  const restartBtn = $("player-restart");
  const loopBtn = $("player-loop");
  const seek = $("player-seek");
  const current = $("player-current");
  const duration = $("player-duration");
  const status = $("player-status");

  /** รอ YouTube API โหลดนานสุดเท่านี้ ก่อนแจ้งว่าเปิดเพลงไม่ได้ */
  const API_TIMEOUT_MS = 15000;
  /** ความถี่ในการอัปเดตเวลาและแถบเพลงระหว่างเล่น */
  const PROGRESS_INTERVAL_MS = 250;

  let player = null;
  let ready = false;
  let wantPlay = false;
  let looping = loopBtn.getAttribute("aria-pressed") === "true";
  let progressTimer = 0;
  let dragging = false;

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function setPlaying(isPlaying) {
    root.classList.toggle("is-playing", isPlaying);
    toggleBtn.setAttribute("aria-label", isPlaying ? "หยุดเพลงชั่วคราว" : "เล่นเพลง");
    clearInterval(progressTimer);
    if (isPlaying) progressTimer = setInterval(updateProgress, PROGRESS_INTERVAL_MS);
  }

  function updateProgress() {
    if (!ready || dragging) return;
    const total = player.getDuration() || 0;
    const now = player.getCurrentTime() || 0;
    duration.textContent = total ? formatTime(total) : "--:--";
    current.textContent = formatTime(now);
    seek.max = String(Math.max(1, Math.floor(total)));
    seek.value = String(Math.floor(now));
    seek.style.setProperty("--progress", total ? `${(now / total) * 100}%` : "0%");
  }

  function loadApi() {
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") previous();
      createPlayer();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = () => fail("โหลดตัวเล่นเพลงไม่ได้ ลองตรวจอินเทอร์เน็ตแล้วรีเฟรชหน้า");
    document.head.append(tag);
    setTimeout(() => {
      if (!ready) fail("เปิดเพลงไม่ได้ในตอนนี้");
    }, API_TIMEOUT_MS);
  }

  function createPlayer() {
    player = new window.YT.Player("player-youtube", {
      host: "https://www.youtube-nocookie.com",
      videoId: cfg.music.youtubeId,
      width: "200",
      height: "200",
      playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, origin: location.origin },
      events: {
        onReady: () => {
          ready = true;
          status.textContent = "";
          [seek, restartBtn].forEach((el) => { el.disabled = false; });
          updateProgress();
          if (wantPlay) player.playVideo();
        },
        onStateChange: (event) => onStateChange(event.data),
        onError: () => fail("เพลงนี้เล่นบนเว็บไม่ได้"),
      },
    });
  }

  function onStateChange(state) {
    const S = window.YT.PlayerState;
    if (state === S.PLAYING) setPlaying(true);
    if (state === S.PAUSED) setPlaying(false);
    if (state === S.ENDED) {
      if (looping) {
        player.seekTo(0, true);
        player.playVideo();
        return;
      }
      setPlaying(false);
      updateProgress();
    }
  }

  function fail(message) {
    status.textContent = message;
    root.classList.add("is-unavailable");
    setPlaying(false);
  }

  toggleBtn.addEventListener("click", () => {
    if (!ready) {
      wantPlay = true;
      status.textContent = "กำลังเปิดเพลง…";
      if (!player) loadApi();
      return;
    }
    if (root.classList.contains("is-playing")) player.pauseVideo();
    else player.playVideo();
  });

  restartBtn.addEventListener("click", () => {
    if (!ready) return;
    player.seekTo(0, true);
    updateProgress();
  });

  loopBtn.addEventListener("click", () => {
    looping = !looping;
    loopBtn.setAttribute("aria-pressed", String(looping));
  });

  seek.addEventListener("input", () => {
    dragging = true;
    current.textContent = formatTime(Number(seek.value));
    seek.style.setProperty("--progress", `${(Number(seek.value) / Number(seek.max)) * 100}%`);
  });
  seek.addEventListener("change", () => {
    dragging = false;
    if (ready) player.seekTo(Number(seek.value), true);
  });

  // โหลด API ไว้ล่วงหน้าเมื่อหน้าว่าง เพื่อให้กดเล่นแล้วเสียงมาเร็ว
  if ("requestIdleCallback" in window) window.requestIdleCallback(() => { if (!player) loadApi(); });
  else setTimeout(() => { if (!player) loadApi(); }, 1500);
})();

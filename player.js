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
  /** สั่งเล่นอัตโนมัติแล้วรอเท่านี้ ถ้ายังไม่เล่นแปลว่าเบราว์เซอร์บล็อกการเล่นพร้อมเสียง */
  const AUTOPLAY_CHECK_MS = 1500;
  /** แตะครั้งแรกเพื่อเปิดเสียง ไม่นับเป็นการกดหยุดเพลง ถ้าเกิดในช่วงนี้ */
  const UNMUTE_GRACE_MS = 600;

  let player = null;
  let ready = false;
  let wantPlay = true; // เข้าหน้า home แล้วเล่นเพลงเลย
  let mutedAutoplay = false;
  let unmutedAt = 0;
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
          if (wantPlay) autoplay();
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

  /**
   * เล่นอัตโนมัติ: ลองเล่นพร้อมเสียงก่อน · เบราว์เซอร์ส่วนใหญ่ (โดยเฉพาะมือถือ) บล็อกเสียง
   * ถ้าผู้ชมยังไม่ได้แตะหน้าเว็บ จึงถอยไปเล่นแบบปิดเสียง (แผ่นยังหมุน) แล้วเปิดเสียงเมื่อแตะครั้งแรก
   */
  function autoplay() {
    player.playVideo();
    setTimeout(() => {
      if (player.getPlayerState() === window.YT.PlayerState.PLAYING) return;
      mutedAutoplay = true;
      player.mute();
      player.playVideo();
      root.classList.add("is-muted");
      status.textContent = "แตะที่ใดก็ได้เพื่อเปิดเสียงเพลง";
      ["pointerdown", "keydown", "touchstart"].forEach((type) =>
        document.addEventListener(type, unmuteOnFirstTouch, { capture: true, once: true })
      );
    }, AUTOPLAY_CHECK_MS);
  }

  function unmuteOnFirstTouch() {
    if (!mutedAutoplay) return;
    mutedAutoplay = false;
    unmutedAt = Date.now();
    player.unMute();
    player.playVideo();
    root.classList.remove("is-muted");
    status.textContent = "";
    ["pointerdown", "keydown", "touchstart"].forEach((type) =>
      document.removeEventListener(type, unmuteOnFirstTouch, { capture: true })
    );
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
    // การแตะครั้งนี้เพิ่งใช้เปิดเสียงไป ไม่ใช่การสั่งหยุด
    if (Date.now() - unmutedAt < UNMUTE_GRACE_MS) return;
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

  // โหลดตัวเล่นทันทีที่เข้าหน้า เพื่อเริ่มเพลงให้เร็วที่สุด
  status.textContent = "กำลังเปิดเพลง…";
  loadApi();
})();

"use client";

const WHEEL_DURATION = 700;
const CLICK_DURATION = 900;
const WHEEL_CONTINUE_THRESHOLD = 120;

let sectionIds: string[] = [];
let isAnimating = false;
let queuedDirection = 0;
let lastWheelTime = 0;
let rafId = 0;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getCurrentIndex(): number {
  const center = window.scrollY + window.innerHeight / 2;
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < sectionIds.length; i++) {
    const el = document.getElementById(sectionIds[i]);
    if (!el) continue;
    const elCenter = el.offsetTop + el.offsetHeight / 2;
    const dist = Math.abs(center - elCenter);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function setSnapDisabled(disabled: boolean): void {
  // CSS scroll-snap-mandatory 会把 JS 动画的中间帧强制对齐到 snap 点,
  // 导致滚动看起来是瞬移. 动画期间临时关掉, 结束再恢复 (触屏 snap 不受影响).
  document.documentElement.style.scrollSnapType = disabled ? "none" : "";
}

function animateTo(targetY: number, duration: number): void {
  cancelAnimationFrame(rafId);
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) {
    isAnimating = false;
    return;
  }
  isAnimating = true;
  setSnapDisabled(true);
  const startTime = performance.now();

  const step = (now: number): void => {
    const t = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(t));
    if (t < 1) {
      rafId = requestAnimationFrame(step);
      return;
    }
    isAnimating = false;
    setSnapDisabled(false);
    // 如果动画结束时用户还在滚动 (最近的 wheel 事件在阈值内), 立即接力到下一段
    if (
      queuedDirection !== 0 &&
      performance.now() - lastWheelTime < WHEEL_CONTINUE_THRESHOLD
    ) {
      const dir = queuedDirection;
      queuedDirection = 0;
      const next = getCurrentIndex() + dir;
      if (next >= 0 && next < sectionIds.length) {
        const nextEl = document.getElementById(sectionIds[next]);
        if (nextEl) animateTo(nextEl.offsetTop, WHEEL_DURATION);
      }
    } else {
      queuedDirection = 0;
    }
  };
  rafId = requestAnimationFrame(step);
}

export function snapToId(id: string, duration: number = CLICK_DURATION): void {
  const el = document.getElementById(id);
  if (!el) return;
  queuedDirection = 0;
  animateTo(el.offsetTop, duration);
}

export function installSnapScroll(ids: string[]): () => void {
  sectionIds = ids;

  function handleWheel(e: WheelEvent): void {
    if (e.ctrlKey) return;
    if (e.deltaY === 0) return;
    e.preventDefault();

    const dir = e.deltaY > 0 ? 1 : -1;
    lastWheelTime = performance.now();

    if (isAnimating) {
      queuedDirection = dir;
      return;
    }

    const next = getCurrentIndex() + dir;
    if (next < 0 || next >= sectionIds.length) return;
    const el = document.getElementById(sectionIds[next]);
    if (el) animateTo(el.offsetTop, WHEEL_DURATION);
  }

  window.addEventListener("wheel", handleWheel, { passive: false });
  return (): void => {
    window.removeEventListener("wheel", handleWheel);
    cancelAnimationFrame(rafId);
  };
}

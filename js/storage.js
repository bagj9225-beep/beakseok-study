// 저장 담당: localStorage를 안전하게 쓰는 도우미예요.
// 브라우저가 저장을 막아도 앱이 멈추지 않도록 try/catch로 감싸요.
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("bs:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("bs:" + key, JSON.stringify(value)); } catch (e) { /* 저장 실패는 무시 */ }
  },
};

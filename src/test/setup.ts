import "@testing-library/jest-dom";

// ResizeObserver not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

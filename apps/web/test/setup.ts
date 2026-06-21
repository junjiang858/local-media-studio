import "@testing-library/jest-dom/vitest";

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:test-object-url");
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

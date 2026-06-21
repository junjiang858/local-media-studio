import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, vi } from "vitest";
import App from "./App";

describe("media workspace shell", () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let toBlobSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });

    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 96 })),
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      set fillStyle(_value: string) {},
      set filter(_value: string) {},
      set font(_value: string) {},
      set globalAlpha(_value: number) {},
      set textAlign(_value: CanvasTextAlign) {},
      set textBaseline(_value: CanvasTextBaseline) {},
    } as unknown as CanvasRenderingContext2D);

    toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback, type) => {
        callback(new Blob(["edited image"], { type: type ?? "image/png" }));
      });

    class MockImage {
      naturalWidth = 1200;
      naturalHeight = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    toBlobSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("renders the local-first guided studio with import, edit, and export steps", () => {
    render(<App />);

    expect(screen.getAllByRole("button", { name: /add media/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /create privately/i })).toBeInTheDocument();
    const flow = screen.getByRole("list", { name: /creation flow/i });
    expect(within(flow).getByText("Import")).toBeInTheDocument();
    expect(within(flow).getByText("Edit")).toBeInTheDocument();
    expect(within(flow).getByText("Export")).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByText(/no media leaves this browser/i)).toBeInTheDocument();
  });

  it("detects Chinese browser language and allows manual switching to English", async () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "zh-CN",
    });

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: /私密创作/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/语言/i), "en");

    expect(screen.getByRole("heading", { name: /create privately/i })).toBeInTheDocument();
  });

  it("imports user-selected files into the media library without uploading them", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/choose media files/i);
    const image = new File(["image"], "cover.png", { type: "image/png" });
    const video = new File(["video"], "clip.mp4", { type: "video/mp4" });

    await user.upload(input, [image, video]);

    expect(screen.getAllByText("cover.png").length).toBeGreaterThan(0);
    expect(screen.getAllByText("clip.mp4").length).toBeGreaterThan(0);
    expect(screen.getByText(/2 assets/i)).toBeInTheDocument();
    expect(screen.getByText(/local only/i)).toBeInTheDocument();
  });

  it("edits a selected image and prepares a local download", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/choose media files/i);
    const image = new File(["image"], "cover photo.png", { type: "image/png" });

    await user.upload(input, image);
    await user.selectOptions(screen.getByLabelText(/crop preset/i), "1:1");
    await user.click(screen.getByRole("button", { name: /rotate 90/i }));
    await user.click(screen.getByRole("button", { name: /flip horizontal/i }));
    await user.clear(screen.getByLabelText(/output width/i));
    await user.type(screen.getByLabelText(/output width/i), "600");
    await user.clear(screen.getByLabelText(/brightness/i));
    await user.type(screen.getByLabelText(/brightness/i), "18");
    await user.type(screen.getByLabelText(/watermark text/i), "Draft");
    await user.click(screen.getByRole("button", { name: /prepare export/i }));

    expect(await screen.findByText(/download ready/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /download cover-photo-edited.png/i }),
    ).toBeInTheDocument();
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.86);
  });
});

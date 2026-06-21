import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("media workspace shell", () => {
  it("renders the local-first workspace with library, preview, edit, and export regions", () => {
    render(<App />);

    expect(screen.getAllByRole("button", { name: /add media/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /export/i })).toBeInTheDocument();
    expect(screen.getByText(/no media leaves this browser/i)).toBeInTheDocument();
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
});

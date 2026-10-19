import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import SearchBar from "./SearchBar";

it("submits the trimmed keyword", async () => {
  const onSearch = vi.fn();
  render(<SearchBar onSearch={onSearch} />);

  await userEvent.type(screen.getByLabelText("Search repositories"), "  react  ");
  await userEvent.click(screen.getByRole("button", { name: "Search" }));

  expect(onSearch).toHaveBeenCalledWith("react");
});

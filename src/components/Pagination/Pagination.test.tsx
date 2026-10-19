import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import Pagination from "./Pagination";

it("disables Previous on the first page", () => {
  render(
    <Pagination page={1} totalPages={5} disabled={false} onPageChange={vi.fn()} />,
  );

  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
});

it("requests the next page", async () => {
  const onPageChange = vi.fn();
  render(
    <Pagination page={2} totalPages={5} disabled={false} onPageChange={onPageChange} />,
  );

  await userEvent.click(screen.getByRole("button", { name: "Next page" }));

  expect(onPageChange).toHaveBeenCalledWith(3);
});

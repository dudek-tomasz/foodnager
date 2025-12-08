import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";

/**
 * Example component for testing
 */
function ExampleButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>;
}

/**
 * Example component test
 * This demonstrates React component testing with Testing Library
 */
describe("ExampleButton", () => {
  it("should render with correct text", () => {
    render(<ExampleButton onClick={() => {}}>Click me</ExampleButton>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<ExampleButton onClick={handleClick}>Click me</ExampleButton>);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be accessible", () => {
    render(<ExampleButton onClick={() => {}}>Accessible Button</ExampleButton>);

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
  });
});

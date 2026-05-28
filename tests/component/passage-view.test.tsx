import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassageView } from "~/components/passage-view";
import type { Session, Token, Blank } from "~/engine/types";

function makeSession(overrides?: Partial<Session>): Session {
  const tokens: Token[] = [
    { text: "Hello", start: 0, end: 5, isWord: true },
    { text: " ", start: 5, end: 6, isWord: false },
    { text: "world", start: 6, end: 11, isWord: true },
    { text: " ", start: 11, end: 12, isWord: false },
    { text: "test", start: 12, end: 16, isWord: true },
  ];
  const blanks: Blank[] = [
    { id: "b-0", tokenIndex: 2, correctWord: "world" },
  ];
  return {
    id: "test-session",
    createdAt: new Date().toISOString(),
    label: "Hello world test",
    practiceText: "Hello world test",
    difficulty: "medium",
    tokens,
    blanks,
    answers: {},
    status: "in_progress",
    ...overrides,
  };
}

describe("PassageView", () => {
  it("renders every token in order including whitespace", () => {
    const session = makeSession();
    render(<PassageView session={session} onAnswerChange={vi.fn()} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("renders a shadcn <Input> at each blank tokenIndex and text spans elsewhere", () => {
    const session = makeSession();
    render(<PassageView session={session} onAnswerChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("each <Input> has an aria-label that includes 'blank N of M'", () => {
    const session = makeSession();
    render(<PassageView session={session} onAnswerChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-label")).toMatch(/blank 1 of 1/i);
  });

  it("typing into a blank fires onAnswerChange with (blankId, value)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const session = makeSession();
    render(<PassageView session={session} onAnswerChange={onChange} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe("b-0");
    expect(typeof lastCall[1]).toBe("string");
  });

  it("initial value for each input comes from session.answers[blankId] when present", () => {
    const session = makeSession({ answers: { "b-0": "prefilled" } });
    render(<PassageView session={session} onAnswerChange={vi.fn()} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("prefilled");
  });
});

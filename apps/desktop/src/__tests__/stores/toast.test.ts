import { describe, it, expect, beforeEach } from "vitest";
import { useToasts } from "../../renderer/core/toast.store";

describe("Toast Store", () => {
  beforeEach(() => {
    useToasts.setState({ toasts: [] });
  });

  it("should start with empty toasts", () => {
    expect(useToasts.getState().toasts.length).toBe(0);
  });

  it("should add and auto-dismiss toasts", () => {
    useToasts.getState().show({ title: "Test", message: "Hello", icon: "\u{1F389}" });
    expect(useToasts.getState().toasts.length).toBe(1);
    expect(useToasts.getState().toasts[0].title).toBe("Test");
  });

  it("should dismiss by id", () => {
    useToasts.getState().show({ title: "T1", message: "M1", icon: "A" });
    useToasts.getState().show({ title: "T2", message: "M2", icon: "B" });
    const id = useToasts.getState().toasts[0].id;
    useToasts.getState().dismiss(id);
    expect(useToasts.getState().toasts.length).toBe(1);
  });
});
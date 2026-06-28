import { describe, it, expect } from "vitest";
import { useI18n } from "../../renderer/core/i18n";

describe("I18n Store", () => {
  it("should default to zh-CN", () => {
    expect(useI18n.getState().locale).toBe("zh-CN");
  });

  it("should translate known keys in Chinese", () => {
    useI18n.getState().setLocale("zh-CN");
    const { t } = useI18n.getState();
    expect(t("mode.learning")).toBeTruthy();
    expect(t("mode.experiment")).toBeTruthy();
    expect(t("mode.analysis")).toBeTruthy();
  });

  it("should translate known keys in English", () => {
    useI18n.getState().setLocale("en-US");
    const { t } = useI18n.getState();
    expect(t("mode.learning")).toBe("Learning");
    expect(t("mode.experiment")).toBe("Experiment");
    expect(t("mode.analysis")).toBe("Analysis");
  });

  it("should return key as fallback for missing keys", () => {
    const { t } = useI18n.getState();
    expect(t("nonexistent.key.12345")).toBe("nonexistent.key.12345");
  });

  it("should switch languages", () => {
    useI18n.getState().setLocale("en-US");
    expect(useI18n.getState().locale).toBe("en-US");
    useI18n.getState().setLocale("zh-CN");
    expect(useI18n.getState().locale).toBe("zh-CN");
  });
});

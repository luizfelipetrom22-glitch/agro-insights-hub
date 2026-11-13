import { describe, expect, it } from "vitest";
import { buildMarginAlert } from "./margin-alert-message";
import type { FinancialBase } from "./profit";

const base = { costPerBag: 108.33, targetPrice: 154.76, production: 60000, margin: 30 } as FinancialBase;

describe("buildMarginAlert", () => {
  it("avisa quando a referência fica abaixo do ponto de equilíbrio", () => {
    expect(buildMarginAlert("abaixo_equilibrio", "Soja", 100, base)?.type).toBe("margin_alert:abaixo_equilibrio");
  });
  it("não avisa quando a referência está acima do equilíbrio", () => {
    expect(buildMarginAlert("abaixo_equilibrio", "Soja", 140.43, base)).toBeNull();
  });
  it("avisa quando a referência fica abaixo do preço da meta", () => {
    expect(buildMarginAlert("abaixo_meta", "Soja", 140.43, base)).not.toBeNull();
  });
});

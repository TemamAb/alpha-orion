import { expect } from "chai";
import { ethers } from "ethers";
import { FlashLoanEngine } from "../../src/core/flash-loan-engine";

describe("FlashLoanEngine", () => {
  let engine: FlashLoanEngine;
  
  beforeEach(() => {
    engine = new FlashLoanEngine(
      "http://localhost:8545",
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
  });

  it("should initialize with default config", () => {
    expect(engine).to.be.instanceOf(FlashLoanEngine);
  });

  it("should find arbitrage opportunities", async () => {
    const opportunities = await engine.findArbitrageOpportunities();
    expect(opportunities).to.be.an("array");
  });

  it("should filter opportunities by profit threshold", async () => {
    const opportunities = await engine.findArbitrageOpportunities();
    opportunities.forEach(opp => {
      expect(opp.profit.gt(ethers.constants.Zero)).to.be.true;
    });
  });
});

import { expect } from "chai";
import { ArbitrageFinder } from "../../src/core/arbitrage-finder";
import { ethers } from "ethers";

describe("ArbitrageFinder Integration", () => {
  let finder: ArbitrageFinder;
  
  beforeEach(() => {
    finder = new ArbitrageFinder("http://localhost:8545");
  });

  describe("Cross-DEX Arbitrage", () => {
    it("should find profitable routes", async () => {
      const amount = ethers.utils.parseEther("1");
      const routes = await finder.findCrossDexArbitrage("ETH", "USDC", amount);
      
      expect(routes).to.be.an("array");
      routes.forEach(route => {
        expect(route.expectedProfit.gt(ethers.constants.Zero)).to.be.true;
        expect(route.dexA).to.have.property("name");
        expect(route.dexB).to.have.property("name");
      });
    });

    it("should return optimal route", async () => {
      const amount = ethers.utils.parseEther("10");
      const route = await finder.getOptimalRoute(amount);
      
      if (route) {
        expect(route.expectedProfit).to.be.instanceOf(ethers.BigNumber);
        expect(route.tokenIn).to.be.a("string");
        expect(route.tokenOut).to.be.a("string");
      }
    });
  });
});

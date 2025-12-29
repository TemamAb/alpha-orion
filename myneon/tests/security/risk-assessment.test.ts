import { expect } from "chai";
import { RiskManager } from "../../src/core/risk-manager";
import { ethers } from "ethers";

describe("RiskManager Security", () => {
  let riskManager: RiskManager;
  
  beforeEach(() => {
    riskManager = new RiskManager("http://localhost:8545");
  });

  describe("Flash Loan Risk Assessment", () => {
    it("should assess low-risk transactions", async () => {
      const asset = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      const amount = ethers.utils.parseEther("10");
      const route = ["Uniswap", "Sushiswap"];
      
      const assessment = await riskManager.assessFlashLoan(asset, amount, route);
      
      expect(assessment).to.have.property("score");
      expect(assessment).to.have.property("riskLevel");
      expect(assessment).to.have.property("issues");
      expect(assessment).to.have.property("recommendations");
      
      expect(assessment.score).to.be.at.least(0).and.at.most(100);
      expect(["LOW", "MEDIUM", "HIGH"]).to.include(assessment.riskLevel);
    });

    it("should detect high gas price risk", async () => {
      const tx = {
        to: "0x0000000000000000000000000000000000000000",
        value: ethers.utils.parseEther("1"),
        gasPrice: ethers.utils.parseUnits("300", "gwei")
      };
      
      const risks = await riskManager.checkTransactionRisk(tx);
      expect(risks.gasRisk).to.be.true;
    });
  });
});

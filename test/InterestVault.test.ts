import { expect } from "chai";
import { ethers } from "hardhat";

describe("InterestVault", function () {
  let vault: any;
  let owner: any;
  let user: any;
  const lockPeriod = 60;
  const interestRate = 5;
  const stakeAmount = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("InterestVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
  });

  async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  async function stakeETH() {
    const tx = await vault.connect(user).stake({ value: stakeAmount });
    const receipt = await tx.wait();
    return { tx, receipt };
  }

  async function withdrawETH() {
    const tx = await vault.connect(user).withdraw(stakeAmount);
    const receipt = await tx.wait();
    return { tx, receipt };
  }

  it("should allow staking ETH", async () => {
    const { tx, receipt } = await stakeETH();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const expectedTimestamp = block!.timestamp;

    await expect(tx)
      .to.emit(vault, "Staked")
      .withArgs(user.address, stakeAmount, expectedTimestamp);

    const staked = await vault.connect(user).getStakedAmount();
    expect(staked).to.equal(stakeAmount);
  });

  it("should not allow withdrawing before lock period", async () => {
    await stakeETH();
    await expect(vault.connect(user).withdraw(stakeAmount)).to.be.revertedWith(
      "Staking period not met"
    );
  });

  it("should revert if non-owner calls setInterestRate", async () => {
    await expect(vault.connect(user).setInterestRate(10)).to.be.revertedWith(
      "Not owner"
    );
  });

  it("should allow owner to set interest rate", async () => {
    await expect(vault.connect(owner).setInterestRate(7)).to.not.be.reverted;
    expect(await vault.interestRate()).to.equal(7);
  });

  it("should allow withdrawal after lock period with interest", async () => {
    await stakeETH();

    // Add ETH for interest payout
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("0.1"),
    });

    await increaseTime(lockPeriod + 1);

    const userBalanceBefore = await ethers.provider.getBalance(user.address);
    const { tx, receipt } = await withdrawETH();
    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice ?? 0n;
    const gasCost = BigInt(gasUsed) * BigInt(gasPrice);
    const userBalanceAfter = await ethers.provider.getBalance(user.address);

    const duration = lockPeriod + 1;
    const interest =
      (stakeAmount * BigInt(interestRate) * BigInt(duration)) /
      BigInt(100 * 365 * 24 * 60 * 60);
    const expected = userBalanceBefore + stakeAmount + interest - gasCost;

    expect(userBalanceAfter).to.be.closeTo(expected, ethers.parseEther("0.01"));

    const actualEvent = receipt.logs.find(
      (log: any) => log.fragment?.name === "Withdrawn"
    );
    const actualInterest = actualEvent?.args?.[2];

    expect(actualInterest).to.be.closeTo(interest, BigInt(5e9)); // ~1 gwei margin
    // await expect(tx)
    //   .to.emit(vault, "Withdrawn")
    //   .withArgs(user.address, stakeAmount, interest);
  });

  it("should revert if trying to stake 0", async () => {
    await expect(vault.connect(user).stake({ value: 0 })).to.be.revertedWith(
      "Must stake > 0"
    );
  });

  it("should revert if withdrawing more than staked", async () => {
    await stakeETH();
    await increaseTime(lockPeriod + 1);

    await expect(
      vault.connect(user).withdraw(ethers.parseEther("2"))
    ).to.be.revertedWith("Insufficient staked amount");
  });
});

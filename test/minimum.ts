
import { accounts, contract } from "@openzeppelin/test-environment";
import { constants, expectEvent, expectRevert } from "@openzeppelin/test-helpers";
import BN from "bn.js";
import chai from "chai";
import { MinimumInstance } from "../build/types";

chai.use(require("chai-bn")(BN));
const expect = chai.expect;

// @ts-ignore : bignumber は型定義がない
const expectBN = value => expect(value).to.be.a.bignumber;

const [deployer, alice, bob, charlie] = accounts;
const MinimumContract = contract.fromArtifact("Minimum");

const tokenIds = [1, 10, 123].map(x => new BN(x));

describe("デプロイ直後", () => {
    let instance: MinimumInstance;
    const wei = new BN(1);
    const mintTokenId = tokenIds[0];

    beforeEach(async () => {
        instance = await MinimumContract.new({ from: deployer });
    });

    it("トークンの設定は正しいです。", async () => {
        expect(await instance.name()).to.equal("Minimum NFT");
        expect(await instance.symbol()).to.equal("MIN");
    });

    it("コントラクトは ETH を受け取りません。", async () => {
        // @ts-ignore
        const tx = instance.send(wei, { from: alice });
        await expectRevert(tx, "revert");
    });

    it("デプロイ後に所有しているトークンはありません。", async () => {
        expectBN(await instance.balanceOf(deployer)).that.is.zero;
        expectBN(await instance.balanceOf(alice)).that.is.zero;
    });

    it("デプロイしたアドレスが、コントラクトの所有者です。", async () => {
        expect(await instance.owner()).to.equal(deployer);
    });

    it("管理者はトークンを発行することができます。", async () => {
        const mintTx = instance.mint(alice, mintTokenId, { from: deployer });
        expectEvent(await mintTx, "Transfer", {
            from: constants.ZERO_ADDRESS,
            to: alice,
            tokenId: tokenIds[0]
        });

        expectBN(await instance.balanceOf(deployer)).that.is.zero;
        expectBN(await instance.balanceOf(alice)).that.equals(new BN(1));
        expectBN(await instance.balanceOf(bob)).that.is.zero;
    });

    it("ユーザーはトークンを発行できません。", async () => {
        const mintTx = instance.mint(alice, mintTokenId, { from: bob });
        await expectRevert(mintTx,
            "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");
    });
});

describe("トークン ミントの後", () => {
    let instance: MinimumInstance;
    const mintTokenIds = [tokenIds[0], tokenIds[1]];
    const burnTokenId = mintTokenIds[0];
    const inexistentTokenId = tokenIds[2];

    beforeEach(async () => {
        instance = await MinimumContract.new({ from: deployer });
        await Promise.all(
            mintTokenIds.map(tokenId => instance.mint(alice, tokenId, { from: deployer })));
    });

    it("所有者はトークンを消却できます。", async () => {
        const burnTx = instance.burn(burnTokenId, { from: deployer });
        expectEvent(await burnTx, "Transfer", {
            from: alice,
            to: constants.ZERO_ADDRESS,
            tokenId: burnTokenId
        });

        expectBN(await instance.balanceOf(deployer)).that.is.zero;
        expectBN(await instance.balanceOf(alice)).that.equals(new BN(mintTokenIds.length - 1));
        expectBN(await instance.balanceOf(bob)).that.is.zero;
    });

    it("ユーザーはトークンを消却できません。", async () => {
        const burnTx = instance.burn(burnTokenId, { from: bob });
        await expectRevert(burnTx,
            "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");
    });

    it("所有者は存在しないトークンを消す却できません。", async () => {
        const burnTx = instance.burn(inexistentTokenId, { from: deployer });
        await expectRevert.unspecified(burnTx);
    });

    it("ユーザーは所有するトークンを移転できます。", async () => {
        const transferTx1 = instance.methods["safeTransferFrom(address,address,uint256)"](
            alice, bob, mintTokenIds[0], { from: alice });
        expectEvent(await transferTx1, "Transfer", {
            from: alice,
            to: bob,
            tokenId: mintTokenIds[0],
        });

        const transferTx2 = instance.transferFrom(
            bob, charlie, mintTokenIds[0], { from: bob });
        expectEvent(await transferTx2, "Transfer", {
            from: bob,
            to: charlie,
            tokenId: mintTokenIds[0],
        });

        expectBN(await instance.balanceOf(deployer)).that.is.zero;
        expectBN(await instance.balanceOf(alice)).that.equals(new BN(mintTokenIds.length - 1));
        expectBN(await instance.balanceOf(bob)).that.is.zero;
        expectBN(await instance.balanceOf(charlie)).that.equals(new BN(1));
    });

    it("ユーザーは所有しないトークンを移転できません。", async () => {
        const transferTx = instance.transferFrom(
            alice, bob, mintTokenIds[0], { from: bob });
        await expectRevert(transferTx, "ERC721: caller is not token owner or approved -- Reason given: ERC721: caller is not token owner or approved.");
    });

    it("移転されたトークンも消却できます。", async () => {
        await instance.transferFrom(alice, bob, burnTokenId, { from: alice });

        const burnTx = instance.burn(burnTokenId, { from: deployer });
        expectEvent(await burnTx, "Transfer", {
            from: bob,
            to: constants.ZERO_ADDRESS,
            tokenId: burnTokenId
        });

        expectBN(await instance.balanceOf(deployer)).that.is.zero;
        expectBN(await instance.balanceOf(alice)).that.equals(new BN(mintTokenIds.length - 1));
        expectBN(await instance.balanceOf(bob)).that.is.zero;
        expectBN(await instance.balanceOf(charlie)).that.is.zero;
    });
});

describe("コントラクト所有者の設定", () => {
    let instance: MinimumInstance;
    const mintTokenId = tokenIds[0];

    beforeEach(async () => {
        instance = await MinimumContract.new({ from: deployer });
    });

    it("新しい所有者に変更し、新しい所有者がトークンを発行します。", async () => {
        const transferTx = instance.transferOwnership(alice, { from: deployer });
        expectEvent(await transferTx, "OwnershipTransferred", {
            previousOwner: deployer,
            newOwner: alice,
        });
        expect(await instance.owner()).to.equal(alice);

        const mintTx1 = instance.mint(bob, mintTokenId, { from: deployer });
        await expectRevert(mintTx1,
            "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");

        const mintTx2 = instance.mint(bob, mintTokenId, { from: alice });
        expectEvent(await mintTx2, "Transfer", {
            from: constants.ZERO_ADDRESS,
            to: bob,
            tokenId: mintTokenId
        });

        expectBN(await instance.balanceOf(deployer)).that.is.zero;
        expectBN(await instance.balanceOf(alice)).that.is.zero;
        expectBN(await instance.balanceOf(bob)).that.equals(new BN(1));
    });

    it("自分を所有者ではないようにします。", async () => {
        await instance.renounceOwnership({ from: deployer });
        expect(await instance.owner()).to.equal(constants.ZERO_ADDRESS);
    });

    it("所有者でない者による操作はエラーします。", async () => {
        const renounceTx = instance.renounceOwnership({ from: alice });
        await expectRevert(renounceTx, "Ownable: caller is not the owner");
    });
});

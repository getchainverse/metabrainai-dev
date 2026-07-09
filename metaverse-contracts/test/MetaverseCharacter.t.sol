// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MetaverseCharacter} from "../src/MetaverseCharacter.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @dev Rejects incoming ETH so the withdraw failure path can be exercised.
contract RejectingReceiver {
    receive() external payable {
        revert("no");
    }
}

contract MetaverseCharacterTest is Test {
    MetaverseCharacter internal nft;

    address internal admin = address(this);
    address internal royaltyReceiver = makeAddr("royalty");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    address internal signer;
    uint256 internal signerPk;

    uint256 internal constant MAX_SUPPLY = 1000;
    uint256 internal constant MAX_PER_WALLET = 3;
    uint96 internal constant ROYALTY_BIPS = 500; // 5%

    function setUp() public {
        (signer, signerPk) = makeAddrAndKey("signer");
        nft = new MetaverseCharacter(
            "Metaverse Character",
            "MVC",
            admin,
            MAX_SUPPLY,
            MAX_PER_WALLET,
            royaltyReceiver,
            ROYALTY_BIPS
        );
        // The admin bootstrap holds SIGNER_ROLE, but we need a key we can sign with.
        nft.grantRole(nft.SIGNER_ROLE(), signer);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPERS
    //////////////////////////////////////////////////////////////*/

    function _input(string memory name)
        internal
        pure
        returns (MetaverseCharacter.CharacterInput memory)
    {
        return MetaverseCharacter.CharacterInput({
            name: name,
            modelURI: "ipfs://model",
            personaURI: "ipfs://persona",
            metadataURI: "ipfs://meta"
        });
    }

    function _voucher(address to, uint256 price, uint256 nonce)
        internal
        view
        returns (MetaverseCharacter.MintVoucher memory)
    {
        return MetaverseCharacter.MintVoucher({
            to: to,
            character: _input("Aria"),
            price: price,
            nonce: nonce,
            deadline: block.timestamp + 1 hours
        });
    }

    function _sign(MetaverseCharacter.MintVoucher memory v, uint256 pk)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = nft.hashVoucher(v);
        (uint8 vv, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, vv);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(nft.name(), "Metaverse Character");
        assertEq(nft.symbol(), "MVC");
        assertEq(nft.maxSupply(), MAX_SUPPLY);
        assertEq(nft.maxPerWallet(), MAX_PER_WALLET);
        assertEq(nft.totalMinted(), 0);
        assertEq(nft.remainingSupply(), MAX_SUPPLY);
        assertTrue(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(nft.hasRole(nft.MINTER_ROLE(), admin));
    }

    function test_SupportsInterfaces() public view {
        assertTrue(nft.supportsInterface(type(IERC721).interfaceId));
        assertTrue(nft.supportsInterface(type(IERC2981).interfaceId));
        assertTrue(nft.supportsInterface(type(IAccessControl).interfaceId));
        assertTrue(nft.supportsInterface(type(IERC165).interfaceId));
    }

    function test_RoyaltyInfo() public view {
        (address receiver, uint256 amount) = nft.royaltyInfo(1, 10_000);
        assertEq(receiver, royaltyReceiver);
        assertEq(amount, 500); // 5% of 10,000
    }

    function test_RevertWhen_ConstructedWithZeroMaxSupply() public {
        vm.expectRevert(MetaverseCharacter.InvalidMaxSupply.selector);
        new MetaverseCharacter("n", "s", admin, 0, 1, royaltyReceiver, 0);
    }

    function test_RevertWhen_ConstructedWithZeroAdmin() public {
        vm.expectRevert(MetaverseCharacter.ZeroAddress.selector);
        new MetaverseCharacter("n", "s", address(0), 1, 1, royaltyReceiver, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN MINT
    //////////////////////////////////////////////////////////////*/

    function test_AdminMint() public {
        uint256 tokenId = nft.adminMint(alice, _input("Nova"));
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.tokenURI(1), "ipfs://meta");
        assertEq(nft.totalMinted(), 1);

        MetaverseCharacter.Character memory c = nft.getCharacter(1);
        assertEq(c.name, "Nova");
        assertEq(c.modelURI, "ipfs://model");
        assertFalse(c.frozen);
    }

    function test_AdminMint_DoesNotCountAgainstWallet() public {
        // Admin mints do not touch mintedCount, so the wallet cap is untouched.
        nft.adminMint(alice, _input("A"));
        nft.adminMint(alice, _input("B"));
        nft.adminMint(alice, _input("C"));
        nft.adminMint(alice, _input("D"));
        assertEq(nft.balanceOf(alice), 4);
        assertEq(nft.mintedCount(alice), 0);
    }

    function test_RevertWhen_AdminMintByNonMinter() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.adminMint(alice, _input("X"));
    }

    function test_RevertWhen_AdminMintToZero() public {
        vm.expectRevert(MetaverseCharacter.ZeroAddress.selector);
        nft.adminMint(address(0), _input("X"));
    }

    function test_RevertWhen_MintWithEmptyModelURI() public {
        MetaverseCharacter.CharacterInput memory bad = _input("X");
        bad.modelURI = "";
        vm.expectRevert(MetaverseCharacter.EmptyRequiredURI.selector);
        nft.adminMint(alice, bad);
    }

    function test_RevertWhen_MaxSupplyReached() public {
        MetaverseCharacter small = new MetaverseCharacter("n", "s", admin, 1, 5, royaltyReceiver, 0);
        small.adminMint(alice, _input("only"));
        vm.expectRevert(MetaverseCharacter.MaxSupplyReached.selector);
        small.adminMint(bob, _input("overflow"));
    }

    /*//////////////////////////////////////////////////////////////
                            VOUCHER REDEEM
    //////////////////////////////////////////////////////////////*/

    function test_Redeem() public {
        uint256 price = 0.1 ether;
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, price, 1);
        bytes memory sig = _sign(v, signerPk);

        vm.deal(alice, price);
        vm.prank(alice);
        uint256 tokenId = nft.redeem{value: price}(v, sig);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.mintedCount(alice), 1);
        assertTrue(nft.nonceUsed(1));
        assertEq(address(nft).balance, price);
    }

    function test_RevertWhen_RedeemWithWrongPayment() public {
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0.1 ether, 1);
        bytes memory sig = _sign(v, signerPk);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                MetaverseCharacter.IncorrectPayment.selector, 0.1 ether, 0.05 ether
            )
        );
        nft.redeem{value: 0.05 ether}(v, sig);
    }

    function test_RevertWhen_RedeemExpired() public {
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0, 1);
        v.deadline = block.timestamp; // valid now
        bytes memory sig = _sign(v, signerPk);

        vm.warp(block.timestamp + 1); // now past the deadline
        vm.prank(alice);
        vm.expectRevert(MetaverseCharacter.VoucherExpired.selector);
        nft.redeem(v, sig);
    }

    function test_RevertWhen_NonceReused() public {
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0, 7);
        bytes memory sig = _sign(v, signerPk);

        vm.prank(alice);
        nft.redeem(v, sig);

        vm.prank(alice);
        vm.expectRevert(MetaverseCharacter.NonceAlreadyUsed.selector);
        nft.redeem(v, sig);
    }

    function test_RevertWhen_SignerNotAuthorized() public {
        (, uint256 attackerPk) = makeAddrAndKey("attacker");
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0, 1);
        bytes memory sig = _sign(v, attackerPk);

        vm.prank(alice);
        vm.expectRevert(); // UnauthorizedSigner(recovered)
        nft.redeem(v, sig);
    }

    function test_RevertWhen_VoucherTampered() public {
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0, 1);
        bytes memory sig = _sign(v, signerPk);
        // Change the recipient after signing: recovered signer no longer holds SIGNER_ROLE.
        v.to = bob;

        vm.prank(bob);
        vm.expectRevert();
        nft.redeem(v, sig);
    }

    function test_RevertWhen_WalletCapExceeded() public {
        for (uint256 i = 0; i < MAX_PER_WALLET; i++) {
            MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0, i + 1);
            bytes memory sig = _sign(v, signerPk);
            vm.prank(alice);
            nft.redeem(v, sig);
        }
        assertEq(nft.mintedCount(alice), MAX_PER_WALLET);

        MetaverseCharacter.MintVoucher memory over = _voucher(alice, 0, 99);
        bytes memory overSig = _sign(over, signerPk);
        vm.prank(alice);
        vm.expectRevert(MetaverseCharacter.MaxPerWalletReached.selector);
        nft.redeem(over, overSig);
    }

    /*//////////////////////////////////////////////////////////////
                        CHARACTER MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function test_UpdateCharacterURIs() public {
        nft.adminMint(alice, _input("Nova"));
        nft.updateCharacterURIs(1, "ipfs://model2", "ipfs://persona2", "ipfs://meta2");

        MetaverseCharacter.Character memory c = nft.getCharacter(1);
        assertEq(c.modelURI, "ipfs://model2");
        assertEq(c.personaURI, "ipfs://persona2");
        assertEq(nft.tokenURI(1), "ipfs://meta2");
    }

    function test_RevertWhen_UpdateByNonManager() public {
        nft.adminMint(alice, _input("Nova"));
        vm.prank(bob);
        vm.expectRevert();
        nft.updateCharacterURIs(1, "a", "b", "c");
    }

    function test_FreezeAndBlockUpdate() public {
        nft.adminMint(alice, _input("Nova"));
        vm.prank(alice);
        nft.freezeCharacter(1);
        assertTrue(nft.getCharacter(1).frozen);

        vm.expectRevert(MetaverseCharacter.CharacterIsFrozen.selector);
        nft.updateCharacterURIs(1, "ipfs://m", "ipfs://p", "ipfs://x");
    }

    function test_RevertWhen_FreezeByNonOwner() public {
        nft.adminMint(alice, _input("Nova"));
        vm.prank(bob);
        vm.expectRevert(MetaverseCharacter.NotCharacterOwner.selector);
        nft.freezeCharacter(1);
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSABLE
    //////////////////////////////////////////////////////////////*/

    function test_PauseBlocksTransfer() public {
        nft.adminMint(alice, _input("Nova"));
        nft.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        nft.transferFrom(alice, bob, 1);

        nft.unpause();
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
    }

    function test_RevertWhen_PauseByNonPauser() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.pause();
    }

    /*//////////////////////////////////////////////////////////////
                            WITHDRAW
    //////////////////////////////////////////////////////////////*/

    function test_Withdraw() public {
        uint256 price = 0.5 ether;
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, price, 1);
        bytes memory sig = _sign(v, signerPk);
        vm.deal(alice, price);
        vm.prank(alice);
        nft.redeem{value: price}(v, sig);

        assertEq(address(nft).balance, price);
        nft.withdraw(bob);
        assertEq(bob.balance, price);
        assertEq(address(nft).balance, 0);
    }

    function test_RevertWhen_WithdrawNothing() public {
        vm.expectRevert(MetaverseCharacter.NothingToWithdraw.selector);
        nft.withdraw(bob);
    }

    function test_RevertWhen_WithdrawByNonAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.withdraw(alice);
    }

    function test_RevertWhen_WithdrawToRejectingReceiver() public {
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, 0.1 ether, 1);
        bytes memory sig = _sign(v, signerPk);
        vm.deal(alice, 0.1 ether);
        vm.prank(alice);
        nft.redeem{value: 0.1 ether}(v, sig);

        RejectingReceiver r = new RejectingReceiver();
        vm.expectRevert(MetaverseCharacter.WithdrawFailed.selector);
        nft.withdraw(address(r));
    }

    /*//////////////////////////////////////////////////////////////
                                FUZZ
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RedeemExactPayment(uint96 price, uint256 nonce) public {
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, price, nonce);
        bytes memory sig = _sign(v, signerPk);

        vm.deal(alice, price);
        vm.prank(alice);
        nft.redeem{value: price}(v, sig);

        assertEq(nft.ownerOf(1), alice);
        assertEq(address(nft).balance, price);
        assertTrue(nft.nonceUsed(nonce));
    }

    function testFuzz_RevertWhen_WrongPayment(uint96 price, uint96 sent) public {
        vm.assume(price != sent);
        MetaverseCharacter.MintVoucher memory v = _voucher(alice, price, 1);
        bytes memory sig = _sign(v, signerPk);

        vm.deal(alice, sent);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(MetaverseCharacter.IncorrectPayment.selector, price, sent)
        );
        nft.redeem{value: sent}(v, sig);
    }

    function testFuzz_AdminMintAssignsSequentialIds(uint8 count) public {
        vm.assume(count > 0 && count <= 20);
        for (uint256 i = 0; i < count; i++) {
            uint256 id = nft.adminMint(alice, _input("C"));
            assertEq(id, i + 1);
        }
        assertEq(nft.totalMinted(), count);
        assertEq(nft.remainingSupply(), MAX_SUPPLY - count);
    }
}

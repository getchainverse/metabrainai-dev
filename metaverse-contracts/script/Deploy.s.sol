// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MetaverseCharacter} from "../src/MetaverseCharacter.sol";

/**
 * @title Deploy
 * @notice Deployment script for {MetaverseCharacter}.
 *
 * @dev Configuration is read from environment variables so the same script serves every
 *      EVM network (Ethereum, Polygon, Avalanche, BSC, ...):
 *
 *      COLLECTION_NAME     - ERC-721 name           (default "Metaverse Character")
 *      COLLECTION_SYMBOL   - ERC-721 symbol         (default "MVC")
 *      ADMIN               - initial role admin     (default: broadcaster)
 *      MAX_SUPPLY          - hard supply cap        (default 10000)
 *      MAX_PER_WALLET      - voucher mint cap        (default 5)
 *      ROYALTY_RECEIVER    - ERC-2981 recipient      (default: admin)
 *      ROYALTY_BIPS        - royalty in basis points (default 500 = 5%)
 *
 *      Usage:
 *        forge script script/Deploy.s.sol:Deploy \
 *          --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
 */
contract Deploy is Script {
    function run() external returns (MetaverseCharacter nft) {
        string memory name = vm.envOr("COLLECTION_NAME", string("Metaverse Character"));
        string memory symbol = vm.envOr("COLLECTION_SYMBOL", string("MVC"));
        address admin = vm.envOr("ADMIN", msg.sender);
        uint256 maxSupply = vm.envOr("MAX_SUPPLY", uint256(10_000));
        uint256 maxPerWallet = vm.envOr("MAX_PER_WALLET", uint256(5));
        address royaltyReceiver = vm.envOr("ROYALTY_RECEIVER", admin);
        uint256 royaltyBips = vm.envOr("ROYALTY_BIPS", uint256(500));

        vm.startBroadcast();
        nft = new MetaverseCharacter(
            name, symbol, admin, maxSupply, maxPerWallet, royaltyReceiver, uint96(royaltyBips)
        );
        vm.stopBroadcast();

        console2.log("MetaverseCharacter deployed at:", address(nft));
        console2.log("Admin:", admin);
        console2.log("Max supply:", maxSupply);
    }
}

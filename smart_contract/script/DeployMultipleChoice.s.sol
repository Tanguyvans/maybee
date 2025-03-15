// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "forge-std/Script.sol";
import "../src/MultipleChoice.sol";

contract DeployMultipleChoice is Script {
    // Sepolia UMA Optimistic Oracle V2 address
    address constant OOV2_SEPOLIA = 0x9f1263B8f0355673619168b5B8c0248f1d03e88C;

    // WETH on Sepolia (or another token you want to use)
    address constant TOKEN_SEPOLIA = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;

    // Set your desired values
    uint256 constant REWARD = 0.01 ether; // Example reward
    uint256 constant BOND = 0.02 ether; // Example bond
    uint256 constant LIVENESS = 7200; // Example liveness (2 hours)

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        OOv2EventRequester multipleChoice = new OOv2EventRequester(
            OOV2_SEPOLIA,
            TOKEN_SEPOLIA,
            REWARD,
            BOND,
            LIVENESS
        );

        console.log("OOv2EventRequester deployed at:", address(multipleChoice));

        vm.stopBroadcast();
    }
}

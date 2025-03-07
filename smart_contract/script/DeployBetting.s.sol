// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/BettingContract.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // UMA Oracle address on Sepolia
        address umaOracleAddress = 0x9f1263B8f0355673619168b5B8c0248f1d03e88C;

        // Deploy the contract
        BettingContract bettingContract = new BettingContract(umaOracleAddress);

        vm.stopBroadcast();

        // Log the deployed address
        console.log("BettingContract deployed at:", address(bettingContract));
    }
}

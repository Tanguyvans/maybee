// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {BettingContract} from "../src/BettingContract.sol";

contract DeployScript is Script {
    // UMA Optimistic Oracle V2 address on Sepolia
    address constant ORACLE_ADDRESS =
        0x9f1263B8f0355673619168b5B8c0248f1d03e88C;

    function run() public {
        // Retrieve private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deploying BettingContract with:");
        console2.log("Deployer:", deployer);
        console2.log("Oracle:", ORACLE_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        BettingContract betting = new BettingContract(ORACLE_ADDRESS);
        console2.log("BettingContract deployed at:", address(betting));

        // Add deployer as bet creator
        betting.addBetCreator(deployer);
        console2.log("Added deployer as bet creator");

        vm.stopBroadcast();
    }
}

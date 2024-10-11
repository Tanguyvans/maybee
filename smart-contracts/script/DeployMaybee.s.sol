// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {MayBee} from "../src/Maybee.sol";

contract DeployMayBeeScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MayBee mayBee = new MayBee();
        console.log("MayBee contract deployed at:", address(mayBee));

        vm.stopBroadcast();
    }
}

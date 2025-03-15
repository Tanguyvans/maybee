// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "@uma/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OOv2EventRequester is Ownable {
    OptimisticOracleV2Interface public OOV2;
    address public token; // used for proposal and dispute bonds and reward if set
    uint256 public reward;
    uint256 public bond; // set to 0 to use OO default bond amount
    uint256 public liveness; // set to 0 to use OO default liveness

    int256 public constant TOO_EARLY_RESPONSE = type(int256).min;
    bytes32 public constant MULTIPLE_CHOICE_QUERY_ID = "MULTIPLE_CHOICE_QUERY"; // https://github.com/UMAprotocol/UMIPs/blob/master/UMIPs/umip-181.md

    event PriceRequested(uint256 timestamp, bytes ancillaryData);
    event PriceSettled(uint256 timestamp, bytes ancillaryData, int256 price);

    /// @param _OOV2            - OOV2 address on deployed network
    /// @param _token            - address on deployed network
    /// @param _reward          - OO proposal reward amount
    /// @param _bond            - OO bond amount (does not include final fee). Set to 0 to use minimum.
    /// @param _liveness        - OO liveness. Set to 0 to use OO default.
    constructor(
        address _OOV2,
        address _token,
        uint256 _reward,
        uint256 _bond,
        uint256 _liveness
    ) Ownable() {
        OOV2 = OptimisticOracleV2Interface(_OOV2);
        token = _token;
        reward = _reward;
        bond = _bond;
        liveness = _liveness;
    }

    /// @notice Request a price from the Optimistic Oracle
    /// @dev this contract must be funded with `reward` amount of `token`before calling
    /// @param _ancillaryData    - Data used to resolve a question. *** Must be formatted as per https://github.com/UMAprotocol/UMIPs/blob/master/UMIPs/umip-181.md#ancillary-data-specifications
    function requestPrice(bytes memory _ancillaryData) public onlyOwner {
        _requestPrice(_ancillaryData);
    }

    function _requestPrice(bytes memory _ancillaryData) internal {
        if (reward > 0) {
            // Approve the OO as spender on the reward token from the Adapter
            IERC20(token).approve(address(OOV2), reward);
        }

        uint256 timestamp = block.timestamp;

        // Send a price request to the Optimistic oracle
        OOV2.requestPrice(
            MULTIPLE_CHOICE_QUERY_ID,
            timestamp,
            _ancillaryData,
            IERC20(token),
            reward
        );

        // Ensure the price request is event based
        OOV2.setEventBased(MULTIPLE_CHOICE_QUERY_ID, timestamp, _ancillaryData);

        // Ensure that the dispute callback flag is set
        OOV2.setCallbacks(
            MULTIPLE_CHOICE_QUERY_ID,
            timestamp,
            _ancillaryData,
            false, // DO NOT set callback on priceProposed
            false, // DO NOT set callback on priceDisputed
            true // DO set callback on priceSettled
        );

        // Update the proposal bond on the Optimistic oracle if necessary
        if (bond > 0)
            OOV2.setBond(
                MULTIPLE_CHOICE_QUERY_ID,
                timestamp,
                _ancillaryData,
                bond
            );
        if (liveness > 0) {
            OOV2.setCustomLiveness(
                MULTIPLE_CHOICE_QUERY_ID,
                timestamp,
                _ancillaryData,
                liveness
            );
        }
        emit PriceRequested(timestamp, _ancillaryData);
    }

    /// @notice Callback function to re-create requests that are settled as TOO_EARLY_RESPONSE
    /// @dev contract must be pre-funded with `reward` amount of `token` or else priceSettled will revert
    /// @dev see OptimisticRequester interface in OptimisticOracleV2.sol for function comments
    function priceSettled(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 price
    ) external {
        // restrict to OOV2 only
        require(msg.sender == address(OOV2), "OOV2 only");

        // if resolved price is TOO_EARLY_RESPONSE, re-request with same settings
        if (price == TOO_EARLY_RESPONSE) {
            _requestPrice(ancillaryData);
        }
        emit PriceSettled(timestamp, ancillaryData, price);
    }

    /// @notice Withdraws `amount` of `token` to msg.sender
    function withdrawTokens(address _token, uint256 _amount) public onlyOwner {
        IERC20(_token).transfer(msg.sender, _amount);
    }

    function reviseToken(address _token) public onlyOwner {
        token = _token;
    }

    function reviseReward(uint256 _reward) public onlyOwner {
        reward = _reward;
    }

    function reviseBond(uint256 _bond) public onlyOwner {
        bond = _bond;
    }

    function reviseLiveness(uint256 _liveness) public onlyOwner {
        liveness = _liveness;
    }
}

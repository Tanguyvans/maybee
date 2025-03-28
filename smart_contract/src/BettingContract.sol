// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OptimisticOracleV2Interface} from "@uma/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BettingContract {
    // UMA Protocol
    OptimisticOracleV2Interface public immutable oo;
    bytes32 public constant IDENTIFIER = "MULTIPLE_CHOICE_QUERY"; // YES_OR_NO_QUERY
    address public constant WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;

    // Role management
    address public immutable owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public betCreators;

    uint256 public constant PLATFORM_FEE = 300; // 3%
    uint256 public platformBalance;

    enum MarketCategory {
        CULTURE,
        CRYPTO,
        SPORTS,
        POLITICS,
        MEMECOINS,
        GAMING,
        ECONOMY,
        AI
    }

    struct Market {
        string description;
        address creator;
        uint256 expirationDate;
        uint256 verificationTime;
        bool isResolved;
        uint256[] optionAmounts;
        uint256 requestTime;
        int256 outcome;
        bytes questionText;
        string imageUrl;
        MarketCategory category;
        mapping(address => UserBet) userBets;
        address[] bettors;
        uint256 optionCount;
    }

    struct UserBet {
        uint256[] optionAmounts;
        bool claimed;
    }

    mapping(uint256 => Market) public markets;
    uint256 public marketCount;

    uint256[] public marketIds;

    struct MarketView {
        uint256 marketId;
        string description;
        address creator;
        uint256 expirationDate;
        uint256 verificationTime;
        bool isResolved;
        uint256[] optionAmounts;
        uint256 requestTime;
        int256 outcome;
        MarketCategory category;
        string imageUrl;
        uint256 optionCount;
    }

    // Events
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event BetCreatorAdded(address indexed creator);
    event BetCreatorRemoved(address indexed creator);
    event MarketCreated(
        uint256 indexed marketId,
        string description,
        uint256 expirationDate,
        uint256 verificationTime
    );
    event BetPlaced(
        address indexed user,
        uint256 indexed marketId,
        uint256 amount,
        uint256 optionIndex
    );
    event SettlementRequested(uint256 indexed marketId, uint256 requestTime);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event WinningsClaimed(
        address indexed user,
        uint256 indexed marketId,
        uint256 amount
    );
    event PlatformFeesWithdrawn(uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can call this");
        _;
    }

    modifier onlyBetCreator() {
        require(betCreators[msg.sender], "Only bet creator can call this");
        _;
    }

    constructor(address _ooAddress) {
        oo = OptimisticOracleV2Interface(_ooAddress);
        owner = msg.sender;
        admins[msg.sender] = true;
        betCreators[msg.sender] = true;
    }

    // Role management functions
    function addAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Invalid address");
        admins[newAdmin] = true;
        emit AdminAdded(newAdmin);
    }

    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner, "Cannot remove owner");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    function addBetCreator(address creator) external onlyAdmin {
        require(creator != address(0), "Invalid address");
        betCreators[creator] = true;
        emit BetCreatorAdded(creator);
    }

    function removeBetCreator(address creator) external onlyAdmin {
        betCreators[creator] = false;
        emit BetCreatorRemoved(creator);
    }

    function withdrawPlatformFees() external onlyOwner {
        require(platformBalance > 0, "No fees to withdraw");
        uint256 amount = platformBalance;
        platformBalance = 0;
        payable(owner).transfer(amount);
        emit PlatformFeesWithdrawn(amount);
    }

    function createMarketAdmin(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 expirationDate,
        uint256 _verificationTime,
        string memory imageUrl,
        MarketCategory category
    ) external onlyBetCreator {
        require(expirationDate > block.timestamp, "Invalid expiration date");
        require(_verificationTime >= 150, "Verification time too short");
        require(_verificationTime <= 86400, "Verification time too long"); // Max 24 hours
        require(options.length >= 2, "At least 2 options required");
        require(options.length <= 10, "Maximum 10 options allowed");

        // Create a properly formatted JSON object for UMA's MULTIPLE_CHOICE_QUERY
        string memory jsonStart = '{"title":"';
        string memory jsonTitleEnd = '","description":"';
        string memory jsonDescEnd = '","options":[';

        // Start building the JSON
        string memory formattedQuestion = string(
            abi.encodePacked(
                jsonStart,
                title,
                jsonTitleEnd,
                description,
                jsonDescEnd
            )
        );

        // Add options
        for (uint i = 0; i < options.length; i++) {
            // Format: ["Option1","0"],["Option2","1"]
            if (i > 0) {
                formattedQuestion = string(
                    abi.encodePacked(formattedQuestion, ",")
                );
            }
            formattedQuestion = string(
                abi.encodePacked(
                    formattedQuestion,
                    '["',
                    options[i],
                    '","',
                    uintToString(i),
                    '"]'
                )
            );
        }

        // Close the JSON object
        formattedQuestion = string(abi.encodePacked(formattedQuestion, "]}"));

        marketCount++;
        Market storage market = markets[marketCount];
        market.description = description;
        market.creator = msg.sender;
        market.expirationDate = expirationDate;
        market.verificationTime = _verificationTime;
        market.questionText = bytes(formattedQuestion);
        market.imageUrl = imageUrl;
        market.category = category;
        market.outcome = -1; // Initialize as unresolved
        market.optionCount = options.length;

        // Initialize the optionAmounts array with the correct size
        market.optionAmounts = new uint256[](options.length);

        marketIds.push(marketCount);

        emit MarketCreated(
            marketCount,
            description,
            expirationDate,
            _verificationTime
        );
    }

    // Helper function to convert uint to string
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    // Internal function that both placeBet and placeBetYesNo will call
    function _placeBet(uint256 marketId, uint256 optionIndex) internal {
        require(
            marketId > 0 && marketId <= marketCount,
            "Market does not exist"
        );
        Market storage market = markets[marketId];

        require(!market.isResolved, "Market is resolved");
        require(block.timestamp < market.expirationDate, "Market has expired");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(optionIndex < market.optionCount, "Invalid option index");

        // Calculate platform fee
        uint256 fee = (msg.value * PLATFORM_FEE) / 10000;
        uint256 betAmount = msg.value - fee;
        platformBalance += fee;

        // Get or initialize user bet
        UserBet storage userBet = market.userBets[msg.sender];

        // Initialize user's optionAmounts array if this is their first bet
        if (userBet.optionAmounts.length == 0) {
            userBet.optionAmounts = new uint256[](market.optionCount);
            market.bettors.push(msg.sender);
        }

        // Update market totals and user bet
        market.optionAmounts[optionIndex] += betAmount;
        userBet.optionAmounts[optionIndex] += betAmount;

        emit BetPlaced(msg.sender, marketId, betAmount, optionIndex);
    }

    // Public function for placing bets with option index
    function placeBet(uint256 marketId, uint256 optionIndex) external payable {
        _placeBet(marketId, optionIndex);
    }

    // Public function for placing Yes/No bets (backward compatibility)
    function placeBetYesNo(uint256 marketId, bool isYes) external payable {
        uint256 optionIndex = isYes ? 1 : 0;
        _placeBet(marketId, optionIndex);
    }

    function requestSettlement(
        uint256 marketId,
        uint256 reward,
        uint256 bond
    ) external onlyAdmin {
        require(
            marketId > 0 && marketId <= marketCount,
            "Market does not exist"
        );
        Market storage market = markets[marketId];
        require(!market.isResolved, "Market already resolved");
        require(block.timestamp >= market.expirationDate, "Market not expired");
        require(market.requestTime == 0, "Settlement already requested");

        market.requestTime = block.timestamp;

        // Transfer reward and bond in WETH
        IERC20(WETH).transferFrom(msg.sender, address(this), reward + bond);

        // Approve the Oracle to spend the reward
        IERC20(WETH).approve(address(oo), reward);

        // Request price from UMA
        oo.requestPrice(
            IDENTIFIER,
            market.requestTime,
            market.questionText,
            IERC20(WETH),
            reward
        );

        // Set the bond for the request
        oo.setBond(IDENTIFIER, market.requestTime, market.questionText, bond);

        // Set custom liveness
        oo.setCustomLiveness(
            IDENTIFIER,
            market.requestTime,
            market.questionText,
            market.verificationTime
        );

        emit SettlementRequested(marketId, market.requestTime);
    }

    function settleMarket(uint256 marketId) external onlyAdmin {
        require(
            marketId > 0 && marketId <= marketCount,
            "Market does not exist"
        );
        Market storage market = markets[marketId];
        require(!market.isResolved, "Market already resolved");
        require(market.requestTime > 0, "Settlement not requested");
        require(
            block.timestamp >= market.requestTime + market.verificationTime,
            "Verification time not passed"
        );

        // Get result from UMA
        int256 result = oo
            .getRequest(
                address(this),
                IDENTIFIER,
                market.requestTime,
                market.questionText
            )
            .resolvedPrice;

        // Check if the result is a special value
        if (result == type(int256).min) {
            // Too early response, might want to handle this
            revert("Oracle response: Too early to determine result");
        } else if (result == type(int256).max) {
            // No answer possible
            revert("Oracle response: No answer possible");
        }

        // Ensure the result is a valid option index
        require(
            result >= 0 && uint256(result) < market.optionCount,
            "Invalid option index from oracle"
        );

        market.outcome = result;
        market.isResolved = true;

        emit MarketResolved(marketId, result == 1); // For backward compatibility, still emit true if option 1 wins
    }

    function claimWinnings(uint256 marketId) external {
        require(
            marketId > 0 && marketId <= marketCount,
            "Market does not exist"
        );
        Market storage market = markets[marketId];
        require(market.isResolved, "Market not resolved");

        UserBet storage userBet = market.userBets[msg.sender];
        require(!userBet.claimed, "Winnings already claimed");

        // Check if user placed any bets
        bool hasBets = false;
        for (uint256 i = 0; i < market.optionCount; i++) {
            if (userBet.optionAmounts[i] > 0) {
                hasBets = true;
                break;
            }
        }
        require(hasBets, "No bets placed");

        uint256 winningOption = uint256(market.outcome);
        uint256 winnings = 0;

        // If user bet on the winning option
        if (userBet.optionAmounts[winningOption] > 0) {
            uint256 totalWinningAmount = market.optionAmounts[winningOption];
            uint256 totalLosingAmount = 0;

            // Calculate total losing amount
            for (uint256 i = 0; i < market.optionCount; i++) {
                if (i != winningOption) {
                    totalLosingAmount += market.optionAmounts[i];
                }
            }

            if (totalLosingAmount > 0) {
                // Normal case: distribute losing pool
                winnings =
                    userBet.optionAmounts[winningOption] +
                    (userBet.optionAmounts[winningOption] * totalLosingAmount) /
                    totalWinningAmount;
            } else {
                // Edge case: everyone bet on the winning option
                winnings = userBet.optionAmounts[winningOption]; // Just return original bet
            }
        }

        require(winnings > 0, "No winnings to claim");
        userBet.claimed = true;

        payable(msg.sender).transfer(winnings);
        emit WinningsClaimed(msg.sender, marketId, winnings);
    }

    function getUserBet(
        address user,
        uint256 marketId
    ) external view returns (uint256[] memory optionAmounts, bool claimed) {
        UserBet storage userBet = markets[marketId].userBets[user];
        return (userBet.optionAmounts, userBet.claimed);
    }

    function getMarketDetails(
        uint256 marketId
    )
        external
        view
        returns (
            uint256 id,
            string memory description,
            address creator,
            uint256 expirationDate,
            uint256 verificationTime,
            bool isResolved,
            uint256[] memory optionAmounts,
            uint256 requestTime,
            int256 outcome,
            MarketCategory category,
            string memory imageUrl,
            uint256 optionCount
        )
    {
        require(
            marketId > 0 && marketId <= marketCount,
            "Market does not exist"
        );
        Market storage marketData = markets[marketId];

        return (
            marketId,
            marketData.description,
            marketData.creator,
            marketData.expirationDate,
            marketData.verificationTime,
            marketData.isResolved,
            marketData.optionAmounts,
            marketData.requestTime,
            marketData.outcome,
            marketData.category,
            marketData.imageUrl,
            marketData.optionCount
        );
    }

    function getAllMarketIds() external view returns (uint256[] memory) {
        return marketIds;
    }

    function getAllMarkets() external view returns (MarketView[] memory) {
        uint256 totalMarkets = marketIds.length;
        MarketView[] memory allMarkets = new MarketView[](totalMarkets);

        for (uint256 i = 0; i < totalMarkets; i++) {
            uint256 id = marketIds[i];
            Market storage market = markets[id];

            allMarkets[i] = MarketView({
                marketId: id,
                description: market.description,
                creator: market.creator,
                expirationDate: market.expirationDate,
                verificationTime: market.verificationTime,
                isResolved: market.isResolved,
                optionAmounts: market.optionAmounts,
                requestTime: market.requestTime,
                outcome: market.outcome,
                category: market.category,
                imageUrl: market.imageUrl,
                optionCount: market.optionCount
            });
        }

        return allMarkets;
    }

    function getTotalPoolSize(
        uint256 marketId
    ) external view returns (uint256) {
        require(
            marketId > 0 && marketId <= marketCount,
            "Market does not exist"
        );

        Market storage market = markets[marketId];
        uint256 total = 0;

        for (uint256 i = 0; i < market.optionCount; i++) {
            total += market.optionAmounts[i];
        }

        return total;
    }
}

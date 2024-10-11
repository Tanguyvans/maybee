// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MayBee {
    struct Market {
        string description;
        uint256 expirationDate;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        bool isResolved;
        bool outcome;
        address admin;
    }

    struct Bet {
        uint256 yesAmount;
        uint256 noAmount;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public userBets;
    // Variable to track the number of created markets
    uint256 public marketCount;
    event BetDeposited(
        uint256 indexed marketId,
        address indexed user,
        bool isYes,
        uint256 amount
    );

    address public owner;

    event MarketCreated(
        uint256 marketId,
        string description,
        uint256 expirationDate
    );
    event BetPlaced(uint256 marketId, address user, bool isYes, uint256 amount);
    event MarketResolved(uint256 marketId, bool outcome);
    event RewardClaimed(uint256 marketId, address user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin(uint256 _marketId) {
        require(
            msg.sender == markets[_marketId].admin,
            "Only admin can perform this action"
        );
        _;
    }

    modifier marketOpen(uint256 _marketId) {
        require(!markets[_marketId].isResolved, "Market is already resolved");
        require(
            block.timestamp < markets[_marketId].expirationDate,
            "Market has expired"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createMarket(
        string memory _description,
        uint256 _expirationDate
    ) external onlyOwner {
        require(
            _expirationDate > block.timestamp,
            "Expiration date must be in the future"
        );

        markets[marketCount] = Market({
            description: _description,
            expirationDate: _expirationDate,
            totalYesAmount: 0,
            totalNoAmount: 0,
            isResolved: false,
            outcome: false,
            admin: msg.sender
        });
        marketCount++;
        emit MarketCreated(marketCount, _description, _expirationDate);
    }
    function deposit(
        uint256 _marketId,
        bool _isYes,
        uint256 _amount
    ) external payable marketOpen(_marketId) {
        require(_amount > 0, "Deposit amount must be greater than 0");

        Bet storage userBet = userBets[_marketId][msg.sender];
        Market storage market = markets[_marketId];

        if (_isYes) {
            userBet.yesAmount += _amount;
            market.totalYesAmount += _amount;
        } else {
            userBet.noAmount += _amount;
            market.totalNoAmount += _amount;
        }

        emit BetDeposited(_marketId, msg.sender, _isYes, _amount);
    }
    function placeBet(
        uint256 _marketId,
        bool _isYes,
        uint256 _amount
    ) external marketOpen(_marketId) {
        require(_amount > 0, "Bet amount must be greater than 0");

        Bet storage userBet = userBets[_marketId][msg.sender];
        Market storage market = markets[_marketId];

        if (_isYes) {
            userBet.yesAmount += _amount;
            market.totalYesAmount += _amount;
        } else {
            userBet.noAmount += _amount;
            market.totalNoAmount += _amount;
        }

        emit BetPlaced(_marketId, msg.sender, _isYes, _amount);
    }

    function resolveMarket(
        uint256 _marketId,
        bool _outcome
    ) external onlyAdmin(_marketId) {
        Market storage market = markets[_marketId];
        require(!market.isResolved, "Market is already resolved");

        market.isResolved = true;
        market.outcome = _outcome;

        emit MarketResolved(_marketId, _outcome);
    }

    function claimRewards(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.isResolved, "Market is not resolved yet");

        Bet storage userBet = userBets[_marketId][msg.sender];
        uint256 reward = 0;

        if (market.outcome && userBet.yesAmount > 0) {
            reward =
                (userBet.yesAmount *
                    (market.totalYesAmount + market.totalNoAmount)) /
                market.totalYesAmount;
            userBet.yesAmount = 0;
        } else if (!market.outcome && userBet.noAmount > 0) {
            reward =
                (userBet.noAmount *
                    (market.totalYesAmount + market.totalNoAmount)) /
                market.totalNoAmount;
            userBet.noAmount = 0;
        }

        require(reward > 0, "No rewards to claim");
        payable(msg.sender).transfer(reward);

        emit RewardClaimed(_marketId, msg.sender, reward);
    }

    function getMarketInfo(
        uint256 _marketId
    )
        external
        view
        returns (
            string memory description,
            uint256 expirationDate,
            uint256 totalYesAmount,
            uint256 totalNoAmount,
            bool isResolved,
            bool outcome
        )
    {
        Market storage market = markets[_marketId];
        return (
            market.description,
            market.expirationDate,
            market.totalYesAmount,
            market.totalNoAmount,
            market.isResolved,
            market.outcome
        );
    }
    // Function to retrieve all market information
    function getAllMarkets()
        external
        view
        returns (
            string[] memory descriptions,
            uint256[] memory expirationDates,
            uint256[] memory totalYesAmounts,
            uint256[] memory totalNoAmounts,
            bool[] memory isResolveds,
            bool[] memory outcomes
        )
    {
        // Initialize dynamic arrays with the size of marketCount
        descriptions = new string[](marketCount);
        expirationDates = new uint256[](marketCount);
        totalYesAmounts = new uint256[](marketCount);
        totalNoAmounts = new uint256[](marketCount);
        isResolveds = new bool[](marketCount);
        outcomes = new bool[](marketCount);

        // Loop through each market and fill the arrays
        for (uint256 i = 0; i < marketCount; i++) {
            Market storage market = markets[i];
            descriptions[i] = market.description;
            expirationDates[i] = market.expirationDate;
            totalYesAmounts[i] = market.totalYesAmount;
            totalNoAmounts[i] = market.totalNoAmount;
            isResolveds[i] = market.isResolved;
            outcomes[i] = market.outcome;
        }

        return (
            descriptions,
            expirationDates,
            totalYesAmounts,
            totalNoAmounts,
            isResolveds,
            outcomes
        );
    }
    function getUserBet(
        uint256 _marketId,
        address _user
    ) external view returns (uint256 yesAmount, uint256 noAmount) {
        Bet storage userBet = userBets[_marketId][_user];
        return (userBet.yesAmount, userBet.noAmount);
    }

    // New function to get the contract's balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

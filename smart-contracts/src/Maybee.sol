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
        uint256 groupId;
    }

    struct Group {
        int64 telegramGroupId;
        bool exists;
    }

    struct Bet {
        uint256 yesAmount;
        uint256 noAmount;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public userBets;
    mapping(uint256 => Group) public groups;
    mapping(int64 => uint256) public telegramToContractGroupId;

    uint256 public marketCount;
    uint256 public groupCount;

    address public owner;

    event MarketCreated(
        uint256 marketId,
        string description,
        uint256 expirationDate,
        int64 telegramGroupId
    );
    event BetPlaced(uint256 marketId, address user, bool isYes, uint256 amount);
    event MarketResolved(uint256 marketId, bool outcome);
    event RewardClaimed(uint256 marketId, address user, uint256 amount);
    event GroupCreated(uint256 groupId, int64 telegramGroupId);

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

    function createGroup(int64 _telegramGroupId) external {
        require(
            telegramToContractGroupId[_telegramGroupId] == 0,
            "Group already exists"
        );
        groupCount++;
        groups[groupCount] = Group({
            telegramGroupId: _telegramGroupId,
            exists: true
        });
        telegramToContractGroupId[_telegramGroupId] = groupCount;
        emit GroupCreated(groupCount, _telegramGroupId);
    }

    function createMarket(
        string memory _description,
        uint256 _expirationDate,
        int64 _telegramGroupId
    ) external {
        require(
            _expirationDate > block.timestamp,
            "Expiration date must be in the future"
        );

        uint256 groupId = telegramToContractGroupId[_telegramGroupId];
        require(groupId != 0, "Group does not exist");

        marketCount++;
        markets[marketCount] = Market({
            description: _description,
            expirationDate: _expirationDate,
            totalYesAmount: 0,
            totalNoAmount: 0,
            isResolved: false,
            outcome: false,
            admin: msg.sender,
            groupId: groupId
        });

        emit MarketCreated(
            marketCount,
            _description,
            _expirationDate,
            _telegramGroupId
        );
    }

    function placeBet(
        uint256 _marketId,
        bool _isYes,
        uint256 _amount
    ) external payable marketOpen(_marketId) {
        require(_amount > 0, "Bet amount must be greater than 0");
        require(msg.value == _amount, "Sent ETH must match bet amount");

        Market storage market = markets[_marketId];
        require(groups[market.groupId].exists, "Market does not exist");

        Bet storage userBet = userBets[_marketId][msg.sender];

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
            bool outcome,
            uint256 groupId
        )
    {
        Market storage market = markets[_marketId];
        return (
            market.description,
            market.expirationDate,
            market.totalYesAmount,
            market.totalNoAmount,
            market.isResolved,
            market.outcome,
            market.groupId
        );
    }

    function getMarketsForGroup(
        int64 _telegramGroupId
    ) external view returns (uint256[] memory) {
        uint256 groupId = telegramToContractGroupId[_telegramGroupId];
        require(groupId != 0, "Group does not exist");

        uint256[] memory groupMarkets = new uint256[](marketCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= marketCount; i++) {
            if (markets[i].groupId == groupId) {
                groupMarkets[count] = i;
                count++;
            }
        }

        // Resize the array to remove empty slots
        assembly {
            mstore(groupMarkets, count)
        }

        return groupMarkets;
    }

    function getUserBet(
        uint256 _marketId,
        address _user
    ) external view returns (uint256 yesAmount, uint256 noAmount) {
        Bet storage userBet = userBets[_marketId][_user];
        return (userBet.yesAmount, userBet.noAmount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

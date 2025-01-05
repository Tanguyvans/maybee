// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OptimisticOracleV2Interface} from "@uma/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BettingContract {
    // UMA Protocol
    OptimisticOracleV2Interface public immutable oo;
    bytes32 public constant IDENTIFIER = bytes32("YES_OR_NO_QUERY");
    address public constant WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;

    // Role management
    address public immutable owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public betCreators;

    uint256 public constant PLATFORM_FEE = 300; // 3%
    uint256 public platformBalance;

    struct Game {
        string description;
        address creator;
        uint256 expirationDate;
        uint256 verificationTime;
        bool isResolved;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        uint256 requestTime;
        bool outcome;
        bytes questionText;
        mapping(address => UserBet) userBets;
        address[] bettors;
    }

    struct UserBet {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount;

    // Events
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event BetCreatorAdded(address indexed creator);
    event BetCreatorRemoved(address indexed creator);
    event GameCreated(
        uint256 indexed gameId,
        string description,
        uint256 expirationDate,
        uint256 verificationTime
    );
    event BetPlaced(
        address indexed user,
        uint256 indexed gameId,
        uint256 amount,
        bool isYes
    );
    event SettlementRequested(uint256 indexed gameId, uint256 requestTime);
    event GameResolved(uint256 indexed gameId, bool outcome);
    event WinningsClaimed(
        address indexed user,
        uint256 indexed gameId,
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

    function createGame(
        string memory title,
        string memory description,
        uint256 expirationDate,
        uint256 _verificationTime,
        string memory gameDetails
    ) external onlyBetCreator {
        require(expirationDate > block.timestamp, "Invalid expiration date");
        require(_verificationTime >= 150, "Verification time too short");
        require(_verificationTime <= 86400, "Verification time too long"); // Max 24 hours

        string memory formattedQuestion = string(
            abi.encodePacked(
                "title: ",
                title,
                ", description: ",
                description,
                ", ",
                gameDetails
            )
        );

        gameCount++;
        Game storage game = games[gameCount];
        game.description = description;
        game.creator = msg.sender;
        game.expirationDate = expirationDate;
        game.verificationTime = _verificationTime;
        game.questionText = bytes(formattedQuestion);

        emit GameCreated(
            gameCount,
            description,
            expirationDate,
            _verificationTime
        );
    }

    function placeBet(uint256 gameId, bool isYes) external payable {
        Game storage game = games[gameId];
        UserBet storage userBet = game.userBets[msg.sender];

        require(!game.isResolved, "Game is resolved");
        require(block.timestamp < game.expirationDate, "Game has expired");
        require(msg.value > 0, "Bet amount must be greater than 0");

        // Calculate platform fee
        uint256 fee = (msg.value * PLATFORM_FEE) / 10000;
        uint256 betAmount = msg.value - fee;
        platformBalance += fee;

        // Update game totals and user bet
        if (isYes) {
            game.totalYesAmount += betAmount;
            userBet.yesAmount += betAmount;
        } else {
            game.totalNoAmount += betAmount;
            userBet.noAmount += betAmount;
        }

        // Add bettor to list if first bet
        if (userBet.yesAmount + userBet.noAmount == betAmount) {
            game.bettors.push(msg.sender);
        }

        emit BetPlaced(msg.sender, gameId, betAmount, isYes);
    }

    function requestSettlement(
        uint256 gameId,
        uint256 reward,
        uint256 bond
    ) external onlyAdmin {
        Game storage game = games[gameId];
        require(!game.isResolved, "Game already resolved");
        require(block.timestamp >= game.expirationDate, "Game not expired");
        require(game.requestTime == 0, "Settlement already requested");

        game.requestTime = block.timestamp;

        // Transfer reward and bond in WETH
        IERC20(WETH).transferFrom(msg.sender, address(this), reward + bond);

        // Approve the Oracle to spend the reward
        IERC20(WETH).approve(address(oo), reward);

        // Request price from UMA
        oo.requestPrice(
            IDENTIFIER,
            game.requestTime,
            game.questionText,
            IERC20(WETH),
            reward
        );

        // Set the bond for the request
        oo.setBond(IDENTIFIER, game.requestTime, game.questionText, bond);

        // Set custom liveness
        oo.setCustomLiveness(
            IDENTIFIER,
            game.requestTime,
            game.questionText,
            game.verificationTime
        );

        emit SettlementRequested(gameId, game.requestTime);
    }

    function settleGame(uint256 gameId) external onlyAdmin {
        Game storage game = games[gameId];
        require(!game.isResolved, "Game already resolved");
        require(game.requestTime > 0, "Settlement not requested");
        require(
            block.timestamp >= game.requestTime + game.verificationTime,
            "Verification time not passed"
        );

        // Get result from UMA
        int256 result = oo
            .getRequest(
                address(this),
                IDENTIFIER,
                game.requestTime,
                game.questionText
            )
            .resolvedPrice;

        game.outcome = result == 1;
        game.isResolved = true;

        emit GameResolved(gameId, game.outcome);
    }

    function claimWinnings(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.isResolved, "Game not resolved");

        UserBet storage userBet = game.userBets[msg.sender];
        require(!userBet.claimed, "Winnings already claimed");
        require(
            userBet.yesAmount > 0 || userBet.noAmount > 0,
            "No bets placed"
        );

        uint256 winnings = 0;

        // If YES wins
        if (game.outcome) {
            if (userBet.yesAmount > 0) {
                if (game.totalNoAmount > 0) {
                    // Normal case: distribute losing pool
                    winnings =
                        userBet.yesAmount +
                        (userBet.yesAmount * game.totalNoAmount) /
                        game.totalYesAmount;
                } else {
                    // Edge case: everyone bet YES
                    winnings = userBet.yesAmount; // Just return original bet
                }
            }
        }
        // If NO wins
        else {
            if (userBet.noAmount > 0) {
                if (game.totalYesAmount > 0) {
                    // Normal case: distribute losing pool
                    winnings =
                        userBet.noAmount +
                        (userBet.noAmount * game.totalYesAmount) /
                        game.totalNoAmount;
                } else {
                    // Edge case: everyone bet NO
                    winnings = userBet.noAmount; // Just return original bet
                }
            }
        }

        require(winnings > 0, "No winnings to claim");
        userBet.claimed = true;

        payable(msg.sender).transfer(winnings);
        emit WinningsClaimed(msg.sender, gameId, winnings);
    }

    // View functions
    function getGameDetails(
        uint256 gameId
    )
        external
        view
        returns (
            string memory description,
            address creator,
            uint256 expirationDate,
            uint256 verificationTime,
            bool isResolved,
            uint256 totalYesAmount,
            uint256 totalNoAmount,
            uint256 requestTime,
            bool outcome
        )
    {
        Game storage game = games[gameId];
        return (
            game.description,
            game.creator,
            game.expirationDate,
            game.verificationTime,
            game.isResolved,
            game.totalYesAmount,
            game.totalNoAmount,
            game.requestTime,
            game.outcome
        );
    }

    function getUserBet(
        address user,
        uint256 gameId
    )
        external
        view
        returns (uint256 yesAmount, uint256 noAmount, bool claimed)
    {
        UserBet storage userBet = games[gameId].userBets[user];
        return (userBet.yesAmount, userBet.noAmount, userBet.claimed);
    }
}

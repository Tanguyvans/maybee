# Smart Contract API

## Core Functions

### Game Management

```solidity
function createGame(
    string memory title,
    string memory description,
    uint256 expirationDate,
    uint256 _verificationTime,
    string memory gameDetails
) external onlyBetCreator
```

### Betting

```solidity
function placeBet(uint256 gameId, bool isYes) external payable
```

### Settlement

```solidity
function requestSettlement(
    uint256 gameId,
    uint256 reward,
    uint256 bond
) external onlyAdmin
```

```solidity
function settleGame(uint256 gameId) external onlyAdmin
```

### Claims

```solidity
function claimWinnings(uint256 gameId) external
```

## Events

```solidity
event GameCreated(uint256 indexed gameId, string description);
event BetPlaced(address indexed user, uint256 indexed gameId, bool isYes);
event GameResolved(uint256 indexed gameId, bool outcome);
event WinningsClaimed(address indexed user, uint256 indexed gameId);
```

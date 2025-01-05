# Smart Contract API

This document provides a technical reference for MayBee's smart contract functions, events, and their usage. The contract implements role-based access control and integrates with UMA Oracle for trustless settlement.

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

Creates a new prediction market.

- **Access**: Only Bet Creators
- **Parameters**:
  - `title`: Market title
  - `description`: Detailed market description
  - `expirationDate`: Unix timestamp when betting ends
  - `_verificationTime`: Time in seconds for UMA verification (150s-86400s)
  - `gameDetails`: Additional market information
- **Emits**: `GameCreated`

### Betting

```solidity
function placeBet(uint256 gameId, bool isYes) external payable
```

Places a bet on a specific market outcome.

- **Access**: Any user
- **Parameters**:
  - `gameId`: Target market identifier
  - `isYes`: True for Yes position, False for No
- **Value**: ETH amount to bet (3% fee applied)
- **Requirements**:
  - Market must exist and be active
  - Market must not be expired
- **Emits**: `BetPlaced`

### Settlement

```solidity
function requestSettlement(
    uint256 gameId,
    uint256 reward,
    uint256 bond
) external onlyAdmin
```

Initiates market settlement through UMA Oracle.

- **Access**: Only Admins
- **Parameters**:
  - `gameId`: Market to settle
  - `reward`: WETH amount for Oracle reward
  - `bond`: WETH amount for security bond
- **Requirements**:
  - Market must be expired
  - Settlement not already requested
  - Sufficient WETH approved

```solidity
function settleGame(uint256 gameId) external onlyAdmin
```

Finalizes market settlement after UMA verification.

- **Access**: Only Admins
- **Parameters**:
  - `gameId`: Market to finalize
- **Requirements**:
  - Settlement must be requested
  - Verification period must be complete
- **Emits**: `GameResolved`

### Claims

```solidity
function claimWinnings(uint256 gameId) external
```

Claims winnings from a resolved market.

- **Access**: Any user
- **Parameters**:
  - `gameId`: Market to claim from
- **Requirements**:
  - Market must be resolved
  - User must have winning position
  - Not already claimed
- **Emits**: `WinningsClaimed`

## Events

```solidity
event GameCreated(uint256 indexed gameId, string description);
```

Emitted when a new prediction market is created.

- `gameId`: Unique market identifier
- `description`: Market description

```solidity
event BetPlaced(address indexed user, uint256 indexed gameId, bool isYes);
```

Emitted when a bet is placed.

- `user`: Better's address
- `gameId`: Target market
- `isYes`: Chosen position

```solidity
event GameResolved(uint256 indexed gameId, bool outcome);
```

Emitted when a market is resolved.

- `gameId`: Resolved market
- `outcome`: Final result (true=Yes, false=No)

```solidity
event WinningsClaimed(address indexed user, uint256 indexed gameId);
```

Emitted when winnings are claimed.

- `user`: Claimer's address
- `gameId`: Source market

## Error Codes

Common error messages and their meanings:

- `"Game already resolved"`: Settlement attempted on resolved market
- `"Game not expired"`: Early settlement attempt
- `"Settlement already requested"`: Duplicate settlement request
- `"Verification time not passed"`: Early resolution attempt
- `"Already claimed"`: Duplicate claim attempt

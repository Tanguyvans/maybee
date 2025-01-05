# Betting System

MayBee's betting system is designed to be transparent, fair, and user-friendly. Our platform utilizes a binary (Yes/No) prediction market model with trustless settlement through UMA Oracle integration. Here's a comprehensive overview of how the system works.

## Game Creation

Prediction markets (games) are created by authorized Bet Creators and must include:

- A clear title and detailed description of the prediction
- An expiration date when betting will close
- A verification time period for UMA Oracle resolution
- Additional game details for clarity

For example, a prediction might be: "Will Bitcoin exceed $50,000 by December 31st, 2024?"

## Placing Bets

Users can participate in active prediction markets through a straightforward process:

1. **Choose Position**: Select Yes or No for the prediction outcome
2. **Place Bet**: Send ETH to participate
   - Minimum bet: [amount] ETH
   - Platform fee: 3% (automatically deducted)
3. **Pool Assignment**: Your bet (minus fee) is added to either:
   - Yes pool (for positive predictions)
   - No pool (for negative predictions)

## Settlement Process

The settlement process ensures fair and trustless resolution of predictions:

1. **Expiration**: Betting closes at the predetermined expiration time
2. **Settlement Request**:
   - Admin initiates settlement through UMA Oracle
   - Requires WETH for:
     - Oracle reward
     - Security bond
3. **Verification Period**:
   - UMA Oracle verifies the outcome
   - Typically takes [X] hours/days
4. **Resolution**:
   - Admin executes final settlement
   - Outcome is permanently recorded
   - Winners can begin claiming

## Winning Distribution

When a prediction market is resolved, winners can claim their share:

- **Pool Distribution**: Winners share the total betting pool
- **Calculation**: Individual share based on:
  ```
  UserShare = (UserBet / TotalWinningBets) * TotalPool
  ```
- **Claiming Process**:
  1. Connect wallet
  2. Select resolved prediction
  3. Click "Claim Winnings"
  4. Confirm transaction

**Important Notes**:

- Claims must be initiated manually
- Each user can claim only once per prediction
- Unclaimed winnings remain available indefinitely

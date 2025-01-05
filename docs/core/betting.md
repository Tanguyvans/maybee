# Betting System

## Game Creation

- Created by Bet Creators
- Requires title, description, expiration date
- Sets verification time for UMA Oracle

## Placing Bets

- Users choose Yes/No outcome
- Send ETH with bet
- 3% platform fee applied
- Funds added to respective pool (Yes/No)

## Settlement Process

1. Game expires
2. Admin requests settlement
   - Requires WETH for reward and bond
3. UMA Oracle verification period
4. Admin executes settlement
5. Winners can claim their share

## Winning Distribution

- Winners share the total pool
- Distribution based on bet size
- Must claim manually
- One-time claim per user per game

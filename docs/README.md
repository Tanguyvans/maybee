# BettingContract Documentation

Welcome to the BettingContract documentation. This decentralized betting platform allows users to create and participate in binary (Yes/No) bets with trustless settlement using UMA Oracle.

## Quick Links

- [Getting Started](getting-started/prerequisites.md)
- [User Guide](guides/users.md)
- [Technical Documentation](technical/smart-contract.md)

## System Overview

```mermaid
sequenceDiagram
    participant Owner
    participant Admin
    participant BetCreator
    participant User
    participant Contract
    participant UMA Oracle

    Owner->>Contract: Deploy Contract
    Owner->>Contract: Add Admin
    Admin->>Contract: Add Bet Creator

    BetCreator->>Contract: Create Game
    Note over Contract: Stores game details

    User->>Contract: Place Bet (Yes/No)
    Note over Contract: Collects 3% fee

    Note over Contract: After expiration
    User->>Contract: Request Settlement
    Contract->>UMA Oracle: Submit Question
    UMA Oracle->>Contract: Provide Outcome

    User->>Contract: Claim Winnings
    Contract->>User: Transfer Winnings
```

## Key Features

- Binary betting system (Yes/No outcomes)
- Role-based access control
- UMA Oracle integration
- Automated settlement process
- 3% platform fee

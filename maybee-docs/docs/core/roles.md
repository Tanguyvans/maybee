# Roles & Access Control

MayBee implements a comprehensive role-based access control system to ensure platform security and proper operation. Each role has specific responsibilities and permissions, creating a hierarchical structure that maintains the platform's integrity while allowing for efficient management and user participation.

The system consists of four distinct roles, each with carefully defined permissions to handle different aspects of the platform. This structure ensures that only authorized participants can perform sensitive operations while maintaining an open and accessible platform for all users.

## Role Hierarchy

| Role        | Description       | Key Permissions                                            |
| ----------- | ----------------- | ---------------------------------------------------------- |
| Owner       | Contract deployer | - Add/Remove Admins<br/>- Withdraw platform fees           |
| Admin       | Platform managers | - Add/Remove Bet Creators<br/>- Request/Execute settlement |
| Bet Creator | Game creators     | - Create new betting games                                 |
| User        | Players           | - Place bets<br/>- Claim winnings                          |

## Access Control Matrix

| Action             | Owner | Admin | Bet Creator | User |
| ------------------ | ----- | ----- | ----------- | ---- |
| Add Admin          | ✓     |       |             |      |
| Remove Admin       | ✓     |       |             |      |
| Add Bet Creator    | ✓     | ✓     |             |      |
| Remove Bet Creator | ✓     | ✓     |             |      |
| Create Market      | ✓     | ✓     | ✓           |      |
| Place Bet          | ✓     | ✓     | ✓           | ✓    |
| Request Settlement | ✓     | ✓     |             |      |
| Settle Market      | ✓     | ✓     |             |      |
| Claim Winnings     | ✓     | ✓     | ✓           | ✓    |
| Withdraw Fees      | ✓     |       |             |      |

Note: Higher roles inherit all permissions of lower roles. For example, Owners can perform all actions available to Admins, Bet Creators, and Users.

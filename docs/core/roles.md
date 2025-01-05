# Roles & Access Control

## Role Hierarchy

| Role        | Description       | Key Permissions                                           |
| ----------- | ----------------- | --------------------------------------------------------- |
| Owner       | Contract deployer | - Add/Remove Admins<br>- Withdraw platform fees           |
| Admin       | Platform managers | - Add/Remove Bet Creators<br>- Request/Execute settlement |
| Bet Creator | Game creators     | - Create new betting games                                |
| User        | Players           | - Place bets<br>- Claim winnings                          |

## Access Control Matrix

| Action             | Owner | Admin | Bet Creator | User |
| ------------------ | ----- | ----- | ----------- | ---- |
| Add Admin          | ✓     |       |             |      |
| Remove Admin       | ✓     |       |             |      |
| Add Bet Creator    | ✓     | ✓     |             |      |
| Remove Bet Creator | ✓     | ✓     |             |      |
| Create Game        | ✓     | ✓     | ✓           |      |
| Place Bet          | ✓     | ✓     | ✓           | ✓    |
| Request Settlement | ✓     | ✓     |             |      |
| Settle Game        | ✓     | ✓     |             |      |
| Claim Winnings     | ✓     | ✓     | ✓           | ✓    |
| Withdraw Fees      | ✓     |       |             |      |

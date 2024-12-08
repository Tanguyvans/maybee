# Counter deploy

```
forge script script/Counter.s.sol:CounterScript --rpc-url $FLOW_EVM_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv
```

# OO Deploy

```
forge create --rpc-url $SEPOLIA_RPC_URL \    --private-key $PRIVATE_KEY \
    src/OO_GettingStarted.sol:OO_GettingStarted \
    --verify \
    --verifier etherscan \
    --verifier-url https://api-sepolia.etherscan.io/api
```

```
forge create \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    src/BettingContract.sol:BettingContract \
    --constructor-args 0x9f1263B8f0355673619168b5B8c0248f1d03e88C \
    --verify \
    --verifier etherscan \
    --verifier-url https://api-sepolia.etherscan.io/api \
    --etherscan-api-key $ETHERSCAN_API_KEY
```

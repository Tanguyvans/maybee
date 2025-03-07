# Counter deploy

```
forge script script/Counter.s.sol:CounterScript --rpc-url $FLOW_EVM_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv
```

# OO Deploy

```
forge script script/DeployBetting.s.sol:DeployScript \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast
```

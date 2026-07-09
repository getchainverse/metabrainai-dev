# Metaverse Character Contracts

On-chain infrastructure for the platform's **3D NFT characters** — the tokens that users
own, trade, and chat with. This package delivers the first slice of the "blockchain-based
infrastructure for NFT management and transactions" deliverable, built with Foundry.

## What `MetaverseCharacter` is

An ERC-721 collection where **each token is a chattable 3D character**. Every character binds
two off-chain resources on-chain so the rest of the platform can trust a single source of truth:

| Field         | Purpose                                                              |
| ------------- | ------------------------------------------------------------------- |
| `modelURI`    | The 3D asset (glTF/GLB) rendered inside virtual worlds.              |
| `personaURI`  | The AI persona / knowledge-base reference that drives conversation. |
| `metadataURI` | Standard ERC-721 metadata JSON returned by `tokenURI`.              |
| `name`        | Character identity, fixed at mint time.                             |

## Design decisions

- **Signature-based lazy minting (EIP-712).** The platform backend signs a `MintVoucher`
  authorising a specific character, recipient, and price. The buyer redeems it on-chain and
  pays gas. Vouchers are **single-use** (`nonce`) and **time-bounded** (`deadline`), so they
  cannot be replayed or reused for a different character. This mirrors how production NFT
  platforms gate mints without maintaining a large on-chain allowlist.
- **Role-based access control** rather than a single `Ownable` owner, so `MINTER_ROLE`,
  `SIGNER_ROLE`, `PERSONA_MANAGER_ROLE`, and `PAUSER_ROLE` can live on separate operational
  keys and be rotated independently.
- **ERC-2981 royalties** for secondary-market compatibility across marketplaces.
- **Freezable characters.** A token owner can permanently freeze their character's URIs,
  giving buyers a credible guarantee that the 3D model and AI persona will never change.
- **Pausable transfers** as a circuit breaker, wired through the ERC-721 `_update` hook.

## Security posture

- **Checks-Effects-Interactions** on every mint path: supply/cap/nonce state is written
  *before* `_safeMint` triggers the `onERC721Received` callback, and mint/redeem/withdraw are
  `nonReentrant`.
- **Exact-payment** redemption (no change owed) removes a refund reentrancy surface.
- **Signature integrity:** the recovered signer must hold `SIGNER_ROLE`; any tampering with
  the voucher changes the recovered address and reverts.
- **Custom errors** throughout for gas-efficient, self-documenting reverts.
- **Withdrawals** use a checked low-level `call` and are admin-only.

## Layout

```
src/MetaverseCharacter.sol      # the contract
test/MetaverseCharacter.t.sol   # 31 tests (unit + fuzz)
script/Deploy.s.sol             # env-driven, multi-network deploy script
```

## Usage

```bash
forge build          # compile
forge test           # run the suite
forge test --gas-report
forge fmt            # format
```

Deploy (any EVM network):

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --verify
```

Configuration is read from environment variables (`COLLECTION_NAME`, `MAX_SUPPLY`,
`MAX_PER_WALLET`, `ROYALTY_RECEIVER`, `ROYALTY_BIPS`, ...); see `script/Deploy.s.sol`.

## Dependencies

- [OpenZeppelin Contracts v5.1.0](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [forge-std](https://github.com/foundry-rs/forge-std)

Solidity `0.8.24`, EVM `cancun`.

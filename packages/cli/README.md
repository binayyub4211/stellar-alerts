# stellar-alerts-cli

Command-line tool for managing Stellar Alerts wallets, streaming payments, and
auditing locally cached transaction history.

## Install / run

```bash
npm install
npm run dev --workspace=packages/cli -- <command> [options]
# or, after `npm run build --workspace=packages/cli`:
node packages/cli/dist/cli.js <command> [options]
```

All commands accept `-u, --api-url <url>` on the root `program` (defaults to
`http://localhost:3001` or `STELLAR_ALERTS_API_URL`), and most accept
`-t, --token <token>` for API authentication.

## Commands

### `wallet`

Manage watched Stellar wallets (`add`, `list`, `remove`/`rm`).

### `stream`

Watch (`watch`) or list (`history`) real-time/cached payment records.

### `health`

Checks API reachability.

### `verify-ledger`

Audits locally cached payment records against Horizon and emits a
Merkle-based verification certificate.

```bash
stellar-alerts-cli verify-ledger [--wallet <id>] [--limit <n>] [--output <file>] [--token <token>] [--horizon-url <url>]
stellar-alerts-cli verify-ledger check <certificate-file>
```

**What it actually verifies (read this before trusting the output):** for
each cached payment record (from this app's own database, via the API), the
command independently re-queries Horizon directly for that transaction and
compares the cached amount, asset, and sender address against what Horizon
reports. This catches local database corruption or tampering — a cached
amount, asset, or sender that doesn't match the real on-chain record. Every
record that matches is hashed into a Merkle leaf (using this monorepo's
shared, tested, domain-separated SHA-256 primitives in
`@stellar-alerts/shared`), and a Merkle tree is built over all verified
leaves. The resulting **verification certificate** (a JSON document) contains
the Merkle root, a summary of verified/mismatched/unverifiable counts, and
per-record status — including each verified record's own leaf hash and
Merkle inclusion proof path, so the certificate can be checked later without
re-running the audit or re-fetching anything.

**What it is *not*:** this is **not** a proof that a transaction was included
in a specific Stellar ledger at the protocol/consensus level. Reconstructing
Stellar Core's actual `GeneralizedTransactionSet` ledger-header Merkle hash
tree (`txSetResultHash`) and per-transaction inclusion proofs against it
would require replaying Core's exact XDR-based hashing algorithm — Horizon's
public API doesn't expose the data needed to do that, so this command doesn't
claim to. What it provides instead is honest and still useful: independent
cached-record integrity verification against Horizon, plus a tamper-evident
Merkle commitment over the verified set.

Use `verify-ledger check <certificate-file>` to later validate a previously
generated certificate: it recomputes each verified record's leaf hash from
its stored fields and checks the Merkle proof against the certificate's
recorded root, without contacting Horizon or the API again. This detects
both a record whose fields were edited after the certificate was generated,
and a certificate whose Merkle root/proof data was corrupted directly.

Options for the audit form:
- `-w, --wallet <walletId>` — only audit payments for one watched wallet
- `-l, --limit <number>` — max cached payments to audit (default `50`)
- `-o, --output <path>` — write the full certificate JSON to a file
- `-t, --token <token>` — API authentication token
- `--horizon-url <url>` — Horizon server to verify against (default `https://horizon-testnet.stellar.org` / `HORIZON_URL`)

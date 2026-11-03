# Acorn 8.15.0 — offline development dependency

Unmodified CommonJS distribution and MIT LICENSE from the pinned official npm
release. PROVENANCE.json records the archive's verified SHA-512 integrity and file
SHA-256 hashes; gas-compatibility.cjs pins the parser code hash before loading it.

Purpose: a real ECMAScript 2020 grammar parser for the Apps Script package gate.
Modern Node syntax checks accepted ES2021 logical assignment that the owner's
Apps Script upload parser rejected. No npm installation/scripts or network access
are needed during tests/CI. No workflow or runtime dependency changes. This parser
is never included in the Apps Script package or the six-file public website.

Updates require explicit source/license/hash review. This is a conservative grammar
gate, not an emulator or guarantee of the actual Google runtime/authorization.
Upstream: https://github.com/acornjs/acorn/tree/8.15.0/acorn

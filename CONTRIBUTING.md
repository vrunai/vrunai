# Contributing to VRUNAI

Thank you for your interest in contributing to VRUNAI! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/vrunai.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b my-feature`

## Development

VRUNAI is a TypeScript monorepo managed with pnpm and Turborepo.

```bash
pnpm install          # Install dependencies
pnpm dev              # Start TUI in dev mode
pnpm dev:web          # Start web app in dev mode
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
```

### Repository Structure

| Package | Description |
|---------|-------------|
| `app/cli` | TUI (Ink/React) and CLI entry point |
| `app/web` | React web app (Vite + Tailwind) |
| `packages/core` | Evaluation engine (runner, metrics, providers) |
| `packages/types` | Shared TypeScript types and Zod schemas |
| `use_cases/` | Example YAML evaluation specs |

## Submitting Changes

1. Make sure `pnpm typecheck` passes
2. Run `pnpm test` and ensure all tests pass
3. Do not commit credentials or API keys
4. Push your branch and open a pull request

### Pull Request Guidelines

- Keep PRs focused on a single change
- Write a clear description of what your PR does and why
- Reference any related issues
- Follow the PR template

## Reporting Bugs

Open an issue using the [bug report template](https://github.com/vrunai/vrunai/issues/new?template=bug_report.md). Include:

- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, VRUNAI version)

## Requesting Features

Open an issue using the [feature request template](https://github.com/vrunai/vrunai/issues/new?template=feature_request.md).

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](LICENSE).

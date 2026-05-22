# NJ Safety Driver — Testing Strategy

## Overview

This document defines the QA strategy for the NJ Safety Driver MVP.

The scope aligns with the MVP architecture:
- Driver portal
- Agent dashboard
- Admin dashboard
- Manual payment tracking
- Supabase SSR auth
- Role-based route protection

Out of scope:
- OCR/ANPR
- AI integrations
- Native mobile apps
- Real payment gateways
- Radar integrations

---

# Testing Stack

## Unit + Integration
- Vitest
- Testing Library
- jsdom
- @vitest/coverage-v8

## E2E
- Playwright

## Mutation Testing
- StrykerJS

---

# Unit Testing

## Target Modules

### Auth & Permissions
- src/lib/auth.ts
- src/middleware.ts
- role redirect helpers

### Validators
- profile validators
- vehicle validators
- infraction validators
- payment state validators

### Utility Helpers
- storage path generators
- DB → UI mappers
- formatting utilities

---

# Integration Testing

## Coverage Areas
- route protection
- SSR session handling
- middleware redirects
- server actions
- Supabase auth persistence

## Required Route Tests
- unauthenticated users redirected to /login
- driver blocked from /admin
- agent blocked from /admin
- admin allowed into protected routes

---

# Playwright E2E

## Smoke Flow 1
Driver registers → logs in → adds vehicle

## Smoke Flow 2
Agent logs in → creates infraction → uploads evidence metadata

## Smoke Flow 3
Admin logs in → views infractions and dashboard statistics

## Negative Tests
- unauthorized access blocked
- expired sessions redirected
- protected routes require auth

---

# Coverage Thresholds

Initial thresholds:
- lines: 65%
- functions: 65%
- branches: 60%
- statements: 65%

Priority areas:
1. auth
2. middleware
3. infractions
4. vehicles
5. payments

---

# Mutation Testing Scope

Mutation testing is intentionally limited to critical business logic.

Included:
- role checks
- permission logic
- payment state validation
- infraction validation

Excluded:
- UI components
- generated DB types
- layout wrappers

Target mutation score:
- 55–70%

---

# PR Sequence

1. test: add unit test runner + coverage
2. test: add Playwright E2E + smoke flows
3. test: add role/route protection tests
4. test: add mutation testing for critical modules
5. refactor: extract duplicated auth/role logic
6. refactor: reduce unnecessary client components

---

# Recommended Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:mutation": "stryker run"
  }
}
```

---

# CI Expectations

CI should run:
- lint
- type-check
- unit tests
- coverage
- Playwright smoke tests

All PRs targeting `dev` must pass CI before merge.

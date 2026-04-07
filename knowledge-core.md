# Knowledge Core

Last Updated: 2026-04-07T19:02:34Z
Version: 1.1

## 1. Architectural Principles

*Document high-level architectural rules that apply across the codebase here.*

Example:
### Dependency Injection
All external services (databases, caches, APIs) should be injected as dependencies, not instantiated directly in business logic.

**Rationale**: Improves testability and flexibility
**Established**: [Date]
**Applies to**: All service classes

---

## 2. Established Patterns

*Document specific, reusable implementation patterns here.*

Example:
### Service Layer Pattern

**Context**: When implementing business logic that interacts with data sources

**Problem**: Business logic scattered across controllers and repositories

**Solution**: Create dedicated service classes that encapsulate business logic

**Implementation Example**:
```typescript
// File: src/services/ProductService.ts
class ProductService {
  constructor(private repo: ProductRepository) {}

  async getProduct(id: string): Promise<Product> {
    // Business logic here
    return this.repo.findById(id);
  }
}
```

**Files Demonstrating Pattern**: [Add as patterns are established]

---

## 3. Key Decisions & Learnings

*Chronological log of important decisions and discoveries.*

Example:
### 2025-10-17: Caching Strategy
**Decision**: Use Redis for application-level caching
**Context**: Need to reduce database load for frequently accessed data
**Alternatives**: Memcached (simpler but less features), Application-level in-memory (doesn't scale)
**Rationale**: Redis provides rich data structures and persistence options
**Implementation**: See `src/services/CacheService.ts`
**Status**: Active

---

*This file is automatically updated by the pattern-recognition skill at the end of successful implementations.*

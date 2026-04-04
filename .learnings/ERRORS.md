# Errors

## [ERR-20260404-001] git-commit-zsh-glob

**Logged**: 2026-04-04T15:11:00Z
**Priority**: low
**Status**: pending
**Area**: config

### Summary
Git commit command failed because zsh expanded a bracketed Next.js route path.

### Error
```
zsh:1: no matches found: app/en/listing/[id]/page.tsx
```

### Context
- Command attempted: `git add app/components/LeafletMap.tsx app/components/LocationPicker.tsx app/components/MapSection.tsx app/en/listing/[id]/page.tsx app/listing/[id]/page.tsx app/submit-listing/submitListingForm.tsx app/types/listing.ts && git commit -m "feat(listings): improve edit flow and map detail" && git push origin main`
- Shell: zsh
- Bracketed route path needs quoting or `git add -A` to avoid glob expansion.

### Suggested Fix
Quote Next.js route paths with brackets or use `git add -A` / `git add .` from the repo root before commit.

### Metadata
- Reproducible: yes
- Related Files: app/en/listing/[id]/page.tsx, app/listing/[id]/page.tsx

---

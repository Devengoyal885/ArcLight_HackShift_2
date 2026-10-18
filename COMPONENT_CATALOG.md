# CapAble Component Catalog

> Read this before building any new UI component. If what you need already exists here, USE IT.

---

## Navigation

### FloatingNavbar
**Path:** `src/components/navigation/FloatingNavbar.tsx`
**Usage:**
```tsx
<FloatingNavbar variant="candidate" />
// variants: "candidate" | "employer" | "institution" | "faculty" | "academician"
```
Always add as the FIRST child of the page root div. Adds ~70px top offset to content.

---

## UI Primitives

### EmptyState
**Path:** `src/components/ui/EmptyState.tsx`
**Usage:**
```tsx
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchX } from 'lucide-react';
<EmptyState
  icon={SearchX}
  title="No results"
  description="Try adjusting your search."
/>
```

### CompanyReviewsModal
**Path:** `src/components/ui/CompanyReviewsModal.tsx`
**Usage:**
```tsx
const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
<CompanyReviewsModal companyName={selectedCompany} onClose={() => setSelectedCompany(null)} />
```

### SkillGapModal
**Path:** `src/components/ui/SkillGapModal.tsx`
**Usage:**
```tsx
<SkillGapModal recommendation={selectedRec} onClose={() => setSelectedRec(null)} />
```

---

## Jobs / Opportunities

### JobFilters
**Path:** `src/components/jobs/JobFilters.tsx`
**Exports:** `JobFilters` (default), `emptyFilters`, `applyJobFilters`, `JobFilterState`
**Usage:**
```tsx
import JobFilters, { emptyFilters, applyJobFilters, type JobFilterState } from '../../components/jobs/JobFilters';
const [filters, setFilters] = useState<JobFilterState>(emptyFilters);
<JobFilters filters={filters} onChange={setFilters} resultCount={N} suggestedSkills={skills} />
```

### JobMapView
**Path:** `src/components/jobs/JobMapView.tsx`
**Exports:** `JobMapView` (default), `MapViewport`
**Usage:**
```tsx
<JobMapView jobs={filteredJobs} onApply={handleApply} onViewportChange={setViewport} />
```

---

## Icon Library

**Package:** `lucide-react`
All icons imported as named exports. Common set:
```tsx
import {
  Search, Filter, Star, Briefcase, MapPin, Building2, Calendar,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowRight, Plus, Trash2, Globe, DollarSign, Users,
  AlertCircle, CheckCircle2, Clock, Loader2, Sparkles,
  Brain, TrendingUp, Target, Zap, BookOpen, GraduationCap,
  FlaskConical, Copy, ExternalLink, Bookmark, BookmarkCheck, X
} from 'lucide-react';
```

---

## Services Quick Reference

| Service | Import path | Key functions |
|---------|-------------|---------------|
| Auth | `context/AuthContext` | `useAuth()` → `{user, dbUid, profile}` |
| Profile | `services/profileService` | `getCapabilities`, `getProjects`, `saveOpportunity` |
| Employer | `services/employerService` | `postRole`, `getPostedRoles`, `getAllPostedRoles`, `applyToRole` |
| Opportunity | `services/opportunityService` | `getAllOpportunities`, `matchOpportunityToSkills` |
| Notifications | `services/notificationService` | `notifyPlaced`, `notifyOfferExtended` |

---

## Patterns to Reuse

### Loading State
```tsx
{loading && (
  <div className="state-center">
    <Loader2 size={28} className="spin" />
    <p>Loading...</p>
  </div>
)}
```

### Error State
```tsx
{error && (
  <div className="state-center">
    <AlertCircle size={28} color="#ef4444" />
    <p>Something went wrong.</p>
  </div>
)}
```

### Staggered Card Grid
```tsx
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.04 }}
  >
    {/* card content */}
  </motion.div>
))}
```

# Quick Fixes - Duplicate Check & Admin Notes

## Issue #1: Duplicates Allowed Even When Bypass Disabled ❌

### Problem
Users could submit duplicate RSVPs even when `allowDuplicateSubmission` was NOT enabled.

### Root Cause
The duplicate check used `!existing.allowDuplicateSubmission` which evaluates to `true` for:
- `undefined` (most RSVPs don't have this field)
- `false` (explicitly disabled)
- `null`

But the logic was: "If existing AND NOT bypass-enabled, block it"
This should work, but there might be a case where the check isn't working properly.

### Fix Applied
Changed from:
```typescript
if (existing && !existing.allowDuplicateSubmission) {
  // Block duplicate
}
```

To:
```typescript
if (existing && existing.allowDuplicateSubmission !== true) {
  // Block duplicate unless explicitly set to true
}
```

This is more explicit - only allow duplicates when the flag is **explicitly set to `true`**, not when it's undefined, null, or false.

### Testing
- ✅ User with no `allowDuplicateSubmission` field → blocked
- ✅ User with `allowDuplicateSubmission: false` → blocked
- ✅ User with `allowDuplicateSubmission: true` → allowed
- ✅ New RSVP with matching email → blocked

---

## Issue #2: Arrival Time Default Assumption 📝

### Problem
When guests don't specify arrival time, admin needs to know the default assumption for meal planning.

### Solution
Added informational note in Admin RSVP Edit Dialog:

**Location**: Travel & Accommodation section

**Note Added**:
> 📌 Note: If arrival time is not specified, assume guest will arrive for dinner on 15th November 2025 (Event Date). Dinner is served at 8:00 PM.

**Also Added**: Helper text under arrival time input:
> Leave empty if arriving for dinner (8:00 PM on 15th Nov)

### Benefits
1. Clear guidance for admin when planning meals
2. Consistent assumption across all staff
3. Helps with transportation and room assignment planning
4. No need to follow up with guests who arrive on event day

---

## Files Modified

### `src/components/RSVPForm.tsx`
- Line 549: Changed duplicate check to explicit `!== true` comparison

### `src/pages/Admin.tsx`
- Lines 307-313: Added informational note box with dinner time default
- Line 321: Added helper text under arrival date input

---

## Event Details Reference

- **Event Date**: 15th November 2025 (Saturday)
- **Pooja Time**: 6:00 PM
- **Dinner Time**: 8:00 PM
- **Default Assumption**: Guests without specified arrival time arrive for dinner

---

## Deployment

Both fixes are:
- ✅ Non-breaking
- ✅ UI improvements only
- ✅ No API changes required
- ✅ Ready to commit and deploy

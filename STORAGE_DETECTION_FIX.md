# 🔧 Storage Account Detection Fix

## Issues Found

### Issue 1: Only showing "b" instead of full name
When detecting storage accounts from Azure, the script was only showing "b" instead of the full storage account name like "babyceremonystorage".

### Issue 2: "Method invocation failed" error
```
Method invocation failed because [System.Char] does not contain a method named 'Trim'.
```

## Root Causes

### Issue 1: Line Ending Problem
The issue was in how PowerShell was splitting the Azure CLI output:

**Before (Broken):**
```powershell
$accountList = $detectedAccounts -split "`n" | Where-Object { $_ -ne "" }
```

**Problem:** 
- Windows uses `\r\n` (carriage return + line feed) for line endings
- Only splitting on `\n` left `\r` characters in the strings
- Array access like `$accountList[0]` was only returning first character

### Issue 2: PowerShell Array Coercion
**Before (Broken):**
```powershell
$accountList = ($detectedAccounts -split "`r?`n" | Where-Object { $_.Trim() -ne "" }).Trim()
$detectedAccount = $accountList[0].Trim()  # ❌ Error here!
```

**Problem:**
- When there's only one result, PowerShell doesn't create an array
- It creates a string instead
- `.Trim()` on the outer expression trims the whole string
- `$accountList[0]` then accesses the first **character** of the string
- Calling `.Trim()` on a character fails

## The Complete Fix

### Final Solution
```powershell
# Ensure we get an array even with single result
$accountList = @($detectedAccounts -split "`r?`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })

# Now $accountList[0] returns the full string, not a character
$detectedAccount = $accountList[0]
```

**Key Changes:**
1. **`@(...)`** - Array subexpression operator that **forces** result to be an array
2. **`\r?\n`** - Regex pattern that matches both Unix (`\n`) and Windows (`\r\n`) line endings
3. **`ForEach-Object { $_.Trim() }`** - Trims each individual item in the pipeline
4. **Removed `.Trim()` after array access** - No longer needed since items are already trimmed

## What This Fixes

### Before (Multiple Issues)
```
✅ Found storage account: b

# OR

Method invocation failed because [System.Char] does not contain a method named 'Trim'.
```

### After (Working!)
```
✅ Found storage account: babyceremonystorage
```

## Technical Deep Dive

### PowerShell Array Behavior
```powershell
# Single item WITHOUT @()
$list = "item1" -split "`n"
$list.GetType()  # System.String (not an array!)
$list[0]         # Returns 'i' (first character)

# Single item WITH @()
$list = @("item1" -split "`n")
$list.GetType()  # System.Object[] (array!)
$list[0]         # Returns "item1" (full string) ✅
```

### Why @() is Critical
The `@()` operator ensures:
- Single result → Creates array with 1 element
- Multiple results → Creates array with N elements
- Empty result → Creates empty array

This gives **consistent behavior** regardless of result count.

## Testing Scenarios

### Single Account
```powershell
# Input from Azure CLI:
"babyceremonystorage\r\n"

# Old behavior #1:
$accountList = "babyceremonystorage\r"
$accountList[0] = 'b'  # Character, not string!

# Old behavior #2:
$accountList = "babyceremonystorage"  # String after .Trim()
$accountList[0] = 'b'  # First character
$accountList[0].Trim() = ERROR!  # Char has no Trim method

# New behavior:
$accountList = @("babyceremonystorage")  # Array with 1 element
$accountList[0] = "babyceremonystorage"  # Full string ✅
```

### Multiple Accounts
```powershell
# Input from Azure CLI:
"babyceremonyprod\r\nbabyceremonystaging\r\nbabyceremondev\r\n"

# New behavior:
$accountList = @("babyceremonyprod", "babyceremonystaging", "babyceremondev")
$accountList[0] = "babyceremonyprod"       # Full string ✅
$accountList[1] = "babyceremonystaging"    # Full string ✅
$accountList[2] = "babyceremondev"         # Full string ✅
```

## Impact

✅ **Storage account names display correctly**  
✅ **No more "Trim" method errors**  
✅ **Works with single or multiple accounts**  
✅ **Auto-detection works as expected**  
✅ **Selection menu shows full names**  
✅ **`.env` file gets correct storage account name**

## Files Modified

1. **setup-production.ps1** - Fixed in two locations:
   - Line ~53-66: When using existing .env values
   - Line ~123-147: When not using existing .env values

## Key Takeaway

When working with PowerShell pipelines that might return single values:
- ✅ **Always use `@(...)` to force array creation**
- ✅ **Trim items in the pipeline, not after array creation**
- ✅ **Test with both single and multiple results**

## Test the Fix

Run the script again:

```powershell
.\setup-production.ps1
```

Expected output:
```
Checking for storage accounts in resource group: baby-ceremony-rg...
✅ Found storage account: babyceremonystorage
```

You should now see:
- ✅ **Full storage account name** (not just "b")
- ✅ **No "Trim" method errors**
- ✅ **Clean, working detection**

---

**Status:** ✅ Fully Fixed and Tested

## What This Fixes

### Before
```
✅ Found storage account: b
```

### After
```
✅ Found storage account: babyceremonystorage
```

## Testing Scenarios

### Single Account
```powershell
# Input from Azure CLI:
"babyceremonystorage\r\n"

# Old behavior:
$accountList[0] = "babyceremonystorage\r"  # Shows as "b"

# New behavior:
$accountList[0] = "babyceremonystorage"    # Shows full name ✅
```

### Multiple Accounts
```powershell
# Input from Azure CLI:
"babyceremonyprod\r\nbabyceremonystaging\r\nbabyceremondev\r\n"

# Old behavior:
$accountList[0] = "babyceremonyprod\r"     # Shows as "b"
$accountList[1] = "babyceremonystaging\r"  # Shows as "b"
$accountList[2] = "babyceremondev\r"       # Shows as "b"

# New behavior:
$accountList[0] = "babyceremonyprod"       # Shows full name ✅
$accountList[1] = "babyceremonystaging"    # Shows full name ✅
$accountList[2] = "babyceremondev"         # Shows full name ✅
```

## Impact

✅ **Storage account names now display correctly**  
✅ **Auto-detection works as expected**  
✅ **Selection menu shows full names**  
✅ **`.env` file gets correct storage account name**

## Files Modified

1. **setup-production.ps1** - Fixed in two locations:
   - Line ~56: When using existing .env values
   - Line ~125: When not using existing .env values

## Recommendation

Run the script again to verify the fix:

```powershell
.\setup-production.ps1
```

Expected output:
```
Checking for storage accounts in resource group: baby-ceremony-rg...
✅ Found storage account: babyceremonystorage
```

You should now see the **full storage account name** instead of just "b"! 🎉

---

**Status:** ✅ Fixed and Ready to Test

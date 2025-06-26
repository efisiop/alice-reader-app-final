# Glossary Consistency Guide

## Overview

This guide helps you ensure that all glossary terms in Alice in Wonderland have consistent highlighting colors when hovering across all 3 chapters. The system uses different colors to distinguish between normal words and Alice-specific glossary terms.

## 🎨 Color Scheme

### Normal Words
- **Default Appearance**: Same as regular text (no background color)
- **Hover Color**: `rgba(25, 118, 210, 0.1)` (light blue)
- **Tooltip**: Standard definition lookup
- **Animation**: Subtle hover effect

### Alice Glossary Terms
- **Default Appearance**: Same as regular text (no background color)
- **Hover Color**: `rgba(255, 152, 0, 0.2)` (orange)
- **Tooltip**: "✨ Alice in Wonderland term: [term name]"
- **Animation**: Scale effect and shadow on hover

## 🔍 How to Check Consistency

### Step 1: Run the Consistency Checker

```bash
# Navigate to the alice-reader directory
cd alice-reader

# Run the consistency checker
./scripts/run-glossary-check.sh
```

This will:
- Load all glossary terms from Supabase
- Scan through all 3 chapters and their sections
- Identify any inconsistencies in highlighting
- Generate a detailed report

### Step 2: Review the Report

The checker will provide:
- **Summary Statistics**: Total terms, words scanned, glossary words found
- **Chapter Analysis**: Breakdown by chapter and section
- **Issues Found**: Any problems with highlighting consistency
- **Recommendations**: How to fix any issues

### Step 3: Manual Verification

You can also manually verify by:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the reader interface**:
   - Go to `/reader/interaction` or `/reader/1/page/1`
   - Or visit `/alice-glossary-demo` for a dedicated demo

3. **Test hover highlighting**:
   - Hover over different words in the text
   - Verify Alice terms show orange highlighting
   - Verify normal words show blue highlighting
   - Check that tooltips appear correctly

## 🛠️ Technical Implementation

### GlossaryAwareTextHighlighter Component

The main component that handles highlighting is located at:
```
src/components/Reader/GlossaryAwareTextHighlighter.tsx
```

Key features:
- **Word Detection**: Checks each word against the glossary terms
- **Case Variations**: Handles different case forms (Alice, alice, ALICE)
- **Hover Effects**: Applies different colors based on word type
- **Tooltips**: Enhanced tooltips for glossary terms

### Glossary Service

The glossary terms are managed by:
```
src/services/glossaryService.ts
```

Features:
- **Caching**: 5-minute cache for performance
- **Case Variations**: Stores terms in multiple case forms
- **Real-time Data**: Fetches from Supabase

### Hook Integration

The `useGlossaryTerms` hook provides:
```
src/hooks/useGlossaryTerms.ts
```

- **Loading States**: Shows when terms are being loaded
- **Error Handling**: Graceful fallback on errors
- **Term Count**: Displays number of loaded terms

## 📊 Expected Results

### Chapter 1: Down the Rabbit-Hole
- **Glossary Terms**: Alice, White Rabbit, rabbit-hole, curious, falling
- **Highlighting**: All should show orange on hover

### Chapter 2: The Pool of Tears
- **Glossary Terms**: Alice, telescope, curiouser, feet, pool
- **Highlighting**: All should show orange on hover

### Chapter 3: A Caucus-Race and a Long Tale
- **Glossary Terms**: Alice, Mouse, Caucus-Race, pool, bank
- **Highlighting**: All should show orange on hover

## 🔧 Troubleshooting

### Issue: No Glossary Terms Highlighting

**Possible Causes**:
1. Glossary terms not loaded from Supabase
2. Network connectivity issues
3. Supabase credentials not configured

**Solutions**:
1. Check browser console for errors
2. Verify `.env` file has correct Supabase credentials
3. Run the consistency checker to diagnose issues

### Issue: Inconsistent Colors

**Possible Causes**:
1. CSS overrides
2. Component not receiving correct props
3. Glossary terms not properly loaded

**Solutions**:
1. Check if `glossaryTerms` prop is passed correctly
2. Verify `normalWordHoverColor` and `technicalWordHoverColor` props
3. Ensure glossary service is working properly

### Issue: Missing Tooltips

**Possible Causes**:
1. Word detection logic not working
2. Glossary terms not in correct format
3. Component not rendering tooltips

**Solutions**:
1. Check if words are being detected as glossary terms
2. Verify glossary terms are stored correctly in Supabase
3. Test with known glossary terms like "Alice" or "White Rabbit"

## 📈 Performance Considerations

### Caching Strategy
- **Duration**: 5 minutes
- **Memory**: ~50KB for all terms and variations
- **Lookup**: O(1) using JavaScript Set

### Loading States
- **Initial Load**: Shows loading indicator
- **Error Handling**: Graceful fallback to normal highlighting
- **Term Count**: Displays when loaded successfully

## 🧪 Testing Checklist

### Automated Testing
- [ ] Run consistency checker: `./scripts/run-glossary-check.sh`
- [ ] Check for any issues in the report
- [ ] Verify all chapters have glossary terms
- [ ] Ensure no missing terms are reported

### Manual Testing
- [ ] Start development server: `npm run dev`
- [ ] Navigate to reader interface
- [ ] Hover over known glossary terms (Alice, White Rabbit, etc.)
- [ ] Verify orange highlighting appears
- [ ] Hover over normal words
- [ ] Verify blue highlighting appears
- [ ] Check tooltips for glossary terms
- [ ] Test across all 3 chapters

### Demo Testing
- [ ] Visit `/alice-glossary-demo`
- [ ] Test search functionality
- [ ] Verify visual legend matches actual highlighting
- [ ] Check sample text highlighting

## 🚀 Best Practices

### For Developers
1. **Always run the consistency checker** before deploying changes
2. **Test across all chapters** to ensure consistency
3. **Use the demo page** to verify highlighting works
4. **Check browser console** for any errors
5. **Verify Supabase connectivity** before testing

### For Content Updates
1. **Add new glossary terms** to the `alice_glossary` table
2. **Run consistency check** after adding terms
3. **Test new terms** in the reader interface
4. **Update documentation** if needed

## 📚 Related Documentation

- [Alice Glossary Guide](alice-glossary-guide.md) - Setting up the glossary system
- [Glossary Hover Highlighting Guide](glossary-hover-highlighting-guide.md) - Technical details
- [Dictionary Service Guide](dictionary-service-guide.md) - How definitions work
- [UI Enhancement Guide](ui-enhancement-guide.md) - General UI improvements

## 🎯 Quick Commands

```bash
# Run consistency check
./scripts/run-glossary-check.sh

# Start development server
npm run dev

# Test glossary service
node scripts/test-alice-glossary.js

# Test glossary highlighting
node scripts/test-glossary-highlighting.js
```

---

**The glossary consistency system ensures that all Alice in Wonderland terms are properly highlighted across all chapters, providing users with a consistent and educational reading experience! 📖✨** 
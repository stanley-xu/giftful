# iOS Large Title Header Collapse Bug

## Problem

When using React Navigation's native iOS large title headers with a custom `headerStyle.backgroundColor`, the large title collapse animation breaks - instead of smoothly collapsing as you scroll, it snaps instantly.

## Root Cause

This is a known bug in React Navigation. Setting `headerStyle: { backgroundColor: '...' }` interferes with the native iOS large title collapse behavior.

GitHub Issue: https://github.com/react-navigation/react-navigation/issues/12037

## Solution

Use `headerTransparent: true` instead of setting a background color:

```tsx
navigation.setOptions({
  headerTransparent: true,
  headerLargeTitleStyle: { color: text.black },
  headerTitleStyle: { color: text.black },
});
```

**Tradeoff**: We lose the ability to set a custom header background color, but gain smooth native large title collapse behavior.

## Profile Card Overlay Implementation

Since we have a ProfileCard overlay that slides down from the top, we needed to handle the header height properly. The overlay:

1. Extends from `top: 0` to cover content that would show behind the transparent header
2. Uses `headerHeight` (from `useHeaderHeight()`) as top padding so content appears below the nav bar
3. Animates the full height (`cardHeight + headerHeight`) when sliding

### useCollapsibleHeader Hook

The hook encapsulates all the height calculations:

```tsx
const {
  animatedOverlayStyle,
  animatedSpacerStyle,
  panGesture,
  totalHeight,      // cardHeight + headerHeight
  headerHeight,     // for top padding
} = useCollapsibleHeader({
  cardHeight: PROFILE_CARD_HEIGHT,  // visible content height
  headerHeight,                      // nav bar height
  initialExpanded: false,
});
```

**What the hook handles:**
- `totalHeight` calculation for overlay and animation
- Spacer only uses `cardHeight` (visible portion, not header area)
- Pan gesture drag distance based on `totalHeight`
- Drag-to-collapse with 50px threshold

This keeps the screen component clean - it just passes `cardHeight` and `headerHeight`, and uses the returned values for styling.

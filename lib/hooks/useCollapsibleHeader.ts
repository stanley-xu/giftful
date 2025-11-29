import { useCallback, useMemo, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const TIMING_CONFIG = { duration: 250 };
const DRAG_THRESHOLD = 50; // Minimum drag distance to trigger collapse

interface UseExpandableOverlayParams {
  /** Height of the visible card content (excluding header area) */
  cardHeight: number;
  /** Height of the navigation header - card extends behind this */
  headerHeight?: number;
  initialExpanded?: boolean;
}

/**
 * Hook for an expandable overlay card controlled by toggle button or drag gesture.
 * Does not interact with scroll - designed to work alongside native large title headers.
 *
 * The overlay extends from top: 0 and includes padding for the header area,
 * so the card background covers any content that would otherwise show behind the header.
 */
export function useExpandableOverlay({
  cardHeight,
  headerHeight = 0,
  initialExpanded = false,
}: UseExpandableOverlayParams) {
  // Total height includes header padding so card extends behind nav bar
  const totalHeight = cardHeight + headerHeight;
  const expandProgress = useSharedValue(initialExpanded ? 1 : 0);
  const chevronRotation = useSharedValue(initialExpanded ? -180 : 0);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      expandProgress.value,
      [0, 1],
      [-totalHeight, 0]
    );
    return {
      transform: [{ translateY }],
      opacity: expandProgress.value,
    };
  });

  // Spacer only pushes content by visible card height (not header portion)
  const animatedSpacerStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(expandProgress.value, [0, 1], [0, cardHeight]),
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${chevronRotation.value}deg` }],
    };
  });

  const collapse = useCallback(() => {
    expandProgress.value = withTiming(0, TIMING_CONFIG);
    chevronRotation.value = withTiming(0, TIMING_CONFIG);
    setIsExpanded(false);
  }, [expandProgress, chevronRotation]);

  const expand = useCallback(() => {
    expandProgress.value = withTiming(1, TIMING_CONFIG);
    chevronRotation.value = withTiming(-180, TIMING_CONFIG);
    setIsExpanded(true);
  }, [expandProgress, chevronRotation]);

  const toggleExpand = useCallback(() => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }, [isExpanded, collapse, expand]);

  // Pan gesture for dragging the card up to collapse
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          // Only allow dragging up (negative translationY) when expanded
          if (event.translationY < 0) {
            // Map drag distance to progress (0 = fully expanded, 1 = collapsed)
            const dragProgress = Math.min(
              1,
              Math.abs(event.translationY) / totalHeight
            );
            expandProgress.value = 1 - dragProgress;
          }
        })
        .onEnd((event) => {
          // If dragged past threshold, collapse; otherwise snap back
          if (event.translationY < -DRAG_THRESHOLD) {
            expandProgress.value = withTiming(0, TIMING_CONFIG);
            chevronRotation.value = withTiming(0, TIMING_CONFIG);
            runOnJS(setIsExpanded)(false);
          } else {
            // Snap back to expanded
            expandProgress.value = withTiming(1, TIMING_CONFIG);
          }
        }),
    [totalHeight, expandProgress, chevronRotation]
  );

  return {
    animatedOverlayStyle,
    animatedSpacerStyle,
    animatedChevronStyle,
    toggleExpand,
    isExpanded,
    panGesture,
    /** Total height of overlay (cardHeight + headerHeight) */
    totalHeight,
    /** Header height for top padding */
    headerHeight,
  };
}

// Keep the old export name for backwards compatibility
export const useCollapsibleHeader = useExpandableOverlay;

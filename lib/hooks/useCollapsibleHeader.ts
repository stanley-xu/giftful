import { useCallback, useState } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const TIMING_CONFIG = { duration: 250 };

interface UseExpandableOverlayParams {
  cardHeight: number;
  initialExpanded?: boolean;
}

/**
 * Hook for an expandable overlay card controlled only by a toggle button.
 * Does not interact with scroll - designed to work alongside native large title headers.
 */
export function useExpandableOverlay({
  cardHeight,
  initialExpanded = false,
}: UseExpandableOverlayParams) {
  const expandProgress = useSharedValue(initialExpanded ? 1 : 0);
  const chevronRotation = useSharedValue(initialExpanded ? -180 : 0);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      expandProgress.value,
      [0, 1],
      [-cardHeight, 0]
    );
    return {
      transform: [{ translateY }],
      opacity: expandProgress.value,
    };
  });

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

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    expandProgress.value = withTiming(newExpanded ? 1 : 0, TIMING_CONFIG);
    chevronRotation.value = withTiming(newExpanded ? -180 : 0, TIMING_CONFIG);
    setIsExpanded(newExpanded);
  }, [isExpanded, expandProgress, chevronRotation]);

  return {
    animatedOverlayStyle,
    animatedSpacerStyle,
    animatedChevronStyle,
    toggleExpand,
    isExpanded,
  };
}

// Keep the old export name for backwards compatibility
export const useCollapsibleHeader = useExpandableOverlay;

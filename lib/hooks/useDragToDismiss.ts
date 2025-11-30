import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

const TIMING_CONFIG = { duration: 300 };
const DISMISS_THRESHOLD_PX = 100; // Pixels to drag before dismissing
const DISMISS_VELOCITY = 500; // Velocity threshold for quick swipe

export function useDragToDismiss(isOpen: boolean, onDismiss: () => void) {
  const VISIBLE_POSITION = 0;
  const translateY = useSharedValue(VISIBLE_POSITION);
  const context = useSharedValue({ y: 0 });

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      translateY.value = VISIBLE_POSITION;
    }
  }, [isOpen]);

  const handleDismiss = () => {
    "worklet";
    runOnJS(onDismiss)();
  };

  const gesture = Gesture.Pan()
    // Only activate when dragging down (positive Y), let ScrollView handle up scrolling
    .activeOffsetY(10)
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Only allow dragging down (positive Y values)
      translateY.value = Math.max(
        VISIBLE_POSITION,
        context.value.y + event.translationY
      );
    })
    .onEnd((event) => {
      // Dismiss on high velocity or drag past threshold
      if (
        translateY.value > DISMISS_THRESHOLD_PX ||
        event.velocityY > DISMISS_VELOCITY
      ) {
        handleDismiss();
      } else {
        // Snap back to visible position
        translateY.value = withTiming(VISIBLE_POSITION, TIMING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { gesture, animatedStyle };
}

import { ReactNode } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDragToDismiss } from "@/lib/hooks/useDragToDismiss";
import { colours, spacing, text } from "@/styles/tokens";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Height as percentage of screen (0-1). Default: 0.5 */
  heightPercentage?: number;
  /** Custom styles for the sheet container */
  containerStyle?: ViewStyle;
  /** Whether to show the drag handle. Default: true */
  showHandle?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  heightPercentage = 0.5,
  containerStyle,
  showHandle = true,
}: BottomSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const { gesture, animatedStyle } = useDragToDismiss(visible, onClose);

  const sheetHeight = SCREEN_HEIGHT * heightPercentage;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <GestureDetector gesture={gesture}>
            <Animated.View
              style={[
                styles.container,
                animatedStyle,
                {
                  height: sheetHeight,
                  paddingBottom: bottom + spacing.lg,
                  shadowOffset: {
                    height: -4,
                    width: 0,
                  },
                  shadowOpacity: 0.1,
                },
                containerStyle,
              ]}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={styles.content}
              >
                {showHandle && (
                  <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                  </View>
                )}
                <View style={styles.childrenContainer}>{children}</View>
              </Pressable>
            </Animated.View>
          </GestureDetector>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colours.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
  },
  childrenContainer: {
    flex: 1,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: text.black,
    opacity: 0.3,
  },
});

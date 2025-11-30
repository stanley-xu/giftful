import {
  borderRadius,
  colours,
  spacing,
  text,
  typography,
} from "@/styles/tokens";
import { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
} from "react-native";
import { Text } from "../Text";
import { Unstyled } from "./Unstyled";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  labelStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  size = "md",
  labelStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <TextInput
        style={[
          styles.base,
          styles[size],
          isFocused && styles.focused,
          error && styles.error,
          style,
        ]}
        placeholderTextColor={text.gray}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />

      {error && (
        <Text variant="error" style={styles.textField}>
          {error}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
    color: text.black,
    opacity: 0.6,
  },

  // Base input styles
  base: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colours.background,
    fontSize: typography.fontSize.base,
    color: text.black,
    paddingHorizontal: spacing.md,
  },

  // Sizes
  sm: {
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingVertical: spacing.lg,
    minHeight: 52,
  },

  // States
  focused: {
    borderColor: colours.accent,
  },

  error: {
    borderColor: colours.error,
  },

  // Subcomponents
  textField: {
    // marginTop: spacing.sm,
  },
});

Input.Unstyled = Unstyled;

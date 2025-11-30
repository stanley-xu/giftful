import { colours, palette, text, typography } from "@/styles/tokens";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from "react-native";
import { useSurfaceColourContext } from "../SurfaceColourContext";

export interface TextProps extends RNTextProps {
  variant?:
    | "regular"
    | "bold"
    | "semibold"
    | "italic"
    | "error"
    | "destructive";
  size?: keyof typeof typography.fontSize;
  colour?: keyof typeof text;
}

export function Text({
  variant = "regular",
  size = "base",
  colour,
  style,
  ...rest
}: TextProps) {
  let contextualColour = useSurfaceColourContext()?.textColour;

  if (variant === "error") {
    contextualColour = colours.error;
  }

  return (
    <RNText
      style={[
        styles[variant],
        contextualColour && { color: contextualColour },
        colour && { color: colour }, // explicit props are overrides
        { fontSize: typography.fontSize[size] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  regular: {
    color: text.black,
  },
  bold: {
    fontWeight: typography.fontWeight.bold,
  },
  semibold: {
    fontWeight: typography.fontWeight.semibold,
  },
  italic: {
    fontStyle: "italic",
  },
  error: {
    // color: colours.error,
    // TODO: dark mode to auto toggle between the one on top and bottomtes
    color: palette.secondaryDark,
    fontWeight: typography.fontWeight.bold,
  },
  destructive: {
    color: colours.error,
    fontWeight: typography.fontWeight.bold,
  },
});

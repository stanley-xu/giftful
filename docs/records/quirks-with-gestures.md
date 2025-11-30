# Quirks with gestures

Things I ran into while implementing gestures

## Scrolling and the pan gesture can compete

Use `ScrollView` from `react-native-gesture-handler` specifically to make this work; not the one from `react-native`!

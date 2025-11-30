import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "expo-router";
import { CirclePlus, CircleX, ScrollText } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn } from "react-native-reanimated";
import { z } from "zod";

import { BottomSheet, Button, Input, Text } from "@/components";
import { SurfaceColourContext } from "@/components/SurfaceColourContext";
import { Features } from "@/config";
import { profiles, wishlistItems, wishlists } from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import { CreateProfileSchema } from "@/lib/schemas";
import { borderRadius, colours, spacing, text } from "@/styles/tokens";

import { IconButton } from "@/components/Button";
import { fullPageStyles } from "@/styles/styles";

// Combined schema for onboarding
const OnboardingSchema = z.object({
  name: CreateProfileSchema.shape.name,
  bio: CreateProfileSchema.shape.bio,
  // Allow empty string or valid wish name (optional field not submitted via form)
  wishName: z.string().max(200).optional(),
});

type OnboardingForm = z.infer<typeof OnboardingSchema>;

const GREETINGS = ["you beaufiful stranger."];
const randomGreet = () =>
  `Welcome, ${GREETINGS.at(Math.floor(Math.random() * GREETINGS.length))}`;

export default function WelcomeScreen() {
  const { setProfile, signOut } = useAuthContext();
  const [wishes, setWishes] = useState<{ name: string }[]>([]);
  const [showWishes, setShowWishes] = useState(false);

  const navigation = useNavigation();

  const {
    control,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      name: "",
      bio: "",
      wishName: "",
    },
  });

  // Watch name field to progressively reveal other sections
  const nameValue = useWatch({ control, name: "name" });
  const showNextSections = nameValue.length > 0;

  const onSubmit = useCallback(async (data: OnboardingForm) => {
    try {
      const { data: profileData, error } = await profiles.createProfile({
        name: data.name,
        bio: data.bio,
      });

      if (error) throw error;
      if (!profileData)
        throw new Error("No profile data returned from createProfile");

      // Seed default wishlist if multi-wishlist feature is off
      if (!Features["multi-wishlists"]) {
        const { data: wishlistData, error: wishlistError } =
          await wishlists.create({
            name: "My Wishlist",
          });

        if (wishlistError) {
          console.error("Error creating default wishlist:", wishlistError);
        } else if (wishlistData) {
          // Include current input value if user hasn't pressed Add yet
          const allWishes = data.wishName
            ? [...wishes, { name: data.wishName }]
            : wishes;

          if (allWishes.length > 0) {
            const { error: itemError } = await wishlistItems.createMany(
              wishlistData.id,
              allWishes
            );

            if (itemError) {
              console.error("Error creating wishlist items:", itemError);
            }
          }
        }
      }

      setProfile(profileData);

      // Navigation to app route happens automatically via session state change
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile");
    }
  }, [wishes, setProfile]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button.Unstyled onPress={handleSubmit(onSubmit)}>
          <Text variant="semibold">Let&apos;s go</Text>
        </Button.Unstyled>
      ),
      headerLeft: () => (
        <Button.Unstyled onPress={() => signOut()}>
          <Text variant="semibold">Sign out</Text>
        </Button.Unstyled>
      ),
    });
  }, [navigation, handleSubmit, onSubmit, signOut]);

  return (
    <SurfaceColourContext value={{ textColour: text.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.screen}
      >
        <RNScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.Text
            entering={FadeIn.duration(800)}
            style={styles.greeting}
          >
            <Text variant="bold" size={"3xl"} colour="white">
              {randomGreet()}
            </Text>
          </Animated.Text>

          <Animated.View
            entering={FadeIn.duration(400).delay(700)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Tell us about yourself</Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="What's your name?"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  autoFocus
                />
              )}
            />
          </Animated.View>

          {showNextSections && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.section}
            >
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Tell us about yourself"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bio?.message}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
            </Animated.View>
          )}

          {!Features["multi-wishlists"] && showNextSections && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>
                Is there anything you're wishing for?
              </Text>

              <Controller
                control={control}
                name="wishName"
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { isDirty },
                }) => (
                  <>
                    <Input
                      placeholder="I'm wishing for..."
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.wishName?.message}
                    />
                    <View style={[styles.bottomButtonWrapper]}>
                      <Button
                        onPress={() => setShowWishes(true)}
                        disabled={wishes.length === 0}
                        style={styles.bottomButton}
                      >
                        <ScrollText color={text.black} />
                        <Text variant="semibold" colour="black">
                          Check my list
                        </Text>
                      </Button>
                      <Button
                        onPress={() => {
                          if (value) {
                            const wish = { name: value };
                            setWishes((wishes) => [...wishes, wish]);
                            resetField("wishName");
                          }
                        }}
                        disabled={!isDirty}
                        style={styles.bottomButton}
                      >
                        <CirclePlus color={text.black} />
                        <Text variant="semibold" colour="black">
                          Add
                        </Text>
                      </Button>
                    </View>
                  </>
                )}
              />
            </Animated.View>
          )}
        </RNScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={showWishes}
        onClose={() => setShowWishes(false)}
        containerStyle={{ backgroundColor: colours.surface }}
      >
        <View style={styles.wishListContainer}>
          <Text
            variant="bold"
            size="2xl"
            colour="black"
            style={{ textAlign: "center", marginBottom: spacing.md }}
          >
            My wishes
          </Text>
          <GHScrollView
            style={styles.wishList}
            contentContainerStyle={styles.wishListContent}
          >
            {wishes.map((wish, idx) => (
              <View
                key={`${idx}-${wish.name}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text size="3xl" colour="black">
                  {wish.name}
                </Text>
                <IconButton
                  onPress={() =>
                    setWishes((wishes) =>
                      wishes.filter((_wish, existingIdx) => existingIdx !== idx)
                    )
                  }
                >
                  <CircleX color={text.black} />
                </IconButton>
              </View>
            ))}
          </GHScrollView>
        </View>
      </BottomSheet>
    </SurfaceColourContext>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...fullPageStyles.container,
    backgroundColor: colours.surfaceDark,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  greeting: {},
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  bottomButtonWrapper: {
    flexDirection: "row",
    justifyContent: "center",
  },
  bottomButton: {
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    backgroundColor: colours.surface,
  },
  wishListContainer: {
    flex: 1,
  },
  wishList: {
    flex: 1,
  },
  wishListContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod/v4";

import { Button, Input, Text } from "@/components";
import { useAuthContext } from "@/lib/auth";
import { fullPageStyles } from "@/styles/styles";
import { spacing } from "@/styles/tokens";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn, loading } = useAuthContext();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn({ email: data.email, password: data.password });
      // Navigation happens automatically via session state change
    } catch (e) {
      console.error(e);
      setError("root", { message: (e as Error).message });
    }
  };

  const handleDevLogin = async (email: string, password: string) => {
    try {
      await signIn({ email, password });
      // Navigation happens automatically via session state change
    } catch (e) {
      console.error(e);
      setError("root", { message: (e as Error).message });
    }
  };

  const isLoading = isSubmitting || loading;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.form}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} loading={isLoading}>
          <Text variant="semibold">Continue</Text>
        </Button>

        {errors.root && <Text variant="error">{errors.root.message}</Text>}

        {__DEV__ && (
          <>
            <Button
              variant="dev"
              loading={isLoading}
              onPress={() =>
                handleDevLogin("dev@example.com", "dev@example.com")
              }
            >
              <Text variant="semibold">Login as Dev</Text>
            </Button>
            <Button
              variant="dev"
              loading={isLoading}
              onPress={() =>
                handleDevLogin("alice@example.com", "alice@example.com")
              }
            >
              <Text variant="semibold">Login as Alice</Text>
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: fullPageStyles.container,
  form: {
    paddingTop: spacing["xl"],
    gap: spacing.md,
  },
  title: fullPageStyles.title,
  subtitle: fullPageStyles.subtitle,
});

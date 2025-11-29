import { zodResolver } from "@hookform/resolvers/zod";
import { AuthError } from "@supabase/supabase-js";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod/v4";

import { Button, Input, Text } from "@/components";
import { useAuthContext } from "@/lib/auth";
import { generateFakeUser } from "@/lib/fake-data";
import { fullPageStyles } from "@/styles/styles";
import { spacing } from "@/styles/tokens";

const registerSchema = z
  .object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUp, loading } = useAuthContext();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp({ email: data.email, password: data.password });
      // In local: navigation happens automatically via session state change
      // In prod: email confirmation needs to be done
      router.push("/(auth)/handoff");
    } catch (e) {
      console.error(e);
      setError("root", { message: (e as Error).message });
    }
  };

  const handleDevRegister = async () => {
    const fakeUser = generateFakeUser();

    // Set form values for visibility
    setValue("email", fakeUser.email);
    setValue("password", fakeUser.password);
    setValue("confirmPassword", fakeUser.password);

    try {
      await signUp({
        email: fakeUser.email,
        password: fakeUser.password,
      });
      // Navigation happens automatically via session state change
    } catch (e) {
      const authError = e as AuthError;
      console.error(authError);
      setError("root", { message: authError.message });
    }
  };

  const isLoading = isSubmitting || loading;

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create account</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="giver@giftful.io"
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

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} loading={isLoading}>
          <Text variant="semibold">Register</Text>
        </Button>

        {errors.root && <Text variant="error">{errors.root.message}</Text>}

        {__DEV__ && (
          <Button loading={isLoading} onPress={handleDevRegister} variant="dev">
            <Text variant="semibold">Auto-generate user</Text>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...fullPageStyles.container,
    alignItems: "center",
  },
  form: {
    gap: spacing.md,
    width: "100%",
  },
  title: fullPageStyles.title,
  subtitle: fullPageStyles.subtitle,
});

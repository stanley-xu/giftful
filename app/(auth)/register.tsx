import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react-native";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod/v4";

import { Button, Input, Text } from "@/components";
import { BottomSheet } from "@/components/BottomSheet";
import { auth } from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import { generateFakeUser } from "@/lib/fake-data";
import { fullPageStyles } from "@/styles/styles";
import { colours, spacing } from "@/styles/tokens";

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
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const registeredEmailRef = useRef<string | null>(null);

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
      console.log("before");
      await signUp({ email: data.email, password: data.password });
      registeredEmailRef.current = data.email;
      console.log(data.email);
      setResendSuccess(false);
      setShowCheckEmail(true);
    } catch (e) {
      console.error(e);
      setError("root", { message: (e as Error).message });
    }
  };

  const handleResendEmail = async () => {
    console.log(registeredEmailRef.current);
    if (!registeredEmailRef.current) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const { error } = await auth.resendVerificationEmail(
        registeredEmailRef.current
      );
      if (error) throw error;
      setResendSuccess(true);
    } catch (e) {
      console.error("Failed to resend verification email:", e);
    } finally {
      setIsResending(false);
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
      registeredEmailRef.current = fakeUser.email;
      setResendSuccess(false);
      setShowCheckEmail(true);
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

      <BottomSheet
        visible={showCheckEmail}
        onClose={() => setShowCheckEmail(false)}
        heightPercentage={0.45}
        containerStyle={{ backgroundColor: colours.surface }}
      >
        <View style={styles.sheetContent}>
          <Mail size={spacing.xs * 18} />
          <Text style={styles.sheetTitle}>Hang tight!</Text>
          <Text style={styles.sheetDescription}>
            We sent a verification link to your email. Use the link to complete
            your signup.
          </Text>
          {resendSuccess ? (
            <Text>Email sent!</Text>
          ) : (
            <Button onPress={handleResendEmail} loading={isResending}>
              <Text variant="semibold">Resend verification email</Text>
            </Button>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...fullPageStyles.container,
    backgroundColor: colours.surface,
    alignItems: "center",
  },
  form: {
    gap: spacing.md,
    width: "100%",
  },
  title: fullPageStyles.title,
  subtitle: fullPageStyles.subtitle,
  sheetContent: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    // backgroundColor: colours.surface,
  },
  sheetTitle: {
    ...fullPageStyles.title,
    textAlign: "center",
  },
  sheetDescription: {
    textAlign: "center",
  },
});

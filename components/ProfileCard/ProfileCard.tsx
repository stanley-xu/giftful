import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

import Avatar from "@/components/Avatar/Avatar";
import { Card } from "@/components/Card";
import { cardTitleStyles } from "@/components/Card/Title";
import { Input } from "@/components/Input";
import { UpdateProfileSchema, type Profile } from "@/lib/schemas";
import { borderRadius, colours, spacing, text } from "@/styles/tokens";

const ProfileFormSchema = UpdateProfileSchema.pick({ name: true, bio: true });
type ProfileForm = z.infer<typeof ProfileFormSchema>;

interface ProfileCardProps {
  profile: Profile;
  readOnly?: boolean;
  onUpdate?: (field: keyof ProfileForm, value: string) => Promise<void>;
  cardHeight: number;
  topPadding?: number;
}

export default function ProfileCard({
  profile,
  readOnly = false,
  onUpdate,
  cardHeight,
  topPadding = 0,
}: ProfileCardProps) {
  const [editingField, setEditingField] = useState<keyof ProfileForm | null>(
    null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.avatar_url ?? null
  );

  const abbreviatedName = profile.name
    .split(" ")
    .map((name) => name[0].toUpperCase())
    .join("");

  const {
    control,
    getValues,
    trigger,
    formState: { errors: formErrors, isValid: formIsValid },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: profile.name,
      bio: profile.bio ?? "",
    },
    reValidateMode: "onChange",
  });

  const hasFormErrors = Object.keys(formErrors).length > 0;

  const handleSave = async (field: keyof ProfileForm) => {
    if (readOnly || !onUpdate) return;

    const isValid = await trigger(field);
    if (!isValid) return;

    const value = getValues(field) ?? "";
    setEditingField(null);
    await onUpdate(field, value);
  };

  return (
    <Card
      corners="squared"
      padding="sm"
      style={{
        borderBottomStartRadius: borderRadius.lg,
        borderBottomEndRadius: borderRadius.lg,
        height: cardHeight,
        paddingTop: topPadding,
        paddingBottom: 0,
        justifyContent: "space-between",
      }}
    >
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
        }}
        style={styles.container}
      >
        <View style={styles.profileAvatar}>
          <Avatar
            url={avatarUrl}
            size={150}
            onUpload={
              readOnly
                ? undefined
                : (url) => {
                    setAvatarUrl(url);
                    onUpdate?.("avatar_url" as any, url);
                  }
            }
            fallbackText={abbreviatedName}
          />
        </View>

        <View>
          <Controller
            control={control}
            name="name"
            render={({
              field: { onChange, value },
              fieldState: { error, isDirty },
            }) =>
              !readOnly && editingField === "name" ? (
                <Input.Unstyled
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => handleSave("name")}
                  error={error?.message}
                  style={[
                    cardTitleStyles.title,
                    styles.fieldElement,
                    styles.profileInput,
                    isDirty && { borderColor: text.black },
                    error && { borderColor: colours.error },
                  ]}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => !readOnly && setEditingField("name")}
                  disabled={readOnly || hasFormErrors || !formIsValid}
                  style={styles.fieldElement}
                >
                  <Card.Title>{value}</Card.Title>
                </TouchableOpacity>
              )
            }
          />
        </View>

        <Controller
          control={control}
          name="bio"
          render={({
            field: { onChange, value },
            fieldState: { error, isDirty },
          }) =>
            !readOnly && editingField === "bio" ? (
              <Input.Unstyled
                value={value}
                onChangeText={onChange}
                onBlur={() => handleSave("bio")}
                autoFocus
                error={error?.message}
                style={[
                  styles.fieldElement,
                  styles.profileInput,
                  isDirty && { borderColor: text.black },
                  error && { borderColor: colours.error },
                ]}
              />
            ) : (
              <TouchableOpacity
                onPress={() => !readOnly && setEditingField("bio")}
                disabled={readOnly || hasFormErrors || !formIsValid}
                style={styles.fieldElement}
              >
                <Card.Text variant="italic">
                  {value || (readOnly ? "" : "Add a bio...")}
                </Card.Text>
              </TouchableOpacity>
            )
          }
        />
      </Pressable>

      {/* Drag handle indicator at bottom */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.md,
  },
  profileAvatar: {
    // marginBottom: spacing.md,
  },
  profileInput: {
    borderStyle: "dashed",
    borderColor: colours.accent,
    borderRadius: borderRadius.md,
  },
  fieldElement: {
    borderWidth: 1,
    borderColor: "transparent",
    minWidth: 150,
    paddingVertical: spacing.xs,
    alignItems: "center",
    textAlign: "center",
  },
  handleContainer: {
    alignItems: "center",
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: text.black,
    opacity: 0.2,
  },
});

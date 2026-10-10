import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, spacing } from "../styles/theme";

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'sage' | 'rust' | 'slate' | 'wine';

type Props = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    disabled?: boolean;
};

export function AppButton({ title, onPress, variant = 'primary', disabled = false }: Props) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            // pressable-ov style prop moze biti funkcija pa se moze 'animirati' bez animiranja
            style={({ pressed }) => [
                styles.base,
                variantStyles[variant],
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            <Text style={[styles.text, variant === 'ghost' && styles.textGhost]}>{title}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    base: {
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: 'center',
        marginVertical: spacing.xs,
    },
    text: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 15,
        color: colors.ink,
        letterSpacing: 0.3,
    },
    textGhost: {
        color: colors.gold,
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.4,
    },
});

const variantStyles = StyleSheet.create({
    primary: { backgroundColor: colors.accent, borderColor: colors.gold },
    secondary: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
    danger: { backgroundColor: colors.danger, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent', borderColor: colors.gold },
    sage: { backgroundColor: colors.sage, borderColor: colors.gold },
    rust: { backgroundColor: colors.rust, borderColor: colors.gold },
    slate: { backgroundColor: colors.slate, borderColor: colors.gold },
    wine: { backgroundColor: colors.wine, borderColor: colors.gold },
});
import { View, Pressable, Text, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.bar}>
            {state.routes.map((route, index) => {
                const focused = state.index === index;
                const isLast = index === state.routes.length - 1;

                return (
                    <View key={route.key} style={styles.item}>
                        <Pressable onPress={() => navigation.navigate(route.name)} style={styles.inner}>
                            <View style={[styles.pill, focused && styles.pillFocused]}>
                                <Text style={[styles.label, focused && styles.labelFocused]}>{route.name}</Text>
                            </View>
                        </Pressable>
                        {!isLast && <View style={styles.divider} />}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        height: 50,
        backgroundColor: colors.surface,
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inner: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    pillFocused: {
        backgroundColor: colors.surfaceAlt,
        borderWidth: 0.5,
        borderColor: colors.gold,
    },
    divider: {
        width: 1,
        alignSelf: 'center',
        height: 28,
        backgroundColor: colors.border,
    },
    label: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
        color: colors.inkMuted,
    },
    labelFocused: {
        color: colors.gold,
    },
});
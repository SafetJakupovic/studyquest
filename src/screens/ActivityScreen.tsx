import { useCallback, useState } from "react";
import { ActivityWithStatus, getActivitiesWithStatus, getTodayPages, PAGES_PER_REWARD_UNIT, setTodayPages, Stats, toggleActivity } from "../db/database";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, Text, TextInput, View } from "react-native";
import { styles } from "../styles/styles";
import { StatsBar } from "../components/StatsBar";
import { ScreenBackground } from "../components/ScreenBackground";
import { colors, fonts, spacing } from "../styles/theme";
import { AppButton } from "../components/AppButton";

type Props = {
    stats: Stats | null;
    onStatsChange: (s: Stats) => void;
}

export function ActivityScreen({ stats, onStatsChange }: Props) {
    const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
    const [pagesInput, setPagesInput] = useState('');

    const refresh = useCallback(() => {
        setActivities(getActivitiesWithStatus());
        setPagesInput(String(getTodayPages()));
    }, []);

    // refresh je vec useCallback sa praznim nizom pa je stabilna referenca
    // imao sam problem sa usefocuseffect(()=>refresh()) vec jednom posto je to nova funckija pri svakom renderu
    useFocusEffect(refresh);

    function handleToggle(activity: ActivityWithStatus) {
        const newStats = toggleActivity(activity.id, activity.xpReward, activity.coinsReward);
        onStatsChange(newStats);
        refresh();
    }

    function handleSavePages() {
        const parsed = parseInt(pagesInput, 10);
        if (isNaN(parsed))
            return;
        const newStats = setTodayPages(parsed);
        onStatsChange(newStats);
        setPagesInput(String(parsed));
    }

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {stats && <StatsBar stats={stats} />}

                <Text style={styles.sectionTitle}>
                    Današnja aktivnost
                </Text>

                {activities.map(a => (
                    <Pressable
                        key={a.id}
                        onPress={() => handleToggle(a)}
                        style={({ pressed }) => [
                            localStyles.row,
                            a.doneToday && localStyles.rowDone,
                            pressed && localStyles.rowPressed,
                        ]}
                    >
                        <Text style={localStyles.checkbox}>{a.doneToday ? '✓' : '○'}</Text>
                        <Text style={localStyles.name}>{a.name}</Text>
                        <Text style={localStyles.reward}>+{a.xpReward} XP / +{a.coinsReward} coins</Text>
                    </Pressable>
                ))}
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Čitanje</Text>
                <Text style={styles.counter}>{PAGES_PER_REWARD_UNIT} stranica = 1 XP / 1 coin</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Stranica pročitano danas"
                    placeholderTextColor={colors.inkMuted}
                    value={pagesInput}
                    onChangeText={setPagesInput}
                />
                <AppButton title="Sačuvaj" onPress={handleSavePages} />
            </View>
        </ScreenBackground>
    );
}

const localStyles = {
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        width: '100%' as const,
        padding: spacing.md,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        marginBottom: spacing.sm,
    },
    rowDone: {
        borderColor: colors.gold,
        backgroundColor: colors.surfaceAlt,
    },
    rowPressed: {
        opacity: 0.7,
    },
    checkbox: {
        fontSize: 20,
        color: colors.gold,
        marginRight: spacing.sm + 4,
        width: 24,
        textAlign: 'center' as const,
    },
    name: {
        flex: 1,
        fontFamily: fonts.body,
        fontSize: 16,
        color: colors.ink,
    },
    reward: {
        fontFamily: fonts.body,
        fontSize: 12,
        color: colors.inkMuted,
    },
}
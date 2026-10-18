import { useCallback, useState } from "react";
import { ActivityWithStatus, createActivity, deleteActivity, getActivitiesWithStatus, getTodayPages, PAGES_PER_REWARD_UNIT, setTodayPages, Stats, toggleActivity } from "../db/database";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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

    const [newName, setNewName] = useState('');
    const [newXp, setNewXp] = useState('5');

    function handleCreateActivity() {
        const xp = parseInt(newXp, 10);
        if (newName.trim() === '' || isNaN(xp)) return;
        createActivity(newName.trim(), xp, xp);
        setNewName('');
        setNewXp('5');
        refresh();
    }

    function handleDeleteActivity(id: number, name: string) {
        Alert.alert(`Obriši "${name}"?`, 'Istorija ove aktivnosti će takođe biti obrisana.', [
            { text: 'Otkaži', style: 'cancel' },
            { text: 'Obriši', style: 'destructive', onPress: () => { deleteActivity(id); refresh(); } },
        ]);
    }

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
            <ScrollView>
                <View style={styles.container}>
                    {stats && <StatsBar stats={stats} />}

                    <Text style={styles.sectionTitle}>
                        Današnja aktivnost
                    </Text>

                    {activities.map(a => (
                        <Pressable
                            key={a.id}
                            onPress={() => handleToggle(a)}
                            onLongPress={() => handleDeleteActivity(a.id, a.name)}
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

                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Dodaj aktivnost</Text>
                    <TextInput style={styles.input} placeholder="Naziv aktivnosti..." value={newName} onChangeText={setNewName} />
                    <TextInput style={styles.input} placeholder="XP/coins nagrada" keyboardType="numeric" value={newXp} onChangeText={setNewXp} />
                    <AppButton title="Dodaj" variant="secondary" onPress={handleCreateActivity} />
                </View>
            </ScrollView>
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
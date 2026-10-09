import { useCallback, useState } from "react";
import { ActivityWithStatus, getActivitiesWithStatus, Stats, toggleActivity } from "../db/database";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { styles } from "../styles/styles";
import { StatsBar } from "../components/StatsBar";

type Props = {
    stats: Stats | null;
    onStatsChange: (s: Stats) => void;
}

export function ActivityScreen({ stats, onStatsChange }: Props) {
    const [activities, setActivities] = useState<ActivityWithStatus[]>([]);

    const refresh = useCallback(() => {
        setActivities(getActivitiesWithStatus());
    }, []);

    // refresh je vec useCallback sa praznim nizom pa je stabilna referenca
    // imao sam problem sa usefocuseffect(()=>refresh()) vec jednom posto je to nova funckija pri svakom renderu
    useFocusEffect(refresh);

    function handleToggle(activity: ActivityWithStatus) {
        const newStats = toggleActivity(activity.id, activity.xpReward, activity.coinsReward);
        onStatsChange(newStats);
        refresh();
    }

    return (
        <View style={styles.container}>
            {stats && <StatsBar stats={stats} />}

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>
                Današnja aktivnost
            </Text>

            {activities.map(a => (
                <Pressable
                    key={a.id}
                    onPress={() => handleToggle(a)}
                    style={{
                        flexDirection: 'row', alignItems: 'center', width: '100%',
                        padding: 12, borderRadius: 8, marginBottom: 8,
                        backgroundColor: a.doneToday ? '#d5f4e6' : '#f2f2f2',
                    }}
                >
                    <Text style={{ fontSize: 20, marginRight: 10 }}>{a.doneToday ? '✅' : '⬜'}</Text>
                    <Text style={{ flex: 1, fontSize: 16 }}>{a.name}</Text>
                    <Text style={{ color: '#888' }}>+{a.xpReward} XP / +{a.coinsReward} coins</Text>
                </Pressable>
            ))}
        </View>
    );
}

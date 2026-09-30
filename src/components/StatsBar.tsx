import { View, Text } from 'react-native';
import { styles } from '../styles/styles';
import type { Stats } from '../db/database';

type Props = { stats: Stats };

export function StatsBar({ stats }: Props) {
    return (
        <View style={styles.statsBar}>
            <Text style={styles.statsText}>XP: {stats.xp}</Text>
            <Text style={styles.statsText}>Coins: {stats.coins}</Text>
            <Text style={styles.statsText}>Streak: {stats.streak}</Text>
        </View>
    );
}
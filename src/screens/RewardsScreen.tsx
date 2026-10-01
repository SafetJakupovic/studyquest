import { View, Text } from 'react-native';
import { styles } from '../styles/styles';
import { StatsBar } from '../components/StatsBar';
import type { Stats } from '../db/database';

type Props = { stats: Stats | null };

export function RewardsScreen({ stats }: Props) {
    return (
        <View style={styles.container}>
            {stats && <StatsBar stats={stats} />}
            <Text style={{ marginTop: 20, color: '#888' }}>
                biće
            </Text>
        </View>
    );
}
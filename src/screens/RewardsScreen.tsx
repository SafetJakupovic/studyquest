import { View, Text, Alert, Button } from 'react-native';
import { styles } from '../styles/styles';
import { StatsBar } from '../components/StatsBar';
import { Stats, exchangeCoinsForMinutes, exchangeCoinsForBudget, COINS_PER_MINUTE, COINS_PER_KM } from '../db/database';
import { useState } from 'react';

type Props = {
    stats: Stats | null;
    onStatsChange: (s: Stats) => void;
};

const MINUTE_OPTIONS = [10, 30, 60];

export function RewardsScreen({ stats, onStatsChange }: Props) {
    const [error, setError] = useState('');

    function handleExchangeMinutes(minutes: number) {
        try {
            const newStats = exchangeCoinsForMinutes(minutes);
            onStatsChange(newStats);
            setError('');
            Alert.alert('Uživaj!', `Iskoristio si ${minutes} minuta.`);
        } catch (e: any) {
            setError(e.message);
        }
    }

    function handleExchangeBudget() {
        try {
            const newStats = exchangeCoinsForBudget(1);
            onStatsChange(newStats);
            setError('');
        } catch (e: any) {
            setError(e.message);
        }
    }

    return (
        <View style={styles.container}>
            {stats && <StatsBar stats={stats} />}

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
                Zamijeni za minute igranja
            </Text>
            <Text style={styles.counter}>{COINS_PER_MINUTE} coin = 1 minuta</Text>
            <View style={styles.buttonRow}>
                {MINUTE_OPTIONS.map(m => (
                    <Button key={m} title={`${m} min`} onPress={() => handleExchangeMinutes(m)} />
                ))}
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 30 }}>
                Zamijeni za budžet igre
            </Text>
            <Text style={styles.counter}>{COINS_PER_KM} coins = 1 KM</Text>
            {stats && <Text style={styles.counter}>Trenutni budžet: {stats.gameBudget.toFixed(2)} KM</Text>}
            <Button title="Zamijeni 100 coins → 1 KM" onPress={handleExchangeBudget} />
        </View>
    );
}
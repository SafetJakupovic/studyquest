import { View, Text, Alert, Button, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { StatsBar } from '../components/StatsBar';
import { Stats, exchangeCoinsForMinutes, exchangeCoinsForBudget, COINS_PER_MINUTE, COINS_PER_KM } from '../db/database';
import { useState } from 'react';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { colors, fonts, spacing } from '../styles/theme';

type Props = {
    stats: Stats | null;
    onStatsChange: (s: Stats) => void;
    navigation: any;
};

const MINUTE_OPTIONS = [10, 30, 60];

export function RewardsScreen({ stats, onStatsChange, navigation }: Props) {
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
        <ScreenBackground>
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    {stats && <StatsBar stats={stats} />}
                    {error !== '' && <Text style={styles.error}>{error}</Text>}

                    <Text style={styles.sectionTitle}>Zamijeni za minute igranja</Text>
                    <Text style={styles.counter}>{COINS_PER_MINUTE} coin = 1 minuta</Text>
                    <View style={styles.buttonRow}>
                        {MINUTE_OPTIONS.map(m => (
                            <AppButton key={m} title={`${m} min`} variant="secondary" onPress={() => handleExchangeMinutes(m)} />
                        ))}
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Zamijeni za budžet igre</Text>
                    <Text style={styles.counter}>{COINS_PER_KM} coins = 1 KM</Text>
                    {stats && <Text style={[styles.counter, { color: colors.gold, fontFamily: fonts.bodySemiBold }]}>
                        Trenutni budžet: {stats.gameBudget.toFixed(2)} KM
                    </Text>}
                    <AppButton title="Zamijeni 100 coins → 1 KM" onPress={handleExchangeBudget} />
                </ScrollView>

                <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <AppButton title="⚙ Podešavanja" variant="ghost" onPress={() => navigation.navigate('Settings')} />
                </View>
            </View>
        </ScreenBackground>
    );
}
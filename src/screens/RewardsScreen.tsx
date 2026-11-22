import { View, Text, Alert, Button, ScrollView, Platform, AppState } from 'react-native';
import { styles } from '../styles/styles';
import { StatsBar } from '../components/StatsBar';
import { Stats, exchangeCoinsForMinutes, exchangeCoinsForBudget, COINS_PER_MINUTE, COINS_PER_KM } from '../db/database';
import { useEffect, useRef, useState } from 'react';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { colors, fonts, spacing } from '../styles/theme';
import { AppAlert } from '../components/AppAlert';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type Props = {
    stats: Stats | null;
    onStatsChange: (s: Stats) => void;
    navigation: any;
};

const MINUTE_OPTIONS = [1, 10, 30, 60];

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function RewardsScreen({ stats, onStatsChange, navigation }: Props) {
    const [error, setError] = useState('');

    const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [alertConfig, setAlertConfig] = useState<{ title: string; message?: string; buttons: { text: string; onPress?: () => void; variant?: any }[] } | null>(null);
    const notificationIdRef = useRef<string | null>(null);
    const endTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const sub = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') tick(); // odmah preračunaj čim se vratiš, umjesto da čekaš sljedeću sekundu
        });
        return () => sub.remove();
    }, []);

    function tick() {
        if (endTimeRef.current === null) return;
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            endTimeRef.current = null;
            setTimerSeconds(null);
        } else {
            setTimerSeconds(remaining);
        }
    }

    async function setupNotifications() {
        if (isExpoGo) return null;
        try {
            const Notifications = await import('expo-notifications');
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') return null;
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('timer', {
                    name: 'Tajmer za igranje',
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: 'timer_end.wav',
                });
            }
            return Notifications;
        } catch {
            return null;
        }
    }

    function handleExchangeMinutes(minutes: number) {
        try {
            const newStats = exchangeCoinsForMinutes(minutes);
            onStatsChange(newStats);
            setError('');
            startTimer(minutes);
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

    async function startTimer(minutes: number) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        endTimeRef.current = Date.now() + minutes * 60 * 1000;
        setTimerSeconds(minutes * 60);

        const Notifications = await setupNotifications();
        if (Notifications) {
            if (notificationIdRef.current) await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
            const id = await Notifications.scheduleNotificationAsync({
                content: { title: 'Vrijeme je isteklo', body: 'Tvoje plaćeno vrijeme za igranje je gotovo.' },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutes * 60, channelId: 'timer', repeats: false },
            });
            notificationIdRef.current = id;
        }

        intervalRef.current = setInterval(tick, 1000);
    }



    async function stopTimer() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (notificationIdRef.current && !isExpoGo) {
            try {
                const Notifications = await import('expo-notifications');
                await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
            } catch { }
            notificationIdRef.current = null;
        }
        setTimerSeconds(null);
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

                    {timerSeconds !== null && (
                        <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
                            <Text style={{ fontFamily: fonts.display, fontSize: 36, color: timerSeconds <= 30 ? colors.wine : colors.gold }}>
                                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                            </Text>
                            <AppButton title="Zaustavi tajmer" variant="secondary" onPress={() => { stopTimer() }} />
                        </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Zamijeni za budžet igre</Text>
                    {stats && <Text style={[styles.counter, { color: colors.gold, fontFamily: fonts.bodySemiBold }]}>
                        Trenutni budžet: {stats.gameBudget.toFixed(2)} KM
                    </Text>}
                    <AppButton title="Zamijeni 100 coins → 1 KM" onPress={handleExchangeBudget} />
                </ScrollView>

                <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <AppButton title="⚙ Podešavanja" variant="ghost" onPress={() => navigation.navigate('Settings')} />
                </View>
            </View>
            <AppAlert
                visible={alertConfig !== null}
                title={alertConfig?.title ?? ''}
                message={alertConfig?.message}
                buttons={alertConfig?.buttons ?? []}
                onRequestClose={() => setAlertConfig(null)}
            />
        </ScreenBackground>
    );
}
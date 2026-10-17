import { useEffect, useState } from "react";
import { exportBackup, pickAndImportBackup } from "../utils/backup";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenBackground } from "../components/ScreenBackground";
import { styles } from "../styles/styles";
import { AppButton } from "../components/AppButton";
import { setLeechThreshold, setMaxNewCardsPerDay, Stats } from "../db/database";
import { listAutoBackups, restoreAutoBackup } from "../utils/autoBackup";
import { clearApiKey, hasCustomApiKey, setApiKey } from "../utils/apiKey";

type Props = {
    stats: Stats | null;
    onStatsChange: (s: Stats) => void;
    onImported: () => void;
    onExit: () => void;
};

export function SettingsScreen({ stats, onStatsChange, onImported, onExit }: Props) {
    const [busy, setBusy] = useState(false);
    const [maxNewInput, setMaxNewInput] = useState(String(stats?.maxNewCardsPerDay ?? 20));
    const [autoBackups, setAutoBackups] = useState<string[]>([]);
    const [thresholdInput, setThresholdInput] = useState(String(stats?.leechThreshold ?? 6));

    const [apiKeyInput, setApiKeyInput] = useState('');
    const [usingCustomKey, setUsingCustomKey] = useState(false);

    useEffect(() => {
        listAutoBackups().then(setAutoBackups);
        hasCustomApiKey().then(setUsingCustomKey);
    }, []);

    async function handleExport() {
        setBusy(true);
        try {
            await exportBackup();
        } catch (e: any) {
            Alert.alert('Greška pri izvozu', e.message);
        } finally {
            setBusy(false);
        }
    }

    function handleSaveMaxNew() {
        const parsed = parseInt(maxNewInput, 10);
        if (isNaN(parsed))
            return;
        const newStats = setMaxNewCardsPerDay(parsed);
        onStatsChange(newStats);
    }

    function handleImportPress() {
        Alert.alert(
            'Uvezi podatke?',
            'Ovo će obrisati sve trenunte podatke u aplikaciji i zamijeniti ih uvezenim.',
            [
                { text: 'Otkaži', style: 'cancel' },
                { text: 'Uvezi i zamijeni', style: 'destructive', onPress: doImport },
            ]
        );
    }

    async function doImport() {
        setBusy(true);
        try {
            const imported = await pickAndImportBackup();
            if (imported) {
                onImported();
                Alert.alert('Gotovo', 'Podaci su uspješno uvezeni.');
            }
        } catch (e: any) {
            Alert.alert('Greška pri uvozu', e.message);
        } finally {
            setBusy(false);
        }
    }

    function handleRestoreAuto(filename: string) {
        Alert.alert('Vrati ovaj backup?', `Zamijeniće trenutne podatke sadržajem iz ${filename}.`, [
            { text: 'Otkaži', style: 'cancel' },
            {
                text: 'Vrati', style: 'destructive', onPress: async () => {
                    setBusy(true);
                    try {
                        await restoreAutoBackup(filename);
                        onImported();
                        Alert.alert('Gotovo', 'Podaci su vraćeni.');
                    } catch (e: any) {
                        Alert.alert('Greška', e.message);
                    } finally { setBusy(false); }
                }
            },
        ]);
    }

    function handleSaveThreshold() {
        const parsed = parseInt(thresholdInput, 10);
        if (isNaN(parsed)) return;
        const newStats = setLeechThreshold(parsed);
        onStatsChange(newStats);
    }

    async function handleSaveKey() {
        if (apiKeyInput.trim() === '') return;
        await setApiKey(apiKeyInput);
        setUsingCustomKey(true);
        setApiKeyInput('');
        Alert.alert('Sačuvano', 'API ključ je sačuvan na uređaju.');
    }

    async function handleClearKey() {
        await clearApiKey();
        setUsingCustomKey(false);
        Alert.alert('Uklonjeno', 'Vraćeno je na podrazumijevani ključ (ako postoji).');
    }

    return (
        <ScreenBackground>
            <ScrollView>
                <View style={styles.container}>
                    <Text style={styles.sectionTitle}>Podešavanja</Text>

                    <Text style={styles.counter}>Maksimalan broj novih kartica dnevno, po špilu:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={maxNewInput}
                        onChangeText={setMaxNewInput}
                    />
                    <AppButton title="Sačuvaj limit" variant="secondary" onPress={handleSaveMaxNew} />

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Teške kartice (leech)</Text>
                    <Text style={styles.counter}>Broj uzastopnih "Opet" ocjena prije nego se kartica izbaci iz dnevne rotacije:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={thresholdInput}
                        onChangeText={setThresholdInput}
                    />
                    <AppButton title="Sačuvaj prag" variant="secondary" onPress={handleSaveThreshold} />

                    <View style={styles.divider} />

                    <Text style={styles.counter}>
                        Izvezi sve podatke (pitanja, špilove, napredak) u jedan fajl koji možeš prenijeti na drugi uređaj.
                    </Text>
                    <AppButton title="Izvezi podatke" onPress={handleExport} disabled={busy} />

                    <View style={styles.divider} />

                    <Text style={styles.counter}>
                        Uvezi fajl sa drugog uređaja. Ovo zamjenjuje sve trenutne podatke u aplikaciji.
                    </Text>
                    <AppButton title="Uvezi podatke" variant="danger" onPress={handleImportPress} disabled={busy} />

                    {busy && <ActivityIndicator style={{ marginTop: 20 }} />}

                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Automatski backup (zadnjih 5 dana)</Text>
                    {autoBackups.length === 0 && <Text style={styles.counter}>Još nema automatskih kopija.</Text>}
                    {autoBackups.map(f => (
                        <AppButton key={f} title={f.replace('backup-', '').replace('.json', '')} variant="secondary" onPress={() => handleRestoreAuto(f)} disabled={busy} />
                    ))}

                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Gemini API ključ</Text>
                    <Text style={styles.counter}>
                        {usingCustomKey ? 'Koristiš svoj vlastiti ključ.' : 'Koristiš podrazumijevani ključ iz aplikacije.'}
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="AIzaSy..."
                        value={apiKeyInput}
                        onChangeText={setApiKeyInput}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                    <AppButton title="Sačuvaj moj ključ" variant="secondary" onPress={handleSaveKey} />
                    {usingCustomKey && <AppButton title="Ukloni moj ključ" variant="danger" onPress={handleClearKey} />}

                    <View style={styles.divider} />
                    <AppButton title="Nazad" variant="secondary" onPress={onExit} />
                </View>
            </ScrollView>
        </ScreenBackground>
    );
}
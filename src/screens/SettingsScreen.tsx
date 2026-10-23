import { useEffect, useState } from "react";
import { exportBackup, pickAndImportBackup } from "../utils/backup";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenBackground } from "../components/ScreenBackground";
import { styles } from "../styles/styles";
import { AppButton } from "../components/AppButton";
import { setLeechThreshold, setMaxNewCardsPerDay, setcoinsPerPage, Stats } from "../db/database";
import { listAutoBackups, restoreAutoBackup } from "../utils/autoBackup";
import { clearApiKey, hasCustomApiKey, setApiKey } from "../utils/apiKey";
import { getLLMConfig, LLMConfig, PROVIDER_PRESETS, setLLMConfig } from "../utils/llmConfig";

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
    const [config, setConfigState] = useState<LLMConfig>({ baseUrl: '', apiKey: '', model: '' });

    const [pagesUnitInput, setPagesUnitInput] = useState(String(stats?.coinsPerPage ?? 5));

    useEffect(() => {
        listAutoBackups().then(setAutoBackups);
        hasCustomApiKey().then(setUsingCustomKey);
        getLLMConfig().then(setConfigState);
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

    function handleSavePagesUnit() {
        const parsed = parseInt(pagesUnitInput, 10);
        if (isNaN(parsed)) return;
        onStatsChange(setcoinsPerPage(parsed));
    }

    async function handleSaveConfig() {
        await setLLMConfig(config);
        Alert.alert('Sačuvano', 'Podešavanja LLM provajdera su ažurirana.');
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

                    <Text style={styles.counter}>Broj uzastopnih "Opet" ocjena prije nego se kartica izbaci iz dnevne rotacije:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={thresholdInput}
                        onChangeText={setThresholdInput}
                    />
                    <AppButton title="Sačuvaj prag" variant="secondary" onPress={handleSaveThreshold} />

                    <Text style={styles.counter}>XP/coins po pročitanoj stranici:</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={pagesUnitInput} onChangeText={setPagesUnitInput} />
                    <AppButton title="Sačuvaj" variant="secondary" onPress={handleSavePagesUnit} />

                    <View style={styles.divider} />

                    <Text style={styles.counter}>
                        Izvezi sve podatke (pitanja, špilove, napredak) u jedan fajl koji možeš prenijeti na drugi uređaj.
                    </Text>
                    <AppButton title="Izvezi podatke" onPress={handleExport} disabled={busy} />

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

                    <Text style={styles.sectionTitle}>LLM provajder</Text>
                    <View style={styles.chipRow}>
                        {PROVIDER_PRESETS.map(p => (
                            <AppButton
                                key={p.label}
                                title={p.label}
                                variant="secondary"
                                onPress={() => setConfigState(prev => ({ ...prev, baseUrl: p.baseUrl, model: p.model }))}
                            />
                        ))}
                    </View>
                    <Text style={styles.label}>Base URL:</Text>
                    <TextInput style={styles.input} value={config.baseUrl} onChangeText={v => setConfigState(prev => ({ ...prev, baseUrl: v }))} autoCapitalize="none" />
                    <Text style={styles.label}>Model:</Text>
                    <TextInput style={styles.input} value={config.model} onChangeText={v => setConfigState(prev => ({ ...prev, model: v }))} autoCapitalize="none" />
                    <Text style={styles.label}>API ključ:</Text>
                    <TextInput style={styles.input} value={config.apiKey} onChangeText={v => setConfigState(prev => ({ ...prev, apiKey: v }))} secureTextEntry autoCapitalize="none" />
                    <AppButton title="Sačuvaj provajdera" onPress={handleSaveConfig} />

                    <View style={styles.divider} />

                    <AppButton title="Nazad" variant="secondary" onPress={onExit} />
                </View>
            </ScrollView>
        </ScreenBackground>
    );
}
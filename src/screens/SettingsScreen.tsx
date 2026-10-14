import { useState } from "react";
import { exportBackup, pickAndImportBackup } from "../utils/backup";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { ScreenBackground } from "../components/ScreenBackground";
import { styles } from "../styles/styles";
import { AppButton } from "../components/AppButton";

type Props = {
    onImported: () => void;
    onExit: () => void;
};

export function SettingsScreen({ onImported, onExit }: Props) {
    const [busy, setBusy] = useState(false);

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

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>Podešavanja</Text>

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
                <AppButton title="Nazad" variant="secondary" onPress={onExit} />
            </View>
        </ScreenBackground>
    );
}
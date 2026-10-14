import { View, Text, Button, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { styles } from '../styles/styles';
import { QuestionCard } from '../components/QuestionCard';
import type { Question } from '../api/gemini';
import { ManualEntryForm } from '../components/ManualEntryForm';
import { DeckCreateForm } from '../components/DeckCreateForm';
import { useState } from 'react';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { colors } from '../styles/theme';
import { DeckStats } from '../db/database';
import { DeckSelector } from '../components/DeckSelector';
//import { pickAndReadPdf } from '../utils/pdfReader';

type Section = 'generate' | 'manual' | 'manage';

type Props = {
    text: string;
    onChangeText: (t: string) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string;
    saved: number;
    deckName: string | undefined;
    pendingQueue: Question[];
    onAccept: () => void;
    onReject: () => void;
    onManualAdd: (question: string, answer: string, questionImages: string[], answerImages: string[]) => void;
    onCreateDeck: (name: string) => void;
    selectedDeckId: number | null;
    navigation: any;
    decks: DeckStats[];
    onSelectDeck: (id: number) => void;
};

export function AddScreen({
    text, onChangeText, onSubmit, loading, error, saved, deckName, pendingQueue, onAccept, onReject, onManualAdd, onCreateDeck, selectedDeckId, navigation, decks, onSelectDeck }: Props) {
    const [section, setSection] = useState<Section>('generate');
    const currentQuestion = pendingQueue[0];
    const activeSection = currentQuestion ? 'generate' : section;

    /*async function handlePickPdf() {
        try {
            const extractedText = await pickAndReadPdf();
            if (extractedText)
                onPdfLoaded(extractedText);
        } catch (e: any) {
            console.log('PDF greška:', e.message);
        }
    }*/

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.chipRow}>
                    {(['generate', 'manual', 'manage'] as Section[]).map(s => (
                        <AppButton
                            key={s}
                            title={s === 'generate' ? 'Generiši' : s === 'manual' ? 'Ručno' : 'Uredi kartice'}
                            variant={activeSection === s ? 'primary' : 'secondary'}
                            onPress={() => setSection(s)}
                            disabled={!!currentQuestion && s !== 'generate'}
                        />
                    ))}
                </View>

                <DeckSelector decks={decks} selectedDeckId={selectedDeckId} onSelect={onSelectDeck} />

                <View style={styles.divider} />

                {activeSection === 'generate' && !currentQuestion && (
                    <>
                        <Text style={styles.sectionTitle}>Novo gradivo</Text>
                        <Text style={styles.label}>Unesi tekst:</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Zalijepi tekst ovdje..."
                            placeholderTextColor={colors.inkMuted}
                            value={text}
                            onChangeText={onChangeText}
                        />
                        <AppButton title="Generiši pitanja" onPress={onSubmit} disabled={loading} />
                        {error !== '' && <Text style={styles.error}>{error}</Text>}
                    </>
                )}

                {currentQuestion && (
                    <View style={styles.reviewArea}>
                        <Text style={styles.sectionTitle}>Pregled</Text>
                        <Text style={styles.counter}>Preostalo za pregled: {pendingQueue.length}</Text>
                        <QuestionCard question={currentQuestion.question} answer={currentQuestion.answer} />
                        <View style={styles.buttonRow}>
                            <AppButton title="Odbaci" variant="danger" onPress={onReject} />
                            <AppButton title="Prihvati" onPress={onAccept} />
                        </View>
                    </View>
                )}

                {activeSection === 'manual' && !currentQuestion && (
                    <>
                        <Text style={styles.sectionTitle}>Ručni unos</Text>
                        <ManualEntryForm onAdd={onManualAdd} />
                    </>
                )}

                {activeSection === 'manage' && !currentQuestion && (
                    <>
                        <Text style={styles.sectionTitle}>Špilovi</Text>
                        <DeckCreateForm onCreate={onCreateDeck} />
                        <AppButton
                            title="Otvori i uredi kartice trenutnog špila"
                            variant="secondary"
                            onPress={() => navigation.navigate('ManageDeck', { deckId: selectedDeckId })}
                        />
                    </>
                )}
            </ScrollView>
        </ScreenBackground>
    );
}
import { View, Text, Button, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { styles } from '../styles/styles';
import { QuestionCard } from '../components/QuestionCard';
import { DEFAULT_INSTRUCTION, type Question } from '../api/llm';
import { ManualEntryForm } from '../components/ManualEntryForm';
import { DeckCreateForm } from '../components/DeckCreateForm';
import { useState } from 'react';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { colors } from '../styles/theme';
import { DeckStats } from '../db/database';
import { DeckSelector } from '../components/DeckSelector';
//import { pickAndReadPdf } from '../utils/pdfReader';

type Props = {
    text: string;
    onChangeText: (t: string) => void;
    onSubmit: (instruction?: string, withCardType?: boolean) => void;
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
    onBulkAdd: (items: { question: string; answer: string; cardType?: string }[]) => void;
};

const PROMPT_PRESETS: { label: string; instruction: string; withCardType?: boolean }[] = [
    { label: 'Standardno', instruction: DEFAULT_INSTRUCTION },
    { label: 'Trag koda', instruction: 'Na osnovu sljedećeg teksta (koji sadrži isječke koda), napravi 5 pitanja gdje korisnik treba da predvidi tačan izlaz ili ponašanje koda. Svako pitanje treba imati kratak, jasan odgovor.' },
    { label: 'Definicije', instruction: 'Na osnovu sljedećeg teksta, napravi 5 pitanja koja traže preciznu definiciju ključnih pojmova. Svako pitanje treba imati kratak, jasan odgovor.' },
    { label: 'Poređenje', instruction: 'Na osnovu sljedećeg teksta, napravi 5 pitanja koja traže poređenje ili razliku između dva povezana pojma. Svako pitanje treba imati kratak, jasan odgovor.' },
    { label: 'Primjena', instruction: 'Na osnovu sljedećeg teksta, napravi 5 pitanja koja traže primjenu koncepta na nov primjer ili scenario, ne samo ponavljanje definicije. Svako pitanje treba imati kratak, jasan odgovor.' },
    { label: 'Narativni tekst', instruction: 'Tekst je narativnog/opisnog karaktera, ne nabrajanje. Za svako pitanje OBAVEZNO uključi u sam tekst pitanja dovoljno konteksta (naziv teme, trenda ili koncepta na koji se odnosi) da pitanje ima smisla samostalno, bez uvida u izvorni tekst ili druga pitanja. Daj prednost pitanjima oblika "zašto" i "kako", ne samo "šta". Odgovor treba uključivati kratko obrazloženje uzroka/posljedice, ne samo gol podatak. Izbjegavaj pitanja o izolovanim sitnim detaljima (datumima, imenima) bez objašnjenja zašto su bitni.' }
];

type Section = 'manual' | 'generate' | 'manage';
const SECTION_ORDER: Section[] = ['manual', 'generate', 'manage'];
const SECTION_LABELS: Record<Section, string> = { manual: 'Ručno', generate: 'Generiši', manage: 'Uredi kartice' };

export function AddScreen({
    text, onChangeText, onSubmit, loading, error, saved, deckName, pendingQueue, onAccept, onReject, onManualAdd, onCreateDeck, selectedDeckId, navigation, decks, onSelectDeck, onBulkAdd }: Props) {
    const [section, setSection] = useState<Section>('manual');
    const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
    const [withCardType, setWithCardType] = useState(false);
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
                    {SECTION_ORDER.map(s => (
                        <AppButton
                            key={s}
                            title={SECTION_LABELS[s]}
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
                        <Text style={styles.label}>Vrsta pitanja:</Text>
                        <View style={localStyles.presetGrid}>
                            {PROMPT_PRESETS.map(p => (
                                <View key={p.label} style={localStyles.presetItem}>
                                    <AppButton
                                        title={p.label}
                                        variant={instruction === p.instruction ? 'primary' : 'secondary'}
                                        onPress={() => { setInstruction(p.instruction); setWithCardType(!!p.withCardType); }}
                                    />
                                </View>
                            ))}
                        </View>

                        <Text style={styles.label}>Uputstvo za generisanje (možeš izmijeniti):</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                            multiline
                            value={instruction}
                            onChangeText={setInstruction}
                        />
                        <Text style={styles.label}>Unesi tekst:</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Zalijepi tekst ovdje..."
                            placeholderTextColor={colors.inkMuted}
                            value={text}
                            onChangeText={onChangeText}
                        />
                        <AppButton title="Generiši pitanja" onPress={() => onSubmit(instruction, withCardType)} disabled={loading} />
                        {error !== '' && <Text style={styles.error}>{error}</Text>}
                    </>
                )}

                {currentQuestion && (
                    <View style={styles.reviewArea}>
                        <Text style={styles.sectionTitle}>Pregled</Text>
                        <Text style={styles.counter}>Preostalo za pregled: {pendingQueue.length}</Text>
                        <QuestionCard
                            question={currentQuestion.question}
                            answer={currentQuestion.answer}
                            questionImages={currentQuestion.questionImages}
                            answerImages={currentQuestion.answerImages}
                        />                        <View style={styles.buttonRow}>
                            <AppButton title="Odbaci" variant="danger" onPress={onReject} />
                            <AppButton title="Prihvati" onPress={onAccept} />
                        </View>
                    </View>
                )}

                {activeSection === 'manual' && !currentQuestion && (
                    <>
                        <ManualEntryForm onAdd={onManualAdd} onBulkAdd={onBulkAdd} />
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

const localStyles = StyleSheet.create({
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    presetItem: {
        width: '31%',
    },
});
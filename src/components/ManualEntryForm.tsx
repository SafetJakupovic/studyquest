import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from '../styles/styles';
import { ImageListPicker } from './ImageListPicker';
import { AppButton } from './AppButton';
import { parseBulkText } from '../utils/bulkParse';
import { downloadAllIfRemote } from '../utils/downloadImage';

type Props = {
    onAdd: (question: string, answer: string, questionImages: string[], answerImages: string[]) => void;
    onBulkAdd: (items: { question: string; answer: string; cardType?: string }[]) => void;
};

export function ManualEntryForm({ onAdd, onBulkAdd }: Props) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [questionImages, setQuestionImages] = useState<string[]>([]);
    const [answerImages, setAnswerImages] = useState<string[]>([]);

    const [bulkText, setBulkText] = useState('');
    const [bulkMode, setBulkMode] = useState(false);

    const [downloading, setDownloading] = useState(false);

    async function handleBulkImport() {
        const parsed = parseBulkText(bulkText);
        if (parsed.length === 0) return;
        setDownloading(true);
        try {
            const parsed = parseBulkText(bulkText);
            if (parsed.length === 0) return;

            const withLocalImages = await Promise.all(
                parsed.map(async (p) => ({
                    ...p,
                    questionImages: await downloadAllIfRemote(p.questionImages),
                    answerImages: await downloadAllIfRemote(p.answerImages),
                }))
            );

            onBulkAdd(withLocalImages.map(p => ({ question: p.question, answer: p.answer, cardType: p.type, questionImages: p.questionImages, answerImages: p.answerImages })));
            setBulkText('');
        } finally {
            setDownloading(false);
        }
    }

    function handleAdd() {
        if (question.trim() === '' || answer.trim() === '') return;
        onAdd(question.trim(), answer.trim(), questionImages, answerImages);
        setQuestion(''); setAnswer(''); setQuestionImages([]); setAnswerImages([]);
    }



    return (
        <View style={{ width: '100%', marginTop: 15 }}>

            <View style={styles.buttonRow}>
                <AppButton title="Jedno po jedno" variant={!bulkMode ? 'primary' : 'secondary'} onPress={() => setBulkMode(false)} />
                <AppButton title="Masovni unos" variant={bulkMode ? 'primary' : 'secondary'} onPress={() => setBulkMode(true)} />
            </View>

            {bulkMode ? (
                <>
                    <TextInput
                        style={[styles.input, { minHeight: 180, textAlignVertical: 'top' }]}
                        multiline
                        placeholder={'P: Pitanje...\nO: Odgovor...\nIMG_Q: https://link-za-sliku-uz-pitanje.jpg\nIMG_A: https://link-za-sliku-uz-odgovor.jpg\n\nP: Sljedeće pitanje...\nO: Odgovor...'}
                        value={bulkText}
                        onChangeText={setBulkText}
                    />

                    <AppButton title={downloading ? 'Preuzimam slike...' : 'Učitaj listu'} onPress={handleBulkImport} disabled={downloading} />
                </>
            ) : (
                <>
                    <Text style={styles.label}>Ručno dodaj pitanje:</Text>
                    <Text style={styles.counter}>Ubaci "{'{{slika}}'}" gdje želiš sliku (redom kako dodaješ slike ispod)</Text>
                    <TextInput style={styles.input} placeholder="Pitanje..." value={question} onChangeText={setQuestion} />
                    <ImageListPicker label="pitanje" uris={questionImages} onChange={setQuestionImages} />

                    <TextInput style={styles.input} placeholder="Odgovor..." value={answer} onChangeText={setAnswer} />
                    <ImageListPicker label="odgovor" uris={answerImages} onChange={setAnswerImages} />

                    <AppButton title="Dodaj pitanje" onPress={handleAdd} />
                </>
            )}
        </View>
    );
}
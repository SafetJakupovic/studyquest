import { useState, useEffect } from 'react';
import { styles } from './src/styles/styles';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TextInput, Button, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { generateQuestions, Question } from './src/api/gemini';
import { initDatabase, insertQuestions, getAllQuestions, StoredQuestion } from './src/db/database';
import { fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import { getDueQuestions, updateCardAfterReview, getQuestionById, DeckStats, getDeckStats, createDeck, getStats, applyReviewReward, Stats } from './src/db/database';
import { StatsBar } from './src/components/StatsBar';
import { ManualEntryForm } from './src/components/ManualEntryForm';
import { QuestionCard } from './src/components/QuestionCard';
import { DeckPicker } from './src/components/DeckPicker';

const scheduler = fsrs(generatorParameters());
const SESSION_WINDOW_MS = 20 * 60 * 1000; // pitanja koja su na redu u narednih 20 minuta ostaju u sesiji, da se ne razvlaci puno

export default function App() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<StoredQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // nakon gemini poziva cijeli rezultat ide ovdje, ne u bazu
  const [pendingQueue, setPendingQueue] = useState<Question[]>([]);
  const [pendingSource, setPendingSource] = useState('');

  const [dueQueue, setDueQueue] = useState<StoredQuestion[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);

  const [info, setInfo] = useState('');

  const [decks, setDecks] = useState<DeckStats[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    initDatabase();
    const stats = getDeckStats();
    setDecks(stats);
    setSelectedDeckId(stats[0]?.id ?? null);
    setStats(getStats());
    setSaved(getAllQuestions());
  }, []);
  // [] znaci samo jednom pokrenuti, ne pri svakom re-renderu

  function refreshDecks() {
    setDecks(getDeckStats());
  }


  // atp se ne isplati prebacivati jos vise u deck picker, ali barem je iole urednije ovdje pa nema veze, a ne bih (barem za sad?) globalne state menadzere ubacivao
  function handleCreateDeck(name: string) {
    try {
      const id = createDeck(name);
      setSelectedDeckId(id);
      refreshDecks(); // decks se cuva u stateu kao kopija onoga sto je u bazi
      // baza se ne javlja reactu kad se promijeni pa se trebaju opet citati podaci
    } catch (e: any) {
      setError('Špil s tim imenom već postoji.');
    }
  }

  function startSession() {
    if (selectedDeckId === null) return;
    const due = getDueQuestions(selectedDeckId);
    setInfo(due.length === 0 ? 'Nema pitanja za ponavljanje' : '');
    setDueQueue(due);
    setShowAnswer(false);
  }

  function handleRate(grade: Grade) {
    const current = dueQueue[0];
    // vadimo iz sqlite i pretvaramo u card kakav fsrs ocekuje pa se datum konvertuje
    const cardBefore: Card = {
      due: new Date(current.due),
      stability: current.stability,
      difficulty: current.difficulty,
      elapsed_days: current.elapsed_days,
      scheduled_days: current.scheduled_days,
      learning_steps: current.learning_steps,
      reps: current.reps,
      lapses: current.lapses,
      state: current.state,
      last_review: current.last_review ? new Date(current.last_review) : undefined,
    };

    const result = scheduler.next(cardBefore, new Date(), grade);
    updateCardAfterReview(current.id, result.card);
    const dueSoon = result.card.due.getTime() - Date.now() <= SESSION_WINDOW_MS;

    if (!dueSoon) {
      const newStats = applyReviewReward(grade);
      setStats(newStats);
    }

    setDueQueue(prev => {
      const rest = prev.slice(1);
      const updated = dueSoon ? getQuestionById(current.id) : null;
      return updated ? [...rest, updated] : rest;
    });

    setSaved(getAllQuestions());
    refreshDecks();
    setShowAnswer(false);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const result = await generateQuestions(text);
      setPendingQueue(result);
      setPendingSource(text);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (selectedDeckId === null) return;
    const current = pendingQueue[0];
    // i dalje se salje niz, samo ce imati jedan element jer se pitanja cuvaju pojedinacno kako se prihvataju
    insertQuestions([{ ...current, sourceText: pendingSource }], selectedDeckId);
    setSaved(getAllQuestions());
    // koristi se umjesto setPendingQueue(pendingQueue.slice(1)) jer je sigurnije kad se state mijenja na osnovu prethodne vrijednosti
    refreshDecks();
    setPendingQueue(prev => prev.slice(1)); // ukloni prvo iz reda
  }

  function handleReject() {
    setPendingQueue(prev => prev.slice(1)); // samo ukloni, ne cuvaj
  }

  function handleManualAdd(question: string, answer: string) {
    if (selectedDeckId === null)
      return;
    insertQuestions([{ question, answer, sourceText: 'ručni unos' }], selectedDeckId);
    setSaved(getAllQuestions());
    refreshDecks();
  }

  // dovoljno da nam sljedecu u nizu bude prvo ako samo izbacujemo iz niza
  const currentQuestion = pendingQueue[0];
  // da se koristio useState za trenutno pitanje koje se prikazuje (da se koristilo i pendingQueue niz i currentIndex broj) pri svakom prihvatanju/odbacivanju morase azurairati oba na ispravan nacin
  // sa pendingQueue[0] postoji samo jedan izvor, a trenutno pitanje je uvijek samo izvedena vrijednost iz njega, ne posebno stanje koje se cuva
  // sve u svemu, sto manje useState, to bolje

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {stats && <StatsBar stats={stats} />}

        <DeckPicker
          decks={decks}
          selectedDeckId={selectedDeckId}
          onSelect={setSelectedDeckId}
          onCreate={handleCreateDeck}
        />

        {pendingQueue.length === 0 && dueQueue.length === 0 && (
          <Button title="Pokreni dnevnu sesiju" onPress={startSession} />
        )}

        <ManualEntryForm onAdd={handleManualAdd} />

        {info !== '' && <Text style={styles.counter}>{info}</Text>}

        {/* sesija ponavljanja */}
        {dueQueue.length > 0 && (
          <View style={styles.reviewArea}>
            <Text style={styles.counter}>Preostalo u sesiji: {dueQueue.length}</Text>
            <QuestionCard
              question={dueQueue[0].question}
              answer={showAnswer ? dueQueue[0].answer : undefined}
            />

            {!showAnswer ? (
              <Button title="Prikazi odgovor" onPress={() => setShowAnswer(true)} />
            ) : (
              <View style={styles.buttonRow}>
                <Button title="Opet" color="#c0392b" onPress={() => handleRate(Rating.Again)} />
                <Button title="Teško" color="#e67e22" onPress={() => handleRate(Rating.Hard)} />
                <Button title="Dobro" color="#27ae60" onPress={() => handleRate(Rating.Good)} />
                <Button title="Lako" color="#2980b9" onPress={() => handleRate(Rating.Easy)} />
              </View>
            )}
          </View>
        )}

        {/* ako nema pending pitanja, prikazi formu za unos gradiva */}
        {pendingQueue.length === 0 && (
          <>
            <Text style={styles.label}>Unesi gradivo:</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Zalijepi tekst ovdje..."
              value={text}
              onChangeText={setText}
            />
            {/* disabled loading da se ne moze kliknuti dva puta dok se generise*/}
            <Text style={styles.counter}>
              Pitanja idu u špil: {decks.find(d => d.id === selectedDeckId)?.name}
            </Text>
            <Button title="Generisi pitanja" onPress={handleSubmit} disabled={loading} />
            <Text>Ukupno sacuvano: {saved.length}</Text>
            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
            {error !== '' && <Text style={styles.error}>Greska: {error}</Text>}
          </>
        )}

        {/* ako ima pending pitanja, prikazi prvo pitanje i dugmice za prihvati/odbaci */}
        {currentQuestion && (
          <View style={styles.reviewArea}>
            <Text style={styles.counter}>Preostalo za pregled: {pendingQueue.length}</Text>
            <QuestionCard
              question={currentQuestion.question}
              answer={currentQuestion.answer}
            />
            <View style={styles.buttonRow}>
              <Button title="Odbaci" color="#c0392b" onPress={handleReject} />
              <Button title="Prihvati" color="#27ae60" onPress={handleAccept} />
            </View>
          </View>
        )}

        <StatusBar style="auto" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
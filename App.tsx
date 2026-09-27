import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { generateQuestions, Question } from './src/api/gemini';
import { initDatabase, insertQuestions, getAllQuestions, StoredQuestion } from './src/db/database';

export default function App() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<StoredQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // nakon gemini poziva cijeli rezultat ide ovdje, ne u bazu
  const [pendingQueue, setPendingQueue] = useState<Question[]>([]);
  const [pendingSource, setPendingSource] = useState('');


  useEffect(() => {
    initDatabase();
    setSaved(getAllQuestions());
  }, []);
  // [] znaci samo jednom pokrenuti, ne pri svakom re-renderu

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
    const current = pendingQueue[0];
    // i dalje se salje niz, samo ce imati jedan element jer se pitanja cuvaju pojedinacno kako se prihvataju
    insertQuestions([{ ...current, sourceText: pendingSource }]);
    setSaved(getAllQuestions());
    // koristi se umjesto setPendingQueue(pendingQueue.slice(1)) jer je sigurnije kad se state mijenja na osnovu prethodne vrijednosti
    setPendingQueue(prev => prev.slice(1)); // ukloni prvo iz reda
  }

  function handleReject() {
    setPendingQueue(prev => prev.slice(1)); // samo ukloni, ne cuvaj
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
            <View style={styles.card}>
              <Text style={styles.question}>{currentQuestion.question}</Text>
              <Text style={styles.answer}>{currentQuestion.answer}</Text>
            </View>
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 60,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '100%',
    minHeight: 100,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  output: {
    marginTop: 20,
    fontSize: 14,
  },
  card: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    minHeight: 120,
  },
  question: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  answer: {
    marginTop: 8,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  reviewArea: {
    width: '100%',
    alignItems: 'center',
  },
  counter: {
    fontSize: 14,
    marginTop: 10,
    color: '#555',
  }
});
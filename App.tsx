import { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { generateQuestions, Question } from './src/api/gemini';
import { initDatabase, insertQuestions, getAllQuestions, StoredQuestion, QuestionWithImages } from './src/db/database';
import { fsrs, generatorParameters, type Card, type Grade } from 'ts-fsrs';
import { getDueQuestions, updateCardAfterReview, getQuestionById, DeckStats, getDeckStats, createDeck, getStats, applyReviewReward, Stats } from './src/db/database';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StudyScreen } from './src/screens/StudyScreen';
import { AddScreen } from './src/screens/AddScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BossFightScreen } from './src/screens/BossFightScreen';
import { ManageDeckScreen } from './src/screens/ManageDeckScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Lora_400Regular, Lora_600SemiBold } from '@expo-google-fonts/lora';
import { View, ActivityIndicator } from 'react-native';
import { colors, fonts } from './src/styles/theme';
import { CustomTabBar } from './src/components/CustomTabBar';
import { SettingsScreen } from './src/screens/SettingsScreen';

const scheduler = fsrs(generatorParameters());
const SESSION_WINDOW_MS = 20 * 60 * 1000; // pitanja koja su na redu u narednih 20 minuta ostaju u sesiji, da se ne razvlaci puno
const Tab = createBottomTabNavigator();

type RootStackParamList = {
  MainTabs: undefined;
  BossFight: undefined;
  ManageDeck: { deckId: number };
  Settings: undefined;
}
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Lora_400Regular,
    Lora_600SemiBold,
  });

  const [text, setText] = useState('');
  const [saved, setSaved] = useState<StoredQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // nakon gemini poziva cijeli rezultat ide ovdje, ne u bazu
  const [pendingQueue, setPendingQueue] = useState<Question[]>([]);
  const [pendingSource, setPendingSource] = useState('');

  const [dueQueue, setDueQueue] = useState<QuestionWithImages[]>([]);
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

  const refreshDecks = useCallback(() => {
    setDecks(getDeckStats());
  }, []);


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

  /*function handlePdfLoaded(extractedText: string) {
    setText(extractedText);
  }*/

  function handleManualAdd(question: string, answer: string, questionImages: string[], answerImages: string[]) {
    if (selectedDeckId === null)
      return;
    insertQuestions([{ question, answer, sourceText: 'ručni unos', questionImages, answerImages }], selectedDeckId);
    setSaved(getAllQuestions());
    refreshDecks();
  }

  function handleSelectDeck(id: number) {
    setSelectedDeckId(id);
    if (dueQueue.length > 0) {
      const due = getDueQuestions(id);
      setInfo(due.length === 0 ? 'Nema pitanja za ponavljanje' : '');
      setDueQueue(due);
      setShowAnswer(false);
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1B140F' }}>
        <ActivityIndicator color="#B08D57" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'fullScreenModal' }}>
        <Stack.Screen name="MainTabs">
          {() => (
            <Tab.Navigator
              tabBar={(props) => <CustomTabBar {...props} />}
              screenOptions={{ headerShown: false }}>
              <Tab.Screen name="Učenje">
                {({ navigation }) => (
                  <StudyScreen
                    decks={decks}
                    selectedDeckId={selectedDeckId}
                    onSelectDeck={handleSelectDeck}
                    dueQueue={dueQueue}
                    showAnswer={showAnswer}
                    onStartSession={startSession}
                    onShowAnswer={() => setShowAnswer(true)}
                    onRate={handleRate}
                    info={info}
                    navigation={navigation}
                    onFocus={refreshDecks}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen name="Aktivnost">
                {() => <ActivityScreen stats={stats} onStatsChange={setStats} />}
              </Tab.Screen>

              <Tab.Screen name="Dodaj">
                {({ navigation }) => (
                  <AddScreen
                    text={text}
                    onChangeText={setText}
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                    saved={saved.length}
                    deckName={decks.find(d => d.id === selectedDeckId)?.name}
                    pendingQueue={pendingQueue}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onManualAdd={handleManualAdd}
                    onCreateDeck={handleCreateDeck}
                    selectedDeckId={selectedDeckId}
                    navigation={navigation}
                    decks={decks}
                    onSelectDeck={setSelectedDeckId}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen name="Nagrade">
                {({ navigation }) =>
                  <RewardsScreen
                    stats={stats}
                    onStatsChange={setStats}
                    navigation={navigation}
                  />}
              </Tab.Screen>
            </Tab.Navigator>
          )}
        </Stack.Screen>

        <Stack.Screen name="BossFight">
          {({ navigation }) => (
            <BossFightScreen
              deckId={selectedDeckId}
              onExit={() => navigation.goBack()}
              onFinish={(newStats) => {
                setStats(newStats);
                navigation.goBack();
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ManageDeck">
          {({ navigation, route }) => (
            <ManageDeckScreen
              deckId={route.params.deckId}
              deckName={decks.find(d => d.id === route.params.deckId)?.name ?? ''}
              onExit={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Settings">
          {({ navigation }) => (
            <SettingsScreen
              onExit={() => navigation.goBack()}
              onImported={() => {
                const deckStats = getDeckStats();
                setDecks(deckStats);
                setSelectedDeckId(deckStats[0]?.id ?? null);
                setStats(getStats());
                setSaved(getAllQuestions());
                setDueQueue([]);
                setPendingQueue([]);
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
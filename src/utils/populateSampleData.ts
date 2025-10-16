import { collection, doc, getDocs, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { sampleQuestions, sampleQuizzes } from '../data/sampleQuizzes';

export const populateSampleData = async (): Promise<void> => {
  try {
    console.log('Starting sample data population...');

    // Add sample questions to Firestore
    const questionsBatch = writeBatch(firestore);
    const questionsCollection = collection(firestore, 'questions');

    sampleQuestions.forEach((question) => {
      const questionRef = doc(questionsCollection, question.id);
      questionsBatch.set(questionRef, {
        ...question,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await questionsBatch.commit();
    console.log(`✅ Added ${sampleQuestions.length} sample questions`);

    // Add sample quizzes to Firestore
    const quizzesBatch = writeBatch(firestore);
    const quizzesCollection = collection(firestore, 'quizzes');

    sampleQuizzes.forEach((quiz) => {
      const quizRef = doc(quizzesCollection, quiz.id);
      quizzesBatch.set(quizRef, {
        ...quiz,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await quizzesBatch.commit();
    console.log(`✅ Added ${sampleQuizzes.length} sample quizzes`);

    // Initialize global leaderboard
    const leaderboardDoc = doc(firestore, 'leaderboards', 'global');
    await setDoc(leaderboardDoc, {
      lastUpdated: Timestamp.now(),
      totalPlayers: 0,
    });

    console.log('✅ Initialized global leaderboard');

    console.log('🎉 Sample data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Questions: ${sampleQuestions.length}`);
    console.log(`   • Quizzes: ${sampleQuizzes.length}`);
    console.log(`   • Themes: ${[...new Set(sampleQuestions.map(q => q.theme))].length}`);

  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    throw error;
  }
};

// Function to clear all sample data (for testing)
export const clearSampleData = async (): Promise<void> => {
  try {
    console.log('🗑️ Clearing sample data...');

    // Delete all questions
    const questionsCollection = collection(firestore, 'questions');
    const questionsSnapshot = await getDocs(questionsCollection);
    const questionsBatch = writeBatch(firestore);

    questionsSnapshot.docs.forEach((docSnap) => {
      questionsBatch.delete(docSnap.ref);
    });

    await questionsBatch.commit();

    // Delete all quizzes
    const quizzesCollection = collection(firestore, 'quizzes');
    const quizzesSnapshot = await getDocs(quizzesCollection);
    const quizzesBatch = writeBatch(firestore);

    quizzesSnapshot.docs.forEach((docSnap) => {
      quizzesBatch.delete(docSnap.ref);
    });

    await quizzesBatch.commit();

    // Clear leaderboard
    const leaderboardDoc = doc(firestore, 'leaderboards', 'global');
    const scoresCollection = collection(leaderboardDoc, 'scores');
    const leaderboardSnapshot = await getDocs(scoresCollection);

    const leaderboardBatch = writeBatch(firestore);
    leaderboardSnapshot.docs.forEach((docSnap) => {
      leaderboardBatch.delete(docSnap.ref);
    });

    await leaderboardBatch.commit();

    console.log('✅ Sample data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
    throw error;
  }
};
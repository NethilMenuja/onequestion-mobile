import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

type SavedAnswer = {
  id: number;
  answer: string;
  name: string;
  country: string;
  question_id: number;
};

export default function SavedScreen() {
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedAnswers = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavedAnswers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        id,
        answer_id,
        created_at,
        answers (
          id,
          answer,
          name,
          country,
          question_id
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Saved answers error:", error);
      setSavedAnswers([]);
      setLoading(false);
      return;
    }

    const answers = (data ?? [])
      .map((item: any) => item.answers)
      .filter(Boolean);

    setSavedAnswers(answers);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedAnswers();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading saved answers...
        </Text>
      </View>
    );
  }

  if (savedAnswers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saved</Text>

        <Text style={styles.subtitle}>
          Your saved answers will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved</Text>

      <FlatList
        data={savedAnswers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.answer}>
              {item.answer}
            </Text>

            <Text style={styles.name}>
              — {item.name}
            </Text>

            <Text style={styles.country}>
              {item.country}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginTop: 10,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
  },

  list: {
    paddingTop: 15,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  answer: {
    fontSize: 16,
    lineHeight: 24,
    color: "#ffffff",
  },

  name: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },

  country: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
});
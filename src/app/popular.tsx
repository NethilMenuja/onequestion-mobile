import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Period = "today" | "week" | "all";

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  name: string;
  country: string;
  user_id: string | null;
  created_at: string;
};

type LikeRow = {
  answer_id: number;
  user_id?: string | null;
  created_at?: string | null;
};

type ReactionRow = {
  answer_id: number;
  reaction_type?: string | null;
  user_id?: string | null;
  created_at?: string | null;
};

type PopularAnswer = Answer & {
  reactionCount: number;
};

const PAGE_SIZE = 1000;

export default function PopularPage() {
  const params = useLocalSearchParams();

  const getPeriodFromParams = (): Period => {
    const value = Array.isArray(params.period)
      ? params.period[0]
      : params.period;

    if (value === "week") return "week";
    if (value === "all") return "all";

    return "today";
  };

  const [period, setPeriod] = useState<Period>(getPeriodFromParams());
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setPeriod(getPeriodFromParams());
  }, [params.period]);

  useEffect(() => {
    loadPopularData();
  }, []);

  const loadAllAnswers = async () => {
    let allAnswers: Answer[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("answers")
        .select(
          "id, question_id, answer, name, country, user_id, created_at"
        )
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      const rows = (data || []) as Answer[];

      allAnswers = [...allAnswers, ...rows];

      if (rows.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
    }

    return allAnswers;
  };

  const loadAllLikes = async () => {
    let allLikes: LikeRow[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("likes")
        .select("answer_id, user_id, created_at")
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      const rows = (data || []) as LikeRow[];

      allLikes = [...allLikes, ...rows];

      if (rows.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
    }

    return allLikes;
  };

  const loadAllReactions = async () => {
    let allReactions: ReactionRow[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("reactions")
        .select("answer_id, reaction_type, user_id, created_at")
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      const rows = (data || []) as ReactionRow[];

      allReactions = [...allReactions, ...rows];

      if (rows.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
    }

    return allReactions;
  };

  const loadPopularData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [answersData, likesData, reactionsData] = await Promise.all([
        loadAllAnswers(),
        loadAllLikes(),
        loadAllReactions(),
      ]);

      setAnswers(answersData);
      setLikes(likesData);
      setReactions(reactionsData);
    } catch (error) {
      console.error("Popular data error:", error);
      setErrorMessage("Could not load popular answers.");
    } finally {
      setLoading(false);
    }
  };

  const getPeriodStart = () => {
    const now = new Date();

    if (period === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    if (period === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }

    return null;
  };

  const popularAnswers = useMemo<PopularAnswer[]>(() => {
    const periodStart = getPeriodStart();

    const filteredLikes =
      periodStart === null
        ? likes
        : likes.filter((like) => {
            if (!like.created_at) return false;

            return new Date(like.created_at) >= periodStart;
          });

    const filteredReactions =
      periodStart === null
        ? reactions
        : reactions.filter((reaction) => {
            if (!reaction.created_at) return false;

            return new Date(reaction.created_at) >= periodStart;
          });

    /*
     * Count BOTH tables.
     *
     * likes row       = 1
     * reactions row   = 1
     *
     * We intentionally do NOT check reaction_type.
     * So any future reaction type will automatically count too.
     */
    const counts: Record<number, number> = {};

    filteredLikes.forEach((like) => {
      counts[like.answer_id] = (counts[like.answer_id] || 0) + 1;
    });

    filteredReactions.forEach((reaction) => {
      counts[reaction.answer_id] =
        (counts[reaction.answer_id] || 0) + 1;
    });

    return answers
      .filter((answer) => counts[answer.id] > 0)
      .map((answer) => ({
        ...answer,
        reactionCount: counts[answer.id],
      }))
      .sort((a, b) => {
        if (b.reactionCount !== a.reactionCount) {
          return b.reactionCount - a.reactionCount;
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });
  }, [answers, likes, reactions, period]);

  const filteredAnswers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return popularAnswers;
    }

    return popularAnswers.filter((item) => {
      return (
        item.answer.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.country.toLowerCase().includes(query)
      );
    });
  }, [popularAnswers, search]);

  const periodTitle =
    period === "today"
      ? "Today"
      : period === "week"
      ? "This Week"
      : "All Time";

  const handlePeriodChange = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    setSearch("");

    router.setParams({
      period: nextPeriod,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🔥 Popular Answers</Text>
        <Text style={styles.subtitle}>
          Most reacted answers — {periodTitle}
        </Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              period === "today" && styles.activeTab,
            ]}
            onPress={() => handlePeriodChange("today")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                period === "today" && styles.activeTabText,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              period === "week" && styles.activeTab,
            ]}
            onPress={() => handlePeriodChange("week")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                period === "week" && styles.activeTabText,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              period === "all" && styles.activeTab,
            ]}
            onPress={() => handlePeriodChange("all")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                period === "all" && styles.activeTabText,
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search popular answers..."
          placeholderTextColor="#666666"
          style={styles.searchInput}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : errorMessage ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : filteredAnswers.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              No popular answers yet.
            </Text>
            <Text style={styles.emptyText}>
              Answers will appear here when they receive reactions.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredAnswers.map((item, index) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>
                      #{index + 1}
                    </Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>
                      {item.name}
                    </Text>

                    <Text style={styles.country}>
                      {item.country}
                    </Text>
                  </View>

                  <View style={styles.reactionBadge}>
                    <Text style={styles.reactionEmoji}>
                      🔥
                    </Text>
                    <Text style={styles.reactionCount}>
                      {item.reactionCount}
                    </Text>
                  </View>
                </View>

                <Text style={styles.answer}>
                  {item.answer}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  content: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "#777777",
    fontSize: 13,
    marginTop: 6,
  },

  tabs: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "#111111",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222222",
    padding: 4,
  },

  tab: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },

  activeTab: {
    backgroundColor: "#ffffff",
  },

  tabText: {
    color: "#777777",
    fontSize: 12,
    fontWeight: "600",
  },

  activeTabText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "700",
  },

  searchInput: {
    marginTop: 14,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    color: "#ffffff",
    paddingHorizontal: 15,
    fontSize: 13,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    color: "#666666",
    fontSize: 13,
    textAlign: "center",
    marginTop: 7,
  },

  list: {
    marginTop: 18,
  },

  card: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  rankCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },

  rankText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  cardInfo: {
    flex: 1,
    marginLeft: 11,
  },

  name: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  country: {
    color: "#666666",
    fontSize: 11,
    marginTop: 3,
  },

  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  reactionEmoji: {
    fontSize: 13,
  },

  reactionCount: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  answer: {
    color: "#dddddd",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
});
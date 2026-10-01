import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Contributor = {
  user_id: string;
  name: string;
  country: string;
  answerCount: number;
};

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadContributors();
  }, []);

  const loadContributors = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("answers")
        .select("user_id, name, country");

      if (error) {
        throw error;
      }

      const rows = data || [];

      const contributorMap: Record<
        string,
        {
          user_id: string;
          name: string;
          country: string;
          answerCount: number;
        }
      > = {};

      rows.forEach((row) => {
        if (!row.user_id) return;

        if (!contributorMap[row.user_id]) {
          contributorMap[row.user_id] = {
            user_id: row.user_id,
            name: row.name || "Anonymous",
            country: row.country || "",
            answerCount: 0,
          };
        }

        contributorMap[row.user_id].answerCount += 1;
      });

      const sorted = Object.values(contributorMap).sort(
        (a, b) => b.answerCount - a.answerCount
      );

      setContributors(sorted);
    } catch (error) {
      console.error("Contributors error:", error);
      setErrorMessage("Could not load contributors.");
    } finally {
      setLoading(false);
    }
  };

  const openProfile = (userId: string) => {
  router.push(`/profile?id=${userId}`);
};

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
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

        <Text style={styles.title}>🏆 Contributors</Text>

        <Text style={styles.subtitle}>
          People sharing their answers with the world
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : errorMessage ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : contributors.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              No contributors yet.
            </Text>
          </View>
        ) : (
          <>
            {contributors.length >= 1 && (
              <View style={styles.topSection}>
                <TouchableOpacity
                  style={styles.topCard}
                  onPress={() =>
                    openProfile(contributors[0].user_id)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.topMedal}>🥇</Text>

                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                      {contributors[0].name
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.topName}>
                    {contributors[0].name}
                  </Text>

                  <Text style={styles.topCountry}>
                    {contributors[0].country}
                  </Text>

                  <Text style={styles.topCount}>
                    {contributors[0].answerCount}
                  </Text>

                  <Text style={styles.topCountLabel}>
                    answers
                  </Text>
                </TouchableOpacity>

                {contributors.length >= 2 && (
                  <TouchableOpacity
                    style={styles.topCard}
                    onPress={() =>
                      openProfile(contributors[1].user_id)
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.topMedal}>🥈</Text>

                    <View style={styles.avatarLarge}>
                      <Text style={styles.avatarLargeText}>
                        {contributors[1].name
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.topName}>
                      {contributors[1].name}
                    </Text>

                    <Text style={styles.topCountry}>
                      {contributors[1].country}
                    </Text>

                    <Text style={styles.topCount}>
                      {contributors[1].answerCount}
                    </Text>

                    <Text style={styles.topCountLabel}>
                      answers
                    </Text>
                  </TouchableOpacity>
                )}

                {contributors.length >= 3 && (
                  <TouchableOpacity
                    style={styles.topCard}
                    onPress={() =>
                      openProfile(contributors[2].user_id)
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.topMedal}>🥉</Text>

                    <View style={styles.avatarLarge}>
                      <Text style={styles.avatarLargeText}>
                        {contributors[2].name
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.topName}>
                      {contributors[2].name}
                    </Text>

                    <Text style={styles.topCountry}>
                      {contributors[2].country}
                    </Text>

                    <Text style={styles.topCount}>
                      {contributors[2].answerCount}
                    </Text>

                    <Text style={styles.topCountLabel}>
                      answers
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {contributors.length > 3 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>
                  All Contributors
                </Text>

                {contributors.slice(3).map((contributor, index) => (
                  <TouchableOpacity
                    key={contributor.user_id}
                    style={styles.listCard}
                    onPress={() =>
                      openProfile(contributor.user_id)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rank}>
                      {getMedal(index + 3)}
                    </Text>

                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {contributor.name
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.listInfo}>
                      <Text style={styles.listName}>
                        {contributor.name}
                      </Text>

                      <Text style={styles.listCountry}>
                        {contributor.country}
                      </Text>
                    </View>

                    <View style={styles.answerCountBox}>
                      <Text style={styles.answerCount}>
                        {contributor.answerCount}
                      </Text>

                      <Text style={styles.answerLabel}>
                        answers
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
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
    marginBottom: 20,
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

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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
  },

  topSection: {
    flexDirection: "row",
    gap: 9,
    marginTop: 28,
  },

  topCard: {
    flex: 1,
    minHeight: 205,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 18,
    alignItems: "center",
    paddingTop: 14,
    paddingHorizontal: 6,
  },

  topMedal: {
    fontSize: 25,
    marginBottom: 7,
  },

  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarLargeText: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "800",
  },

  topName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 9,
    textAlign: "center",
  },

  topCountry: {
    color: "#666666",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },

  topCount: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
  },

  topCountLabel: {
    color: "#666666",
    fontSize: 10,
    marginTop: 1,
  },

  listSection: {
    marginTop: 28,
  },

  listTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 15,
    padding: 12,
    marginBottom: 9,
  },

  rank: {
    width: 30,
    color: "#777777",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  listInfo: {
    flex: 1,
    marginLeft: 11,
  },

  listName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  listCountry: {
    color: "#666666",
    fontSize: 11,
    marginTop: 3,
  },

  answerCountBox: {
    alignItems: "flex-end",
  },

  answerCount: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  answerLabel: {
    color: "#666666",
    fontSize: 9,
    marginTop: 2,
  },
});
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

function SettingsIcon() {
  return (
    <Image
      source={{
        uri: "https://img.icons8.com/?size=100&id=UXWIv5G5mWsK&format=png&color=000000",
      }}
      style={styles.settingsIcon}
      resizeMode="contain"
    />
  );
}

export default function SettingsScreen() {
  const animation = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      damping: 18,
      stiffness: 170,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [animation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.page,
          {
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [35, 0],
                }),
              },
              {
                scale: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            Settings
          </Text>

          <View style={styles.headerIcon}>
            <SettingsIcon />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <SettingsIcon />
          </View>

          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>
              Account Settings
            </Text>

            <Text style={styles.cardDescription}>
              More profile and account settings
              will appear here.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backLarge}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backLargeText}>
            Back to Profile
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    color: "#ffffff",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },

  settingsIcon: {
    width: 23,
    height: 23,
    tintColor: "#eeeeee",
  },

  card: {
    backgroundColor: "#111111",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  cardDescription: {
    color: "#777777",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  backLarge: {
    height: 54,
    borderRadius: 17,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  backLargeText: {
    color: "#dddddd",
    fontSize: 15,
    fontWeight: "700",
  },
});
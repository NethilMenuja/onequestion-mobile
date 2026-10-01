import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] =
    useState<"success" | "error">("success");

  const popupScale = useRef(
    new Animated.Value(0.85)
  ).current;

  const popupOpacity = useRef(
    new Animated.Value(0)
  ).current;

  function showPopup(
    title: string,
    message: string,
    type: "success" | "error" = "success"
  ) {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupVisible(true);

    popupScale.setValue(0.85);
    popupOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),

      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closePopup(callback?: () => void) {
    Animated.parallel([
      Animated.timing(popupScale, {
        toValue: 0.85,
        duration: 160,
        useNativeDriver: true,
      }),

      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPopupVisible(false);

      if (callback) {
        callback();
      }
    });
  }

  async function handleLogin() {
    if (!email || !password) {
      showPopup(
        "Missing details",
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        showPopup(
          "Sign In Failed",
          error.message,
          "error"
        );
        return;
      }

      if (!data.user) {
        showPopup(
          "Sign In Failed",
          "Could not sign you in. Please try again.",
          "error"
        );
        return;
      }

      showPopup(
        "Welcome back!",
        "You have signed in successfully.",
        "success"
      );
    } catch (err) {
      console.error("Login error:", err);

      showPopup(
        "Error",
        "Something went wrong. Please try again.",
        "error"
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View style={styles.content}>
        <Text style={styles.logo}>
          ONEQUESTION
        </Text>

        <Text style={styles.title}>
          Welcome back
        </Text>

        <Text style={styles.subtitle}>
          Sign in to continue to ONEQUESTION.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* CUSTOM POPUP */}
      <Modal
        visible={popupVisible}
        transparent
        animationType="none"
        onRequestClose={() => closePopup()}
      >
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popupCard,
              {
                opacity: popupOpacity,
                transform: [
                  {
                    scale: popupScale,
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.popupIcon,
                popupType === "success"
                  ? styles.popupSuccess
                  : styles.popupError,
              ]}
            >
              <Text style={styles.popupIconText}>
                {popupType === "success"
                  ? "✓"
                  : "!"}
              </Text>
            </View>

            <Text style={styles.popupTitle}>
              {popupTitle}
            </Text>

            <Text style={styles.popupMessage}>
              {popupMessage}
            </Text>

            <TouchableOpacity
              style={styles.popupButton}
              onPress={() =>
                closePopup(
                  popupTitle ===
                    "Welcome back!"
                    ? () =>
                        router.replace(
                          "/(tabs)"
                        )
                    : undefined
                )
              }
              activeOpacity={0.85}
            >
              <Text
                style={styles.popupButtonText}
              >
                {popupTitle ===
                "Welcome back!"
                  ? "Continue"
                  : "Okay"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 90,
  },

  logo: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },

  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 60,
  },

  subtitle: {
    color: "#888888",
    fontSize: 15,
    marginTop: 10,
    marginBottom: 32,
  },

  input: {
    height: 54,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 16,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 14,
  },

  loginButton: {
    height: 54,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  loginText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },

  backButton: {
    alignItems: "center",
    marginTop: 22,
    padding: 12,
  },

  backText: {
    color: "#999999",
    fontSize: 15,
  },

  /* POPUP */

  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  popupCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#111111",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#292929",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 15,
  },

  popupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  popupSuccess: {
    backgroundColor: "#183b29",
    borderWidth: 1,
    borderColor: "#2e8b57",
  },

  popupError: {
    backgroundColor: "#3b1919",
    borderWidth: 1,
    borderColor: "#8b3030",
  },

  popupIconText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
  },

  popupTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  popupMessage: {
    color: "#999999",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },

  popupButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  popupButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "800",
  },
});
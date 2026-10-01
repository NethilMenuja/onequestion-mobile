import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "@/lib/supabase";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSignup() {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        return;
      }

      if (!data.user) {
        Alert.alert(
          "Sign Up",
          "Account could not be created. Please try again."
        );
        return;
      }

      Alert.alert(
        "Account Created",
        "Your account has been created successfully.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (err) {
      console.error("Signup error:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>ONEQUESTION</Text>

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join ONEQUESTION and share your answer with the world.
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

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#666666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSignup}
          activeOpacity={0.8}
        >
          <Text style={styles.signupText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 70,
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
    marginTop: 50,
  },
  subtitle: {
    color: "#888888",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 30,
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
  signupButton: {
    height: 54,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signupText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  loginButton: {
    alignItems: "center",
    marginTop: 22,
    padding: 10,
  },
  loginText: {
    color: "#ffffff",
    fontSize: 15,
  },
  backButton: {
    alignItems: "center",
    marginTop: 8,
    padding: 10,
  },
  backText: {
    color: "#777777",
    fontSize: 15,
  },
});
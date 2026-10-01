import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";



import { COUNTRIES, Country, getFlag } from "@/constants/countries";
import { supabase } from "@/lib/supabase";

type Question = {
  id: number;
  question: string;
  question_date: string;
};

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  name: string;
  country: string;
  user_id: string | null;
  created_at: string;
};

type ContributorPreview = {
  user_id: string;
  name: string;
  answerCount: number;
};

type ReactionRow = {
  id: number;
  answer_id: number;
  user_id: string;
  reaction_type: string;
  created_at: string;
};

type Reply = {
  id: number;
  answer_id: number;
  user_id: string;
  reply: string;
  created_at: string;
};


const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

/* =========================================================
   REACTIONS
   ========================================================= */

const QUICK_REACTIONS = [
  { type: "love", emoji: "❤️" },
  { type: "like", emoji: "👍" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
];

const ALL_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚",
  "😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸",
  "🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️",
  "😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡",
  "🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓",
  "🤗","🤔","🫣","🤭","🫢","🫡","🤫","🫠","🤥","😶",
  "🫥","😐","🫤","😑","😬","🙄","😯","😦","😧","😮",
  "😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮",
  "🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺",
  "🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺",
  "😸","😹","😻","😼","😽","🙀","😿","😾",

  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
  "❣️","💕","💞","💓","💗","💖","💘","💝","💟","💌",
  "💋","💯","💢","💥","💫","💦","💨","🕳️","💣","💬",
  "👋","🤚","🖐️","✋","🖖","👌","🤏","✌️","🤞","🤟",
  "🤘","🤙","👈","👉","👆","👇","☝️","✋","🤲","🙌",
  "👏","🙏","💪","🫶","👀","👁️","🧠","🫀","🫁","🦷",
  "👶","🧒","👦","👧","🧑","👨","👩","🧓","👴","👵",

  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
  "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔",
  "🐧","🐦","🐤","🦆","🦅","🦉","🐺","🐗","🐴","🦄",
  "🐝","🐛","🦋","🐌","🐞","🐜","🪲","🕷️","🦂","🐢",
  "🐍","🦎","🦖","🦕","🐙","🦑","🦀","🐠","🐟","🐡",
  "🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🐘",

  "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐",
  "🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🍆",
  "🥔","🥕","🌽","🌶️","🥒","🥬","🥦","🧄","🧅","🍞",
  "🥐","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩",
  "🍗","🍖","🌭","🍔","🍟","🍕","🥪","🌮","🌯","🥗",
  "🍿","🍜","🍝","🍣","🍤","🍚","🍙","🍦","🍩","🍪",
  "🎂","🍰","🧁","🍫","🍭","🍬","🍎","☕","🧃","🥤",

  "⚽","🏀","🏈","⚾","🎾","🏐","🏆","🥇","🥈","🥉",
  "🎮","🎯","🎲","🎸","🎹","🎤","🎧","🎬","🎨","🎭",
  "🚗","🚕","🚌","🚎","🏎️","🚓","🚑","🚒","🚲","✈️",
  "🚀","🛸","🚢","🏠","🏢","🌍","🌎","🌏","🌙","⭐",
  "🌟","✨","⚡","🔥","🌈","☀️","🌧️","❄️","🌊","🌸",
];

/* =========================================================
   HOME
   ========================================================= */

   
export default function HomeScreen() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [contributorsPreview, setContributorsPreview] = useState<
  ContributorPreview[]
>([]);

const [contributorsLoading, setContributorsLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState<number | null>(null);
  
const handleBookmark = async (answerId: number) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    Alert.alert(
      "Sign in required",
      "Please sign in to save answers."
    );
    return;
  }

  setBookmarkLoading(answerId);

  try {
    const { data: existingBookmark, error: checkError } =
      await supabase
        .from("bookmarks")
        .select("id")
        .eq("answer_id", answerId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (checkError) {
      console.error("Bookmark check error:", checkError);

      Alert.alert(
        "Error",
        "Could not check saved answer."
      );

      return;
    }

    if (existingBookmark) {
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("answer_id", answerId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error(
          "Bookmark remove error:",
          deleteError
        );

        Alert.alert(
          "Error",
          "Could not remove saved answer."
        );

        return;
      }

      setBookmarkedIds((prev) =>
        prev.filter((id) => id !== answerId)
      );

      return;
    }

    const { error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        answer_id: answerId,
        user_id: user.id,
      });

    if (insertError) {
      console.error(
        "Bookmark save error:",
        insertError
      );

      Alert.alert(
        "Error",
        "Could not save answer."
      );

      return;
    }

    setBookmarkedIds((prev) =>
      prev.includes(answerId)
        ? prev
        : [...prev, answerId]
    );
  } finally {
    setBookmarkLoading(null);
  }
};

  const [loading, setLoading] = useState(true);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [answer, setAnswer] = useState("");
  const [name, setName] = useState("");
  const [selectedCountry, setSelectedCountry] =
    useState<Country | null>(null);

  const [countryPickerVisible, setCountryPickerVisible] =
    useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [posting, setPosting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [customPopup, setCustomPopup] = useState<{
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error";
}>({
  visible: false,
  title: "",
  message: "",
  type: "success",
});

  const [reactionCounts, setReactionCounts] =
    useState<Record<number, Record<string, number>>>({});

  const [myReactions, setMyReactions] =
    useState<Record<number, string | null>>({});

    const [replies, setReplies] =
  useState<Record<number, Reply[]>>({});

 

const [selectedAnswerId, setSelectedAnswerId] =
  useState<number | null>(null);

const [replyText, setReplyText] =
  useState("");


const [replySending, setReplySending] =
  useState(false);

const replyAnimation = useRef(
  new Animated.Value(0)
).current;

  const [reactionPickerAnswer, setReactionPickerAnswer] =
    useState<number | null>(null);

  const [emojiPickerAnswer, setEmojiPickerAnswer] =
    useState<number | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  const pickerAnimation = useRef(new Animated.Value(0)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const successAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  loadTodayQuestion();
  checkSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const loggedIn = !!session?.user;

    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      loadTodayAnswers();
      
    } else {
      setAnswers([]);
      setBookmarkedIds([]);
      setReactionCounts({});
      setMyReactions({});
    }
  });

  

  return () => {
    subscription.unsubscribe();
  };
}, []);



  useEffect(() => {
  if (question) {
    loadTodayAnswers();
   
  }
}, [question]);

useEffect(() => {
  loadContributorsPreview();
}, []);

const loadContributorsPreview = async () => {
  try {
    setContributorsLoading(true);

    const { data, error } = await supabase
      .from("answers")
      .select("user_id, name");

    if (error) {
      console.error("Contributors preview error:", error);
      return;
    }

    const counts: Record<
      string,
      {
        user_id: string;
        name: string;
        answerCount: number;
      }
    > = {};

    (data || []).forEach((row) => {
      if (!row.user_id) return;

      if (!counts[row.user_id]) {
        counts[row.user_id] = {
          user_id: row.user_id,
          name: row.name || "Anonymous",
          answerCount: 0,
        };
      }

      counts[row.user_id].answerCount += 1;
    });

    const sorted = Object.values(counts)
      .sort((a, b) => b.answerCount - a.answerCount)
      .slice(0, 3);

    setContributorsPreview(sorted);
  } finally {
    setContributorsLoading(false);
  }
};

  useEffect(() => {
    if (answers.length > 0) {
      loadReactions();
    } else {
      setReactionCounts({});
      setMyReactions({});
    }
  }, [answers]);

  useEffect(() => {
  if (!isLoggedIn) {
    setBookmarkedIds([]);
    return;
  }

  loadBookmarks();

  const channel = supabase
    .channel("mobile-bookmarks-sync")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
      },
      () => {
        loadBookmarks();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [isLoggedIn]);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const loggedIn = !!session?.user;

    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      loadTodayAnswers();
    }
  }

  async function loadTodayQuestion() {
    try {
      setLoading(true);
      setError("");

      const today = new Date().toLocaleDateString("en-CA");

      const { data, error: supabaseError } = await supabase
        .from("questions")
        .select("id, question, question_date")
        .eq("question_date", today)
        .maybeSingle();

      if (supabaseError) {
        console.error("Question error:", supabaseError);
        setError("Could not load today's question.");
        return;
      }

      if (!data) {
        setError("No question available for today.");
        return;
      }

      setQuestion(data);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookmarks() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setBookmarkedIds([]);
    return;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("answer_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Bookmarks load error:", error);
    return;
  }

  setBookmarkedIds(
    (data ?? []).map((bookmark) => bookmark.answer_id)
  );
}

  async function loadTodayAnswers() {
    if (!question) {
      return;
    }

    try {
      setAnswersLoading(true);

      const { data, error: answersError } = await supabase
        .from("answers")
        .select(
          "id, question_id, answer, name, country, user_id, created_at"
        )
        .eq("question_id", question.id)
        .order("created_at", { ascending: false });

      if (answersError) {
        console.error("Answers error:", answersError);
        return;
      }

      setAnswers(data ?? []);
    } catch (err) {
      console.error("Unexpected answers error:", err);
    } finally {
      setAnswersLoading(false);
    }
  }

  async function loadReactions() {
  if (answers.length === 0) {
    setReactionCounts({});
    setMyReactions({});
    return;
  }

  
  try {
    // Get the current session safely
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
    }

    const user = session?.user ?? null;

    const answerIds = answers.map(
      (item) => item.id
    );

    const {
      data,
      error: reactionError,
    } = await supabase
      .from("reactions")
      .select(
        "id, answer_id, user_id, reaction_type, created_at"
      )
      .in("answer_id", answerIds);

    if (reactionError) {
      console.error(
        "Reactions load error:",
        reactionError
      );
      return;
    }

    const rows = (data ?? []) as ReactionRow[];

    const counts: Record<
      number,
      Record<string, number>
    > = {};

    rows.forEach((row) => {
      if (!counts[row.answer_id]) {
        counts[row.answer_id] = {};
      }

      counts[row.answer_id][row.reaction_type] =
        (counts[row.answer_id][row.reaction_type] || 0) + 1;
    });

    const mine: Record<
      number,
      string | null
    > = {};

    if (user) {
      rows.forEach((row) => {
        if (
          String(row.user_id) ===
          String(user.id)
        ) {
          mine[row.answer_id] =
            row.reaction_type;
        }
      });
    }

    setReactionCounts(counts);
    setMyReactions(mine);

    console.log(
      "Loaded reactions:",
      rows
    );

    console.log(
      "Current user:",
      user?.id
    );

    console.log(
      "My reactions:",
      mine
    );
  } catch (err) {
    console.error(
      "Unexpected reactions error:",
      err
    );
  }
}

async function loadReplies() {
  if (answers.length === 0) {
    setReplies({});
    return;
  }

  try {
    const answerIds = answers.map((item) => item.id);

    const { data, error } = await supabase
      .from("replies")
      .select(
        "id, answer_id, user_id, reply, created_at"
      )
      .in("answer_id", answerIds)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("Replies load error:", error);
      return;
    }

    const rows = (data ?? []) as Reply[];

    const grouped: Record<number, Reply[]> = {};

    rows.forEach((row) => {
      if (!grouped[row.answer_id]) {
        grouped[row.answer_id] = [];
      }

      grouped[row.answer_id].push(row);
    });

    setReplies(grouped);
  } catch (err) {
    console.error("Unexpected replies error:", err);
  }
}

  async function handleReaction(
    answerId: number,
    reactionType: string
  ) {
    if (!isLoggedIn) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to react to an answer."
      );
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to react to an answer."
        );
        return;
      }

      const currentReaction =
        myReactions[answerId] ?? null;

      setReactionPickerAnswer(null);
      setEmojiPickerAnswer(null);

      if (currentReaction === reactionType) {
        const { error: deleteError } = await supabase
          .from("reactions")
          .delete()
          .eq("answer_id", answerId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error(
            "Reaction remove error:",
            deleteError
          );
          Alert.alert(
            "Could not remove reaction",
            deleteError.message
          );
          return;
        }
      } else {
        const { error: deleteError } = await supabase
          .from("reactions")
          .delete()
          .eq("answer_id", answerId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error(
            "Old reaction remove error:",
            deleteError
          );
          return;
        }

        const { error: insertError } = await supabase
          .from("reactions")
          .insert({
            answer_id: answerId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (insertError) {
          console.error(
            "Reaction insert error:",
            insertError
          );

          Alert.alert(
            "Could not add reaction",
            insertError.message
          );

          return;
        }
      }

      await loadReactions();
      await loadReactions();
    } catch (err) {
      console.error(
        "Unexpected reaction error:",
        err
      );
    }
  }
useEffect(() => {
  if (selectedAnswerId !== null) {
    replyAnimation.setValue(0);

    Animated.spring(replyAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }
}, [selectedAnswerId]);

  async function handleReply() {
  if (selectedAnswerId === null) {
    return;
  }

  if (!replyText.trim()) {
  showCustomPopup(
    "Reply Required",
    "Please write something first.",
    "error"
  );
  return;
}

  try {
    setReplySending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to reply."
      );
      return;
    }

    const { error } = await supabase
      .from("replies")
      .insert({
        answer_id: selectedAnswerId,
        user_id: user.id,
        reply: replyText.trim(),
      });

    if (error) {
      console.error(
        "Reply insert error:",
        error
      );

      showCustomPopup(
  "Could Not Post Reply",
  error.message,
  "error"
);

      return;
    }

    setReplyText("");

    await loadReplies();

   
    setSelectedAnswerId(null);

    showCustomPopup(
  "Reply Posted",
  "Your reply was posted! ❤️",
  "success"
);

    successAnimation.setValue(0);

    Animated.spring(successAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.7,
    }).start();

    setTimeout(() => {
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setSuccessMessage("");
      });
    }, 2500);
  } catch (err) {
    console.error(
      "Unexpected reply error:",
      err
    );

    Alert.alert(
      "Reply failed",
      "Something went wrong while posting your reply."
    );
  } finally {
    setReplySending(false);
  }
}

  function openReactionPicker(answerId: number) {
    setEmojiPickerAnswer(null);
    setReactionPickerAnswer(answerId);
  }

  function openEmojiPicker(answerId: number) {
    setReactionPickerAnswer(null);
    setEmojiPickerAnswer(answerId);
  }

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(search)
    );
  }, [countrySearch]);

  const totalAnswers = answers.length;

  const totalCountries = useMemo(() => {
    const uniqueCountries = new Set(
      answers
        .map((item) => item.country?.trim())
        .filter(Boolean)
        .filter(
          (country) =>
            country.toLowerCase() !== "other"
        )
    );

    return uniqueCountries.size;
  }, [answers]);

  const worldCoverage = Math.round(
    (totalCountries / 195) * 100
  );

  const countryPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 3;
      },

      onPanResponderMove: (_, gestureState) => {
        let movement = gestureState.dy;

        if (movement < -150) {
          movement =
            -150 + (movement + 150) * 0.25;
        }

        if (movement > 180) {
          movement =
            180 + (movement - 180) * 0.25;
        }

        dragY.setValue(movement);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (
          gestureState.dy > 120 ||
          gestureState.vy > 1.2
        ) {
          closeCountryPicker();
          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
          mass: 0.8,
        }).start();
      },

      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
          mass: 0.8,
        }).start();
      },
    })
  ).current;

  function openCountryPicker() {
    setCountryPickerVisible(true);

    pickerAnimation.setValue(0);
    overlayAnimation.setValue(0);
    dragY.setValue(0);

    Animated.parallel([
      Animated.timing(pickerAnimation, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeCountryPicker(callback?: () => void) {
    Animated.parallel([
      Animated.timing(pickerAnimation, {
        toValue: 0,
        duration: 430,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),

      Animated.spring(dragY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      }),
    ]).start(() => {
      setCountryPickerVisible(false);
      setCountrySearch("");

      if (callback) {
        callback();
      }
    });
  }

  function selectCountry(country: Country) {
    setSelectedCountry(country);
    closeCountryPicker();
  }

function showCustomPopup(
  title: string,
  message: string,
  type: "success" | "error" = "success"
) {
  setCustomPopup({
    visible: true,
    title,
    message,
    type,
  });
}
function closeCustomPopup() {
  setCustomPopup((prev) => ({
    ...prev,
    visible: false,
  }));
}

  async function handlePostAnswer() {
    if (!question) {
      Alert.alert(
        "Error",
        "Today's question is not available."
      );
      return;
    }

    if (!name.trim()) {
  showCustomPopup(
    "Name Required",
    "Please enter your name.",
    "error"
  );
  return;
}

    if (!selectedCountry) {
  showCustomPopup(
    "Country Required",
    "Please select your country.",
    "error"
  );
  return;
}

   if (!answer.trim()) {
  showCustomPopup(
    "Answer Required",
    "Please write your answer.",
    "error"
  );
  return;
}
    try {
      setPosting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to post an answer."
        );
        return;
      }

      const answerName = name.trim();
      const answerCountry = selectedCountry.name;
      const answerText = answer.trim();

      const { error: insertError } = await supabase
        .from("answers")
        .insert({
          question_id: question.id,
          answer: answerText,
          name: answerName,
          country: answerCountry,
          user_id: user.id,
        });

      if (insertError) {
        console.error(
          "Answer insert error:",
          insertError
        );

        Alert.alert(
          "Could not post answer",
          insertError.message ||
            "Something went wrong."
        );

        return;
      }

      setName("");
      setSelectedCountry(null);
      setAnswer("");

      await loadTodayAnswers();

      showCustomPopup(
  "Answer Posted",
  "Your answer was posted! ❤️",
  "success"
);

      setTimeout(() => {
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setSuccessMessage("");
        });
      }, 2500);
    } catch (err) {
      console.error(
        "Unexpected answer error:",
        err
      );

      Alert.alert(
        "Error",
        "Something went wrong while posting your answer."
      );
    } finally {
      setPosting(false);
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
      <SkyBackground />

      <Animated.ScrollView

refreshControl={
  <RefreshControl
    refreshing={false}
    onRefresh={async () => {
      await loadTodayAnswers();
    }}
  />
}

  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  bounces={false}
  overScrollMode="never"
  contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {
            useNativeDriver: true,
          }
        )}
      >
        <HomeReveal
          scrollY={scrollY}
          delay={0}
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  {
                    translateY:
                      scrollY.interpolate({
                        inputRange: [0, 120],
                        outputRange: [0, -8],
                        extrapolate: "clamp",
                      }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.logo}>
              <Text style={styles.logoOne}>
                ONE
              </Text>
              <Text style={styles.logoQuestion}>
                QUESTION
              </Text>
            </Text>

            <Text style={styles.subtitle}>
              One question. One answer. One world.
            </Text>
          </Animated.View>
        </HomeReveal>

        <HomeReveal
          scrollY={scrollY}
          delay={80}
        >
          <View style={styles.card}>
            <Text style={styles.label}>
              TODAY'S QUESTION
            </Text>

            {loading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : error ? (
              <Text style={styles.error}>
                {error}
              </Text>
            ) : (
              <Text style={styles.question}>
                {question?.question}
              </Text>
            )}
          </View>
        </HomeReveal>

        {!isLoggedIn ? (
          <HomeReveal
            scrollY={scrollY}
            delay={160}
          >
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  router.push("/login")
                }
                activeOpacity={0.8}
              >
                <Text style={styles.primaryText}>
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  router.push("/signup")
                }
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryText}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </HomeReveal>
        ) : (
          <>
            <HomeReveal
              scrollY={scrollY}
              delay={100}
            >
              <View style={styles.answerSection}>
                <Text style={styles.answerTitle}>
                  Your Answer
                </Text>

                <Text style={styles.fieldLabel}>
                  NAME
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#666666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={styles.fieldLabel}>
                  COUNTRY
                </Text>

                <TouchableOpacity
                  style={styles.countryButton}
                  onPress={openCountryPicker}
                  activeOpacity={0.8}
                >
                  {selectedCountry ? (
                    <View
                      style={styles.selectedCountryRow}
                    >
                      <Text style={styles.flag}>
                        {getFlag(
                          selectedCountry.code
                        )}
                      </Text>

                      <Text
                        style={
                          styles.countryButtonText
                        }
                      >
                        {selectedCountry.name}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={
                        styles.countryPlaceholder
                      }
                    >
                      Select your country
                    </Text>
                  )}

                  <Text style={styles.chevron}>
                    ⌄
                  </Text>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>
                  ANSWER
                </Text>

                <TextInput
                  style={styles.answerInput}
                  placeholder="Write your answer..."
                  placeholderTextColor="#666666"
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />

                <Text style={styles.characterCount}>
                  {answer.length}/2000
                </Text>

                <TouchableOpacity
                  style={[
                    styles.postButton,
                    posting &&
                      styles.postButtonDisabled,
                  ]}
                  onPress={handlePostAnswer}
                  disabled={posting}
                  activeOpacity={0.8}
                >
                  {posting ? (
                    <ActivityIndicator
                      size="small"
                      color="#000000"
                    />
                  ) : (
                    <Text
                      style={
                        styles.postButtonText
                      }
                    >
                      Post Answer
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </HomeReveal>

            <StatsSection
  scrollY={scrollY}
  answers={totalAnswers}
  countries={totalCountries}
  coverage={worldCoverage}
/>

           

<HomeReveal
  scrollY={scrollY}
  delay={100}
>
  <View style={styles.popularSection}>
    <View style={styles.popularHeader}>
      <View>
        <Text style={styles.popularTitle}>
          🔥 Popular Answers
        </Text>

        <Text style={styles.popularSubtitle}>
          Discover what people are reacting to
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/popular")}
        activeOpacity={0.8}
      >
        <Text style={styles.popularViewAll}>
          View all →
        </Text>
      </TouchableOpacity>
    </View>

    <View style={styles.popularTabs}>
  <TouchableOpacity
    style={styles.popularTab}
    onPress={() => router.push("/popular?period=today")}
    activeOpacity={0.8}
  >
    <Text style={styles.popularTabText}>
      Today
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.popularTab}
    onPress={() => router.push("/popular?period=week")}
    activeOpacity={0.8}
  >
    <Text style={styles.popularTabText}>
      This Week
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.popularTab}
    onPress={() => router.push("/popular?period=all")}
    activeOpacity={0.8}
  >
    <Text style={styles.popularTabText}>
      All Time
    </Text>
  </TouchableOpacity>
</View>
  </View>
</HomeReveal>

{!contributorsLoading && contributorsPreview.length > 0 && (
  <HomeReveal scrollY={scrollY} delay={180}>
    <View style={styles.contributorsSection}>
      <View style={styles.contributorsHeader}>
        <View>
          <Text style={styles.contributorsTitle}>
            🏆 Contributors
          </Text>

          <Text style={styles.contributorsSubtitle}>
            People sharing their answers with the world
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/contributors")}
          activeOpacity={0.8}
        >
          <Text style={styles.contributorsViewAll}>
            View all →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contributorsPreviewList}>
        {contributorsPreview.map((person, index) => (
          <TouchableOpacity
            key={person.user_id}
            style={[
              styles.contributorPreviewCard,
              index === 0 && styles.contributorPreviewFirst,
            ]}
            onPress={() =>
              router.push(`/profile?id=${person.user_id}`)
            }
            activeOpacity={0.8}
          >
            <Text style={styles.contributorRank}>
              {index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : "🥉"}
            </Text>

            <View style={styles.contributorAvatar}>
              <Text style={styles.contributorAvatarText}>
                {person.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.contributorInfo}>
              <Text style={styles.contributorName}>
                {person.name}
              </Text>

              <Text style={styles.contributorAnswers}>
                {person.answerCount} answers
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </HomeReveal>
)}

              <View style={styles.answersSection}>
                <View style={styles.answersHeader}>
                  <Text style={styles.answersTitle}>
                    Answers
                  </Text>

                  {!answersLoading &&
                    answers.length > 0 && (
                      <Text
                        style={styles.answersCount}
                      >
                        {answers.length}
                      </Text>
                    )}
                </View>

                {answersLoading ? (
                  <View
                    style={styles.answersLoading}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#888888"
                    />
                  </View>
                ) : answers.length === 0 ? (
                  <View
                    style={styles.emptyAnswers}
                  >
                    <Text
                      style={
                        styles.emptyAnswersTitle
                      }
                    >
                      No answers yet
                    </Text>

                    <Text
                      style={
                        styles.emptyAnswersText
                      }
                    >
                      Be the first person to
                      answer today's question.
                    </Text>
                  </View>
                ) : (
                  answers.map((item) => (
                    <View
                      key={item.id}
                      style={styles.answerCard}
                    >
                      <View
                        style={
                          styles.answerCardHeader
                        }
                      >
                        <View
                          style={
                            styles.answerPerson
                          }
                        >
                          <CountryFlagAvatar
                            country={
                              item.country
                            }
                          />

                          <View
                            style={
                              styles.personInfo
                            }
                          >
                            <Text
                              style={
                                styles.personName
                              }
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={
                                styles.personCountry
                              }
                            >
                              {getCountryFlagFromName(
                                item.country
                              )}{" "}
                              {item.country}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.answerCardText
                        }
                      >
                        {item.answer}
                      </Text>

                      <ReactionBar
                        answerId={item.id}
                        currentReaction={
                          myReactions[item.id] ?? null
                        }
                        counts={
                          reactionCounts[item.id] ?? {}
                        }
                        onReaction={(type) =>
                          handleReaction(
                            item.id,
                            type
                          )
                        }
                        onLongPress={() =>
                          openReactionPicker(
                            item.id
                          )
                        }
                        onOpenEmojiPicker={() =>
                          openEmojiPicker(
                            item.id
                          )
                        }
                      />

                      <TouchableOpacity
  style={[
    styles.saveButton,
    bookmarkedIds.includes(item.id) &&
      styles.saveButtonSaved,
  ]}
  activeOpacity={0.8}
  onPress={() => handleBookmark(item.id)}
>
  <Text style={styles.saveButtonIcon}>
    🔖
  </Text>

  <Text style={styles.saveButtonText}>
    {bookmarkLoading === item.id
      ? "Saving..."
      : bookmarkedIds.includes(item.id)
        ? "Saved"
        : "Save"}
  </Text>
</TouchableOpacity>

                      <TouchableOpacity
  style={styles.replyButton}
  activeOpacity={0.75}
  onPress={() => {
    if (selectedAnswerId === item.id) {
      setSelectedAnswerId(null);
      setReplyText("");
    } else {
      setSelectedAnswerId(item.id);
      setReplyText("");
    }
  }}
>
  <Text style={styles.replyButtonIcon}>
    💬
  </Text>

  <Text style={styles.replyButtonText}>
    Reply
  </Text>
</TouchableOpacity>

{selectedAnswerId === item.id && (
  <Animated.View
    style={[
      styles.inlineReplies,
      {
        opacity: replyAnimation,
        transform: [
          {
            translateY:
              replyAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-25, 0],
              }),
          },
          {
            scaleY:
              replyAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
          },
        ],
      },
    ]}
  >
    {(replies[item.id] ?? []).length > 0 && (
  <ScrollView
    style={styles.inlineReplyList}
    nestedScrollEnabled
    showsVerticalScrollIndicator={false}
  >
    {(replies[item.id] ?? []).map((reply) => (
      <View
        key={reply.id}
        style={styles.inlineReplyItem}
      >
        <Text style={styles.inlineReplyText}>
          {reply.reply}
        </Text>

        <Text style={styles.inlineReplyDate}>
          {new Date(reply.created_at).toLocaleString()}
        </Text>
      </View>
    ))}
  </ScrollView>
)}
    
  </Animated.View>
)}

{selectedAnswerId === item.id && (
  <Animated.View
    style={[
      styles.inlineReplies,
      {
        opacity: replyAnimation,
        transform: [
          {
            translateY:
              replyAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-25, 0],
              }),
          },
          {
            scaleY:
              replyAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
          },
        ],
      },
    ]}
  >
   

    <View style={styles.replyComposer}>
      <TextInput
        value={replyText}
        onChangeText={setReplyText}
        placeholder="Write a reply..."
        placeholderTextColor="#777777"
        multiline
        maxLength={500}
        style={styles.replyInput}
      />

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={replySending}
        style={[
          styles.replySendButton,
          replySending &&
            styles.replySendButtonDisabled,
        ]}
        onPress={handleReply}
      >
        {replySending ? (
          <ActivityIndicator
            size="small"
            color="#000000"
          />
        ) : (
          <Text style={styles.replySendText}>
            Send Reply
          </Text>
        )}
      </TouchableOpacity>
    </View>
  </Animated.View>
)}
                    </View>
                  ))
                )}
              </View>
            
          </>
        )}
      </Animated.ScrollView>
       
      <CustomPopup
  visible={customPopup.visible}
  title={customPopup.title}
  message={customPopup.message}
  type={customPopup.type}
  onClose={closeCustomPopup}
/>

      <ReactionPopup
        visible={reactionPickerAnswer !== null}
        currentReaction={
          reactionPickerAnswer !== null
            ? myReactions[reactionPickerAnswer] ?? null
            : null
        }
        onSelect={(type) => {
          if (reactionPickerAnswer !== null) {
            handleReaction(
              reactionPickerAnswer,
              type
            );
          }
        }}
        onPlus={() => {
          if (reactionPickerAnswer !== null) {
            openEmojiPicker(
              reactionPickerAnswer
            );
          }
        }}
        onClose={() =>
          setReactionPickerAnswer(null)
        }
      />

      <EmojiPickerModal
        visible={emojiPickerAnswer !== null}
        onClose={() =>
          setEmojiPickerAnswer(null)
        }
        onSelect={(emoji) => {
          if (emojiPickerAnswer !== null) {
            handleReaction(
              emojiPickerAnswer,
              emoji
            );
          }
        }}
      />

      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="none"
        onRequestClose={() =>
          closeCountryPicker()
        }
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalOverlay,
              {
                opacity: overlayAnimation,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() =>
                closeCountryPicker()
              }
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.countryModal,
              {
                transform: [
                  {
                    translateY: Animated.add(
                      pickerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [750, 0],
                      }),
                      dragY
                    ),
                  },
                ],
              },
            ]}
          >
            <View
              style={styles.sheetHandleTouchArea}
              {...countryPanResponder.panHandlers}
            >
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Choose Country
                </Text>

                <Text style={styles.modalSubtitle}>
                  195 countries
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  closeCountryPicker()
                }
                activeOpacity={0.8}
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>
                ⌕
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor="#666666"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="words"
                autoCorrect={false}
              />

              {countrySearch.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    setCountrySearch("")
                  }
                  style={styles.clearSearch}
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.clearSearchText
                    }
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCountries.length === 0 ? (
                <View style={styles.noResults}>
                  <Text
                    style={styles.noResultsIcon}
                  >
                    🌎
                  </Text>

                  <Text
                    style={styles.noResultsText}
                  >
                    No country found
                  </Text>

                  <Text
                    style={
                      styles.noResultsSubtext
                    }
                  >
                    Try another search
                  </Text>
                </View>
              ) : (
                filteredCountries.map(
                  (country) => {
                    const selected =
                      selectedCountry?.code ===
                      country.code;

                    return (
                      <TouchableOpacity
                        key={country.code}
                        style={[
                          styles.countryRow,
                          selected &&
                            styles.countryRowSelected,
                        ]}
                        onPress={() =>
                          selectCountry(country)
                        }
                        activeOpacity={0.65}
                      >
                        <View
                          style={
                            styles.countryFlagBox
                          }
                        >
                          <Text
                            style={
                              styles.countryFlag
                            }
                          >
                            {getFlag(
                              country.code
                            )}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.countryName,
                            selected &&
                              styles.countryNameSelected,
                          ]}
                        >
                          {country.name}
                        </Text>

                        {selected && (
                          <View
                            style={
                              styles.selectedCheck
                            }
                          >
                            <Text
                              style={
                                styles.checkMark
                              }
                            >
                              ✓
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }
                )
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   REACTION BAR
   ========================================================= */

function ReactionBar({
  answerId,
  currentReaction,
  counts,
  onReaction,
  onLongPress,
  onOpenEmojiPicker,
}: {
  answerId: number;
  currentReaction: string | null;
  counts: Record<string, number>;
  onReaction: (type: string) => void;
  onLongPress: () => void;
  onOpenEmojiPicker: () => void;
}) {
  const buttonAnimation = useRef(
    new Animated.Value(1)
  ).current;

  const total = Object.values(counts).reduce(
    (sum, value) => sum + value,
    0
  );

  const currentEmoji = currentReaction
  ? getReactionEmoji(currentReaction)
  : "";

  function pressAnimation() {
    Animated.sequence([
      Animated.spring(buttonAnimation, {
        toValue: 0.78,
        useNativeDriver: true,
        damping: 12,
        stiffness: 260,
      }),
      Animated.spring(buttonAnimation, {
        toValue: 1.12,
        useNativeDriver: true,
        damping: 10,
        stiffness: 230,
      }),
      Animated.spring(buttonAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 220,
      }),
    ]).start();
  }

  return (
    <View style={styles.reactionArea}>
      <View style={styles.reactionBottomRow}>
        <TouchableOpacity
          activeOpacity={0.75}
          delayLongPress={350}
          onPress={() => {
            pressAnimation();
            onReaction(
              currentReaction || "love"
            );
          }}
          onLongPress={onLongPress}
          style={styles.reactButton}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: buttonAnimation,
                },
              ],
            }}
          >
            <Text
              style={[
                styles.reactEmoji,
                currentReaction &&
                  styles.reactEmojiActive,
              ]}
            >
              {currentReaction
                ? currentEmoji
                : "♡"}
            </Text>
          </Animated.View>

          <Text
            style={[
              styles.reactText,
              currentReaction &&
                styles.reactTextActive,
            ]}
          >
            {currentReaction
              ? reactionLabel(currentReaction)
              : "React"}
          </Text>
        </TouchableOpacity>

        {total > 0 && (
          <View style={styles.reactionCountArea}>
            {QUICK_REACTIONS.map(
              (reaction) =>
                (counts[reaction.type] || 0) >
                  0 && (
                  <Text
                    key={reaction.type}
                    style={styles.miniReaction}
                  >
                    {reaction.emoji}
                  </Text>
                )
            )}

            <Text style={styles.reactionCount}>
              {total}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ReactionPopup({
  visible,
  currentReaction,
  onSelect,
  onPlus,
  onClose,
}: {
  visible: boolean;
  currentReaction: string | null;
  onSelect: (type: string) => void;
  onPlus: () => void;
  onClose: () => void;
}) {
  const scale = useRef(
    new Animated.Value(0.55)
  ).current;

  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  const translateY = useRef(
    new Animated.Value(20)
  ).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.55);
      opacity.setValue(0);
      translateY.setValue(20);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 230,
          mass: 0.7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 14,
          stiffness: 220,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.reactionOverlay}>
        <TouchableOpacity
          style={styles.reactionOverlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.reactionPopup,
            {
              opacity,
              transform: [
                { translateY },
                { scale },
              ],
            },
          ]}
        >
          {QUICK_REACTIONS.map(
            (reaction, index) => (
              <ReactionPopupItem
                key={reaction.type}
                emoji={reaction.emoji}
                selected={
                  currentReaction ===
                  reaction.type
                }
                index={index}
                onPress={() =>
                  onSelect(reaction.type)
                }
              />
            )
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPlus}
            style={styles.plusReactionButton}
          >
            <Text style={styles.plusReactionText}>
              +
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ReactionPopupItem({
  emoji,
  selected,
  index,
  onPress,
}: {
  emoji: string;
  selected: boolean;
  index: number;
  onPress: () => void;
}) {
  const scale = useRef(
    new Animated.Value(0.6)
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 35),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 240,
      }),
    ]).start();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.popupEmojiButton,
          selected &&
            styles.popupEmojiSelected,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={styles.popupEmoji}>
          {emoji}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* =========================================================
   FULL EMOJI PICKER
   ========================================================= */

function EmojiPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  const slide = useRef(
    new Animated.Value(1)
  ).current;

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      slide.setValue(1);

      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 170,
        mass: 0.8,
      }).start();
    }
  }, [visible]);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) {
      return ALL_EMOJIS;
    }

    return ALL_EMOJIS;
  }, [search]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.emojiModalContainer}>
        <TouchableOpacity
          style={styles.emojiModalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.emojiSheet,
            {
              transform: [
                {
                  translateY:
                    slide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 650],
                    }),
                },
              ],
            },
          ]}
        >
          <View style={styles.emojiHandle} />

          <View style={styles.emojiHeader}>
            <View>
              <Text style={styles.emojiTitle}>
                Choose an emoji
              </Text>

              <Text style={styles.emojiSubtitle}>
                React with anything you want
              </Text>
            </View>

            <TouchableOpacity
              style={styles.emojiClose}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.emojiCloseText}>
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emojiSearch}>
            <Text style={styles.emojiSearchIcon}>
              ⌕
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search emoji..."
              placeholderTextColor="#666666"
              style={styles.emojiSearchInput}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.emojiGrid
            }
          >
            {filteredEmojis.map(
              (emoji, index) => (
                <TouchableOpacity
                  key={`${emoji}-${index}`}
                  activeOpacity={0.65}
                  onPress={() =>
                    onSelect(emoji)
                  }
                  style={styles.emojiCell}
                >
                  <Text style={styles.fullEmoji}>
                    {emoji}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getReactionEmoji(
  reaction: string
) {
  const quick = QUICK_REACTIONS.find(
    (item) => item.type === reaction
  );

  return quick?.emoji || reaction;
}

function reactionLabel(
  reaction: string
) {
  const quick = QUICK_REACTIONS.find(
    (item) => item.type === reaction
  );

  if (quick) {
    return (
      quick.type.charAt(0).toUpperCase() +
      quick.type.slice(1)
    );
  }

  return "Reacted";
}

/* =========================================================
   SKY BACKGROUND
   ========================================================= */

function SkyBackground() {
  const stars = useRef<
    {
      x: number;
      y: number;
      size: number;
      opacity: number;
    }[]
  >([]);

  const meteorX = useRef(
    new Animated.Value(-220)
  ).current;

  const meteorY = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    if (stars.current.length === 0) {
      const amount = Math.floor(
        (SCREEN_WIDTH * SCREEN_HEIGHT) / 6500
      );

      for (let i = 0; i < amount; i++) {
        stars.current.push({
          x: Math.random() * SCREEN_WIDTH,
          y:
            Math.random() *
            SCREEN_HEIGHT *
            0.76,
          size:
            Math.random() < 0.88
              ? Math.random() * 0.9 + 0.35
              : Math.random() * 1.5 + 0.8,
          opacity:
            Math.random() * 0.65 + 0.18,
        });
      }
    }

    let meteorTimeout:
      | ReturnType<typeof setTimeout>
      | undefined;

    const startMeteor = () => {
      meteorX.setValue(-220);

      const startY =
        35 +
        Math.random() *
          SCREEN_HEIGHT *
          0.34;

      const endY =
        startY +
        70 +
        Math.random() * 130;

      meteorY.setValue(startY);

      const duration =
        1200 +
        Math.random() * 700;

      Animated.parallel([
        Animated.timing(meteorX, {
          toValue:
            SCREEN_WIDTH + 220,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(meteorY, {
          toValue: endY,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        meteorTimeout = setTimeout(
          startMeteor,
          9000 +
            Math.random() * 11000
        );
      });
    };

    meteorTimeout = setTimeout(
      startMeteor,
      4500 +
        Math.random() * 5000
    );

    return () => {
      if (meteorTimeout) {
        clearTimeout(meteorTimeout);
      }

      meteorX.stopAnimation();
      meteorY.stopAnimation();
    };
  }, []);

  return (
    <View
      pointerEvents="none"
      style={styles.skyBackground}
    >
      <View style={styles.skyBase} />

      <View
        style={styles.skyAtmosphereTop}
      />

      <View
        style={styles.skyAtmosphereMiddle}
      />

      <View
        style={styles.skyAtmosphereBottom}
      />

      <View style={styles.milkyWay} />

      {stars.current.map(
        (star, index) => (
          <Star
            key={index}
            star={star}
          />
        )
      )}

      <Animated.View
        style={[
          styles.meteor,
          {
            transform: [
              {
                translateX: meteorX,
              },
              {
                translateY: meteorY,
              },
              {
                rotate: "25deg",
              },
            ],
          },
        ]}
      >
        <View
          style={styles.meteorGlow}
        />

        <View
          style={styles.meteorTailLong}
        />

        <View
          style={styles.meteorTail}
        />

        <View
          style={styles.meteorHead}
        />
      </Animated.View>

      <View
        style={styles.skyBottomFade}
      />
    </View>
  );
}

function Star({
  star,
}: {
  star: {
    x: number;
    y: number;
    size: number;
    opacity: number;
  };
}) {
  const opacity = useRef(
    new Animated.Value(star.opacity)
  ).current;

  const scale = useRef(
    new Animated.Value(1)
  ).current;

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, {
              toValue:
                star.opacity * 0.18,
              duration:
                900 +
                Math.random() * 1800,
              useNativeDriver: true,
            }),

            Animated.timing(opacity, {
              toValue: star.opacity,
              duration:
                900 +
                Math.random() * 1800,
              useNativeDriver: true,
            }),
          ]),

          Animated.sequence([
            Animated.timing(scale, {
              toValue: 0.72,
              duration:
                900 +
                Math.random() * 1800,
              useNativeDriver: true,
            }),

            Animated.timing(scale, {
              toValue: 1,
              duration:
                900 +
                Math.random() * 1800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    opacity,
    scale,
    star.opacity,
  ]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: star.x,
        top: star.y,
        width: star.size,
        height: star.size,
        borderRadius:
          star.size / 2,
        backgroundColor:
          "#ffffff",
        opacity,
        transform: [
          {
            scale,
          },
        ],
      }}
    />
  );
}

/* =========================================================
   HOME REVEAL
   ========================================================= */

function HomeReveal({
  children,
  scrollY,
  delay = 0,
  repeatAnimation = false,
}: {
  children: React.ReactNode;
  scrollY: Animated.Value;
  delay?: number;
  repeatAnimation?: boolean;
}) {
  const animation = useRef(
    new Animated.Value(0)
  ).current;

  const [layoutY, setLayoutY] =
    useState<number | null>(null);

  const visibleRef = useRef(false);

  useEffect(() => {
    const listenerId = scrollY.addListener(
      ({ value }) => {
        if (layoutY === null) {
          return;
        }

        const enterPoint =
          value +
          SCREEN_HEIGHT -
          70;

        const leavePoint =
          value - 80;

        const isVisible =
          layoutY < enterPoint &&
          layoutY > leavePoint;

        if (isVisible) {
          if (!visibleRef.current) {
            visibleRef.current = true;

            animation.stopAnimation();

            Animated.sequence([
              Animated.delay(delay),
              Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                damping: 16,
                stiffness: 150,
                mass: 0.75,
              }),
            ]).start();
          }
        } else if (
          repeatAnimation &&
          visibleRef.current
        ) {
          visibleRef.current = false;

          animation.stopAnimation();

          Animated.timing(animation, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    return () => {
      scrollY.removeListener(
        listenerId
      );
    };
  }, [
    scrollY,
    layoutY,
    animation,
    delay,
    repeatAnimation,
  ]);

  function handleLayout(
    event: any
  ) {
    const y =
      event.nativeEvent.layout.y;

    setLayoutY(y);

    if (
      y <
      SCREEN_HEIGHT - 70
    ) {
      visibleRef.current = true;

      animation.setValue(0);

      Animated.spring(animation, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        damping: 16,
        stiffness: 150,
        mass: 0.75,
      }).start();
    }
  }

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        {
          opacity: animation,

          transform: [
            {
              translateY:
                animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [55, 0],
                }),
            },
            {
              scale:
                animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* =========================================================
   STATS SECTION
   ========================================================= */

function StatsSection({
  scrollY,
  answers,
  countries,
  coverage,
}: {
  scrollY: Animated.Value;
  answers: number;
  countries: number;
  coverage: number;
}) {
  const [statsStarted, setStatsStarted] =
    useState(false);

  const statsStartedRef =
    useRef(false);

  const statsYRef =
    useRef<number | null>(null);

  const statsHeightRef =
    useRef(105);

  const revealAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const lastScrollYRef =
    useRef(0);

  function updateStatsVisibility(
    scrollPosition: number
  ) {
    lastScrollYRef.current =
      scrollPosition;

    const y = statsYRef.current;

    if (y === null) {
      return;
    }

    const height =
      statsHeightRef.current;

    const viewportTop =
      scrollPosition + 40;

    const viewportBottom =
      scrollPosition +
      SCREEN_HEIGHT - 50;

    const statsTop = y;
    const statsBottom =
      y + height;

    const isVisible =
      statsBottom > viewportTop &&
      statsTop < viewportBottom;

    if (isVisible) {
      if (
        !statsStartedRef.current
      ) {
        statsStartedRef.current =
          true;

        setStatsStarted(true);

        revealAnimation.stopAnimation();
        revealAnimation.setValue(0);

        Animated.spring(
          revealAnimation,
          {
            toValue: 1,
            useNativeDriver: true,
            damping: 16,
            stiffness: 155,
            mass: 0.75,
          }
        ).start();
      }
    } else {
      if (
        statsStartedRef.current
      ) {
        statsStartedRef.current =
          false;

        setStatsStarted(false);

        revealAnimation.stopAnimation();

        Animated.timing(
          revealAnimation,
          {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }
        ).start();
      }
    }
  }

  useEffect(() => {
    const listenerId = scrollY.addListener(
      ({ value }) => {
        updateStatsVisibility(value);
      }
    );

    return () => {
      scrollY.removeListener(
        listenerId
      );
    };
  }, [scrollY]);

  function handleStatsLayout(
    event: any
  ) {
    const layout =
      event.nativeEvent.layout;

    statsYRef.current =
      layout.y;

    statsHeightRef.current =
      layout.height || 105;

    requestAnimationFrame(() => {
      updateStatsVisibility(
        lastScrollYRef.current
      );
    });
  }

  return (
    <Animated.View
      onLayout={handleStatsLayout}
      style={[
        styles.statsSection,
        {
          opacity: revealAnimation,

          transform: [
            {
              translateY:
                revealAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [45, 0],
                }),
            },
            {
              scale:
                revealAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
            },
          ],
        },
      ]}
    >
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <AnimatedCounter
            value={answers}
            animate={statsStarted}
          />

          <Text style={styles.statLabel}>
            Answers
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <AnimatedCounter
            value={countries}
            animate={statsStarted}
          />

          <Text style={styles.statLabel}>
            Countries
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <AnimatedCounter
            value={coverage}
            animate={statsStarted}
          />

          <Text style={styles.statPercent}>
            %
          </Text>

          <Text style={styles.statLabel}>
            World Coverage
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* =========================================================
   ANIMATED COUNTER
   ========================================================= */

function AnimatedCounter({
  value,
  animate,
}: {
  value: number;
  animate: boolean;
}) {
  const animation = useRef(
    new Animated.Value(0)
  ).current;

  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {
    animation.stopAnimation();

    if (!animate) {
      animation.setValue(0);
      setDisplayValue(0);
      return;
    }

    animation.setValue(0);
    setDisplayValue(0);

    const listenerId =
      animation.addListener(
        ({ value: current }) => {
          setDisplayValue(
            Math.round(current)
          );
        }
      );

    Animated.timing(animation, {
      toValue: value,
      duration: 1300,
      easing: Easing.out(
        Easing.cubic
      ),
      useNativeDriver: false,
    }).start();

    return () => {
      animation.removeListener(
        listenerId
      );
    };
  }, [
    animate,
    value,
    animation,
  ]);

  return (
    <Text style={styles.statNumber}>
      {displayValue}
    </Text>
  );
}

/* =========================================================
   FLAG AVATAR
   ========================================================= */

function CountryFlagAvatar({
  country,
}: {
  country: string;
}) {
  const waveAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const matchedCountry =
    COUNTRIES.find(
      (item) =>
        item.name.toLowerCase() ===
        country.toLowerCase()
    );

  const countryCode =
    matchedCountry?.code.toLowerCase();

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.delay(1200),

          Animated.timing(
            waveAnimation,
            {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            waveAnimation,
            {
              toValue: -1,
              duration: 280,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            waveAnimation,
            {
              toValue: 0.5,
              duration: 180,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            waveAnimation,
            {
              toValue: -0.2,
              duration: 150,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            waveAnimation,
            {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }
          ),

          Animated.delay(2200),
        ])
      );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [waveAnimation]);

  const rotate =
    waveAnimation.interpolate({
      inputRange: [-1, 1],
      outputRange: [
        "-5deg",
        "5deg",
      ],
    });

  const scale =
    waveAnimation.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [
        1.02,
        1,
        1.02,
      ],
    });

  return (
    <View style={styles.avatar}>
      {countryCode ? (
        <Animated.View
          style={[
            styles.flagImageWrapper,
            {
              transform: [
                { rotate },
                { scale },
              ],
            },
          ]}
        >
          <Image
            source={{
              uri: `https://flagcdn.com/w160/${countryCode}.png`,
            }}
            style={styles.flagImage}
            resizeMode="cover"
          />
        </Animated.View>
      ) : (
        <Text style={styles.fallbackFlag}>
          🌎
        </Text>
      )}
    </View>
  );
}

function getCountryFlagFromName(
  name: string
) {
  const country = COUNTRIES.find(
    (item) =>
      item.name.toLowerCase() ===
      name.toLowerCase()
  );

  return country
    ? getFlag(country.code)
    : "🌎";
}

function CustomPopup({
  visible,
  title,
  message,
  type,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  const scale = useRef(
    new Animated.Value(0.82)
  ).current;

  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.82);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 190,
          mass: 0.8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.customPopupOverlay}>
        <TouchableOpacity
          style={styles.customPopupBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.customPopupCard,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View
            style={[
              styles.customPopupIcon,
              isSuccess
                ? styles.customPopupSuccessIcon
                : styles.customPopupErrorIcon,
            ]}
          >
            <Text style={styles.customPopupIconText}>
              {isSuccess ? "✓" : "!"}
            </Text>
          </View>

          <Text style={styles.customPopupTitle}>
            {title}
          </Text>

          <Text style={styles.customPopupMessage}>
            {message}
          </Text>

          <TouchableOpacity
            style={styles.customPopupButton}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.customPopupButtonText}>
              OK
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  skyBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#010308",
    zIndex: 0,
  },

  skyBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#010308",
  },

  skyAtmosphereTop: {
    position: "absolute",
    top: -SCREEN_HEIGHT * 0.16,
    left: -SCREEN_WIDTH * 0.45,
    width: SCREEN_WIDTH * 1.9,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: SCREEN_WIDTH,
    backgroundColor:
      "rgba(13, 45, 90, 0.20)",
  },

  skyAtmosphereMiddle: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.18,
    left: -SCREEN_WIDTH * 0.38,
    width: SCREEN_WIDTH * 1.76,
    height: SCREEN_HEIGHT * 0.62,
    borderRadius: SCREEN_WIDTH,
    backgroundColor:
      "rgba(8, 35, 75, 0.13)",
  },

  skyAtmosphereBottom: {
    position: "absolute",
    bottom: -SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.42,
    width: SCREEN_WIDTH * 1.84,
    height: SCREEN_HEIGHT * 0.58,
    borderRadius: SCREEN_WIDTH,
    backgroundColor:
      "rgba(5, 25, 55, 0.12)",
  },

  milkyWay: {
    position: "absolute",
    width: SCREEN_WIDTH * 1.65,
    height: 190,
    left: -SCREEN_WIDTH * 0.32,
    top: SCREEN_HEIGHT * 0.16,
    borderRadius: 120,
    backgroundColor:
      "rgba(150, 180, 230, 0.016)",
    transform: [
      {
        rotate: "-13deg",
      },
    ],
  },

  meteor: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 190,
    height: 8,
  },

  meteorGlow: {
    position: "absolute",
    width: 35,
    height: 12,
    right: 0,
    top: -2,
    borderRadius: 10,
    backgroundColor:
      "rgba(110, 175, 255, 0.16)",
  },

  meteorTailLong: {
    position: "absolute",
    width: 165,
    height: 1,
    left: 0,
    top: 3,
    backgroundColor:
      "rgba(95, 160, 245, 0.09)",
  },

  meteorTail: {
    position: "absolute",
    width: 120,
    height: 1.5,
    left: 35,
    top: 3,
    backgroundColor:
      "rgba(190, 220, 255, 0.28)",
  },

  meteorHead: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    right: 8,
    top: 1,
    backgroundColor: "#ffffff",
    shadowColor: "#9dcbff",
    shadowOpacity: 0.95,
    shadowRadius: 9,
    elevation: 5,
  },

  skyBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.28,
    backgroundColor:
      "rgba(0, 2, 7, 0.30)",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 30,
    zIndex: 2,
  },

  profileIcon: {
    position: "absolute",
    top: 55,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  profileIconText: {
    fontSize: 22,
  },

  logoContainer: {
    alignItems: "center",
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },

  logoOne: {
    color: "#ffffff",
  },

  logoQuestion: {
    color: "#4da3ff",
  },

  subtitle: {
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },

  card: {
    marginTop: 60,
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222222",
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    color: "#777777",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 18,
    textAlign: "center",
  },

  question: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "700",
    lineHeight: 33,
    textAlign: "center",
    width: "100%",
  },

  error: {
    color: "#ff6b6b",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  buttons: {
    marginTop: 28,
    gap: 12,
  },

  primaryButton: {
    height: 54,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    height: 54,
    backgroundColor: "#111111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

popularSection: {
  marginTop: 28,
},

popularHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

popularTitle: {
  color: "#ffffff",
  fontSize: 21,
  fontWeight: "700",
},

popularSubtitle: {
  color: "#666666",
  fontSize: 12,
  marginTop: 5,
},

popularViewAll: {
  color: "#4da3ff",
  fontSize: 13,
  fontWeight: "700",
},

popularTabs: {
  flexDirection: "row",
  marginTop: 16,
  backgroundColor: "#111111",
  borderRadius: 15,
  borderWidth: 1,
  borderColor: "#222222",
  padding: 4,
},

popularTab: {
  flex: 1,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 11,
},

popularTabActive: {
  flex: 1,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 11,
  backgroundColor: "#ffffff",
},

popularTabText: {
  color: "#777777",
  fontSize: 12,
  fontWeight: "600",
},

popularTabActiveText: {
  color: "#000000",
  fontSize: 12,
  fontWeight: "700",
},

  answerSection: {
    marginTop: 32,
  },

  answerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },

  fieldLabel: {
    color: "#777777",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 9,
    marginTop: 4,
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
    marginBottom: 18,
  },

  countryButton: {
    minHeight: 54,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  selectedCountryRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  flag: {
    fontSize: 24,
    marginRight: 12,
  },

  countryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    flex: 1,
  },

  countryPlaceholder: {
    color: "#666666",
    fontSize: 16,
  },

  chevron: {
    color: "#888888",
    fontSize: 24,
    marginLeft: 10,
  },

  answerInput: {
    minHeight: 150,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 24,
  },

  characterCount: {
    color: "#666666",
    textAlign: "right",
    fontSize: 12,
    marginTop: 7,
  },

  postButton: {
    height: 56,
    backgroundColor: "#ffffff",
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  postButtonDisabled: {
    opacity: 0.6,
  },

  postButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },

  statsSection: {
    marginTop: 18,
  },

  statsCard: {
    minHeight: 105,
    backgroundColor: "#111111",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#222222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 16,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },

  statNumber: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 31,
  },

  statPercent: {
    position: "absolute",
    top: 2,
    marginLeft: 38,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  statLabel: {
    color: "#777777",
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#292929",
  },

  answersSection: {
    marginTop: 38,
  },

  answersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  answersTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },

  answersCount: {
    color: "#999999",
    fontSize: 14,
    marginLeft: 10,
    backgroundColor: "#151515",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },

  answersLoading: {
    paddingVertical: 35,
    alignItems: "center",
  },

  emptyAnswers: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },

  emptyAnswersTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyAnswersText: {
    color: "#666666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 7,
    lineHeight: 21,
  },

  answerCard: {
    backgroundColor: "#111111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
    padding: 18,
    marginBottom: 12,
  },

  answerCardHeader: {
    marginBottom: 14,
  },

  answerPerson: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#353535",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  flagImageWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  flagImage: {
    width: "100%",
    height: "100%",
  },

  fallbackFlag: {
    fontSize: 27,
  },

  personInfo: {
    marginLeft: 12,
    flex: 1,
  },

  personName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  personCountry: {
    color: "#777777",
    fontSize: 12,
    marginTop: 3,
  },

  answerCardText: {
    color: "#dddddd",
    fontSize: 16,
    lineHeight: 25,
  },

  replyButton: {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  marginTop: 10,
  paddingVertical: 7,
  paddingHorizontal: 12,
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.08)",
},

saveButton: {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  marginTop: 8,
  paddingVertical: 7,
  paddingHorizontal: 12,
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
},

saveButtonSaved: {
  backgroundColor: "rgba(255,255,255,0.25)",
  borderColor: "rgba(255,255,255,0.4)",
},

saveButtonIcon: {
  fontSize: 17,
  marginRight: 6,
},

saveButtonText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff",
},

inlineReplies: {
  marginTop: 10,
  marginBottom: 4,
  padding: 12,
  borderRadius: 18,
  backgroundColor: "rgba(0,0,0,0.25)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.07)",
  overflow: "hidden",
},

inlineReplyList: {
  maxHeight: 220,
  marginBottom: 10,
},

inlineReplyItem: {
  paddingVertical: 10,
  paddingHorizontal: 12,
  marginBottom: 8,
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.06)",
},

inlineReplyText: {
  color: "#eeeeee",
  fontSize: 14,
  lineHeight: 21,
},

inlineReplyDate: {
  color: "#777777",
  fontSize: 10,
  marginTop: 5,
},

replyComposer: {
  width: "100%",
},

noRepliesText: {
  color: "#888888",
  fontSize: 13,
  textAlign: "center",
  paddingVertical: 15,
},

replyModalOverlay: {
  flex: 1,
  justifyContent: "flex-end",
  backgroundColor: "rgba(0,0,0,0.55)",
},

replyModalBackdrop: {
  ...StyleSheet.absoluteFill,
},

replyModalCard: {
  width: "100%",
  maxHeight: "85%",
  backgroundColor: "#151515",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 20,
  paddingTop: 12,
  paddingBottom: 24,
},

replyInput: {
  minHeight: 52,
  maxHeight: 120,
  backgroundColor: "rgba(255,255,255,0.07)",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.10)",
  color: "#ffffff",
  fontSize: 15,
  paddingHorizontal: 15,
  paddingVertical: 12,
  marginBottom: 12,
  textAlignVertical: "top",
},

replySendButton: {
  height: 50,
  borderRadius: 16,
  backgroundColor: "#ffffff",
  alignItems: "center",
  justifyContent: "center",
},

replySendButtonDisabled: {
  opacity: 0.55,
},

replySendText: {
  color: "#000000",
  fontSize: 15,
  fontWeight: "700",
},

replyButtonIcon: {
  fontSize: 16,
  marginRight: 6,
},

replyButtonText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff",
},

contributorsSection: {
  marginTop: 28,
},

contributorsHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

contributorsTitle: {
  color: "#ffffff",
  fontSize: 21,
  fontWeight: "700",
},

contributorsSubtitle: {
  color: "#666666",
  fontSize: 12,
  marginTop: 5,
},

contributorsViewAll: {
  color: "#4da3ff",
  fontSize: 13,
  fontWeight: "700",
},

contributorsPreviewList: {
  marginTop: 14,
},

contributorPreviewCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#111111",
  borderWidth: 1,
  borderColor: "#222222",
  borderRadius: 15,
  padding: 12,
  marginBottom: 8,
},

contributorPreviewFirst: {
  borderColor: "#333333",
},

contributorRank: {
  width: 32,
  fontSize: 18,
  textAlign: "center",
},

contributorAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#222222",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: 5,
},

contributorAvatarText: {
  color: "#ffffff",
  fontSize: 15,
  fontWeight: "800",
},

contributorInfo: {
  flex: 1,
  marginLeft: 11,
},

contributorName: {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "700",
},

contributorAnswers: {
  color: "#666666",
  fontSize: 11,
  marginTop: 3,
},

  /* =====================================================
     REACTION UI
     ===================================================== */

  reactionArea: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1d1d1d",
  },

  reactionBottomRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 10,
  },

  reactEmoji: {
    fontSize: 25,
    color: "#777777",
    marginRight: 7,
  },

  reactEmojiActive: {
    fontSize: 24,
  },

  reactText: {
    color: "#777777",
    fontSize: 14,
    fontWeight: "600",
  },

  reactTextActive: {
    color: "#4da3ff",
    fontWeight: "700",
  },

  reactionCountArea: {
    flexDirection: "row",
    alignItems: "center",
  },

  miniReaction: {
    fontSize: 17,
    marginLeft: -2,
  },

  reactionCount: {
    color: "#777777",
    fontSize: 13,
    marginLeft: 5,
  },

  reactionOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 115,
  },

  reactionOverlayTouch: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  reactionPopup: {
    minHeight: 65,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 34,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#333333",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
  },

  popupEmojiButton: {
    width: 47,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },

  popupEmojiSelected: {
    backgroundColor: "#292929",
    transform: [
      {
        scale: 1.12,
      },
    ],
  },

  popupEmoji: {
    fontSize: 28,
  },

  plusReactionButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 3,
  },

  plusReactionText: {
    color: "#ffffff",
    fontSize: 27,
    fontWeight: "300",
    marginTop: -2,
  },

  /* =====================================================
     FULL EMOJI PICKER
     ===================================================== */

  emojiModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  emojiModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  emojiSheet: {
    height: "82%",
    backgroundColor: "#090909",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  emojiHandle: {
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#3b3b3b",
    alignSelf: "center",
    marginTop: 13,
    marginBottom: 16,
  },

  emojiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  emojiTitle: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "700",
  },

  emojiSubtitle: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },

  emojiClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#292929",
  },

  emojiCloseText: {
    color: "#ffffff",
    fontSize: 27,
    fontWeight: "300",
    lineHeight: 29,
  },

  emojiSearch: {
    height: 48,
    borderRadius: 15,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#292929",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  emojiSearchIcon: {
    color: "#777777",
    fontSize: 23,
    marginLeft: 13,
    marginRight: 3,
    transform: [
      {
        rotate: "-20deg",
      },
    ],
  },

  emojiSearchInput: {
    flex: 1,
    height: 46,
    color: "#ffffff",
    fontSize: 15,
    paddingHorizontal: 9,
  },

  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 35,
  },

  emojiCell: {
    width: `${100 / 7}%`,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
  },

  fullEmoji: {
    fontSize: 29,
  },

  customPopupOverlay: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 24,
},

customPopupBackdrop: {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(0,0,0,0.72)",
},

customPopupCard: {
  width: "100%",
  maxWidth: 360,
  backgroundColor: "#111111",
  borderRadius: 26,
  borderWidth: 1,
  borderColor: "#2b2b2b",
  paddingHorizontal: 24,
  paddingTop: 26,
  paddingBottom: 22,
  alignItems: "center",
  shadowColor: "#000000",
  shadowOpacity: 0.45,
  shadowRadius: 25,
  shadowOffset: {
    width: 0,
    height: 12,
  },
  elevation: 15,
},

customPopupIcon: {
  width: 58,
  height: 58,
  borderRadius: 29,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
},

customPopupSuccessIcon: {
  backgroundColor: "#ffffff",
},

customPopupErrorIcon: {
  backgroundColor: "#2a2a2a",
  borderWidth: 1,
  borderColor: "#444444",
},

customPopupIconText: {
  fontSize: 27,
  fontWeight: "800",
  color: "#000000",
},

customPopupTitle: {
  color: "#ffffff",
  fontSize: 21,
  fontWeight: "800",
  textAlign: "center",
},

customPopupMessage: {
  color: "#888888",
  fontSize: 14,
  lineHeight: 21,
  textAlign: "center",
  marginTop: 9,
  paddingHorizontal: 5,
},

customPopupButton: {
  width: "100%",
  height: 50,
  borderRadius: 15,
  backgroundColor: "#ffffff",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 22,
},

customPopupButtonText: {
  color: "#000000",
  fontSize: 15,
  fontWeight: "800",
},

  successBox: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 90,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },

  successIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#111111",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 25,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 10,
  },

  successText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      "rgba(0, 0, 0, 0.78)",
  },

  overlayTouch: {
    flex: 1,
  },

  countryModal: {
    height: "84%",
    backgroundColor: "#090909",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 0,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#242424",
    overflow: "hidden",
  },

  sheetHandleTouchArea: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#3a3a3a",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "700",
  },

  modalSubtitle: {
    color: "#666666",
    fontSize: 13,
    marginTop: 4,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#292929",
  },

  closeText: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
  },

  searchWrapper: {
    height: 52,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchIcon: {
    color: "#777777",
    fontSize: 25,
    marginLeft: 14,
    marginRight: 4,
    transform: [
      {
        rotate: "-20deg",
      },
    ],
  },

  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    color: "#ffffff",
    fontSize: 15,
  },

  clearSearch: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  clearSearchText: {
    color: "#888888",
    fontSize: 23,
  },

  countryList: {
    flex: 1,
  },

  countryRow: {
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#191919",
    borderRadius: 13,
  },

  countryRowSelected: {
    backgroundColor: "#181818",
  },

  countryFlagBox: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  countryFlag: {
    fontSize: 26,
  },

  countryName: {
    color: "#dddddd",
    fontSize: 15,
    flex: 1,
    marginLeft: 4,
  },

  countryNameSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },

  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  checkMark: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "800",
  },

  noResults: {
    paddingVertical: 60,
    alignItems: "center",
  },

  noResultsIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  noResultsText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  noResultsSubtext: {
    color: "#666666",
    fontSize: 13,
    marginTop: 6,
  },
});
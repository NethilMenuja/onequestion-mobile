import * as ImagePicker from "expo-image-picker";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  name: string;
  country: string;
  user_id: string | null;
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  avatar_url: string | null;
};

/* =========================================================
   ANIMATED NUMBER
   ========================================================= */

function AnimatedNumber({
  value,
  visible,
}: {
  value: number;
  visible: boolean;
}) {
  const animation = useRef(
    new Animated.Value(0)
  ).current;

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animation.stopAnimation();

    if (!visible) {
      animation.setValue(0);
      setDisplayValue(0);
      return;
    }

    animation.setValue(0);
    setDisplayValue(0);

    const listener = animation.addListener(
      ({ value: currentValue }) => {
        setDisplayValue(Math.round(currentValue));
      }
    );

    Animated.timing(animation, {
      toValue: value,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animation.removeListener(listener);
    };
  }, [value, visible, animation]);

  return (
    <Text style={styles.statNumber}>
      {displayValue}
    </Text>
  );
}

/* =========================================================
   PROFILE ICON
   ========================================================= */

function PhotoEditIcon() {
  return (
    <Image
      source={{
        uri: "https://img.icons8.com/?size=100&id=OWXzR0yXpW0d&format=png&color=000000",
      }}
      style={styles.photoEditIcon}
      resizeMode="contain"
    />
  );
}

/* =========================================================
   SETTINGS ICON
   ========================================================= */

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

/* =========================================================
   CUSTOM SEARCH ICON
   ========================================================= */

function SearchIcon() {
  return (
    <View style={styles.searchIconCustom}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );
}

/* =========================================================
   LOGOUT ICON
   ========================================================= */

function LogoutIcon() {
  return (
    <Image
      source={{
        uri: "https://img.icons8.com/?size=100&id=BdksXmxLaK8r&format=png&color=000000",
      }}
      style={styles.logoutIcon}
      resizeMode="contain"
    />
  );
}

/* =========================================================
   MAIN PROFILE
   ========================================================= */

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{
  id?: string;
}>();

const isPublicProfile =
  typeof id === "string";
  
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [answers, setAnswers] =
    useState<Answer[]>([]);

  const [filteredAnswers, setFilteredAnswers] =
    useState<Answer[]>([]);

  const [answerCount, setAnswerCount] =
    useState(0);

  const [followerCount, setFollowerCount] =
    useState(0);

  const [followingCount, setFollowingCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [photoLoading, setPhotoLoading] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [answersOpen, setAnswersOpen] =
    useState(false);

  /* Stats visibility */
  const [statsVisible, setStatsVisible] =
    useState(false);

  /* Custom logout confirmation */
  const [logoutConfirmOpen, setLogoutConfirmOpen] =
    useState(false);

  const logoutAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const answersAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const statsFadeAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const lastStatsVisible =
    useRef(false);

  useEffect(() => {
    loadProfile();
  }, []);

  /* =======================================================
     SEARCH
     ======================================================= */

  useEffect(() => {
    const query =
      searchText.trim().toLowerCase();

    if (!query) {
      setFilteredAnswers(answers);
      return;
    }

    const filtered = answers.filter(
      (item) =>
        item.answer
          .toLowerCase()
          .includes(query) ||
        item.name
          .toLowerCase()
          .includes(query) ||
        item.country
          .toLowerCase()
          .includes(query)
    );

    setFilteredAnswers(filtered);
  }, [searchText, answers]);

  /* =======================================================
     LOAD PROFILE
     ======================================================= */

  async function loadProfile() {
    try {
      setLoading(true);

      const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  router.replace("/login");
  return;
}

const profileUserId =
  typeof id === "string"
    ? id
    : user.id;

const isOwnProfile =
  profileUserId === user.id;

if (isOwnProfile) {
  setProfile({
    id: user.id,
    email: user.email ?? "",
    avatar_url:
      user.user_metadata?.avatar_url ??
      null,
  });
}

await Promise.all([
  loadAnswers(profileUserId),
  loadAnswerCount(profileUserId),
  loadFollowCounts(profileUserId),
]);

      /*
       * Start the stats animation after the
       * actual counts have been loaded.
       */
      lastStatsVisible.current = true;

      setTimeout(() => {
        setStatsVisible(true);

        Animated.timing(
          statsFadeAnimation,
          {
            toValue: 1,
            duration: 300,
            easing: Easing.out(
              Easing.cubic
            ),
            useNativeDriver: true,
          }
        ).start();
      }, 100);
    } catch (error) {
      console.error(
        "Profile error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD ANSWERS
     ======================================================= */

  async function loadAnswers(
    userId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("answers")
      .select(
        "id, question_id, answer, name, country, user_id, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Profile answers error:",
        error
      );

      setAnswers([]);
      return;
    }

    setAnswers(
      (data ?? []) as Answer[]
    );
  }

  /* =======================================================
     ANSWER COUNT
     ======================================================= */

  async function loadAnswerCount(
    userId: string
  ) {
    const {
      count,
      error,
    } = await supabase
      .from("answers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "Answer count error:",
        error
      );

      setAnswerCount(0);
      return;
    }

    setAnswerCount(count ?? 0);
  }

  /* =======================================================
     FOLLOW COUNTS
     ======================================================= */

  async function loadFollowCounts(
    userId: string
  ) {
    try {
      const {
        count: followers,
        error: followersError,
      } = await supabase
        .from("follows")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("following_id", userId);

      if (followersError) {
        console.error(
          "Followers count error:",
          followersError
        );
      }

      const {
        count: following,
        error: followingError,
      } = await supabase
        .from("follows")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("follower_id", userId);

      if (followingError) {
        console.error(
          "Following count error:",
          followingError
        );
      }

      setFollowerCount(
        followers ?? 0
      );

      setFollowingCount(
        following ?? 0
      );
    } catch (error) {
      console.error(
        "Follow count error:",
        error
      );
    }
  }

  /* =======================================================
     REFRESH
     ======================================================= */

  async function handleRefresh() {
    try {
      setRefreshing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      /*
       * Reset stats first.
       * This means refresh also shows:
       *
       * 0 → actual number
       */
      lastStatsVisible.current = false;
      setStatsVisible(false);

      statsFadeAnimation.setValue(0);

      await Promise.all([
        loadAnswers(user.id),
        loadAnswerCount(user.id),
        loadFollowCounts(user.id),
      ]);

      setTimeout(() => {
        lastStatsVisible.current = true;
        setStatsVisible(true);

        Animated.timing(
          statsFadeAnimation,
          {
            toValue: 1,
            duration: 300,
            easing: Easing.out(
              Easing.cubic
            ),
            useNativeDriver: true,
          }
        ).start();
      }, 100);
    } finally {
      setRefreshing(false);
    }
  }

  /* =======================================================
     STATS SCROLL VISIBILITY
     ======================================================= */

  function handleScroll(
    event: any
  ) {
    const scrollY =
      event.nativeEvent.contentOffset.y;

    /*
     * Approximate position of stats card.
     *
     * When user scrolls down enough,
     * stats leave the screen.
     *
     * When they come back,
     * animation starts again from 0.
     */

    const statsTop = 250;
    const screenHeight = 700;

    const visible =
      statsTop - scrollY <
        screenHeight &&
      statsTop - scrollY > -80;

    if (
      visible &&
      !lastStatsVisible.current
    ) {
      lastStatsVisible.current = true;

      setStatsVisible(false);

      setTimeout(() => {
        setStatsVisible(true);
      }, 50);
    }

    if (
      !visible &&
      lastStatsVisible.current
    ) {
      lastStatsVisible.current = false;

      setStatsVisible(false);
    }

    Animated.timing(
      statsFadeAnimation,
      {
        toValue: visible ? 1 : 0.35,
        duration: 180,
        useNativeDriver: true,
      }
    ).start();
  }

  /* =======================================================
     PHOTO PICKER
     ======================================================= */

  async function handlePickPhoto() {
    try {
      if (!profile) {
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (
        result.canceled ||
        !result.assets ||
        result.assets.length === 0
      ) {
        return;
      }

      await uploadProfilePhoto(
        result.assets[0].uri
      );
    } catch (error) {
      console.error(
        "Photo picker error:",
        error
      );
    }
  }

  /* =======================================================
     UPLOAD PHOTO
     ======================================================= */

  async function uploadProfilePhoto(
    imageUri: string
  ) {
    if (!profile) {
      return;
    }

    try {
      setPhotoLoading(true);

      const response =
        await fetch(imageUri);

      const arrayBuffer =
        await response.arrayBuffer();

      const filePath =
        `${profile.id}/avatar.jpg`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("avatars")
        .upload(
          filePath,
          arrayBuffer,
          {
            contentType:
              "image/jpeg",
            upsert: true,
          }
        );

      if (uploadError) {
        console.error(
          "Avatar upload error:",
          uploadError
        );

        return;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl =
        `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
        },
      });

      if (updateError) {
        console.error(
          "Avatar update error:",
          updateError
        );

        return;
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                avatar_url:
                  avatarUrl,
              }
            : current
      );
    } catch (error) {
      console.error(
        "Upload photo error:",
        error
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  /* =======================================================
     MY ANSWERS DROPDOWN
     ======================================================= */

  function toggleAnswers() {
    const opening =
      !answersOpen;

    setAnswersOpen(opening);

    Animated.timing(
      answersAnimation,
      {
        toValue: opening ? 1 : 0,
        duration: 360,
        easing: opening
          ? Easing.out(
              Easing.cubic
            )
          : Easing.inOut(
              Easing.cubic
            ),
        useNativeDriver: true,
      }
    ).start();
  }

  /* =======================================================
     CUSTOM LOGOUT CONFIRMATION OPEN
     ======================================================= */

  function openLogoutConfirmation() {
    setLogoutConfirmOpen(true);

    logoutAnimation.setValue(0);

    Animated.spring(
      logoutAnimation,
      {
        toValue: 1,
        damping: 18,
        stiffness: 180,
        mass: 0.75,
        useNativeDriver: true,
      }
    ).start();
  }

  /* =======================================================
     CLOSE LOGOUT CONFIRMATION
     ======================================================= */

  function closeLogoutConfirmation() {
    Animated.timing(
      logoutAnimation,
      {
        toValue: 0,
        duration: 220,
        easing: Easing.in(
          Easing.cubic
        ),
        useNativeDriver: true,
      }
    ).start(() => {
      setLogoutConfirmOpen(false);
    });
  }

  /* =======================================================
     ACTUAL LOGOUT
     ======================================================= */

  async function performLogout() {
    setLoggingOut(true);

    try {
      const {
        error,
      } = await supabase.auth.signOut();

      if (error) {
        console.error(
          "Logout error:",
          error
        );

        setLoggingOut(false);
        return;
      }

      setLogoutConfirmOpen(false);

      router.replace("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      setLoggingOut(false);
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="small"
          color="#ffffff"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  /* =======================================================
     PROFILE UI
     ======================================================= */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
          />
        }
      >
        {/* ================================================
            TOP BAR
            ================================================ */}

        <View style={styles.topBar}>
          <TouchableOpacity
            style={
              styles.iconButton
            }
            onPress={() =>
              router.back()
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.backIcon
              }
            >
              ‹
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.topTitle
            }
          >
            Profile
          </Text>

          {/* SETTINGS = SEPARATE PAGE */}

{!isPublicProfile ? (
  <TouchableOpacity
    style={
      styles.iconButton
    }
    onPress={() =>
      router.push(
        "/settings"
      )
    }
    activeOpacity={0.8}
  >
    <SettingsIcon />
  </TouchableOpacity>
) : (
  <View
    style={
      styles.iconButton
    }
  />
)}
        </View>

        {/* ================================================
            PROFILE CARD
            ================================================ */}

        <View
          style={
            styles.profileCard
          }
        >
          <TouchableOpacity
            style={
              styles.avatarWrapper
            }
            onPress={
  isPublicProfile
    ? undefined
    : handlePickPhoto
}
            activeOpacity={0.85}
            disabled={
              photoLoading
            }
          >
            {profile?.avatar_url ? (
              <Image
                source={{
                  uri: profile.avatar_url,
                }}
                style={
                  styles.avatarImage
                }
              />
            ) : (
              <View
                style={
                  styles.avatar
                }
              >
                <Image
                  source={{
                    uri: "https://img.icons8.com/?size=100&id=Fx70T4fgtNmt&format=png&color=000000",
                  }}
                  style={
                    styles.defaultProfileIcon
                  }
                  resizeMode="contain"
                />
              </View>
            )}

            {!isPublicProfile && (
  <View
    style={
      styles.photoEditButton
    }
  >
    {photoLoading ? (
      <ActivityIndicator
        size="small"
        color="#ffffff"
      />
    ) : (
      <PhotoEditIcon />
    )}
  </View>
)}
          </TouchableOpacity>

          <Text
            style={
              styles.email
            }
          >
            {profile?.email}
          </Text>

          {!isPublicProfile && (
  <Text
    style={
      styles.photoHint
    }
  >
    Tap your photo to change it
  </Text>
)}
        </View>

        {/* ================================================
            STATS
            ================================================ */}

        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity:
                statsFadeAnimation,
              transform: [
                {
                  translateY:
                    statsFadeAnimation.interpolate(
                      {
                        inputRange: [
                          0,
                          1,
                        ],
                        outputRange: [
                          8,
                          0,
                        ],
                      }
                    ),
                },
              ],
            },
          ]}
        >
          <View
            style={styles.stat}
          >
            <AnimatedNumber
              value={
                answerCount
              }
              visible={
                statsVisible
              }
            />

            <Text
              style={
                styles.statLabel
              }
            >
              Answers
            </Text>
          </View>

          <View
            style={
              styles.divider
            }
          />

          <View
            style={styles.stat}
          >
            <AnimatedNumber
              value={
                followerCount
              }
              visible={
                statsVisible
              }
            />

            <Text
              style={
                styles.statLabel
              }
            >
              Followers
            </Text>
          </View>

          <View
            style={
              styles.divider
            }
          />

          <View
            style={styles.stat}
          >
            <AnimatedNumber
              value={
                followingCount
              }
              visible={
                statsVisible
              }
            />

            <Text
              style={
                styles.statLabel
              }
            >
              Following
            </Text>
          </View>
        </Animated.View>

        {/* ================================================
            SEARCH
            ================================================ */}

        <View
          style={
            styles.searchContainer
          }
        >
          <SearchIcon />

          <TextInput
            value={searchText}
            onChangeText={
              setSearchText
            }
            placeholder="Search your answers..."
            placeholderTextColor="#666666"
            style={
              styles.searchInput
            }
            returnKeyType="search"
          />

          {searchText.length >
            0 && (
            <TouchableOpacity
              onPress={() =>
                setSearchText("")
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.clearSearch
                }
              >
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ================================================
            MY ANSWERS
            ================================================ */}

        <TouchableOpacity
          style={
            styles.answersHeader
          }
          onPress={
            toggleAnswers
          }
          activeOpacity={0.85}
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              {isPublicProfile ? "Answers" : "My Answers"}
            </Text>

            <Text
              style={
                styles.answerCountText
              }
            >
              {answerCount} answer
              {answerCount === 1
                ? ""
                : "s"}
            </Text>
          </View>

          <Animated.Text
            style={[
              styles.dropdownArrow,
              {
                transform: [
                  {
                    rotate:
                      answersAnimation.interpolate(
                        {
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            "0deg",
                            "180deg",
                          ],
                        }
                      ),
                  },
                ],
              },
            ]}
          >
            ⌄
          </Animated.Text>
        </TouchableOpacity>

        {answersOpen && (
          <Animated.View
            style={[
              styles.answersContainer,
              {
                opacity:
                  answersAnimation,
                transform: [
                  {
                    translateY:
                      answersAnimation.interpolate(
                        {
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            -15,
                            0,
                          ],
                        }
                      ),
                  },
                  {
                    scale:
                      answersAnimation.interpolate(
                        {
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            0.97,
                            1,
                          ],
                        }
                      ),
                  },
                ],
              },
            ]}
          >
            {filteredAnswers.length ===
            0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <View
                  style={
                    styles.emptyCircle
                  }
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  {searchText
                    ? "No answers found"
                    : "No answers yet"}
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {searchText
                    ? "Try a different search."
                    : "Your answers will appear here."}
                </Text>
              </View>
            ) : (
              filteredAnswers.map(
                (item) => (
                  <View
                    key={
                      item.id
                    }
                    style={
                      styles.answerCard
                    }
                  >
                    <View
                      style={
                        styles.answerHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.answerName
                          }
                        >
                          {
                            item.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.answerCountry
                          }
                        >
                          {
                            item.country
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.answerDate
                        }
                      >
                        {new Date(
                          item.created_at
                        ).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.answerText
                      }
                    >
                      {
                        item.answer
                      }
                    </Text>
                  </View>
                )
              )
            )}
          </Animated.View>
        )}

        {/* ================================================
            LOGOUT
            ================================================ */}
      {!isPublicProfile && (
        <TouchableOpacity
          style={[
            styles.logoutButton,
            loggingOut &&
              styles.logoutDisabled,
          ]}
          onPress={
            openLogoutConfirmation
          }
          disabled={
            loggingOut
          }
          activeOpacity={0.82}
        >
          {loggingOut ? (
            <ActivityIndicator
              size="small"
              color="#b85a5a"
            />
          ) : (
            <>
              <LogoutIcon />

              <Text
                style={
                  styles.logoutText
                }
              >
                Log Out
              </Text>
            </>
          )}
        </TouchableOpacity>

        )}

        <TouchableOpacity
          style={
            styles.bottomBackButton
          }
          onPress={() =>
            router.back()
          }
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.backText
            }
          >
            Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
      

      {/* ==================================================
          CUSTOM LOGOUT CONFIRMATION
          ================================================== */}

      {logoutConfirmOpen && (
        <View
          style={
            styles.logoutOverlay
          }
        >
          <TouchableOpacity
            style={
              styles.overlayTouch
            }
            activeOpacity={1}
            onPress={
              closeLogoutConfirmation
            }
          />

          <Animated.View
            style={[
              styles.logoutModal,
              {
                opacity:
                  logoutAnimation,
                transform: [
                  {
                    scale:
                      logoutAnimation.interpolate(
                        {
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            0.86,
                            1,
                          ],
                        }
                      ),
                  },
                  {
                    translateY:
                      logoutAnimation.interpolate(
                        {
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            45,
                            0,
                          ],
                        }
                      ),
                  },
                ],
              },
            ]}
          >
            <View
              style={
                styles.logoutModalIcon
              }
            >
              <LogoutIcon />
            </View>

            <Text
              style={
                styles.logoutModalTitle
              }
            >
              Log out?
            </Text>

            <Text
              style={
                styles.logoutModalText
              }
            >
              Are you sure you want to
              log out of your
              ONEQUESTION account?
            </Text>

            <View
              style={
                styles.logoutModalButtons
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  closeLogoutConfirmation
                }
                activeOpacity={
                  0.8
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.confirmLogoutButton
                }
                onPress={
                  performLogout
                }
                disabled={
                  loggingOut
                }
                activeOpacity={
                  0.8
                }
              >
                {loggingOut ? (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={
                      styles.confirmLogoutText
                    }
                  >
                    Log Out
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 70,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#777777",
    fontSize: 14,
    marginTop: 12,
  },

  /* TOP */

  topBar: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  topTitle: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "700",
  },

  iconButton: {
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

  /* SETTINGS ICON */

  settingsIcon: {
    width: 22,
    height: 22,
    tintColor: "#eeeeee",
  },

  /* PROFILE */

  profileCard: {
    backgroundColor: "#111111",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#222222",
    paddingVertical: 29,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 18,
  },

  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#1b1b1b",
    borderWidth: 2,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
    borderColor: "#303030",
  },

  defaultProfileIcon: {
    width: 48,
    height: 48,
    tintColor: "#777777",
  },

  defaultAvatarHead: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#777777",
    marginTop: 1,
  },

  defaultAvatarBody: {
    width: 48,
    height: 27,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#777777",
    marginTop: 7,
  },

  photoEditButton: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: "#262626",
    borderWidth: 2,
    borderColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ICONS8 PHOTO ICON */

  photoEditIcon: {
    width: 21,
    height: 21,
    tintColor: "#eeeeee",
  },

  email: {
    color: "#ffffff",
    fontSize: 16,
  },

  photoHint: {
    color: "#555555",
    fontSize: 12,
    marginTop: 9,
  },

  /* STATS */

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#222222",
    marginTop: 16,
    paddingVertical: 22,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },

  statLabel: {
    color: "#777777",
    fontSize: 12,
    marginTop: 5,
  },

  divider: {
    width: 1,
    height: 39,
    backgroundColor: "#292929",
  },

  /* SEARCH */

  searchContainer: {
    height: 53,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#222222",
    paddingHorizontal: 15,
    marginTop: 18,
  },

  searchIconCustom: {
    width: 21,
    height: 21,
    marginRight: 9,
    position: "relative",
  },

  searchCircle: {
    position: "absolute",
    left: 1,
    top: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#aaaaaa",
  },

  searchHandle: {
    position: "absolute",
    width: 8,
    height: 2,
    backgroundColor: "#aaaaaa",
    left: 12,
    top: 14,
    transform: [
      {
        rotate: "45deg",
      },
    ],
    borderRadius: 2,
  },

  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    height: "100%",
  },

  clearSearch: {
    color: "#888888",
    fontSize: 27,
    lineHeight: 28,
    paddingLeft: 8,
  },

  /* ANSWERS */

  answersHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "700",
  },

  answerCountText: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },

  dropdownArrow: {
    color: "#aaaaaa",
    fontSize: 23,
  },

  answersContainer: {
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: "#111111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  emptyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#555555",
    marginBottom: 12,
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },

  emptyText: {
    color: "#777777",
    fontSize: 14,
    marginTop: 7,
    textAlign: "center",
  },

  answerCard: {
    backgroundColor: "#111111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
    padding: 18,
    marginBottom: 12,
  },

  answerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  answerName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  answerCountry: {
    color: "#777777",
    fontSize: 13,
    marginTop: 4,
  },

  answerText: {
    color: "#eeeeee",
    fontSize: 16,
    lineHeight: 24,
  },

  answerDate: {
    color: "#666666",
    fontSize: 11,
    marginLeft: 10,
  },

  /* LOGOUT BUTTON */

  logoutButton: {
    height: 57,
    backgroundColor: "#321818",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#683131",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 27,
  },

  logoutDisabled: {
    opacity: 0.65,
  },

  logoutText: {
    color: "#ffb8b8",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },

  /* ICONS8 LOGOUT ICON */

  logoutIcon: {
    width: 21,
    height: 21,
    tintColor: "#ffb8b8",
  },

  /* BOTTOM BACK */

  bottomBackButton: {
    alignItems: "center",
    marginTop: 20,
    padding: 12,
  },

  backText: {
    color: "#999999",
    fontSize: 15,
  },

  /* ======================================================
     CUSTOM LOGOUT MODAL
     ====================================================== */

  logoutOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  overlayTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  logoutModal: {
    width: "100%",
    backgroundColor: "#111111",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#3a2020",
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 21,
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 15,
  },

  logoutModalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#351919",
    borderWidth: 1,
    borderColor: "#683131",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 17,
  },

  logoutModalTitle: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  logoutModalText: {
    color: "#858585",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 10,
  },

  logoutModalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 23,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#1b1b1b",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#dddddd",
    fontSize: 15,
    fontWeight: "700",
  },

  confirmLogoutButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#8d3838",
    borderWidth: 1,
    borderColor: "#a64b4b",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmLogoutText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
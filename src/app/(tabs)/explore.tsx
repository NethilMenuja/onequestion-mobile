import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  created_at: string;
};

type ExploreQuestion = Question & {
  answers: Answer[];
};

const CALENDAR_ICON =
  "https://img.icons8.com/?size=100&id=43503&format=png&color=000000";

const WEEK_DAYS = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

/*
 * Mobile-safe YYYY-MM-DD
 */
function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStart(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function getCalendarDays(monthDate: Date) {
  const year =
    monthDate.getFullYear();

  const month =
    monthDate.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthDays =
    new Date(
      year,
      month,
      0
    ).getDate();

  const days: {
    date: Date;
    currentMonth: boolean;
  }[] = [];

  for (
    let i = firstDay - 1;
    i >= 0;
    i--
  ) {
    days.push({
      date: new Date(
        year,
        month - 1,
        previousMonthDays - i
      ),
      currentMonth: false,
    });
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    days.push({
      date: new Date(
        year,
        month,
        day
      ),
      currentMonth: true,
    });
  }

  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      date: new Date(
        year,
        month + 1,
        nextDay
      ),
      currentMonth: false,
    });

    nextDay++;
  }

  return days;
}

/*
 * Search highlight component
 */
function HighlightedText({
  text,
  search,
  style,
}: {
  text: string;
  search: string;
  style: any;
}) {
  const cleanSearch =
    search.trim();

  if (!cleanSearch) {
    return (
      <Text style={style}>
        {text}
      </Text>
    );
  }

  const lowerText =
    text.toLowerCase();

  const lowerSearch =
    cleanSearch.toLowerCase();

  const pieces: {
    text: string;
    match: boolean;
  }[] = [];

  let currentIndex = 0;

  while (currentIndex < text.length) {
    const matchIndex =
      lowerText.indexOf(
        lowerSearch,
        currentIndex
      );

    if (matchIndex === -1) {
      pieces.push({
        text: text.slice(
          currentIndex
        ),
        match: false,
      });

      break;
    }

    if (
      matchIndex > currentIndex
    ) {
      pieces.push({
        text: text.slice(
          currentIndex,
          matchIndex
        ),
        match: false,
      });
    }

    pieces.push({
      text: text.slice(
        matchIndex,
        matchIndex +
          cleanSearch.length
      ),
      match: true,
    });

    currentIndex =
      matchIndex +
      cleanSearch.length;
  }

  return (
    <Text style={style}>
      {pieces.map(
        (piece, index) =>
          piece.match ? (
            <Text
              key={index}
              style={
                styles.highlight
              }
            >
              {piece.text}
            </Text>
          ) : (
            <Text key={index}>
              {piece.text}
            </Text>
          )
      )}
    </Text>
  );
}

/*
 * Animated Q&A card
 *
 * - Date selection = fresh popup
 * - Every time the card enters the screen = popup
 * - When it leaves the screen, animation resets
 * - When it comes back = popup again
 */
function AnimatedQuestionCard({
  question,
  searchText,
  scrollY,
  animationKey,
}: {
  question: ExploreQuestion;
  searchText: string;
  scrollY: Animated.Value;
  animationKey: string;
}) {
  const animation =
    useRef(
      new Animated.Value(0)
    ).current;

  const [layoutY, setLayoutY] =
    useState<number | null>(
      null
    );

  const [layoutHeight, setLayoutHeight] =
    useState(0);

  const isVisible =
    useRef(false);

  const previousAnimationKey =
    useRef(animationKey);

  /*
   * Popup animation function
   */
  const runPopupAnimation =
    useCallback(() => {
      animation.stopAnimation();

      animation.setValue(0);

      Animated.timing(
        animation,
        {
          toValue: 1,
          duration: 650,
          easing: Easing.out(
            Easing.back(1.15)
          ),
          useNativeDriver: true,
        }
      ).start();
    }, [animation]);

  /*
   * Date selection / filter change
   *
   * Every time the animation key changes,
   * this card gets a fresh popup.
   */
  useEffect(() => {
    if (
      previousAnimationKey.current !==
      animationKey
    ) {
      previousAnimationKey.current =
        animationKey;

      isVisible.current = true;

      runPopupAnimation();
    }
  }, [
    animationKey,
    runPopupAnimation,
  ]);

  /*
   * Scroll popup
   *
   * The card pops up every time it
   * enters the visible screen area.
   *
   * When it leaves the screen,
   * its animation resets.
   */
  useEffect(() => {
    if (
      layoutY === null ||
      layoutHeight <= 0
    ) {
      return;
    }

    const checkPosition = (
      value: number
    ) => {
      /*
       * Approximate visible phone area.
       */
      const screenTop =
        value + 20;

      const screenBottom =
        value + 680;

      const cardTop =
        layoutY;

      const cardBottom =
        layoutY + layoutHeight;

      /*
       * Is any part of this card
       * inside the visible area?
       */
      const visible =
        cardBottom > screenTop &&
        cardTop < screenBottom;

      /*
       * Card ENTERS screen
       */
      if (
        visible &&
        !isVisible.current
      ) {
        isVisible.current = true;

        runPopupAnimation();

        return;
      }

      /*
       * Card LEAVES screen
       *
       * Reset so that when the user
       * scrolls back to it, it pops
       * again.
       */
      if (
        !visible &&
        isVisible.current
      ) {
        isVisible.current = false;

        animation.stopAnimation();
        animation.setValue(0);
      }
    };

    const listener =
      scrollY.addListener(
        ({ value }) => {
          checkPosition(value);
        }
      );

    /*
     * Start with the first position.
     *
     * We do NOT use __getValue().
     */
    checkPosition(0);

    return () => {
      scrollY.removeListener(
        listener
      );
    };
  }, [
    layoutY,
    layoutHeight,
    scrollY,
    animation,
    runPopupAnimation,
  ]);

  /*
   * Popup opacity
   */
  const opacity =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

  /*
   * Popup comes from below
   */
  const translateY =
    animation.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [85, 10, 0],
      extrapolate: "clamp",
    });

  /*
   * Small -> slightly bigger -> normal
   */
  const scale =
    animation.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [
        0.86,
        1.03,
        1,
      ],
      extrapolate: "clamp",
    });

  return (
    <Animated.View
      onLayout={(event) => {
        setLayoutY(
          event.nativeEvent.layout.y
        );

        setLayoutHeight(
          event.nativeEvent.layout.height
        );
      }}
      style={[
        styles.questionSection,
        {
          opacity,
          transform: [
            {
              translateY,
            },
            {
              scale,
            },
          ],
        },
      ]}
    >
      {/* DATE BADGE */}

      <View
        style={styles.dateBadge}
      >
        <Image
          source={{
            uri: CALENDAR_ICON,
          }}
          style={
            styles.smallCalendarIcon
          }
        />

        <Text
          style={styles.dateText}
        >
          {question.question_date}
        </Text>
      </View>

      {/* QUESTION */}

      <View
        style={styles.questionCard}
      >
        <Text
          style={
            styles.questionLabel
          }
        >
          QUESTION
        </Text>

        <HighlightedText
          text={question.question}
          search={searchText}
          style={
            styles.questionText
          }
        />
      </View>

      {/* ANSWERS */}

      {question.answers.length ===
      0 ? (
        <View
          style={
            styles.emptyAnswers
          }
        >
          <Text
            style={
              styles.emptyAnswersText
            }
          >
            No answers yet.
          </Text>
        </View>
      ) : (
        question.answers.map(
          (answer) => (
            <View
              key={answer.id}
              style={
                styles.answerCard
              }
            >
              <HighlightedText
                text={answer.answer}
                search={searchText}
                style={
                  styles.answerText
                }
              />

              <HighlightedText
                text={`— ${answer.name}`}
                search={searchText}
                style={
                  styles.answerName
                }
              />

              <HighlightedText
                text={answer.country}
                search={searchText}
                style={
                  styles.answerCountry
                }
              />
            </View>
          )
        )
      )}
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const [questions, setQuestions] =
    useState<
      ExploreQuestion[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState<string | null>(
      null
    );

  const [calendarOpen, setCalendarOpen] =
    useState(false);

  const [calendarMonth, setCalendarMonth] =
    useState(() =>
      getMonthStart(
        new Date()
      )
    );

  /*
   * Calendar animation
   */
  const calendarAnimation =
    useRef(
      new Animated.Value(0)
    ).current;

  /*
   * Q&A scroll animation
   */
  const scrollY =
    useRef(
      new Animated.Value(0)
    ).current;

  /*
   * Used to force Q&A popup again
   * after date selection.
   */
  const [qaAnimationKey, setQaAnimationKey] =
    useState("all");

  /*
   * Load Questions + Answers
   */
  const loadExploreData =
    async () => {
      try {
        setError("");

        const today =
          getTodayDate();

        console.log(
          "Explore today:",
          today
        );

        const {
          data: questionsData,
          error: questionsError,
        } = await supabase
          .from("questions")
          .select(
            "id, question, question_date"
          )
          .lte(
            "question_date",
            today
          )
          .order(
            "question_date",
            {
              ascending: false,
            }
          );

        if (questionsError) {
          console.error(
            "Explore questions error:",
            questionsError
          );

          setError(
            "Could not load questions."
          );

          return;
        }

        const loadedQuestions =
          questionsData ?? [];

        console.log(
          "Explore questions:",
          loadedQuestions.length
        );

        if (
          loadedQuestions.length ===
          0
        ) {
          setQuestions([]);
          return;
        }

        const questionIds =
          loadedQuestions.map(
            (question) =>
              question.id
          );

        const {
          data: answersData,
          error: answersError,
        } = await supabase
          .from("answers")
          .select(
            "id, question_id, answer, name, country, created_at"
          )
          .in(
            "question_id",
            questionIds
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (answersError) {
          console.error(
            "Explore answers error:",
            answersError
          );

          setError(
            "Could not load answers."
          );

          return;
        }

        const loadedAnswers =
          answersData ?? [];

        const combinedQuestions =
          loadedQuestions.map(
            (question) => ({
              ...question,
              answers:
                loadedAnswers.filter(
                  (answer) =>
                    answer.question_id ===
                    question.id
                ),
            })
          );

        setQuestions(
          combinedQuestions
        );
      } catch (err) {
        console.error(
          "Unexpected Explore error:",
          err
        );

        setError(
          "Something went wrong."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useFocusEffect(
    useCallback(() => {
      loadExploreData();
    }, [])
  );

  /*
   * Refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadExploreData();
  };

  /*
   * Available dates
   */
  const availableDates =
    useMemo(() => {
      return new Set(
        questions.map(
          (question) =>
            question.question_date
        )
      );
    }, [questions]);

  /*
   * Calendar days
   */
  const calendarDays =
    useMemo(() => {
      return getCalendarDays(
        calendarMonth
      );
    }, [calendarMonth]);

  /*
   * Filter Questions
   */
  const filteredQuestions =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      /*
       * IMPORTANT:
       * Date filter happens first.
       */
      let result = questions;

      if (selectedDate) {
        result = result.filter(
          (question) =>
            question.question_date ===
            selectedDate
        );
      }

      /*
       * Search filter
       */
      if (!search) {
        return result;
      }

      return result
        .map((question) => {
          const questionMatches =
            question.question
              .toLowerCase()
              .includes(search);

          const matchingAnswers =
            question.answers.filter(
              (answer) =>
                answer.answer
                  .toLowerCase()
                  .includes(
                    search
                  ) ||
                answer.name
                  .toLowerCase()
                  .includes(
                    search
                  ) ||
                answer.country
                  .toLowerCase()
                  .includes(
                    search
                  )
            );

          if (
            questionMatches
          ) {
            return {
              ...question,
              answers:
                question.answers,
            };
          }

          if (
            matchingAnswers.length >
            0
          ) {
            return {
              ...question,
              answers:
                matchingAnswers,
            };
          }

          return null;
        })
        .filter(
          (
            question
          ): question is ExploreQuestion =>
            question !== null
        );
    }, [
      questions,
      selectedDate,
      searchText,
    ]);

  /*
   * Open Calendar
   */
  const openCalendar = () => {
    setCalendarOpen(true);

    Animated.timing(
      calendarAnimation,
      {
        toValue: 1,
        duration: 450,
        easing: Easing.out(
          Easing.cubic
        ),
        useNativeDriver: true,
      }
    ).start();
  };

  /*
   * Close Calendar
   */
  const closeCalendar = () => {
    Animated.timing(
      calendarAnimation,
      {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(
          Easing.ease
        ),
        useNativeDriver: true,
      }
    ).start(() => {
      setCalendarOpen(false);
    });
  };

  /*
   * Toggle Calendar
   */
  const toggleCalendar = () => {
    if (calendarOpen) {
      closeCalendar();
    } else {
      openCalendar();
    }
  };

  /*
   * Select date
   *
   * Date එක select කළාම:
   * 1. Selected date set වෙනවා
   * 2. Q&A animation key change වෙනවා
   * 3. Q&A එක fresh popup animation එකක් ගන්නවා
   * 4. Calendar close වෙනවා
   */
  const selectDate = (
    date: string
  ) => {
    setSelectedDate(date);

    setQaAnimationKey(
      `date-${date}-${Date.now()}`
    );

    closeCalendar();
  };

  /*
   * Clear selected date
   */
  const clearSelectedDate = () => {
    setSelectedDate(null);

    setQaAnimationKey(
      `all-${Date.now()}`
    );
  };

  /*
   * Calendar animation values
   */
  const calendarTranslateY =
    calendarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-60, 0],
    });

  const calendarOpacity =
    calendarAnimation.interpolate({
      inputRange: [
        0,
        0.25,
        1,
      ],
      outputRange: [
        0,
        0.35,
        1,
      ],
    });

  const calendarScale =
    calendarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [
        0.90,
        1,
      ],
    });

  /*
   * Loading
   */
  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#ffffff"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading Explore...
        </Text>
      </View>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={
            loadExploreData
          }
          style={
            styles.retryButton
          }
        >
          <Text
            style={
              styles.retryButtonText
            }
          >
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={styles.scrollView}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={
            handleRefresh
          }
          tintColor="#ffffff"
        />
      }
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
          useNativeDriver: false,
        }
      )}
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Explore
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Explore questions and answers from around the world.
        </Text>
      </View>

      {/* SEARCH + CALENDAR */}

      <View
        style={
          styles.searchRow
        }
      >
        <View
          style={
            styles.searchContainer
          }
        >
          <Text
            style={
              styles.searchIcon
            }
          >
            🔍
          </Text>

          <TextInput
            value={searchText}
            onChangeText={
              setSearchText
            }
            placeholder="Search questions or answers..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={
              styles.searchInput
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {searchText.length >
            0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setSearchText(
                  ""
                )
              }
            >
              <Text
                style={
                  styles.clearText
                }
              >
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={
            toggleCalendar
          }
          style={[
            styles.calendarButton,
            calendarOpen &&
              styles.calendarButtonActive,
          ]}
        >
          <Image
            source={{
              uri: CALENDAR_ICON,
            }}
            style={
              styles.calendarButtonIcon
            }
          />
        </TouchableOpacity>
      </View>

      {/* FULL CALENDAR */}

      {calendarOpen && (
        <Animated.View
          style={[
            styles.calendarPanel,
            {
              opacity:
                calendarOpacity,
              transform: [
                {
                  translateY:
                    calendarTranslateY,
                },
                {
                  scale:
                    calendarScale,
                },
              ],
            },
          ]}
        >
          {/* CALENDAR HEADER */}

          <View
            style={
              styles.calendarTop
            }
          >
            <View>
              <Text
                style={
                  styles.calendarTitle
                }
              >
                Select a date
              </Text>

              <Text
                style={
                  styles.calendarSubtitle
                }
              >
                Find questions from any day
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                closeCalendar
              }
              style={
                styles.calendarClose
              }
            >
              <Text
                style={
                  styles.calendarCloseText
                }
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>

          {/* MONTH NAVIGATION */}

          <View
            style={
              styles.monthNavigation
            }
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() -
                      1,
                    1
                  )
                )
              }
              style={
                styles.monthArrow
              }
            >
              <Text
                style={
                  styles.monthArrowText
                }
              >
                ‹
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.monthTitle
              }
            >
              {formatMonthYear(
                calendarMonth
              )}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() +
                      1,
                    1
                  )
                )
              }
              style={
                styles.monthArrow
              }
            >
              <Text
                style={
                  styles.monthArrowText
                }
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* WEEK DAYS */}

          <View
            style={
              styles.weekRow
            }
          >
            {WEEK_DAYS.map(
              (day) => (
                <View
                  key={day}
                  style={
                    styles.weekCell
                  }
                >
                  <Text
                    style={
                      styles.weekText
                    }
                  >
                    {day}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* CALENDAR GRID */}

          <View
            style={
              styles.calendarGrid
            }
          >
            {calendarDays.map(
              ({
                date,
                currentMonth,
              }) => {
                const dateKey =
                  formatDateKey(
                    date
                  );

                const today =
                  getTodayDate();

                const isFuture =
                  dateKey >
                  today;

                const isSelected =
                  selectedDate ===
                  dateKey;

                const hasQuestion =
                  availableDates.has(
                    dateKey
                  );

                const disabled =
                  !currentMonth ||
                  isFuture;

                return (
                  <TouchableOpacity
                    key={dateKey}
                    activeOpacity={
                      disabled
                        ? 1
                        : 0.7
                    }
                    disabled={
                      disabled
                    }
                    onPress={() =>
                      selectDate(
                        dateKey
                      )
                    }
                    style={
                      styles.calendarDayCell
                    }
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isSelected &&
                          styles.selectedDayCircle,
                        !currentMonth &&
                          styles.outsideDayCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          !currentMonth &&
                            styles.outsideDayText,
                          isFuture &&
                            styles.futureDayText,
                          isSelected &&
                            styles.selectedDayText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>

                    {hasQuestion &&
                      currentMonth &&
                      !isFuture && (
                        <View
                          style={
                            styles.questionDot
                          }
                        />
                      )}
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* LEGEND */}

          <View
            style={
              styles.calendarLegend
            }
          >
            <View
              style={
                styles.legendItem
              }
            >
              <View
                style={
                  styles.legendDot
                }
              />

              <Text
                style={
                  styles.legendText
                }
              >
                Question available
              </Text>
            </View>

            {selectedDate && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={
                  clearSelectedDate
                }
              >
                <Text
                  style={
                    styles.clearDateText
                  }
                >
                  Clear date
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* SELECTED DATE FILTER */}

      {selectedDate && (
        <View
          style={
            styles.activeFilter
          }
        >
          <View
            style={
              styles.activeFilterLeft
            }
          >
            <Image
              source={{
                uri: CALENDAR_ICON,
              }}
              style={
                styles.activeFilterIcon
              }
            />

            <View>
              <Text
                style={
                  styles.activeFilterLabel
                }
              >
                Showing questions from
              </Text>

              <Text
                style={
                  styles.activeFilterDate
                }
              >
                {selectedDate}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={
              clearSelectedDate
            }
          >
            <Text
              style={
                styles.removeFilter
              }
            >
              ×
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEARCH RESULT INFO */}

      {searchText.trim()
        .length > 0 && (
        <View
          style={
            styles.searchInfo
          }
        >
          <Text
            style={
              styles.searchInfoText
            }
          >
            Results for{" "}
            <Text
              style={
                styles.searchInfoHighlight
              }
            >
              "{searchText}"
            </Text>
          </Text>

          <Text
            style={
              styles.resultCount
            }
          >
            {
              filteredQuestions.length
            }
          </Text>
        </View>
      )}

      {/* Q&A */}

      {filteredQuestions.map(
        (question) => (
          <AnimatedQuestionCard
            key={`${question.id}-${qaAnimationKey}`}
            question={question}
            searchText={
              searchText
            }
            scrollY={scrollY}
            animationKey={
              qaAnimationKey
            }
          />
        )
      )}

      {/* NO RESULTS */}

      {filteredQuestions.length ===
        0 && (
        <View
          style={
            styles.noResults
          }
        >
          <Text
            style={
              styles.noResultsIcon
            }
          >
            🔎
          </Text>

          <Text
            style={
              styles.noResultsTitle
            }
          >
            No results found
          </Text>

          <Text
            style={
              styles.noResultsText
            }
          >
            Try another search term or choose another date.
          </Text>
        </View>
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#000000",
  },

  contentContainer: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 60,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color:
      "rgba(255,255,255,0.7)",
    fontSize: 14,
  },

  errorText: {
    color: "#ffffff",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 18,
  },

  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.18)",
  },

  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  /*
   * HEADER
   */

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color:
      "rgba(255,255,255,0.6)",
    textAlign: "center",
  },

  /*
   * SEARCH
   */

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: 48,
    color: "#ffffff",
    fontSize: 15,
  },

  clearText: {
    fontSize: 27,
    lineHeight: 29,
    color:
      "rgba(255,255,255,0.65)",
    paddingLeft: 8,
  },

  /*
   * CALENDAR BUTTON
   */

  calendarButton: {
    width: 49,
    height: 49,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
  },

  calendarButtonActive: {
    backgroundColor:
      "rgba(255,255,255,0.20)",
    borderColor:
      "rgba(255,255,255,0.35)",
  },

  calendarButtonIcon: {
    width: 27,
    height: 27,
    resizeMode: "contain",
  },

  /*
   * CALENDAR
   */

  calendarPanel: {
    marginBottom: 20,
    padding: 17,
    borderRadius: 23,
    backgroundColor:
      "rgba(25,35,57,0.99)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.14)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 12,
  },

  calendarTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  calendarTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#ffffff",
  },

  calendarSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color:
      "rgba(255,255,255,0.48)",
  },

  calendarClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
  },

  calendarCloseText: {
    fontSize: 23,
    lineHeight: 24,
    color:
      "rgba(255,255,255,0.75)",
  },

  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.07)",
  },

  monthArrowText: {
    fontSize: 29,
    lineHeight: 30,
    color: "#ffffff",
  },

  monthTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  /*
   * WEEK
   */

  weekRow: {
    flexDirection: "row",
    marginBottom: 5,
  },

  weekCell: {
    width: "14.2857%",
    alignItems: "center",
    paddingVertical: 6,
  },

  weekText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color:
      "rgba(255,255,255,0.38)",
  },

  /*
   * CALENDAR GRID
   */

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarDayCell: {
    width: "14.2857%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  dayCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedDayCircle: {
    backgroundColor:
      "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.45)",
  },

  outsideDayCircle: {
    opacity: 0.25,
  },

  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },

  outsideDayText: {
    color:
      "rgba(255,255,255,0.25)",
  },

  futureDayText: {
    color:
      "rgba(255,255,255,0.20)",
  },

  selectedDayText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  questionDot: {
    position: "absolute",
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      "rgba(255,255,255,0.8)",
  },

  /*
   * LEGEND
   */

  calendarLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor:
      "rgba(255,255,255,0.08)",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 7,
    backgroundColor:
      "rgba(255,255,255,0.75)",
  },

  legendText: {
    fontSize: 10,
    color:
      "rgba(255,255,255,0.42)",
  },

  clearDateText: {
    fontSize: 11,
    fontWeight: "700",
    color:
      "rgba(255,255,255,0.65)",
  },

  /*
   * ACTIVE FILTER
   */

  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 13,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.1)",
  },

  activeFilterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  activeFilterIcon: {
    width: 23,
    height: 23,
    marginRight: 10,
    resizeMode: "contain",
  },

  activeFilterLabel: {
    fontSize: 11,
    color:
      "rgba(255,255,255,0.45)",
  },

  activeFilterDate: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  removeFilter: {
    fontSize: 24,
    color:
      "rgba(255,255,255,0.6)",
    paddingHorizontal: 5,
  },

  /*
   * SEARCH INFO
   */

  searchInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  searchInfoText: {
    fontSize: 13,
    color:
      "rgba(255,255,255,0.55)",
  },

  searchInfoHighlight: {
    color: "#ffffff",
    fontWeight: "700",
  },

  resultCount: {
    minWidth: 27,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
    backgroundColor:
      "rgba(255,255,255,0.1)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  /*
   * Q&A
   */

  questionSection: {
    marginBottom: 30,
  },

  dateBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor:
      "rgba(255,255,255,0.12)",
  },

  smallCalendarIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    resizeMode: "contain",
  },

  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color:
      "rgba(255,255,255,0.75)",
  },

  questionCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },

  questionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color:
      "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },

  questionText: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "700",
    color: "#ffffff",
  },

  /*
   * SEARCH HIGHLIGHT
   */

  highlight: {
    backgroundColor:
      "rgba(255,215,80,0.40)",
    color: "#ffffff",
    fontWeight: "800",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: "hidden",
  },

  /*
   * ANSWERS
   */

  answerCard: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.07)",
  },

  answerText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#ffffff",
  },

  answerName: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color:
      "rgba(255,255,255,0.85)",
  },

  answerCountry: {
    marginTop: 4,
    fontSize: 13,
    color:
      "rgba(255,255,255,0.5)",
  },

  emptyAnswers: {
    paddingVertical: 12,
  },

  emptyAnswersText: {
    fontSize: 13,
    color:
      "rgba(255,255,255,0.45)",
  },

  /*
   * NO RESULTS
   */

  noResults: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  noResultsIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  noResultsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },

  noResultsText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color:
      "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
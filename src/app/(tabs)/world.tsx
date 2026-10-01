import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "@/lib/supabase";

type CountryStat = {
  country: string;
  count: number;
  code: string;
};

const countryCodes: Record<string, string> = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  "Antigua and Barbuda": "AG",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",

  Bahamas: "BS",
  Bahrain: "BH",
  Bangladesh: "BD",
  Barbados: "BB",
  Belarus: "BY",
  Belgium: "BE",
  Belize: "BZ",
  Benin: "BJ",
  Bhutan: "BT",
  Bolivia: "BO",
  "Bosnia and Herzegovina": "BA",
  Botswana: "BW",
  Brazil: "BR",
  Brunei: "BN",
  Bulgaria: "BG",
  "Burkina Faso": "BF",
  Burundi: "BI",

  Cambodia: "KH",
  Cameroon: "CM",
  Canada: "CA",
  "Cape Verde": "CV",
  "Central African Republic": "CF",
  Chad: "TD",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Comoros: "KM",
  Congo: "CG",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cuba: "CU",
  Cyprus: "CY",
  Czechia: "CZ",
  "Czech Republic": "CZ",

  Denmark: "DK",
  Djibouti: "DJ",
  Dominica: "DM",
  "Dominican Republic": "DO",

  Ecuador: "EC",
  Egypt: "EG",
  "El Salvador": "SV",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Estonia: "EE",
  Eswatini: "SZ",
  Ethiopia: "ET",

  Fiji: "FJ",
  Finland: "FI",
  France: "FR",

  Gabon: "GA",
  Gambia: "GM",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Grenada: "GD",
  Guatemala: "GT",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  Guyana: "GY",

  Haiti: "HT",
  Honduras: "HN",
  Hungary: "HU",

  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",

  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",

  Kazakhstan: "KZ",
  Kenya: "KE",
  Kiribati: "KI",
  Kuwait: "KW",
  Kyrgyzstan: "KG",

  Laos: "LA",
  Latvia: "LV",
  Lebanon: "LB",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",

  Madagascar: "MG",
  Malawi: "MW",
  Malaysia: "MY",
  Maldives: "MV",
  Mali: "ML",
  Malta: "MT",
  "Marshall Islands": "MH",
  Mauritania: "MR",
  Mauritius: "MU",
  Mexico: "MX",
  Micronesia: "FM",
  Moldova: "MD",
  Monaco: "MC",
  Mongolia: "MN",
  Montenegro: "ME",
  Morocco: "MA",
  Mozambique: "MZ",
  Myanmar: "MM",

  Namibia: "NA",
  Nauru: "NR",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nicaragua: "NI",
  Niger: "NE",
  Nigeria: "NG",
  "North Korea": "KP",
  "North Macedonia": "MK",
  Norway: "NO",

  Oman: "OM",

  Pakistan: "PK",
  Palau: "PW",
  Panama: "PA",
  "Papua New Guinea": "PG",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",

  Qatar: "QA",

  Romania: "RO",
  Russia: "RU",
  Rwanda: "RW",

  "Saint Kitts and Nevis": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  Samoa: "WS",
  "San Marino": "SM",
  "Sao Tome and Principe": "ST",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  Serbia: "RS",
  Seychelles: "SC",
  "Sierra Leone": "SL",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "Solomon Islands": "SB",
  Somalia: "SO",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sudan: "SD",
  Suriname: "SR",
  Sweden: "SE",
  Switzerland: "CH",
  Syria: "SY",

  Taiwan: "TW",
  Tajikistan: "TJ",
  Tanzania: "TZ",
  Thailand: "TH",
  "Timor-Leste": "TL",
  Togo: "TG",
  Tonga: "TO",
  "Trinidad and Tobago": "TT",
  Tunisia: "TN",
  Turkey: "TR",
  Turkmenistan: "TM",
  Tuvalu: "TV",

  Uganda: "UG",
  Ukraine: "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  UK: "GB",
  "United States": "US",
  USA: "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",

  Vanuatu: "VU",
  "Vatican City": "VA",
  Vatican: "VA",
  Venezuela: "VE",
  Vietnam: "VN",

  Yemen: "YE",

  Zambia: "ZM",
  Zimbabwe: "ZW",

  Other: "XX",
};

function getCountryCode(country: string) {
  const trimmed = country.trim();

  if (countryCodes[trimmed]) {
    return countryCodes[trimmed];
  }

  const found = Object.keys(countryCodes).find(
    (key) =>
      key.toLowerCase() === trimmed.toLowerCase()
  );

  return found ? countryCodes[found] : "--";
}

/*
 * Real flag image.
 *
 * Using an actual flag image instead of emoji means
 * the flag can completely fill the circular mask.
 */
function getFlagUrl(code: string) {
  if (!code || code.length !== 2 || code === "XX") {
    return null;
  }

  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
}

/* =========================================================
   ANIMATED NUMBER
   ========================================================= */

function AnimatedNumber({
  value,
  duration = 850,
  playKey,
}: {
  value: number;
  duration?: number;
  playKey: number;
}) {
  const animatedValue =
    useRef(new Animated.Value(0)).current;

  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {
    animatedValue.stopAnimation();
    animatedValue.setValue(0);
    setDisplayValue(0);

    const listener =
      animatedValue.addListener(
        ({ value: currentValue }) => {
          setDisplayValue(
            Math.round(currentValue)
          );
        }
      );

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [
    value,
    duration,
    playKey,
    animatedValue,
  ]);

  return <Text>{displayValue}</Text>;
}

/* =========================================================
   COUNTRY CARD
   ========================================================= */

function CountryCard({
  item,
}: {
  item: CountryStat;
}) {
  const flagUrl =
    getFlagUrl(item.code);

  return (
    <View
      style={styles.countryCard}
    >
      <View
        style={styles.countryLeft}
      >
        {/* =================================================
            FULL CIRCLE FLAG
            ================================================= */}

        <View
          style={styles.flagCircle}
        >
          {flagUrl ? (
            <Image
              source={{
                uri: flagUrl,
              }}
              style={styles.flagImage}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={styles.fallbackFlag}
            >
              🌍
            </Text>
          )}
        </View>

        <View
          style={styles.countryDetails}
        >
          <Text
            style={styles.countryName}
            numberOfLines={1}
          >
            {item.country}
          </Text>

          <View
            style={styles.codeRow}
          >
            <View
              style={styles.codeBadge}
            >
              <Text
                style={styles.codeText}
              >
                {item.code}
              </Text>
            </View>

            <Text
              style={styles.isoText}
            >
              ISO
            </Text>
          </View>
        </View>
      </View>

      {/* =================================================
          COUNTRY COUNT

          IMPORTANT:
          This is now a normal number.
          It does NOT animate from 0.
          ================================================= */}

      <View
        style={styles.countBox}
      >
        <Text
          style={styles.countText}
        >
          {item.count}
        </Text>

        <Text
          style={styles.countLabel}
        >
          {item.count === 1
            ? "answer"
            : "answers"}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   WORLD SCREEN
   ========================================================= */

export default function WorldScreen() {
  const [countryStats, setCountryStats] =
    useState<CountryStat[]>([]);

  const [totalAnswers, setTotalAnswers] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  /*
   * This controls the existing
   * top-section scroll animations.
   *
   * Country cards DO NOT use this.
   */
  const [scrollAnimationKey, setScrollAnimationKey] =
    useState(0);

  /*
   * This controls first load / tab focus animation.
   */
  const [statsAnimationKey, setStatsAnimationKey] =
    useState(0);

  /*
   * Search bar animation.
   */
  const searchAnimation =
    useRef(new Animated.Value(0)).current;

  /*
   * Header animation.
   */
  const headerAnimation =
    useRef(new Animated.Value(0)).current;

  /*
   * IMPORTANT:
   *
   * This animation is NOT native-driver based,
   * because its output is used for WIDTH.
   *
   * This fixes:
   *
   * "Style property 'width' is not supported
   * by native animated module"
   */
  const progressAnimation =
    useRef(new Animated.Value(0)).current;

  /*
   * Keep track of scroll distance.
   */
  const lastScrollY =
    useRef(0);

  const lastScrollAnimationTime =
    useRef(0);

  /* =======================================================
     LOAD WORLD DATA
     ======================================================= */

  const loadWorldData =
    useCallback(async () => {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("answers")
        .select("country");

      if (error) {
        console.error(
          "World answers error:",
          error
        );

        setCountryStats([]);
        setTotalAnswers(0);
        setLoading(false);
        return;
      }

      const counts: Record<
        string,
        number
      > = {};

      (data ?? []).forEach(
        (answer) => {
          const country =
            answer.country?.trim();

          if (!country) {
            return;
          }

          counts[country] =
            (counts[country] ?? 0) + 1;
        }
      );

      const stats =
        Object.entries(counts)
          .map(
            ([country, count]) => ({
              country,
              count,
              code:
                getCountryCode(
                  country
                ),
            })
          )
          .sort((a, b) => {
            if (
              b.count !==
              a.count
            ) {
              return (
                b.count -
                a.count
              );
            }

            return a.country.localeCompare(
              b.country
            );
          });

      setCountryStats(stats);

      setTotalAnswers(
        data?.length ?? 0
      );

      /*
       * New screen/focus animation.
       */
      setStatsAnimationKey(
        (previous) =>
          previous + 1
      );

      setScrollAnimationKey(
        (previous) =>
          previous + 1
      );

      setLoading(false);
    }, []);

  /* =======================================================
     RELOAD EVERY TIME WORLD TAB IS OPENED
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      loadWorldData();

      return undefined;
    }, [loadWorldData])
  );

  /* =======================================================
     HEADER ANIMATION
     ======================================================= */

  useEffect(() => {
    if (loading) {
      return;
    }

    headerAnimation.stopAnimation();
    headerAnimation.setValue(0);

    Animated.spring(
      headerAnimation,
      {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }
    ).start();
  }, [
    loading,
    statsAnimationKey,
    headerAnimation,
  ]);

  /* =======================================================
     COVERAGE BAR ANIMATION
     ======================================================= */

  const countriesReached =
    countryStats.length;

  const worldCoverage =
    Math.min(
      100,
      Math.round(
        (countriesReached /
          195) *
          100
      )
    );

  useEffect(() => {
    if (loading) {
      return;
    }

    /*
     * Width animation MUST use
     * useNativeDriver:false.
     *
     * This is the fix for the error.
     */
    progressAnimation.stopAnimation();
    progressAnimation.setValue(0);

    Animated.timing(
      progressAnimation,
      {
        toValue: worldCoverage,
        duration: 1200,
        easing: Easing.out(
          Easing.cubic
        ),
        useNativeDriver: false,
      }
    ).start();
  }, [
    loading,
    worldCoverage,
    statsAnimationKey,
    scrollAnimationKey,
    progressAnimation,
  ]);

  /*
   * Width is now generated from a
   * non-native Animated.Value.
   */
  const coverageBarWidth =
    progressAnimation.interpolate({
      inputRange: [0, 100],
      outputRange: [
        "0%",
        "100%",
      ],
      extrapolate: "clamp",
    });

  /* =======================================================
     SEARCH FILTER
     ======================================================= */

  const filteredCountries =
    countryStats.filter(
      (item) => {
        const query =
          searchText
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          item.country
            .toLowerCase()
            .includes(query) ||
          item.code
            .toLowerCase()
            .includes(query)
        );
      }
    );

  /* =======================================================
     SEARCH BUTTON
     ======================================================= */

  function toggleSearch() {
    const opening =
      !searchOpen;

    setSearchOpen(opening);

    if (!opening) {
      setSearchText("");
    }

    searchAnimation.stopAnimation();

    Animated.timing(
      searchAnimation,
      {
        toValue: opening ? 1 : 0,
        duration: 380,
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
     SEARCH CHANGE
     ======================================================= */

  function handleSearch(
    value: string
  ) {
    setSearchText(value);

    /*
     * Searching starts a fresh
     * animation cycle.
     */
    setScrollAnimationKey(
      (previous) =>
        previous + 1
    );
  }

  /* =======================================================
     HEADER INTERPOLATIONS
     ======================================================= */

  const headerTranslateY =
    headerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [45, 0],
    });

  const headerScale =
    headerAnimation.interpolate({
      inputRange: [0, 0.75, 1],
      outputRange: [
        0.92,
        1.025,
        1,
      ],
    });

  const headerOpacity =
    headerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

  /* =======================================================
     SCROLL ANIMATION
     ======================================================= */

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const currentY =
      event.nativeEvent.contentOffset.y;

    const distance =
      Math.abs(
        currentY -
          lastScrollY.current
      );

    const now =
      Date.now();

    /*
     * Existing top-section scroll
     * animation stays exactly as before.
     *
     * Country cards are NOT animated.
     */
    if (
      distance >= 45 &&
      now -
        lastScrollAnimationTime.current >=
        430
    ) {
      lastScrollY.current =
        currentY;

      lastScrollAnimationTime.current =
        now;

      setScrollAnimationKey(
        (previous) =>
          previous + 1
      );
    }
  };

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <View
        style={styles.container}
      >
        <View
          style={
            styles.loadingContainer
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
            Loading the world...
          </Text>
        </View>
      </View>
    );
  }

  /* =======================================================
     MAIN UI
     ======================================================= */

  return (
    <View
      style={styles.container}
    >
      <FlatList
        data={
          filteredCountries
        }
        keyExtractor={(item) =>
          `${item.country}-${item.code}`
        }
        renderItem={({
          item,
        }) => {
          return (
            <CountryCard
              item={item}
            />
          );
        }}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        onScroll={
          handleScroll
        }
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            {/* =========================================
                HEADER
                ========================================= */}

            <Animated.View
              style={[
                styles.header,
                {
                  opacity:
                    headerOpacity,
                  transform: [
                    {
                      translateY:
                        headerTranslateY,
                    },
                    {
                      scale:
                        headerScale,
                    },
                  ],
                },
              ]}
            >
              <View
                style={
                  styles.titleArea
                }
              >
                <Text
                  style={
                    styles.title
                  }
                >
                  🌎 World
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  One question. Answers from around the world.
                </Text>
              </View>

              {/* =======================================
                  SEARCH ICON
                  ======================================= */}

              <TouchableOpacity
                style={
                  styles.searchButton
                }
                onPress={
                  toggleSearch
                }
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: "https://img.icons8.com/?size=100&id=W0xu6u7K9A0F&format=png&color=000000",
                  }}
                  style={
                    styles.searchImage
                  }
                />
              </TouchableOpacity>
            </Animated.View>

            {/* =========================================
                SEARCH BAR
                ========================================= */}

            {searchOpen && (
              <Animated.View
                style={[
                  styles.searchBar,
                  {
                    opacity:
                      searchAnimation,
                    transform: [
                      {
                        translateY:
                          searchAnimation.interpolate(
                            {
                              inputRange: [
                                0,
                                1,
                              ],
                              outputRange: [
                                -18,
                                0,
                              ],
                            }
                          ),
                      },
                      {
                        scaleX:
                          searchAnimation.interpolate(
                            {
                              inputRange: [
                                0,
                                1,
                              ],
                              outputRange: [
                                0.8,
                                1,
                              ],
                            }
                          ),
                      },
                      {
                        scaleY:
                          searchAnimation.interpolate(
                            {
                              inputRange: [
                                0,
                                1,
                              ],
                              outputRange: [
                                0.82,
                                1,
                              ],
                            }
                          ),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={{
                    uri: "https://img.icons8.com/?size=100&id=W0xu6u7K9A0F&format=png&color=000000",
                  }}
                  style={
                    styles.searchBarIcon
                  }
                />

                <TextInput
                  value={
                    searchText
                  }
                  onChangeText={
                    handleSearch
                  }
                  placeholder="Search country..."
                  placeholderTextColor="#626262"
                  autoFocus
                  style={
                    styles.searchInput
                  }
                />

                {searchText.length >
                  0 && (
                  <TouchableOpacity
                    onPress={() =>
                      handleSearch(
                        ""
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={
                        styles.clearButton
                      }
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            {/* =========================================
                STATISTICS
                ========================================= */}

            <Animated.View
              style={[
                styles.statsRow,
                {
                  opacity:
                    headerOpacity,
                  transform: [
                    {
                      translateY:
                        headerTranslateY,
                    },
                    {
                      scale:
                        headerScale,
                    },
                  ],
                },
              ]}
            >
              {/* COUNTRIES */}

              <View
                style={
                  styles.statCard
                }
              >
                <Text
                  style={
                    styles.statNumber
                  }
                >
                  <AnimatedNumber
                    value={
                      countriesReached
                    }
                    playKey={
                      statsAnimationKey +
                      scrollAnimationKey
                    }
                  />
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  Countries
                </Text>
              </View>

              {/* ANSWERS */}

              <View
                style={
                  styles.statCard
                }
              >
                <Text
                  style={
                    styles.statNumber
                  }
                >
                  <AnimatedNumber
                    value={
                      totalAnswers
                    }
                    playKey={
                      statsAnimationKey +
                      scrollAnimationKey
                    }
                  />
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  Answers
                </Text>
              </View>
            </Animated.View>

            {/* =========================================
                WORLD COVERAGE
                ========================================= */}

            <Animated.View
              style={[
                styles.coverageCard,
                {
                  opacity:
                    headerOpacity,
                  transform: [
                    {
                      translateY:
                        headerTranslateY,
                    },
                    {
                      scale:
                        headerScale,
                    },
                  ],
                },
              ]}
            >
              <View
                style={
                  styles.coverageTop
                }
              >
                <View>
                  <Text
                    style={
                      styles.coverageTitle
                    }
                  >
                    World coverage
                  </Text>

                  <Text
                    style={
                      styles.coverageSubtitle
                    }
                  >
                    {countriesReached} of 195 countries
                  </Text>
                </View>

                <Text
                  style={
                    styles.coveragePercentage
                  }
                >
                  <AnimatedNumber
                    value={
                      worldCoverage
                    }
                    duration={1000}
                    playKey={
                      statsAnimationKey +
                      scrollAnimationKey
                    }
                  />
                  %
                </Text>
              </View>

              {/* =======================================
                  ANIMATED PROGRESS BAR
                  ======================================= */}

              <View
                style={
                  styles.progressBackground
                }
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        coverageBarWidth,
                    },
                  ]}
                />
              </View>
            </Animated.View>

            {/* =========================================
                COUNTRIES TITLE
                ========================================= */}

            <Animated.View
              style={{
                opacity:
                  headerOpacity,
                transform: [
                  {
                    translateY:
                      headerTranslateY,
                  },
                ],
              }}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Countries
              </Text>

              {searchText.trim().length >
                0 && (
                <Text
                  style={
                    styles.searchResultText
                  }
                >
                  {filteredCountries.length}{" "}
                  {filteredCountries.length ===
                  1
                    ? "country"
                    : "countries"}{" "}
                  found
                </Text>
              )}
            </Animated.View>

            {/* =========================================
                NO SEARCH RESULTS
                ========================================= */}

            {searchText.trim().length >
              0 &&
              filteredCountries.length ===
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
                    No country found
                  </Text>

                  <Text
                    style={
                      styles.noResultsText
                    }
                  >
                    Try another country name or code.
                  </Text>
                </View>
              )}
          </>
        }
        ListEmptyComponent={
          searchText.trim().length ===
          0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                🌍
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No answers yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Answers from different countries will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

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

  /* =======================================================
     HEADER
     ======================================================= */

  header: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleArea: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.62)",
  },

  /* =======================================================
     SEARCH BUTTON
     ======================================================= */

  searchButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.11)",
  },

  searchImage: {
    width: 25,
    height: 25,
  },

  /* =======================================================
     SEARCH BAR
     ======================================================= */

  searchBar: {
    height: 54,
    borderRadius: 17,
    paddingHorizontal: 15,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
  },

  searchBarIcon: {
    width: 22,
    height: 22,
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    color: "#ffffff",
    fontSize: 15,
  },

  clearButton: {
    color: "#888888",
    fontSize: 28,
    lineHeight: 30,
    paddingLeft: 8,
  },

  /* =======================================================
     STATS
     ======================================================= */

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    minHeight: 108,
    borderRadius: 18,
    padding: 17,
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
  },

  statNumber: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 13,
    color:
      "rgba(255,255,255,0.55)",
  },

  /* =======================================================
     COVERAGE
     ======================================================= */

  coverageCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
  },

  coverageTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  coverageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },

  coverageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color:
      "rgba(255,255,255,0.52)",
  },

  coveragePercentage: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    color: "#ffffff",
  },

  progressBackground: {
    height: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor:
      "rgba(255,255,255,0.10)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },

  /* =======================================================
     COUNTRY TITLE
     ======================================================= */

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 5,
  },

  searchResultText: {
    fontSize: 12,
    color:
      "rgba(255,255,255,0.45)",
    marginBottom: 12,
  },

  /* =======================================================
     COUNTRY CARD
     ======================================================= */

  countryCard: {
    minHeight: 82,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor:
      "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.09)",
  },

  countryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  /* =======================================================
     FULL CIRCLE FLAG
     ======================================================= */

  flagCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    flexShrink: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.13)",
  },

  flagImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  fallbackFlag: {
    fontSize: 30,
    textAlign: "center",
  },

  countryDetails: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },

  countryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  codeBadge: {
    minWidth: 34,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
  },

  codeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#dddddd",
  },

  isoText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555555",
    marginLeft: 6,
  },

  /* =======================================================
     COUNTRY COUNT
     ======================================================= */

  countBox: {
    minWidth: 61,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 10,
  },

  countText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },

  countLabel: {
    fontSize: 10,
    marginTop: 2,
    color: "#5d5d5d",
  },

  /* =======================================================
     NO RESULTS
     ======================================================= */

  noResults: {
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
    marginTop: 5,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.09)",
  },

  noResultsIcon: {
    fontSize: 31,
    marginBottom: 10,
  },

  noResultsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },

  noResultsText: {
    fontSize: 13,
    marginTop: 5,
    color:
      "rgba(255,255,255,0.50)",
  },

  /* =======================================================
     EMPTY
     ======================================================= */

  emptyContainer: {
    alignItems: "center",
    paddingTop: 35,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color:
      "rgba(255,255,255,0.55)",
  },

  /* =======================================================
     LOADING
     ======================================================= */

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color:
      "rgba(255,255,255,0.60)",
  },
});
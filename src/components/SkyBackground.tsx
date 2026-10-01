import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

type Star = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  speed: number;
  offset: number;
  color: string;
};

export default function SkyBackground() {
  // =========================================================
  // STARS
  // =========================================================

  const stars = useMemo<Star[]>(() => {
    const amount = Math.floor(
      (SCREEN_WIDTH * SCREEN_HEIGHT) / 7200
    );

    return Array.from({ length: amount }, () => {
      const colorRandom = Math.random();

      let color = "#ffffff";

      if (colorRandom < 0.08) {
        color = "#dbeaff";
      } else if (colorRandom < 0.13) {
        color = "#fff1d6";
      }

      return {
        left: Math.random() * SCREEN_WIDTH,

        top:
          Math.random() *
          SCREEN_HEIGHT *
          0.94,

        size:
          Math.random() < 0.88
            ? Math.random() * 0.65 + 0.22
            : Math.random() * 0.8 + 0.7,

        opacity:
          Math.random() * 0.6 + 0.2,

        speed:
          Math.random() * 1.15 + 0.45,

        offset:
          Math.random() *
          Math.PI *
          2,

        color,
      };
    });
  }, []);

  // =========================================================
  // METEOR ANIMATION
  // =========================================================

  const meteorX = useRef(
    new Animated.Value(0)
  ).current;

  const meteorY = useRef(
    new Animated.Value(0)
  ).current;

  const meteorOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const meteorScale = useRef(
    new Animated.Value(0.8)
  ).current;

  const meteorRotate = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    let cancelled = false;

    let timeout:
      | ReturnType<typeof setTimeout>
      | undefined;

    const runMeteor = () => {
      if (cancelled) return;

      const fromLeft =
        Math.random() > 0.5;

      const startY =
        Math.random() *
          SCREEN_HEIGHT *
          0.40 +
        25;

      const endY =
        startY +
        Math.random() *
          SCREEN_HEIGHT *
          0.20 +
        SCREEN_HEIGHT * 0.12;

      const startX = fromLeft
        ? -180
        : SCREEN_WIDTH + 180;

      const endX = fromLeft
        ? SCREEN_WIDTH + 220
        : -220;

      const duration =
        1250 +
        Math.random() * 650;

      meteorX.setValue(startX);
      meteorY.setValue(startY);

      meteorOpacity.setValue(0);

      meteorScale.setValue(0.72);

      meteorRotate.setValue(
        fromLeft ? 0 : 180
      );

      Animated.parallel([
        // -------------------------
        // MOVEMENT X
        // -------------------------

        Animated.timing(
          meteorX,
          {
            toValue: endX,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }
        ),

        // -------------------------
        // MOVEMENT Y
        // -------------------------

        Animated.timing(
          meteorY,
          {
            toValue: endY,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }
        ),

        // -------------------------
        // FADE
        // -------------------------

        Animated.sequence([
          Animated.timing(
            meteorOpacity,
            {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            meteorOpacity,
            {
              toValue: 1,
              duration: 120,
              easing: Easing.out(
                Easing.ease
              ),
              useNativeDriver: true,
            }
          ),

          Animated.delay(500),

          Animated.timing(
            meteorOpacity,
            {
              toValue: 0,
              duration:
                duration - 620 > 200
                  ? duration - 620
                  : 200,
              easing: Easing.in(
                Easing.ease
              ),
              useNativeDriver: true,
            }
          ),
        ]),

        // -------------------------
        // SCALE
        // -------------------------

        Animated.sequence([
          Animated.timing(
            meteorScale,
            {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            meteorScale,
            {
              toValue: 0.9,
              duration:
                duration - 160,
              useNativeDriver: true,
            }
          ),
        ]),
      ]).start(() => {
        if (cancelled) return;

        // Next meteor after 8–18 seconds
        timeout = setTimeout(
          runMeteor,
          8000 +
            Math.random() * 10000
        );
      });
    };

    // First meteor after 4–8 seconds
    timeout = setTimeout(
      runMeteor,
      4000 +
        Math.random() * 4000
    );

    return () => {
      cancelled = true;

      if (timeout) {
        clearTimeout(timeout);
      }

      meteorX.stopAnimation();
      meteorY.stopAnimation();
      meteorOpacity.stopAnimation();
      meteorScale.stopAnimation();
      meteorRotate.stopAnimation();
    };
  }, [
    meteorX,
    meteorY,
    meteorOpacity,
    meteorScale,
    meteorRotate,
  ]);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {/* =====================================================
          DEEP BLACK NIGHT SKY
      ===================================================== */}

      <View style={styles.sky} />

      {/* =====================================================
          VERY SUBTLE BLUE ATMOSPHERE
      ===================================================== */}

      <View
        style={styles.atmosphere}
      />

      {/* =====================================================
          FAINT MILKY WAY
      ===================================================== */}

      <View
        style={styles.milkyWay}
      />

      {/* =====================================================
          STARS
      ===================================================== */}

      {stars.map((star, index) => (
        <StarView
          key={index}
          star={star}
        />
      ))}

      {/* =====================================================
          METEOR
      ===================================================== */}

      <Animated.View
        style={[
          styles.meteor,

          {
            opacity:
              meteorOpacity,

            transform: [
              {
                translateX:
                  meteorX,
              },

              {
                translateY:
                  meteorY,
              },

              {
                rotate:
                  meteorRotate.interpolate(
                    {
                      inputRange: [
                        0,
                        180,
                      ],

                      outputRange: [
                        "24deg",
                        "204deg",
                      ],
                    }
                  ),
              },

              {
                scale:
                  meteorScale,
              },
            ],
          },
        ]}
      >
        {/* BIG SOFT GLOW */}

        <View
          style={
            styles.meteorGlow
          }
        />

        {/* OUTER TAIL */}

        <View
          style={
            styles.meteorTailOuter
          }
        />

        {/* MIDDLE TAIL */}

        <View
          style={
            styles.meteorTailMiddle
          }
        />

        {/* BRIGHT INNER TAIL */}

        <View
          style={
            styles.meteorTailInner
          }
        />

        {/* HEAD GLOW */}

        <View
          style={
            styles.meteorHeadGlow
          }
        />

        {/* WHITE HEAD */}

        <View
          style={
            styles.meteorHead
          }
        />
      </Animated.View>
    </View>
  );
}

// =============================================================
// STAR COMPONENT
// =============================================================

function StarView({
  star,
}: {
  star: Star;
}) {
  const opacity = useRef(
    new Animated.Value(
      star.opacity
    )
  ).current;

  const scale = useRef(
    new Animated.Value(1)
  ).current;

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          // Different starting time
          Animated.delay(
            star.offset * 180
          ),

          // -------------------------
          // DIM
          // -------------------------

          Animated.parallel([
            Animated.timing(
              opacity,
              {
                toValue:
                  star.opacity *
                  0.22,

                duration:
                  900 +
                  Math.random() *
                    1300,

                easing:
                  Easing.inOut(
                    Easing.ease
                  ),

                useNativeDriver: true,
              }
            ),

            Animated.timing(
              scale,
              {
                toValue: 0.72,

                duration:
                  900 +
                  Math.random() *
                    1300,

                easing:
                  Easing.inOut(
                    Easing.ease
                  ),

                useNativeDriver: true,
              }
            ),
          ]),

          // -------------------------
          // BRIGHT
          // -------------------------

          Animated.parallel([
            Animated.timing(
              opacity,
              {
                toValue:
                  star.opacity,

                duration:
                  900 +
                  Math.random() *
                    1300,

                easing:
                  Easing.inOut(
                    Easing.ease
                  ),

                useNativeDriver: true,
              }
            ),

            Animated.timing(
              scale,
              {
                toValue: 1,

                duration:
                  900 +
                  Math.random() *
                    1300,

                easing:
                  Easing.inOut(
                    Easing.ease
                  ),

                useNativeDriver: true,
              }
            ),
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
    star.offset,
  ]);

  return (
    <Animated.View
      style={[
        styles.star,

        {
          left: star.left,
          top: star.top,

          width: star.size,
          height: star.size,

          borderRadius:
            star.size / 2,

          backgroundColor:
            star.color,

          opacity,

          transform: [
            {
              scale,
            },
          ],
        },
      ]}
    />
  );
}

// =============================================================
// STYLES
// =============================================================

const styles =
  StyleSheet.create({
    // ---------------------------------------------------------
    // BLACK SKY
    // ---------------------------------------------------------

    sky: {
      ...StyleSheet.absoluteFill,

      backgroundColor:
        "#000000",
    },

    // ---------------------------------------------------------
    // BLUE ATMOSPHERE
    // ---------------------------------------------------------

    atmosphere: {
      position:
        "absolute",

      left:
        -SCREEN_WIDTH * 0.35,

      top:
        SCREEN_HEIGHT * 0.30,

      width:
        SCREEN_WIDTH * 1.7,

      height:
        SCREEN_HEIGHT * 0.75,

      borderRadius:
        SCREEN_WIDTH,

      backgroundColor:
        "rgba(12, 35, 70, 0.055)",
    },

    // ---------------------------------------------------------
    // MILKY WAY
    // ---------------------------------------------------------

    milkyWay: {
      position:
        "absolute",

      width:
        SCREEN_WIDTH * 1.5,

      height: 150,

      left:
        -SCREEN_WIDTH * 0.25,

      top:
        SCREEN_HEIGHT * 0.22,

      borderRadius: 100,

      backgroundColor:
        "rgba(150, 170, 210, 0.018)",

      transform: [
        {
          rotate: "-12deg",
        },
      ],
    },

    // ---------------------------------------------------------
    // STAR
    // ---------------------------------------------------------

    star: {
      position:
        "absolute",
    },

    // ---------------------------------------------------------
    // METEOR CONTAINER
    // ---------------------------------------------------------

    meteor: {
      position:
        "absolute",

      left: 0,
      top: 0,

      width: 220,
      height: 10,

      justifyContent:
        "center",
    },

    // ---------------------------------------------------------
    // METEOR OUTER TAIL
    // ---------------------------------------------------------

    meteorTailOuter: {
      position:
        "absolute",

      right: 5,

      width: 200,
      height: 1,

      backgroundColor:
        "rgba(170, 205, 255, 0.07)",
    },

    // ---------------------------------------------------------
    // METEOR MIDDLE TAIL
    // ---------------------------------------------------------

    meteorTailMiddle: {
      position:
        "absolute",

      right: 5,

      width: 155,
      height: 1,

      backgroundColor:
        "rgba(195, 220, 255, 0.20)",
    },

    // ---------------------------------------------------------
    // METEOR INNER TAIL
    // ---------------------------------------------------------

    meteorTailInner: {
      position:
        "absolute",

      right: 5,

      width: 95,
      height: 1.5,

      backgroundColor:
        "rgba(225, 240, 255, 0.52)",
    },

    // ---------------------------------------------------------
    // METEOR SOFT GLOW
    // ---------------------------------------------------------

    meteorGlow: {
      position:
        "absolute",

      right: -2,

      width: 28,
      height: 28,

      borderRadius: 14,

      backgroundColor:
        "rgba(190, 220, 255, 0.09)",
    },

    // ---------------------------------------------------------
    // METEOR HEAD GLOW
    // ---------------------------------------------------------

    meteorHeadGlow: {
      position:
        "absolute",

      right: 1,

      width: 13,
      height: 13,

      borderRadius: 7,

      backgroundColor:
        "rgba(220, 235, 255, 0.25)",
    },

    // ---------------------------------------------------------
    // METEOR HEAD
    // ---------------------------------------------------------

    meteorHead: {
      position:
        "absolute",

      right: 5,

      width: 4,
      height: 4,

      borderRadius: 2,

      backgroundColor:
        "#ffffff",
    },
  });
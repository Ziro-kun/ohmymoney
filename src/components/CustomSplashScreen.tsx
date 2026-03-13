import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export function CustomSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Hide native splash screen immediately to show our custom one
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors if it was already hidden
    });

    // Start a subtle bounce animation for the emoji/text
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Give it 2 seconds before fading out
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 2000);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.text}>숨만 쉬어도</Text>
        <Text style={styles.highlight}>돈이 나간다!</Text>
        <Text style={styles.emoji}>💸</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it sits on top of navigation
  },
  text: {
    fontSize: 28,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  highlight: {
    fontSize: 40,
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: 24,
    textShadowColor: 'rgba(239, 68, 68, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  emoji: {
    fontSize: 72,
  }
});

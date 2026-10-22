import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/theme';

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  const [opacityAnim] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[styles.skeletonCard, { opacity: opacityAnim }]}
        >
          <View style={styles.topRow}>
            <View style={styles.circle} />
            <View style={styles.lines}>
              <View style={[styles.line, { width: '60%' }]} />
              <View style={[styles.line, { width: '40%', height: 10 }]} />
            </View>
            <View style={styles.badge} />
          </View>
          <View style={styles.progressLine} />
          <View style={styles.bottomRow}>
            <View style={[styles.line, { width: '35%', height: 16 }]} />
            <View style={[styles.line, { width: '25%', height: 16 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.border,
    marginRight: Spacing.md,
  },
  lines: {
    flex: 1,
    gap: 6,
  },
  line: {
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  badge: {
    width: 70,
    height: 24,
    borderRadius: Radii.full,
    backgroundColor: Colors.border,
  },
  progressLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});

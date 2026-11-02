import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { Campfire, TrailPosition } from '@/game/game';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useGame } from '@/state/useGame';
import { useToday } from '@/time/today';

export default function Today() {
  const today = useToday();
  const begin = useSettings((state) => state.begin);
  const game = useGame();

  useEffect(() => begin(today, DEFAULT_GOAL), [begin, today]);

  return (
    <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.title}>Pandaleer</Text>
      {game && (
        <>
          <Text style={styles.big} accessibilityLabel={`${game.today.steps} of ${game.today.goal} steps today`}>
            {game.today.steps.toLocaleString()} / {game.today.goal.toLocaleString()}
          </Text>
          <Row label="Date" value={game.today.date} />
          <Row label="Pose" value={game.today.pose} />
          <Row label="Campfire" value={describeFire(game.campfire)} />
          <Row label="Expedition steps" value={game.trail.totalSteps.toLocaleString()} />
          <Row label="Camps reached" value={String(game.trail.campsReached)} />
          <Row label="Next" value={describePosition(game.trail.position)} />
          <Row label="Discoveries" value={game.discoveries.join(', ') || 'none yet'} />
        </>
      )}
      {__DEV__ && (
        <>
          <Link href="/dev/steps" style={styles.link}>
            Mock steps
          </Link>
          <Link href="/dev/gallery" style={styles.link}>
            Art Gallery
          </Link>
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.row}>
      <Text style={styles.label}>{label}: </Text>
      {value}
    </Text>
  );
}

function describeFire(fire: Campfire): string {
  switch (fire.kind) {
    case 'unlit':
      return 'unlit';
    case 'burning':
      return `burning ${fire.days} day${fire.days === 1 ? '' : 's'}${fire.litToday ? ', lit today' : ''}`;
    case 'embers':
      return `embers of a ${fire.lastStreak}-day streak`;
  }
}

function describePosition(position: TrailPosition): string {
  return position.kind === 'complete'
    ? 'expedition complete'
    : `${position.nextCampId} in ${position.stepsRemaining.toLocaleString()} steps (${position.stepsIntoLeg.toLocaleString()} / ${position.legSteps.toLocaleString()})`;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 96, gap: 10, backgroundColor: '#FFF6E9' },
  title: { fontSize: 32, fontWeight: '700', color: '#3B2418' },
  big: { fontSize: 44, fontWeight: '800', color: '#B4441C', fontVariant: ['tabular-nums'] },
  row: { fontSize: 17, color: '#3B2418' },
  label: { fontWeight: '600' },
  link: { marginTop: 24, fontSize: 17, fontWeight: '600', color: '#B4441C' },
});

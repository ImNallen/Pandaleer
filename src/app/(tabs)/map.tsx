import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampTent, type CampState } from '@/art/map/CampTent';
import { MapScenery } from '@/art/map/MapScenery';
import { Panda } from '@/art/panda/Panda';
import { expedition, stopByCampId, trail } from '@/content';
import type { GameState } from '@/game/game';
import { isTerrain, layoutMap, trailPosition, type MapLayout, type MapStop } from '@/map/layout';
import { useGame } from '@/state/useGame';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const SEED = 20261102;
const PANDA = 72;

export default function ExpeditionMap() {
  const theme = useTheme();
  const game = useGame();
  const { width } = useWindowDimensions();
  const layout = useMemo(
    () =>
      layoutMap(
        trail.map(({ camp }) => ({ campId: camp.id, terrain: isTerrain(camp.terrain) ? camp.terrain : 'meadow', stepsFromPrevious: camp.stepsFromPrevious })),
        width,
        SEED,
      ),
    [width],
  );
  return <View style={{ flex: 1, backgroundColor: theme.background }}>{game && <MapContent game={game} layout={layout} />}</View>;
}

function MapContent({ game, layout }: { game: GameState; layout: MapLayout }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scroll = useRef<ScrollViewInstance>(null);
  const { position, campsReached, totalSteps } = game.trail;

  const { point, walked } =
    position.kind === 'complete'
      ? trailPosition(layout, layout.segments.length, 1)
      : trailPosition(layout, campsReached, position.stepsIntoLeg / position.legSteps);

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scroll.current?.scrollTo({ y: Math.max(0, point.y - screenHeight * 0.55), animated: false })}>
        <View style={{ width: layout.width, height: layout.height }}>
          <MapScenery layout={layout} walked={walked} />
          {layout.stops.map((stop, i) => (
            <CampMarker key={stop.campId ?? 'trailhead'} stop={stop} index={i} game={game} />
          ))}
          <View
            pointerEvents="none"
            accessible
            accessibilityLabel={hereLabel(game)}
            style={[styles.panda, { left: point.x - PANDA / 2, top: point.y - PANDA * 0.86 }]}>
            <Panda pose={position.kind === 'complete' ? 'celebrating' : 'walking'} size={PANDA} animated />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.header, { paddingTop: insets.top + 6 }]} pointerEvents="none">
        <HeaderCard title={expedition.regions[0].name} detail={`${campsReached} of ${trail.length} camps · ${totalSteps.toLocaleString()} steps walked`} />
      </View>
    </View>
  );
}

function HeaderCard({ title, detail }: { title: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.headerCard, { backgroundColor: theme.surface, shadowColor: theme.shadow }]} accessible accessibilityRole="header">
      <Text variant="heading">{title}</Text>
      <Text variant="caption" muted>
        {detail}
      </Text>
    </View>
  );
}

function CampMarker({ stop, index, game }: { stop: MapStop; index: number; game: GameState }) {
  const theme = useTheme();
  if (!stop.campId) {
    return (
      <View style={[styles.label, styles.trailhead, { left: stop.x - 50, top: stop.y + 18, backgroundColor: theme.surface }]}>
        <Text variant="caption">Trailhead</Text>
      </View>
    );
  }

  const { camp } = stopByCampId.get(stop.campId)!;
  const state: CampState = index <= game.trail.campsReached ? 'reached' : index === game.trail.campsReached + 1 ? 'next' : 'ahead';
  const status =
    state === 'reached'
      ? 'Reached'
      : state === 'next' && game.trail.position.kind === 'traveling'
        ? `${game.trail.position.stepsRemaining.toLocaleString()} steps to go`
        : `${cumulativeSteps(index).toLocaleString()} steps`;

  return (
    <>
      <View style={[styles.tent, { left: stop.x - 22, top: stop.y - 30 }]} pointerEvents="none">
        <CampTent state={state} size={44} />
      </View>
      <View
        accessible
        accessibilityLabel={`Camp ${index}: ${camp.name}, ${status}`}
        style={[
          styles.label,
          {
            top: stop.y - 26,
            backgroundColor: theme.surface,
            shadowColor: theme.shadow,
            borderColor: state === 'next' ? theme.accent : 'transparent',
            opacity: state === 'ahead' ? 0.86 : 1,
          },
          stop.labelSide === 1 ? { left: stop.x + 24 } : { right: undefined, left: stop.x - 24 - 150 },
        ]}>
        <Text variant="caption" numberOfLines={1}>
          {camp.name}
        </Text>
        <Text variant="caption" muted style={styles.status} numberOfLines={1}>
          {state === 'reached' ? '✓ ' : ''}
          {status}
        </Text>
      </View>
    </>
  );
}

function cumulativeSteps(index: number): number {
  return trail.slice(0, index).reduce((sum, stop) => sum + stop.camp.stepsFromPrevious, 0);
}

function hereLabel(game: GameState): string {
  const position = game.trail.position;
  if (position.kind === 'complete') return 'The panda reached the summit. Expedition complete!';
  return `The panda is on the trail, ${position.stepsRemaining.toLocaleString()} steps from ${stopByCampId.get(position.nextCampId)!.camp.name}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { position: 'absolute', left: 16, right: 16, top: 0 },
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  tent: { position: 'absolute' },
  panda: { position: 'absolute', width: PANDA, height: PANDA },
  label: {
    position: 'absolute',
    width: 150,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  trailhead: { width: 100, alignItems: 'center', borderColor: 'transparent' },
  status: { fontSize: 12 },
});

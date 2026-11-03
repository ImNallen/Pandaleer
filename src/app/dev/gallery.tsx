import { Canvas, Group } from '@shopify/react-native-skia';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { RedPanda, usePandaImage } from '@/art/skia/RedPanda';
import type { PandaPose } from '@/art/skia/pandaPose';
import { Logo } from '@/components/Logo';
import { PandaFill } from '@/components/PandaFill';
import { SchemeScope, themes, useTheme, type Theme } from '@/ui/tokens';

const FILLS = [0, 0.4, 0.75, 1];
const POSES: PandaPose[] = ['wave', 'walk', 'brisk', 'celebrate'];
const TILE = 104;

export default function ArtGallery() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Gallery />;
}

function Gallery() {
  const theme = useTheme();
  const [animated, setAnimated] = useState(true);
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.toggle}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Animate water</Text>
        <Switch value={animated} onValueChange={setAnimated} />
      </View>
      {(['light', 'dark'] as const).map((scheme) => (
        <SchemeScope key={scheme} value={scheme}>
          <Board theme={themes[scheme]} animated={animated} />
        </SchemeScope>
      ))}
    </ScrollView>
  );
}

function Board({ theme, animated }: { theme: Theme; animated: boolean }) {
  return (
    <View style={[styles.board, { backgroundColor: theme.background, borderColor: theme.hairline }]}>
      <Text style={[styles.boardTitle, { color: theme.text }]}>{theme.scheme === 'light' ? 'Light' : 'Dark'}</Text>
      <Logo size={96} />
      <View style={styles.grid}>
        {POSES.map((pose) => (
          <Tile key={pose} label={pose} theme={theme}>
            <ColourPanda pose={pose} />
          </Tile>
        ))}
        {FILLS.map((progress) => (
          <Tile key={progress} label={`${progress * 100}%`} theme={theme}>
            <PandaFill progress={progress} size={TILE} animated={animated} />
          </Tile>
        ))}
      </View>
    </View>
  );
}

function ColourPanda({ pose }: { pose: PandaPose }) {
  const theme = useTheme();
  const image = usePandaImage(pose);
  return (
    <Canvas style={{ width: TILE, height: TILE }}>
      <Group transform={[{ scale: TILE / 240 }]}>
        <RedPanda image={image} theme={theme} pose={pose} />
      </Group>
    </Canvas>
  );
}

function Tile({ label, theme, children }: { label: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.fill }]}>
      {children}
      <Text style={[styles.tileLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 17, fontWeight: '600' },
  board: { borderRadius: 24, borderWidth: 1, padding: 14, gap: 14 },
  boardTitle: { fontSize: 22, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { alignItems: 'center', borderRadius: 20, padding: 8, flexBasis: '31%' },
  tileLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});

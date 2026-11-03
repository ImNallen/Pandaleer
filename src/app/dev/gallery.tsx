import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Panda, type Expression, type PandaPose } from '@/art/panda/Panda';
import { PandaFill } from '@/components/PandaFill';
import { SchemeScope, themes, useTheme, type Theme } from '@/ui/tokens';

const POSES: PandaPose[] = ['standing', 'sleeping', 'packing', 'walking', 'flag', 'celebrating'];
const EXPRESSIONS: Expression[] = ['content', 'excited', 'sleepy'];
const SMALL_SIZES = [40, 64, 96];
const TILE = 132;
const FILLS = [0, 0.25, 0.5, 0.75, 1];

export default function ArtGallery() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Gallery />;
}

function Gallery() {
  const theme = useTheme();
  const [animated, setAnimated] = useState(true);
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.toggle}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Animate</Text>
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

      <Section title="Poses" theme={theme}>
        {POSES.map((pose) => (
          <Tile key={pose} label={pose} theme={theme}>
            <Panda pose={pose} size={TILE} animated={animated} />
          </Tile>
        ))}
      </Section>

      <Section title="Expressions" theme={theme}>
        {EXPRESSIONS.map((expression) => (
          <Tile key={expression} label={expression} theme={theme}>
            <Panda pose="packing" expression={expression} size={TILE} animated={animated} />
          </Tile>
        ))}
      </Section>

      <Section title="Filling up" theme={theme}>
        {FILLS.map((progress) => (
          <Tile key={progress} label={`${progress * 100}%`} theme={theme}>
            <PandaFill progress={progress} size={TILE} celebrating={false} />
          </Tile>
        ))}
      </Section>

      <Section title="Small sizes" theme={theme}>
        {SMALL_SIZES.map((size) => (
          <Tile key={size} label={`${size} pt`} theme={theme}>
            <Panda pose="walking" size={size} animated={animated} />
          </Tile>
        ))}
      </Section>
    </View>
  );
}

function Section({ title, theme, children }: { title: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

function Tile({ label, theme, children }: { label: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.fill, shadowColor: theme.shadow }]}>
      {children}
      <Text style={[styles.tileLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 17, fontWeight: '600' },
  board: { borderRadius: 24, borderWidth: 1, padding: 14, gap: 18 },
  boardTitle: { fontSize: 22, fontWeight: '800' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 8,
    flexBasis: '48%',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tileLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});

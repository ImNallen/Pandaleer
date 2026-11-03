import { memo } from 'react';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';

import { useSvgId } from '@/art/motion';
import type { ScatterType, SceneryItem, WeekLayout } from '@/map/layout';
import { useArt, useTheme, type ArtPalette } from '@/ui/tokens';

/** One week of trail as a static drawing. */
export const MapScenery = memo(function MapScenery({ layout }: { layout: WeekLayout }) {
  const palette = useArt();
  const theme = useTheme();
  const groundId = useSvgId('ground');
  const { width, height } = layout;
  return (
    <Svg width={width} height={height} accessible={false} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id={groundId} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
          {layout.ground.map((band, i) => (
            <Stop key={i} offset={band.y / height} stopColor={palette[band.color]} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${groundId})`} />
      <SceneryLayer items={layout.scenery} palette={palette} />
      <Path d={layout.trailPath} stroke={palette.trail} strokeWidth={20} strokeLinecap="round" fill="none" />
      <Path d={layout.trailPath} stroke={palette.khakiDeep} strokeWidth={3.5} strokeDasharray="1 11" strokeLinecap="round" fill="none" />
      {theme.scheme === 'dark' && <Rect x={0} y={0} width={width} height={height} fill={palette.night} opacity={0.42} />}
    </Svg>
  );
});

const SceneryLayer = memo(function SceneryLayer({ items, palette }: { items: SceneryItem[]; palette: ArtPalette }) {
  return (
    <G>
      {items.map((item, i) => (
        <Item key={i} item={item} palette={palette} />
      ))}
    </G>
  );
});

function Item({ item, palette }: { item: SceneryItem; palette: ArtPalette }) {
  switch (item.kind) {
    case 'mountain':
      return <Mountain {...item} palette={palette} />;
    case 'scatter':
      return (
        <G transform={`translate(${item.x.toFixed(1)} ${item.y.toFixed(1)}) scale(${(item.flip ? -1 : 1) * item.scale} ${item.scale})`}>
          {SCATTER[item.type](palette)}
        </G>
      );
    case 'mist':
      return <Ellipse cx={item.x} cy={item.y} rx={item.width / 2} ry={24} fill={palette.snow} opacity={0.5} />;
    case 'river':
      return (
        <G>
          <Path d={item.d} stroke={palette.mist} strokeWidth={30} strokeLinecap="round" fill="none" />
          <Path d={item.d} stroke={palette.snow} strokeWidth={6} strokeDasharray="18 22" strokeLinecap="round" fill="none" opacity={0.7} />
          <G transform={`translate(${item.bridge.x} ${item.bridge.y})`}>
            <Rect x={-22} y={-24} width={44} height={48} rx={6} fill={palette.leather} />
            {[-14, -4, 6, 16].map((y) => (
              <Rect key={y} x={-22} y={y - 2} width={44} height={3} fill={palette.leatherDeep} />
            ))}
          </G>
        </G>
      );
    case 'terraces':
      return (
        <G transform={`translate(${item.x} ${item.y})`}>
          {[0, 14, 28, 42].map((dy, i) => (
            <Path key={dy} d={`M ${-46 + i * 3} ${dy} Q 0 ${dy - 12} ${46 - i * 3} ${dy}`} stroke={palette.bamboo} strokeWidth={9} strokeLinecap="round" fill="none" />
          ))}
        </G>
      );
    case 'prayerFlags':
      return <PrayerFlags from={item.from} to={item.to} palette={palette} />;
    case 'pools':
      return (
        <G transform={`translate(${item.x} ${item.y})`}>
          <Ellipse cx={-14} cy={0} rx={24} ry={11} fill={palette.mistDeep} />
          <Ellipse cx={-14} cy={-1} rx={19} ry={8} fill={palette.mist} />
          <Ellipse cx={20} cy={10} rx={16} ry={8} fill={palette.mistDeep} />
          <Ellipse cx={20} cy={9} rx={12} ry={5.5} fill={palette.mist} />
          {[-20, -6, 18].map((x) => (
            <Path key={x} d={`M ${x} -8 C ${x - 5} -14 ${x + 5} -18 ${x} -26`} stroke={palette.snow} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.85} />
          ))}
        </G>
      );
    case 'snowflake':
      return <Circle cx={item.x} cy={item.y} r={item.r} fill={palette.snow} opacity={0.9} />;
  }
}

function Mountain({ x, y, width, height, snowy, far, palette }: Extract<SceneryItem, { kind: 'mountain' }> & { palette: ArtPalette }) {
  const left = x - width / 2;
  const right = x + width / 2;
  const peak = y - height;
  const body = `M ${left} ${y} C ${x - width * 0.3} ${y - height * 0.45} ${x - width * 0.14} ${peak} ${x} ${peak} C ${x + width * 0.14} ${peak} ${x + width * 0.3} ${y - height * 0.45} ${right} ${y} Z`;
  const shade = `M ${x} ${peak} C ${x + width * 0.14} ${peak} ${x + width * 0.3} ${y - height * 0.45} ${right} ${y} L ${x + width * 0.12} ${y} C ${x + width * 0.1} ${y - height * 0.5} ${x + width * 0.06} ${peak + height * 0.2} ${x} ${peak} Z`;
  const capY = peak + height * 0.32;
  const cap = `M ${x - width * 0.17} ${capY} C ${x - width * 0.1} ${peak + 4} ${x - width * 0.05} ${peak} ${x} ${peak} C ${x + width * 0.05} ${peak} ${x + width * 0.1} ${peak + 4} ${x + width * 0.17} ${capY} Q ${x + width * 0.09} ${capY - 9} ${x + width * 0.03} ${capY + 2} Q ${x - width * 0.05} ${capY - 9} ${x - width * 0.17} ${capY} Z`;
  return (
    <G opacity={far ? 0.6 : 0.95}>
      <Path d={body} fill={palette.ridge} />
      <Path d={shade} fill={palette.ridgeDeep} />
      {snowy && <Path d={cap} fill={palette.snow} />}
    </G>
  );
}

function PrayerFlags({ from, to, palette }: { from: { x: number; y: number }; to: { x: number; y: number }; palette: ArtPalette }) {
  const colors = [palette.mistDeep, palette.snow, palette.rust, palette.bamboo, palette.fire, palette.mistDeep, palette.snow];
  const sag = 16;
  const at = (t: number) => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t + sag * 4 * t * (1 - t),
  });
  return (
    <G>
      <Rect x={from.x - 2} y={from.y - 4} width={4} height={46} rx={2} fill={palette.leatherDeep} />
      <Rect x={to.x - 2} y={to.y - 4} width={4} height={58} rx={2} fill={palette.leatherDeep} />
      <Path d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 + sag * 2} ${to.x} ${to.y}`} stroke={palette.brownSoft} strokeWidth={1.5} fill="none" />
      {colors.map((color, i) => {
        const p = at((i + 1) / (colors.length + 1));
        return <Path key={i} d={`M ${p.x - 6} ${p.y} L ${p.x + 6} ${p.y} L ${p.x} ${p.y + 13} Z`} fill={color} strokeLinejoin="round" />;
      })}
    </G>
  );
}

/** Each drawn with its base at (0, 0), roughly 30 points tall. */
const SCATTER: Record<ScatterType, (palette: ArtPalette) => React.ReactElement> = {
  bamboo: (p) => (
    <G>
      {[-7, 0, 7].map((x, i) => (
        <G key={x}>
          <Rect x={x - 2} y={-34 + i * 4} width={4} height={34 - i * 4} rx={2} fill={p.bamboo} />
          <Rect x={x - 2.5} y={-20 + i * 2} width={5} height={1.8} rx={0.9} fill={p.bambooDeep} />
        </G>
      ))}
      <Ellipse cx={-11} cy={-30} rx={7} ry={2.6} fill={p.bambooDeep} transform="rotate(-25 -11 -30)" />
      <Ellipse cx={11} cy={-24} rx={7} ry={2.6} fill={p.bambooDeep} transform="rotate(25 11 -24)" />
      <Ellipse cx={4} cy={-34} rx={6} ry={2.4} fill={p.bambooDeep} transform="rotate(-35 4 -34)" />
    </G>
  ),
  bush: (p) => (
    <G>
      <Ellipse cx={0} cy={-2} rx={15} ry={5} fill={p.bambooDeep} />
      <Circle cx={-7} cy={-8} r={8} fill={p.bamboo} />
      <Circle cx={6} cy={-9} r={9} fill={p.bamboo} />
      <Circle cx={0} cy={-14} r={8} fill={p.bamboo} />
    </G>
  ),
  flowers: (p) => (
    <G>
      <Circle cx={-6} cy={-7} r={8} fill={p.bambooDeep} />
      <Circle cx={6} cy={-8} r={9} fill={p.bambooDeep} />
      {[
        [-8, -10],
        [-2, -14],
        [5, -12],
        [9, -6],
        [-3, -5],
      ].map(([x, y]) => (
        <Circle key={`${x}${y}`} cx={x} cy={y} r={2.8} fill={p.blush} />
      ))}
    </G>
  ),
  pine: (p) => (
    <G>
      <Rect x={-2.5} y={-8} width={5} height={8} rx={2} fill={p.leatherDeep} />
      <Path d="M -14 -6 Q 0 -2 14 -6 L 2 -24 Q 0 -26 -2 -24 Z" fill={p.pine} />
      <Path d="M -11 -18 Q 0 -14 11 -18 L 2 -34 Q 0 -36 -2 -34 Z" fill={p.pine} />
      <Path d="M -8 -29 Q 0 -26 8 -29 L 1.5 -42 Q 0 -44 -1.5 -42 Z" fill={p.pine} />
    </G>
  ),
  rock: (p) => (
    <G>
      <Path d="M -14 0 Q -15 -10 -6 -13 Q 2 -17 9 -11 Q 15 -6 14 0 Z" fill={p.stone} />
      <Path d="M 2 -14 Q 10 -12 13 -6 Q 15 -2 14 0 L 4 0 Q 7 -6 2 -14 Z" fill={p.stoneDeep} />
    </G>
  ),
  teaBush: (p) => (
    <G>
      <Path d="M -15 0 Q -17 -14 -6 -15 Q 0 -19 6 -15 Q 17 -14 15 0 Z" fill={p.bamboo} />
      <Path d="M -11 -6 Q 0 -2 11 -6 M -9 -11 Q 0 -8 9 -11" stroke={p.bambooDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    </G>
  ),
  snowPine: (p) => (
    <G>
      <Rect x={-2.5} y={-8} width={5} height={8} rx={2} fill={p.leatherDeep} />
      <Path d="M -14 -6 Q 0 -2 14 -6 L 2 -24 Q 0 -26 -2 -24 Z" fill={p.pine} />
      <Path d="M -11 -18 Q 0 -14 11 -18 L 2 -34 Q 0 -36 -2 -34 Z" fill={p.pine} />
      <Path d="M -8 -29 Q 0 -26 8 -29 L 1.5 -42 Q 0 -44 -1.5 -42 Z" fill={p.pine} />
      <Path d="M -5 -36 Q 0 -34 5 -36 L 1.5 -42 Q 0 -44 -1.5 -42 Z" fill={p.snow} />
      <Path d="M -9 -21 Q 0 -18 9 -21 L 5 -27 Q 0 -25 -5 -27 Z" fill={p.snow} />
    </G>
  ),
  snowRock: (p) => (
    <G>
      <Path d="M -14 0 Q -15 -10 -6 -13 Q 2 -17 9 -11 Q 15 -6 14 0 Z" fill={p.stoneDeep} />
      <Path d="M -10 -9 Q -6 -13 -2 -13.5 Q 4 -16 9 -11 Q 3 -9 -2 -10 Q -6 -8 -10 -9 Z" fill={p.snow} />
    </G>
  ),
};

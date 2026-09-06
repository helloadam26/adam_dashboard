/**
 * Série quotidienne, avec échelle.
 *
 * La version d'origine (portée du prototype) n'avait ni axe Y, ni valeur, ni
 * repère : une base plate et quelques pics. Sur des valeurs de 0 à 3 utilisateurs,
 * ces pics paraissaient spectaculaires et suggéraient une activité qui n'existe pas.
 *
 * Trois corrections :
 *
 * 1. Un axe Y gradué. Ses libellés vivent en HTML, à gauche du SVG, et non dans le
 *    SVG : celui-ci est étiré horizontalement pour remplir son panneau
 *    (`preserveAspectRatio="none"`), ce qui déformerait le texte.
 * 2. La valeur au survol, par un `<title>` SVG natif — aucun état, aucun JS.
 * 3. Des barres, et non une courbe lissée, quand les valeurs sont de petits
 *    entiers : une courbe interpole entre 0 et 3 des valeurs qui n'existent pas.
 */
import { useId } from 'react';
import { nombre } from '../../lib/format';
import { colors } from '../../theme/tokens';

interface LineChartProps {
  series: number[];
  /** Étiquettes alignées sur la série, pour l'infobulle. */
  labels?: string[];
  color?: string;
  height?: number;
}

/** En deçà, une courbe interpolerait des valeurs intermédiaires qui n'existent pas. */
const SEUIL_BARRES = 5;

/** Plafond d'axe lisible : 1, 2 ou 5 fois une puissance de dix. */
function plafondLisible(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const pas of [1, 2, 5, 10]) {
    if (max <= pas * magnitude) return pas * magnitude;
  }
  return 10 * magnitude;
}

function graduations(max: number, entiersPetits: boolean): number[] {
  if (entiersPetits) return Array.from({ length: max + 1 }, (_, i) => max - i);
  const plafond = plafondLisible(max);
  return [plafond, plafond / 2, 0];
}

export function LineChart({ series, labels, color = colors.indigo, height = 200 }: LineChartProps) {
  const gradientId = useId();
  const w = 640;
  const pl = 4;
  const pr = 4;
  const pt = 10;
  const pb = 10;
  const n = series.length;

  if (n < 2) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: colors.faint,
        }}
      >
        Pas assez de points sur la période.
      </div>
    );
  }

  const maxVal = Math.max(...series);
  const entiersPetits = maxVal <= SEUIL_BARRES && series.every(Number.isInteger);
  // Une série entièrement à zéro donnerait une échelle nulle : on force un plafond de 1.
  const echelle = entiersPetits ? Math.max(maxVal, 1) : plafondLisible(Math.max(maxVal, 1));
  const ticks = graduations(Math.max(maxVal, 1), entiersPetits);

  const px = (i: number) => pl + (i * (w - pl - pr)) / (n - 1);
  const py = (v: number) => height - pb - (v / echelle) * (height - pb - pt);

  const infobulle = (i: number, v: number) =>
    `${labels?.[i] ?? `Point ${i + 1}`} : ${nombre(v)}`;

  const pts = series.map((v, i) => [px(i), py(v)] as const);
  const line = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const area = line + ` L ${px(n - 1).toFixed(1)} ${height - pb} L ${px(0).toFixed(1)} ${height - pb} Z`;
  const largeurBarre = Math.max((w - pl - pr) / n - 1, 1);

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {/* Libellés d'axe en HTML : le SVG voisin est étiré, il déformerait le texte. */}
      <div
        style={{
          width: 26,
          height,
          position: 'relative',
          flex: '0 0 auto',
          fontSize: 10,
          color: colors.faint,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {ticks.map((t) => (
          <span
            key={t}
            style={{
              position: 'absolute',
              right: 0,
              top: py(t) - 6,
              lineHeight: '12px',
            }}
          >
            {nombre(t)}
          </span>
        ))}
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Série de ${n} points, maximum ${nombre(maxVal)}`}
      >
        {ticks.map((t) => (
          <line
            key={t}
            x1={0}
            y1={py(t)}
            x2={w}
            y2={py(t)}
            stroke={t === 0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)'}
          />
        ))}

        {entiersPetits ? (
          series.map((v, i) => (
            <rect
              key={i}
              x={px(i) - largeurBarre / 2}
              y={v === 0 ? height - pb - 1 : py(v)}
              width={largeurBarre}
              height={v === 0 ? 1 : height - pb - py(v)}
              fill={v === 0 ? 'rgba(255,255,255,.10)' : color}
            >
              <title>{infobulle(i, v)}</title>
            </rect>
          ))
        ) : (
          <>
            <defs>
              <linearGradient id={gradientId} x1={0} y1={0} x2={0} y2={1}>
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={3.4} fill={color} stroke="#121217" strokeWidth={2} />
            {/* Bandes de survol invisibles : sans elles, il faudrait viser la courbe au pixel. */}
            {series.map((v, i) => (
              <rect key={i} x={px(i) - largeurBarre / 2} y={0} width={largeurBarre} height={height} fill="transparent">
                <title>{infobulle(i, v)}</title>
              </rect>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

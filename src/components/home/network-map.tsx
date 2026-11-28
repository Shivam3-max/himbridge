'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/client';
import { cx } from '@/lib/format';

/** Live trade-network map: the generated SVG is inlined so its SMIL animation and fonts apply. */
export function NetworkMap() {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [regions, setRegions] = useState<[string, string][]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [clock, setClock] = useState('');

  useEffect(() => {
    fetch('/map/world-network.svg')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('map'))))
      .then(setSvg)
      .catch(() => setFailed(true));
    const tick = () => setClock(`${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`);
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = box.current?.querySelector('svg');
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.pauseAnimations();
      el.setCurrentTime(2.2);
    }
    const markets = [...el.querySelectorAll<SVGGElement>('.wn-m')];
    setRegions(
      markets.map((g) => {
        const [name = '', detail = ''] = (g.querySelector('title')?.textContent ?? '').split(' — ');
        return [name, detail.replace('indicative sea transit ', '')];
      }),
    );
    const cleanups = markets.map((g, i) => {
      const on = () => setHover(i);
      const off = () => setHover(null);
      g.addEventListener('mouseenter', on);
      g.addEventListener('focus', on);
      g.addEventListener('mouseleave', off);
      g.addEventListener('blur', off);
      return () => {
        g.removeEventListener('mouseenter', on);
        g.removeEventListener('focus', on);
        g.removeEventListener('mouseleave', off);
        g.removeEventListener('blur', off);
      };
    });
    return () => cleanups.forEach((c) => c());
  }, [svg]);

  return (
    <figure className="netmap" aria-label={t('Himbridge global trade network')}>
      <figcaption className="netmap-head">
        <span className="live-dot" />
        <b>{t('Live trade network')}</b>
        <span className="tiny muted" suppressHydrationWarning>
          {clock}
        </span>
      </figcaption>
      {svg ? (
        <div className="netmap-canvas" ref={box} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="netmap-canvas">
          <div className="empty">{t(failed ? 'Map unavailable' : 'Loading map…')}</div>
        </div>
      )}
      <div className="netmap-foot">
        <span>
          <i className="lg hub" />
          {t('Made in India')}
        </span>
        <span>
          <i className="lg mkt" />
          {t('Buyer regions')}
        </span>
        <span>
          <i className="lg lane" />
          {t('Active trade lanes')}
        </span>
        <span className="netmap-stat">
          <b>11</b> {t('regions')} · <b>40+</b> {t('markets')}
        </span>
      </div>
      <ul className="netmap-list" aria-label={t('Buyer regions')}>
        {regions.map(([name, detail], i) => (
          <li key={name} className={cx(hover === i && 'on')}>
            <b>{name}</b>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

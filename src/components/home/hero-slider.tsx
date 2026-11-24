'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/client';
import { cx } from '@/lib/format';
import { useMediaQuery } from '@/lib/hooks';
import { Peak } from '../ui/primitives';

const SLIDES = [
  {
    img: '/images/hero-crafted.jpg',
    pos: '62% 50%',
    kicker: 'Crafted collection',
    tab: 'Crafted',
    title: 'Made by master hands.',
    text: 'Brass, wood, stone and textiles from audited artisan workshops — finished, packed and export-ready.',
    cta: ['/marketplace?c=crafted', 'Explore Crafted'],
  },
  {
    img: '/images/hero-engineered.jpg',
    pos: '70% 50%',
    kicker: 'Engineered collection',
    tab: 'Engineered',
    title: 'Built at scale. Checked to spec.',
    text: 'Lighting, solar, appliances and modern furniture from certified factories with fast sampling.',
    cta: ['/marketplace?c=engineered', 'Explore Engineered'],
  },
  {
    img: '/images/hero-quality.jpg',
    pos: '68% 50%',
    kicker: 'Quality assurance',
    tab: 'Quality',
    title: 'Nothing ships unchecked.',
    text: 'Independent pre-shipment inspection on every order. Your balance is due only after QC passes.',
    cta: ['/about#verification', 'How verification works'],
  },
  {
    img: '/images/hero-delivery.jpg',
    pos: '58% 50%',
    kicker: 'Door-to-door delivery',
    tab: 'Delivery',
    title: 'One desk. 40+ markets.',
    text: 'Quotes, documents, freight and customs — tracked from the factory floor to your warehouse.',
    cta: ['/track', 'Track a shipment'],
  },
] as const;

/** Home page hero: cross-fade, slow zoom, numbered tabs with a progress line. Pauses on hover/focus. */
export function HeroSlider() {
  const t = useT();
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const still = useMediaQuery('(prefers-reduced-motion: reduce)');
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const go = useCallback((i: number) => setCur((i + SLIDES.length) % SLIDES.length), []);
  useEffect(() => {
    clearInterval(timer.current);
    if (!still && !paused) timer.current = setInterval(() => setCur((c) => (c + 1) % SLIDES.length), 7000);
    return () => clearInterval(timer.current);
  }, [cur, paused, still]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);
  return (
    <section
      className={cx('hs', paused && 'paused')}
      aria-roledescription="carousel"
      aria-label={t('Himbridge highlights')}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      {SLIDES.map((s, i) => (
        <article
          key={s.img}
          className={cx('hs-slide', i === cur && 'on')}
          aria-roledescription="slide"
          aria-label={`0${i + 1} / 04`}
          aria-hidden={i !== cur}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- art-directed full-bleed hero */}
          <img src={s.img} alt="" style={{ objectPosition: s.pos }} fetchPriority={i === 0 ? 'high' : 'auto'} decoding="async" />
          <div className="wrap hs-in">
            <span className="kicker">
              <b className="hs-n">0{i + 1}</b>
              <Peak />
              {t(s.kicker)}
            </span>
            <h2>{t(s.title)}</h2>
            <p>{t(s.text)}</p>
            <div className="hs-cta">
              <Link className="btn saffron" href={s.cta[0]} tabIndex={i === cur ? 0 : -1}>
                {t(s.cta[1])}
              </Link>
              <Link className="btn hs-ghost" href="/dashboard/rfqs/new" tabIndex={i === cur ? 0 : -1}>
                {t('Post a requirement')}
              </Link>
            </div>
          </div>
        </article>
      ))}
      <div className="wrap hs-nav">
        <div className="hs-tabs" role="tablist">
          {SLIDES.map((s, i) => (
            <button key={s.tab} type="button" role="tab" aria-selected={i === cur} className={cx(i === cur && 'on')} onClick={() => go(i)}>
              <b>0{i + 1}</b>
              <span>{t(s.tab)}</span>
              <i key={i === cur ? `on-${cur}` : 'off'} />
            </button>
          ))}
        </div>
        <div className="hs-arrows">
          <button type="button" className="hs-prev" aria-label={t('Previous slide')} onClick={() => go(cur - 1)}>
            ‹
          </button>
          <button type="button" className="hs-next" aria-label={t('Next slide')} onClick={() => go(cur + 1)}>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

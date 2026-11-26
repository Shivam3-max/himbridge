'use client';

/**
 * Small presentational building blocks of the portal design system (styles in src/app/globals.css).
 * They are client components so they can be used from both server pages and interactive forms;
 * all of them translate their own fixed labels.
 */
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { SECTORS, sectorOf } from '@/domain/sectors';
import { ORDER_FLOW, statusIndex, statusLabel } from '@/domain/order-flow';
import { useT } from '@/i18n/client';
import { cx, fmtDate } from '@/lib/format';

export function Block({
  title,
  tone,
  right,
  children,
  bodyClassName = 'block-body',
  id,
  style,
}: {
  title?: ReactNode;
  tone?: 'saffron' | 'green' | 'red';
  right?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  id?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="block" id={id} style={style}>
      {title != null && (
        <div className={cx('block-head', tone)}>
          <h3>{title}</h3>
          {right}
        </div>
      )}
      {bodyClassName ? <div className={bodyClassName}>{children}</div> : children}
    </div>
  );
}

export function PageBar({ crumbs, title, lead }: { crumbs: [href: string | null, label: string][]; title: string; lead?: ReactNode }) {
  const t = useT();
  return (
    <div className="pagebar">
      <div className="wrap">
        <div className="crumbs">
          <Link href="/">{t('Home')}</Link>
          {crumbs.map(([href, label]) => (
            <span key={label}>
              {' › '}
              {href ? <a href={href}>{t(label)}</a> : t(label)}
            </span>
          ))}
        </div>
        <h1>{t(title)}</h1>
        {lead && <p>{typeof lead === 'string' ? t(lead) : lead}</p>}
      </div>
    </div>
  );
}

/** Small saffron peak — the logo's mountain, used as the kicker mark on banners. */
export function Peak() {
  return (
    <svg className="peak" viewBox="0 0 20 12" aria-hidden="true">
      <path d="M0 12 L10 0 L20 12 Z" fill="currentColor" />
      <path d="M10 0 L7.4 3.1 L8.8 2.4 L10 3.6 L11.3 2.4 L12.6 3.1 Z" fill="#fff" />
    </svg>
  );
}

/** Designed page banner: photo + navy gradient + kicker + one-line statement. */
export function PageBanner({ img, kicker, line, pos = 'center' }: { img: string; kicker: string; line: string; pos?: string }) {
  const t = useT();
  return (
    <section className="pb" aria-label={t(kicker)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- full-bleed art-directed banner */}
      <img src={img} alt="" style={{ objectPosition: pos }} fetchPriority="high" />
      <div className="wrap pb-in">
        <span className="kicker">
          <Peak />
          {t(kicker)}
        </span>
        <p className="pb-line">{t(line)}</p>
      </div>
    </section>
  );
}

const PH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </svg>
);

/** Image placeholder — shown until real photos are uploaded. */
export function Placeholder({
  label = '',
  size,
  className,
  style,
  children,
}: {
  label?: string;
  size?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <div className={cx('ph', className)} role="img" aria-label={`${t(label)} placeholder`} style={style}>
      {children}
      <div className="ph-in">
        {PH_ICON}
        {label && <b>{t(label)}</b>}
        {size && <code>{size}</code>}
      </div>
    </div>
  );
}

/** Colour-coded sector label for a niche (Home & Living, Food & Agri, …). */
export function SectorChip({ niche }: { niche: string | null | undefined }) {
  const t = useT();
  const key = sectorOf(niche);
  return (
    <span className={cx('chip', key ?? 'any')}>
      <span className="dot" />
      {t(key ? SECTORS[key].name : 'All sectors')}
    </span>
  );
}

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'info' | 'grey';
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  const t = useT();
  return <span className={cx('badge', tone)}>{typeof children === 'string' ? t(children) : children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone = status === 'delivered' ? 'ok' : status === 'confirmed' ? 'info' : 'warn';
  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}

export function ProgressBar({ status }: { status: string }) {
  const idx = statusIndex(status);
  return (
    <div className="progress">
      {ORDER_FLOW.map((s, i) => (
        <i key={s.key} className={i <= idx ? 'on' : ''} />
      ))}
    </div>
  );
}

export interface TimelineMilestone {
  status: string;
  note: string;
  createdAt: Date | string;
  byCompany?: string | null;
}

/** Order milestone timeline shared by the tracking page and dashboards. */
export function Timeline({ status, milestones }: { status: string; milestones: TimelineMilestone[] }) {
  const t = useT();
  const idx = statusIndex(status);
  const byStatus = new Map(milestones.map((m) => [m.status, m]));
  return (
    <ul className="timeline">
      {ORDER_FLOW.map((s, i) => {
        const m = byStatus.get(s.key);
        const cls = i < idx ? 'done' : i === idx ? (i === ORDER_FLOW.length - 1 ? 'done' : 'current') : '';
        return (
          <li key={s.key} className={cls}>
            <span className="dotc">{i <= idx ? '✓' : ''}</span>
            <div className="tl-t">{t(s.label)}</div>
            <div className="tl-n">
              {m ? (
                <>
                  {fmtDate(m.createdAt)}
                  {m.byCompany ? ` · ${m.byCompany}` : ''}
                  {m.note ? ` — ${m.note}` : ''}
                </>
              ) : (
                t('Pending')
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Empty({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const t = useT();
  return (
    <div className="empty" style={style}>
      {typeof children === 'string' ? t(children) : children}
    </div>
  );
}

export function Banner({ tone, children }: { tone: 'warn' | 'ok' | 'info'; children: ReactNode }) {
  return <div className={cx('banner', tone)}>{children}</div>;
}

export function Kpis({ items }: { items: [label: string, value: ReactNode, color?: string][] }) {
  const t = useT();
  return (
    <div className="kpis">
      {items.map(([label, value, color]) => (
        <div key={label} className="kpi" style={{ '--c': color ?? 'var(--navy)' } as CSSProperties}>
          <div className="n">{value}</div>
          <div className="l">{t(label)}</div>
        </div>
      ))}
    </div>
  );
}

export function FormMessage({ state }: { state: { ok: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  const text = state.ok ? state.message : state.error;
  if (!text) return null;
  return <div className={cx('form-msg show', state.ok ? 'ok' : 'err')}>{text}</div>;
}

/** Five-square score bar for the niche research table. */
export function ScoreBar({ value }: { value: number }) {
  return (
    <span className="score" title={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= value ? 'on' : ''} />
      ))}
    </span>
  );
}

/** Translates a fixed English string. Handy inside server components that pass text to client trees. */
export function T({ children }: { children: string }) {
  return <>{useT()(children)}</>;
}

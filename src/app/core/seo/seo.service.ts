import { DOCUMENT } from '@angular/common';
import { DestroyRef, Inject, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { SeoRouteData } from './seo.types';

const JSON_LD_ID = 'app-seo-jsonld';
const CANONICAL_SEL = 'link[rel="canonical"]';
const HREFLANG_SEL = 'link[rel="alternate"][data-app-hreflang]';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor(@Inject(DOCUMENT) private readonly doc: Document) {
    merge(
      of(null),
      this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyForCurrentUrl());
  }

  /** Обновляет title, meta, canonical и JSON-LD под текущий URL (SSR и браузер). */
  applyForCurrentUrl(): void {
    const url = this.router.url.split('?')[0].split('#')[0];
    const route = this.findDeepestChild(this.router.routerState.snapshot.root);
    const seo = (route.data['seo'] as SeoRouteData | undefined) ?? this.fallbackSeo(url);
    const abs = this.absoluteUrl(url);
    const site = environment.siteUrl.replace(/\/$/, '');

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({
      name: 'robots',
      content: seo.robots ?? 'index, follow',
    });

    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:type', content: seo.ogType ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: abs });
    this.meta.updateTag({ property: 'og:locale', content: 'ru_RU' });
    this.meta.updateTag({ property: 'og:image', content: `${site}/logo.png` });
    this.meta.updateTag({ property: 'og:image:alt', content: seo.title });
    this.meta.updateTag({ property: 'og:site_name', content: 'ЗОШ' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });

    this.setCanonical(abs);
    this.setHreflang(site, url);
    this.setJsonLd(seo.jsonLd ? this.buildJsonLd(seo, site, abs) : null);
  }

  private findDeepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let r = route;
    while (r.firstChild) {
      r = r.firstChild;
    }
    return r;
  }

  private fallbackSeo(path: string): SeoRouteData {
    const base = 'ЗОШ — шаг за шагом к здоровью';
    return {
      title: base,
      description:
        'Сервис для структурированного учёта показателей здоровья, рекомендаций и прогресса.',
      robots: 'noindex, follow',
      ogType: 'website',
      jsonLd: false,
    };
  }

  private absoluteUrl(path: string): string {
    const base = environment.siteUrl.replace(/\/$/, '');
    if (!path || path === '/') return `${base}/`;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  /** Один язык — подсказка поисковикам о канонической локали главной. */
  private setHreflang(site: string, path: string): void {
    const head = this.doc.head;
    const existing = this.doc.querySelector<HTMLLinkElement>(HREFLANG_SEL);
    existing?.remove();
    if (path !== '/' && path !== '') return;
    const link = this.doc.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', 'ru-RU');
    link.setAttribute('href', `${site}/`);
    link.setAttribute('data-app-hreflang', '1');
    head.appendChild(link);
  }

  private setCanonical(href: string): void {
    const head = this.doc.head;
    let link = this.doc.querySelector<HTMLLinkElement>(CANONICAL_SEL);
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(data: Record<string, unknown>[] | null): void {
    const head = this.doc.head;
    const existing = this.doc.getElementById(JSON_LD_ID);
    existing?.remove();
    if (!data?.length) return;
    const script = this.doc.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    head.appendChild(script);
  }

  private buildJsonLd(seo: SeoRouteData, site: string, pageUrl: string): Record<string, unknown>[] {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        name: 'ЗОШ',
        url: `${site}/`,
        description: seo.description,
        inLanguage: 'ru-RU',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ЗОШ',
        url: site,
        logo: `${site}/logo.png`,
        description: seo.description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': pageUrl,
        url: pageUrl,
        name: seo.title,
        description: seo.description,
        isPartOf: { '@id': `${site}/#website` },
      },
    ];
  }
}

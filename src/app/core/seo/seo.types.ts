/** Данные для `<title>`, meta и JSON-LD (задаются в `Route.data.seo`). */
export interface SeoRouteData {
  title: string;
  description: string;
  /** Например `index, follow` или `noindex, nofollow` */
  robots?: string;
  /** `og:type`, по умолчанию `website` */
  ogType?: string;
  /** Включить JSON-LD WebSite + Organization (только главная). */
  jsonLd?: boolean;
}

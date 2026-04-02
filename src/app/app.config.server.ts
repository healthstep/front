import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideServerRendering } from '@angular/platform-server';
import { WA_WINDOW } from '@ng-web-apis/common';
import { appConfig } from './app.config';

/** SSR: jsdom/defaultView has no real matchMedia; Taiga UI (TUI_DARK_MODE, etc.) requires it. */
function mockMediaQueryList(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  } as MediaQueryList;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: WA_WINDOW,
      useFactory: (doc: Document) => {
        const win = doc.defaultView;
        if (!win) {
          throw new Error('Window is not available');
        }
        if (typeof win.matchMedia !== 'function') {
          Object.assign(win, {
            matchMedia: (query: string) => mockMediaQueryList(query),
          });
        }
        return win;
      },
      deps: [DOCUMENT],
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  proTrial: {
    enabled: true,
    expiresAt: '2026-10-16T11:55:59Z',
    timeServers: [
      'https://timeapi.io/api/time/current/zone?timeZone=UTC'
    ],
  },
  desktopDownloadUrl: 'https://github.com/leo-devstudio/PixelPal-releases/releases/latest/download/PixelPal-Setup-v1.0.1.exe',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

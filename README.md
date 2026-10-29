# SolarCast

An Android solar forecasting app with a charcoal dashboard, hourly production lines, seven-day energy bars, local measured-generation history, and a battery planning scenario.

## Install

Download **SolarCast-1.0.0-test.apk** from **Actions → Build SolarCast APK → a successful run → Artifacts → SolarCast-APK**. Android 8 or newer, with an up-to-date Android System WebView. Enable installation from your browser when Android asks. This is a phone-test APK, not a production-signed release. Test signing may change between builds; export your local settings/history before reinstalling. A production signing key is required for guaranteed seamless upgrades.

## First run

Search your town or enter latitude/longitude, review your panel groups, and press Save system & get forecast. The starting editable template is 30 × 440 W, with groups of 9 at 29°, 15 at 27°, and 6 at 299°, all tilted 25°. Inverter rating 10 kW. No personal address is committed. Settings/history stay in app storage; coordinates go to Open-Meteo for forecasts. Clearing storage/uninstalling removes local data unless backed up.

## Model

Open-Meteo global tilted irradiance is requested separately for every group. Compass azimuth (clockwise from north) is converted to the API's south-zero convention. Hourly radiation is a preceding-hour mean: each timestamp represents the end of its energy interval. Unix timestamps and the returned location timezone are used to handle daylight saving and half-hour zones.

For each group: kWp × GTI / 1000 × (1 − group shading). Sum groups, multiply by the combined system efficiency (default 87%), then cap at the inverter AC rating. The loss factor already represents temperature/inverter/wiring/soiling; no duplicate temperature derating is added. kWh is the sum of hourly mean kW × one hour. Missing radiation is missing, never silently zero. Later days are less certain; no invented confidence interval is shown.

This is an AC-equivalent model. It does not model MPPT/string limits, tree shadows, rear-side bifacial yield, export curtailment, or extra DC-coupled battery capture. It is not live inverter telemetry. Battery planning uses user-entered load, SOC, usable capacity, reserve, efficiency and a shared charge/discharge power limit. The capacity and power defaults are assumptions requiring verification. The app does not control hardware.

History keeps the first retrieved forecast for each date/configuration plus manually entered actual energy. A revised configuration replaces that date's comparison forecast. Old forecasts are not fabricated. Use History to copy/restore a JSON backup.

## Build and checks

JDK 17, Gradle 8.11.1, Android SDK 35. Run `node tests/engine.test.js` and `gradle :app:assembleDebug :app:lintDebug`. GitHub Actions builds, tests and uploads the phone-test APK. Physical-device testing remains required, especially WebView behaviour and weather service access.

Weather data by [Open-Meteo](https://open-meteo.com/), CC BY 4.0. Free API use is intended for non-commercial use and subject to provider limits; commercial redistribution requires reviewing the appropriate API plan.

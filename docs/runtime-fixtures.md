# Original runtime dependency replay

The website files are unchanged. Its original CDN request URLs are fulfilled in
Playwright from `tests/runtime/resources`, indexed by `manifest.json`. This also
works in the CDP browser used by the Lighthouse runner.

Resources were fetched from their original HTTPS URLs with curl's normal TLS
verification. The existing React/ReactDOM SHA-384 SRI values were verified before
recording. Every response has a SHA-256 checked on replay. Browser SRI remains
enabled. Neither `ignoreHTTPSErrors` nor `--ignore-certificate-errors` is used.

The cloud proxy initially blocked CDN hosts. The additive environment draft now
includes `esm.sh` along with the earlier React/font domains. Runtime policy
propagated during setup. Chromium's live requests also encountered proxy CA
trust errors; verified response replay avoids changing browser trust settings.
No network publication or website deployment was performed.

Google Fonts CSS is frozen using the Chrome 154 Linux user agent recorded in the
manifest. Those same font responses are intentionally replayed for all Chromium
device-emulation configurations. These are original font files, not substitutes.
Device emulation is not a claim of real Safari rendering.

Only analytics endpoints are stubbed to prevent test visits from sending events.
Unrecognized external runtime requests are aborted and must be treated as a test
failure. Outbound project navigation is separately stubbed by functional tests;
link destination equality is tested without visiting external websites.

`python3 tests/runtime/freeze.py` is a deliberate fixture recording utility,
not a test/gate command. Frozen references must not be refreshed when comparing a
future candidate. Resource/header/network latency replay makes Lighthouse a
controlled local lab measurement, not a reproduction of public PageSpeed scores.

The source-integrity check is specific to Phase 0–1 and reference recording.
Future refactored builds are compared through `BASE_URL` against frozen content
and visual references; they are not expected to pass byte-equality to the old source.

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
for f in $(find js -name '*.js' -type f | sort); do node --input-type=module --check < "$f" >/dev/null; done
for f in $(find . -maxdepth 2 -name '*.json' -type f | sort); do python3 -m json.tool "$f" >/dev/null; done
php -l sync/nextcloud.php >/dev/null
python3 tests/check_i18n.py
node tests/check_scout_flow.mjs
node tests/check_timestamp_editor.mjs
node tests/check_sync_conflict.mjs
node tests/check_analysis_rc6_3.mjs
node tests/check_analysis_rc6_4.mjs
node tests/check_library_metadata_rc6_5.mjs
node tests/check_team_report_rc6_6.mjs
node tests/check_reports_rc6_8.mjs
node tests/check_report_bugfix_rc6_8.mjs
node tests/check_report_layout_rc6_8.mjs
node tests/check_report_finishing_rc6_8.mjs
node tests/check_schema6_migration.mjs
php tests/check_webdav_relay.php
python3 tests/check_report_style_rc6_8.py
python3 tests/check_prefinal_rc6_8.py
python3 tests/check_report_share_visibility_rc6_8.py
python3 tests/check_release_static.py
echo "All VolleyTakt Live RC6 checks passed."

python3 tests/check_final_0_4_1.py

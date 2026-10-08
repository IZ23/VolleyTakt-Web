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
node tests/check_data_migration1.mjs
php tests/check_webdav_relay.php
python3 tests/check_report_style_rc6_8.py
python3 tests/check_prefinal_rc6_8.py
python3 tests/check_report_share_visibility_rc6_8.py
python3 tests/check_release_static.py
node tests/check_0_4_2_rc2.mjs
node tests/check_video_worker_rc2.mjs
node tests/check_i18n_modular_rc3_1.mjs
python3 tests/check_i18n_hardcoded_rc3_1.py
python3 tests/check_report_menu_0_4_2_rc1.py
python3 tests/check_onboarding_0_4_2_rc1.py
python3 tests/check_navigation_0_4_2_rc1.py
python3 tests/check_ui_nav_quality_0_4_2_rc1.py
node tests/check_nav_mobile_data_k3_0_4_2_rc1.mjs
python3 tests/check_nav_mobile_buttons_0_4_2_rc1.py

python3 tests/check_player_report_print_0_4_2_rc1.py
python3 tests/check_match_new_form_0_4_2_rc1.py
node tests/check_rc1_sync_score_regressions.mjs
python3 tests/check_rc1_webdav_lock.py
node tests/check_rc1_video_cleanup_regressions.mjs
python3 tests/check_rc1_sync_cleanup.py

node tests/check_report_i18n_rc3.mjs

node tests/check_report_i18n1_rc3.mjs
node tests/check_report_i18n1a_rc3_2.mjs
python3 tests/check_variable_shadowing_rc3_2.py
node tests/check_0_4_3_2_security.mjs
php tests/check_webdav_relay_0_4_3_2.php
echo "All VolleyTakt Live 0.4.3.2 checks passed."

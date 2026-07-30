#!/usr/bin/env bash
# shellcheck disable=SC1090,SC2034,SC2317
# Regression tests for install.sh's GitHub CLI package-source contract.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSTALL_SCRIPT="$PROJECT_ROOT/install.sh"

TESTS_PASSED=0
TESTS_FAILED=0

pass() {
    echo "[PASS] $1"
    ((++TESTS_PASSED))
}

fail() {
    echo "[FAIL] $1: $2" >&2
    ((++TESTS_FAILED))
}

extract_function() {
    local name="$1"
    awk -v function_name="$name" '
        index($0, function_name "()") == 1 { in_function = 1 }
        in_function { print }
        in_function && /^}$/ { exit }
    ' "$INSTALL_SCRIPT"
}

assert_call() {
    local output="$1"
    local expected="$2"
    local name="$3"
    if grep -Fqx -- "$expected" <<<"$output"; then
        pass "$name"
    else
        fail "$name" "missing call: $expected"
    fi
}

# Load only the functions under test. Sourcing install.sh would execute main.
eval "$(extract_function install_github_cli)"

log_detail() { :; }
log_warn() { :; }
log_success() { :; }
command_exists() { return 0; }

record_call() {
    printf '%s\n' "$*" >&3
}

acfs_curl() {
    record_call "acfs_curl $*"
    printf 'test-keyring'
}

mkdir() {
    record_call "mkdir $*"
}

dd() {
    record_call "dd $*"
    command cat >/dev/null
}

chmod() {
    record_call "chmod $*"
}

dpkg() {
    record_call "dpkg $*"
    printf 'amd64\n'
}

tee() {
    record_call "tee $*"
    command cat >/dev/null
}

apt-get() {
    record_call "apt-get $*"
}

apt-cache() {
    record_call "apt-cache $*"
    printf '  2.96.0 500\n        500 https://cli.github.com/packages stable/main amd64 Packages\n'
}

gh() {
    record_call "gh $*"
    printf 'gh version 2.96.0\n'
}

SUDO=""
calls="$(install_github_cli 3>&1)"

assert_call "$calls" \
    "acfs_curl https://cli.github.com/packages/githubcli-archive-keyring.gpg" \
    "official GitHub CLI signing key is fetched"
assert_call "$calls" \
    "tee /etc/apt/sources.list.d/github-cli.list" \
    "official GitHub CLI apt source is configured"
assert_call "$calls" \
    "apt-get update -y" \
    "apt metadata is refreshed after source configuration"
assert_call "$calls" \
    "apt-get install -y gh" \
    "gh is installed or upgraded after the official source is configured"
assert_call "$calls" \
    "apt-cache policy gh" \
    "installed package origin is verified"

cli_tools_body="$(extract_function install_cli_tools)"
if grep -q 'if command_exists gh' <<<"$cli_tools_body"; then
    fail "existing gh installations are upgraded" "install_cli_tools still skips install_github_cli"
else
    pass "existing gh installations are upgraded"
fi

if grep -q 'install_github_cli' <<<"$cli_tools_body"; then
    pass "CLI phase always routes through install_github_cli"
else
    fail "CLI phase always routes through install_github_cli" "installer call is absent"
fi

echo
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
[[ "$TESTS_FAILED" -eq 0 ]]

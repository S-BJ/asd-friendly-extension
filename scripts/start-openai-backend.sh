#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
server_root="$repo_root/server"
server_entry="$server_root/index.mjs"
config_dir="${ASD_FRIENDLY_CONFIG_DIR:-$HOME/.asd-friendly-extension}"
config_path="$config_dir/server.env.local"
fallback_config_path="$server_root/.env.local"
example_config_path="$server_root/.env.local.example"

if [ ! -f "$server_entry" ]; then
  echo "Server entry was not found: $server_entry" >&2
  exit 1
fi

get_env_from_file() {
  local file="$1"
  local key="$2"
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    local trimmed="${line#"${line%%[![:space:]]*}"}"
    trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"
    case "$trimmed" in
      ''|'#'*) continue ;;
    esac
    local cur_key="${trimmed%%=*}"
    cur_key="${cur_key%"${cur_key##*[![:space:]]}"}"
    if [ "$cur_key" = "$key" ]; then
      local value="${trimmed#*=}"
      value="${value#"${value%%[![:space:]]*}"}"
      value="${value%"${value##*[![:space:]]}"}"
      value="${value%\'}"; value="${value#\'}"
      value="${value%\"}"; value="${value#\"}"
      printf '%s\n' "$value"
      return 0
    fi
  done < "$file"
}

configured_key="${OPENAI_API_KEY:-}"
if [ -z "$configured_key" ]; then
  configured_key="$(get_env_from_file "$config_path" OPENAI_API_KEY || true)"
fi
if [ -z "$configured_key" ]; then
  configured_key="$(get_env_from_file "$fallback_config_path" OPENAI_API_KEY || true)"
fi

if [ -z "$configured_key" ] && [ -t 0 ]; then
  echo "OPENAI_API_KEY is not configured yet."
  echo "Enter it in this console to use it for this launch only."
  echo "Press Enter without typing anything to start without a key."
  # -s keeps the key off the screen.
  read -r -s -p "OpenAI API key: " entered_key || entered_key=""
  echo
  if [ -n "$entered_key" ]; then
    export OPENAI_API_KEY="$entered_key"
    echo "Using the entered API key for this backend launch."
  else
    echo "Starting the backend without an API key."
  fi
fi

cd "$server_root"
node "$server_entry" &
server_pid=$!

echo "Started the local OpenAI backend (pid $server_pid)."
echo "Server root: $server_root"
echo "Preferred config: $config_path"
if [ -f "$fallback_config_path" ]; then
  echo "Fallback config still exists: $fallback_config_path"
elif [ ! -f "$config_path" ]; then
  echo "Config template: $example_config_path"
fi
echo "Health check: http://127.0.0.1:${PORT:-8787}/health"

wait "$server_pid"

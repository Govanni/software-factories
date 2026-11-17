#!/usr/bin/env bash
# launch-agents.sh: start Claude Code or GitHub Copilot CLI with its own config
# directory for this home repo, so your personal agent setup is not loaded.
#
#   Claude Code  -> ~/.claude-software-factory-<repo>   (via CLAUDE_CONFIG_DIR)
#   Copilot CLI  -> ~/.copilot-software-factory-<repo>  (via COPILOT_HOME)
#
# The first run asks which agent to use and remembers it in .launch-agents.local
# (git-ignored). Use --choose to pick again. Other arguments go to the agent.
#
#   ./launch-agents.sh
#   ./launch-agents.sh --choose
#   ./launch-agents.sh --continue      # passed to the agent
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)

# The home repo is the repo this script lives in. Resolve the main checkout, so
# a linked worktree shares the same config directory.
git_common_dir=$(git -C "$script_dir" rev-parse --git-common-dir)
git_common_dir=$(cd "$script_dir" && cd "$git_common_dir" && pwd -P)
if [ "$(basename "$git_common_dir")" = ".git" ]; then
  repo_name=$(basename "$(dirname "$git_common_dir")")
else
  repo_name=$(basename "$(git -C "$script_dir" rev-parse --show-toplevel)")
fi
repo_root=$(git -C "$script_dir" rev-parse --show-toplevel)

choice_file="$repo_root/.launch-agents.local"

choose_agent() {
  local answer
  while true; do
    echo "Which agent do you want to launch for $repo_name?" >&2
    echo "  1) Claude Code" >&2
    echo "  2) GitHub Copilot CLI" >&2
    read -r -p "Choice [1/2]: " answer
    case "$answer" in
      1 | claude) echo claude; return ;;
      2 | copilot) echo copilot; return ;;
      *) echo "Please type 1 or 2." >&2 ;;
    esac
  done
}

agent=""
if [ "${1:-}" = "--choose" ]; then
  shift
elif [ -f "$choice_file" ]; then
  agent=$(tr -d '[:space:]' < "$choice_file")
fi

case "$agent" in
  claude | copilot) ;;
  *)
    agent=$(choose_agent)
    echo "$agent" > "$choice_file"
    echo "Saved '$agent' to $choice_file (run with --choose to change it)." >&2
    ;;
esac

if ! command -v "$agent" > /dev/null 2>&1; then
  echo "launch-agents: '$agent' is not installed or not on your PATH." >&2
  exit 1
fi

config_dir="$HOME/.$agent-software-factory-$repo_name"
mkdir -p "$config_dir"

cd "$repo_root"
case "$agent" in
  claude)
    export CLAUDE_CONFIG_DIR="$config_dir"
    exec claude "$@"
    ;;
  copilot)
    export COPILOT_HOME="$config_dir"
    exec copilot "$@"
    ;;
esac

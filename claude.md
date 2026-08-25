## File Reading Rules

* Always use the built-in `Read` tool when inspecting source files.
* Do NOT use Bash commands such as `cat`, `sed`, `head`, `tail`, or similar commands to read source files.
* Use `Read` with the appropriate line range when only part of a file is needed.
* Use `Grep` for searching for text or symbols.
* Use `Glob` for finding files.
* Use Bash only when a shell command is actually required for execution, testing, building, installing, or other terminal operations.
* Before modifying a file, use `Read` to inspect the relevant existing code.
* Prefer direct file tools over shell commands for file inspection.

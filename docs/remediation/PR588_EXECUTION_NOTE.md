# Execution note

PR #588 is independent of PR #586 and targets `main`. Its purpose is to restore the repository lint baseline so feature PRs such as #586 can be evaluated without unrelated lint failures. After this PR and the independent dependency-security remediation are merged, stacked feature branches should be rebased rather than having baseline debt copied into them.

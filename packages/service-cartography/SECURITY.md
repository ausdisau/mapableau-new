# Security policy

This is a reference library, not a hosted production service. No production
version is supported for live participant, health or funding data.

Please report security issues privately to the authorised maintainers of the
repository where this code is published (for example, using GitHub private
vulnerability reporting if enabled). Do not publish exploit details or personal
information in public issues.

Maintain a strict trust boundary: callers must authenticate users, enforce tenant
isolation, verify the source of evidence and grants, and store audit events in a
secure service. This package does **not** provide those controls.

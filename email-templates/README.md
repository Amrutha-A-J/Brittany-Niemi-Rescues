# Brevo email templates

Paste each file into Brevo (Transactional → Templates → New template → "Paste your code"),
set the subject below, save and activate it, then put its id in `TEMPLATES` in `src/lib/email.ts`.
The sender and reply-to are set by the site, so whatever the template says there is ignored.

| File | Subject | `TEMPLATES` key |
|---|---|---|
| 1-application-received.html | `Thanks for your {{ params.type }} application!` | `applicationReceived` |
| 2-new-application.html | `New {{ params.type }} application from {{ params.applicant_name }}` | `newApplication` |
| 3-meet-and-greet-invite.html | `Your meet & greet with {{ params.who }}: {{ params.when }}` | `meetInvite` |
| 4-meet-and-greet-booked.html | `Meet & greet booked: {{ params.applicant_name }}, {{ params.when }}` | `meetBooked` |

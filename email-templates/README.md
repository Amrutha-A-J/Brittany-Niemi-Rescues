# Brevo email templates

Paste each file into Brevo (Transactional → Templates → New template → "Paste your code"),
set the subject below, save and activate it, then put its id in `TEMPLATES` in `src/lib/email.ts`.
The sender and reply-to are set by the site, so whatever the template says there is ignored.

| File | Subject | `TEMPLATES` key (id) |
|---|---|---|
| 1-application-received.html | `Thanks for your {{ params.type }} application!` | `applicationReceived` (2) |
| 2-new-application.html | `New {{ params.type }} application from {{ params.applicant_name }}` | `newApplication` (3) |
| 3-meet-and-greet-invite.html | `Your meet & greet with {{ params.who }}: {{ params.when }}` | `meetInvite` (4) |
| 4-meet-and-greet-booked.html | `Meet & greet booked: {{ params.applicant_name }}, {{ params.when }}` | `meetBooked` (5) |

Meet & greet templates also get `google_map_url` and `apple_map_url` (both point at the saved pin) for a
"Directions: Google Maps · Apple Maps" line under the place. And
`apple_calendar_url` for an "Add to Apple Calendar" button (next to the Google and Outlook ones).
The usual place and map link are set in Admin → Account.

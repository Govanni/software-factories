# Cadence

Cadence is a course platform where instructors publish courses and students enroll, learn, and discuss lessons.

## Language

### Notifications

**Notification**:
A message addressed to one Recipient about something that happened in Cadence, shown in their Inbox.
_Avoid_: Alert, message, activity

**Recipient**:
The user a Notification is addressed to. Any role (student, instructor, admin) can be a Recipient.
_Avoid_: Subscriber, target

**Trigger**:
An event in Cadence that causes one or more Notifications to be sent.
_Avoid_: Notification event, hook

**Actor**:
The user whose action fired a Trigger. An Actor is never a Recipient of that Trigger's Notification.
_Avoid_: Sender, source, author

**Inbox**:
The in-app feed where a Recipient sees their Notifications and their read state.
_Avoid_: Feed, notification center, bell

**Notification Provider**:
The third-party service that stores, tracks, and delivers Notifications to Inboxes on Cadence's behalf.
_Avoid_: Notification service, vendor

### Discussion

**Question**:
A top-level comment a user posts on a lesson.
_Avoid_: Thread, post

**Reply**:
A comment that answers a Question. Replies are one level deep: a Reply never answers another Reply.
_Avoid_: Answer, response

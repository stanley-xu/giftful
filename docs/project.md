# Project

## This Week's Focus

Given it's Sunday night, here's what I suggest:

This Week (Mon-Fri):

- Monday: Finish onboarding form (Issue #1) - 2 hours
- Tuesday: REST or light styling
- Wednesday: Test protected routes (Issue #2) - 1.5 hours
- Thursday: Start wishlist UI basics - 2 hours
- Friday: REST

This Weekend:

- Saturday AM: Complete wishlist CRUD - 4 hours
- Sunday: Testing, bug fixes, prep for Week 2 - 2 hours

By next Sunday: Working onboarding + wishlist. That's 50% of your MVP.

---

Final Pep Talk 🎯

You've got this. You're already ahead of 99% of developers who think about building side projects but never start.

- You picked a scoped project (Secret Santa, not Facebook)
- You have modern tools (Expo, Supabase, Claude Code)
- You're being strategic (GitHub Project, clear milestones)
- You're asking for help (this conversation)

The app doesn't need to be perfect. It needs to work well enough for your friends to have a Secret Santa exchange. That's it.

Every hour you put in is progress. Some nights you'll crush it. Some nights you'll barely touch it. Both are fine.

Now go finish that onboarding form. Issue #1 is waiting, and it's a small, completable win you can knock out tomorrow night.

You've got 30 productive hours ahead of you. Make them count. 💪

---

## 📋 Task Tracking

**All tasks are now tracked in GitHub!**

- **GitHub Project Board**: [Giftful Project](https://github.com/users/stanley-xu/projects/2)
- **Issues**: [giftful/issues](https://github.com/stanley-xu/giftful/issues)

## Rescoping the project

- TestFlight and not App Store
- iOS focus (cut Android/web for MVP)
- No event management
- [Bonus] secret santas can be created and users invited via: email, SMS
- Critical features to focus on
  - Wishlist management
    - CRUD on items ✅
    - Pinning ✅
    - Drag to reorder
  - Sharing of a profile ✅
    - Secret santa participants can see their match's profile
    - [Bonus] basic follower functionality so 2 people can see each other's wishlist
      - [Very bonus] notifications the wishlists you're following are updated

---

## TestFlight Deployment Checklist

**Prerequisites:**

- [x] Apple Developer account active ($99/year, 24-48hr activation)
- [x] Bundle ID decided: `io.giftful`

**Setup (one-time):**

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Configure EAS: `eas build:configure` (creates eas.json)
- [ ] Login to Expo: `eas login`
- [ ] Configure iOS bundle ID in app.json

**Build & Deploy:**

- [ ] Create iOS production build: `eas build --platform ios --profile production`
- [ ] Submit to TestFlight: `eas submit --platform ios`
- [ ] Add testers in App Store Connect
- [ ] Send invites via email or public link

---

## Ideas

Unsorted.

- Assets ✅
  - Icon ✅
  - Splash ✅
- Mark as purchased
  - Only available for user profile route
- Experiment: Support large title
  - No title for me to try an center (to fix my OCD) > Enables me to use more header buttons with wrapper pattern
  - Some default collapsibility
  - Breaks bottom button (now it flickers when large header collapses) - probably some height calc?
- Android support
- Web support
- Multiple header buttons (SwiftUI)

### Superpowered add-to-list flow

- Unified add to list form
  - Single text field with paste button > paste from clipboard
  - Modal should be half-height sheet
  - Text content is _automatically parsed_ into required wishlist data (name and URL if text is a URL)
    - Use cases enabled:
      - Adding **abstract gifts** (entering a short note, instead of name / link)
      - Adding **links quickly** (URL saved; attempt made at parsing name from URL)
- Contextual menu quick-paste:
  1. Tap-to-hold on profile page button reveals paste button
  2. Finger on paste button > finger up > paste from clipboard

### Notification drawer

- Wishlists you follow will appear as a notification in a page
- Page has drawer UX, revealed from an activator somewhere
- Push notifications

### Mutex for mark as purchased

- Needed for high write contention on lists (e.g. wedding registries)

### Updates to screens

### Profile 2.0

- Still collapsible
- Move wishlist section out to make room... for new content

I want to expand on what a user's profile can do:

- I think it can _summarize_ what a user is into lately (e.g. movie / book genres, types of clothing, etc.)
- This can be LLM-powered
  - Though this will require a way to collect data about a user's preferences...
- More basic MVP: take the wishlist content and summarize that
  - Removes the need for data acquisition

This gives gifters a compass that guides them to **getting better gifts to giftees**

Giftful

- Some content section that summarzies "your wishes" in an easy-to-understand way
  - e.g. display some emojis that represent the wishes

Notes

- Consider other ways to **"give better gifts"**
  - UI hint at leaving notes to followers in the Bio section
- Can this help with ALL types of gifts?
  - Consumables
  - Objects
  - Experiences

### Facilitate custom gift exchanges

Custom rules can be created by organizers

Here's what the MKBHD studio did

1. Everyone is assigned a dollar value
2. They must buy a gift that is EDC / tech - themed within the budget
3. Randomly assign each dollar value gift to a participant

Giftful

- Allow multiple types of gift exchanges
- Presets: secret santa, white elephant
- Custom:
  - Define by: name, description, rules, participants, assignments
- (Bonus) can we allow organizers to _crowd-source_ these exchanges?
  - It could look like an "app store", but you can browse custom gift exchanges

Notes

- Rethink how the app can actually help facilitate these exchanges
- For (probably every exchange), you'll need to administrate it by managing: participants, assignments, event dates, and content
  - We can **minimize this friction**
- For very specific rules (e.g. white elephant), can the app do anything there? "No" is okay.

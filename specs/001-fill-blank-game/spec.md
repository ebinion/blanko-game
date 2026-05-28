# Feature Specification: Fill-in-the-Blank Language Practice Game

**Feature Branch**: `001-fill-blank-game`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Foreign language learners need a variety of ways to practice their target language. To help reinforce spelling and recall, we are creating a fill-in the blank game that allows people to practice with text they provide, paste in text in their target language, and gives them the opportunity to fill-in the blank. Afterwards they are given a score and list of the words they answered incorrectly with the correct spellings."

## Clarifications

### Session 2026-05-28

- Q: How should the system define a "word" when scanning the pasted passage to pick blank candidates? → A: Unicode-aware default — standard Unicode word breaks; letters and combining marks form a word; contractions like "don't" and hyphenated compounds like "well-known" stay as one token; CJK uses one character per token.
- Q: What management actions and limits should v1 give the learner over their saved sessions? → A: Cap + delete + auto-label. Sessions are auto-labeled from passage text and date; the learner can delete any session manually; a hard cap (default 20) evicts the oldest completed session when exceeded; in-progress sessions are never auto-evicted.
- Q: How should the system handle passages longer than one round can comfortably accommodate? → A: Cap blanks per round. The full passage stays visible as context, but only a bounded number of words actually become blanks. The cap may scale with difficulty, and blank positions are spread across the entire passage rather than concentrated at the start.
- Q: What accessibility baseline should v1 commit to? → A: WCAG 2.1 Level AA, plus keyboard-complete navigation and screen-reader-readable score and review list. Every blank is reachable by keyboard with reading-order focus; the score and incorrect-word list are announced; color/contrast meets AA.
- Q: What is v1's privacy stance on the pasted text and on usage telemetry? → A: Fully offline. After the initial load of the application's assets, nothing leaves the device — no passage content, no answers, no telemetry, no analytics, no crash/error reporting. The app should also continue to work without a network connection once loaded.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Practice spelling and recall using my own text (Priority: P1)

A foreign language learner pastes a passage of text in their target language, picks a difficulty level, and starts the round. The system removes selected words and presents the passage with blanks. The learner types the missing word into each blank. When they finish, they see how many they got right and which ones they missed, along with the correct spellings.

**Why this priority**: This is the entire core loop of the product. Without it there is no game and no value delivered. Every other story builds on top of this one.

**Independent Test**: Open the app, paste a passage in any language, choose a difficulty, complete the resulting fill-in-the-blank exercise, and confirm the system returns a score and a list of misspelled words paired with their correct spellings. This alone constitutes a usable MVP.

**Acceptance Scenarios**:

1. **Given** the learner is on the start screen, **When** they paste a passage of text, choose a difficulty, and start the exercise, **Then** the system displays that passage with a subset of words replaced by empty input fields appropriate to that difficulty.
2. **Given** an exercise is in progress with blanks shown, **When** the learner types an answer into each blank and submits, **Then** the system evaluates every answer and shows a results screen.
3. **Given** the results screen is shown, **When** the learner reviews it, **Then** they see (a) a score reflecting how many blanks they answered correctly and (b) a list of every blank they got wrong with the correct spelling beside their answer.
4. **Given** a passage too short to produce any blank at the chosen difficulty (e.g., a single word, or no words long enough at "hard"), **When** the learner attempts to start the exercise, **Then** the system explains why the text cannot be used at that difficulty and lets them paste different text or pick a different difficulty.

---

### User Story 2 - Choose a difficulty level before each round (Priority: P1)

Before starting, the learner picks a difficulty level (e.g., Easy / Medium / Hard). Higher difficulty produces more blanks and biases blank selection toward longer, less-predictable words. Lower difficulty produces fewer blanks and favors shorter, more-predictable words, so beginners aren't overwhelmed.

**Why this priority**: This is required for the product to feel like practice rather than punishment. The same passage should be usable by a complete beginner and an advanced learner. It is part of the core game configuration and gates Story 1, so it shares P1.

**Independent Test**: Paste the same passage twice — once at Easy and once at Hard — and confirm that (a) Hard produces more blanks than Easy and (b) the words blanked at Hard skew noticeably longer than the words blanked at Easy.

**Acceptance Scenarios**:

1. **Given** the learner is on the start screen with text pasted, **When** they choose a difficulty, **Then** that choice persists for the round being configured and is remembered as the default for the next round.
2. **Given** the learner picks "Easy" for a given passage, **When** the exercise is generated, **Then** noticeably fewer words are blanked than at "Hard" for the same passage, and the blanked words tend to be shorter.
3. **Given** the learner picks "Hard" for a given passage, **When** the exercise is generated, **Then** noticeably more words are blanked than at "Easy", and the blanked words tend to be longer.
4. **Given** the chosen difficulty would yield zero blanks on the provided passage (e.g., Hard on a passage of only short words), **When** the learner tries to start, **Then** the system tells them no eligible words were found at that difficulty and offers to lower it.

---

### User Story 3 - Review my mistakes after the round (Priority: P2)

After completing a round, the learner sees each word they got wrong shown alongside the correct spelling so they can compare letter by letter. This turns a passive score into a learning moment.

**Why this priority**: The score by itself tells the learner _how well_ they did, but the misspelled-word review is what actually helps them improve. It is part of the original feature description and tightly coupled to Story 1, but conceptually it is a separable presentation concern that can be iterated on independently (e.g., highlighting differing letters later).

**Independent Test**: Complete a round in which at least one answer is wrong, then verify the results screen lists each incorrect answer next to its correct spelling, in a form the learner can read and compare without scrolling past unrelated information.

**Acceptance Scenarios**:

1. **Given** the learner has just completed a round with one or more incorrect answers, **When** they view the results screen, **Then** every incorrect blank is shown with both their typed answer and the correct word.
2. **Given** the learner answered every blank correctly, **When** they view the results screen, **Then** the system shows the perfect score and indicates there is nothing to review.
3. **Given** the learner left one or more blanks empty, **When** the round is scored, **Then** those blanks are treated as incorrect and appear in the review list with the correct spelling.
4. **Given** the learner typed the right letters but in the wrong case (e.g., "paris" instead of "Paris"), **When** the round is scored, **Then** the answer is counted as correct.
5. **Given** the learner typed the right letters but omitted required accent marks (e.g., "ecole" instead of "école"), **When** the round is scored, **Then** the answer is counted as incorrect and appears in the review list with the correctly-accented spelling.

---

### User Story 4 - Pick up where I left off across browser visits (Priority: P2)

The learner can come back to the app later — same browser, same device — and find their recent practice sessions still there: an in-progress round can be resumed, and completed rounds can be reopened to review the score and misspelled words. No login required.

**Why this priority**: Practice tools live and die on whether the learner comes back. Persisting sessions locally turns the app from a one-shot toy into something a learner can dip into across days. It is not strictly required for the first usable demo (Story 1 still works without it), so it lands at P2 alongside review.

**Independent Test**: Start a round, close the tab mid-round, reopen the app in the same browser, and confirm the in-progress round is restored exactly as it was. Then complete it, close the tab again, reopen, and confirm the completed round is still accessible for review.

**Acceptance Scenarios**:

1. **Given** the learner has a round in progress, **When** they close the tab and reopen the app in the same browser, **Then** the in-progress round is restored with the same text, blanks, difficulty, and any answers already typed.
2. **Given** the learner has finished one or more rounds previously, **When** they open the app, **Then** they can see and reopen those past sessions and view their score and review list.
3. **Given** the learner opens the app in a different browser or on a different device, **When** they look for prior sessions, **Then** none are shown, because session storage is local to one browser.
4. **Given** the learner explicitly clears their browser's site data, **When** they reopen the app, **Then** prior sessions are gone and the app starts fresh; the system does not promise recovery.
5. **Given** the learner has saved sessions, **When** they view the session list, **Then** each session shows an auto-generated label (passage snippet + date) and a way to delete it.
6. **Given** the saved-session count is already at the cap and at least one session is completed, **When** the learner starts a new round, **Then** the oldest completed session is evicted automatically and the new round is created.
7. **Given** the saved-session count is at the cap and all sessions are in-progress, **When** the learner attempts to start a new round, **Then** the system blocks the new round and tells the learner to finish or delete an existing session first.

---

### User Story 5 - Start a fresh round with different text (Priority: P3)

After seeing their results, the learner can return to the start screen and paste a new passage to practice with, without affecting their saved past sessions.

**Why this priority**: Encourages repeated practice. Not strictly required for an MVP, but a smooth restart materially improves the practice experience and pairs naturally with persistence (Story 4).

**Independent Test**: From the results screen, choose to start over, paste different text, and confirm a new exercise begins cleanly. Then confirm the prior session is still available for review separately.

**Acceptance Scenarios**:

1. **Given** the learner is viewing their results, **When** they choose to start a new round, **Then** the system returns to the start screen with no prior text, answers, or score pre-filled.
2. **Given** the learner has started a new round, **When** they complete it, **Then** the score and review list reflect only the new round's answers, and the prior round is still listed among saved sessions.

---

### Edge Cases

- **Very long text**: Learner pastes a multi-page passage. The full passage is shown as context, but the number of blanks is capped per round (FR-025) and the chosen positions are spread across the whole passage (FR-026) so the learner is never confronted with hundreds of inputs at once.
- **Text with no recognizable words**: Learner pastes only punctuation, numbers, or whitespace. The system should refuse to start and explain what kind of input it needs.
- **Repeated words**: A target word appears multiple times in the passage. Each occurrence is evaluated independently against what the learner typed in that specific blank.
- **Case differences**: Learner types the right letters in a different case. The answer is accepted (see FR-019).
- **Missing or wrong accents**: Learner types the right base letters but omits or alters required diacritical marks. The answer is rejected and the correctly-accented form is shown in the review list (see FR-019).
- **Mid-round abandonment**: Learner closes the tab before submitting. The in-progress round is preserved locally and restored on next visit (see Story 4).
- **Non-Latin scripts**: Learner pastes text in a script (e.g., Cyrillic, Greek, Chinese, Arabic). The system handles the input as-is and does not assume Latin characters.
- **Local storage full or disabled**: Browser storage is unavailable or full. The current round still plays through to results in memory, but the system tells the learner that sessions won't be saved.
- **Difficulty with no eligible words**: Learner picks Hard but their passage has no long words. The system explains the mismatch and offers to lower the difficulty.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST let the learner provide a passage of text in any language by pasting it into a single input area on the start screen.
- **FR-002**: The system MUST let the learner pick a difficulty level (at minimum: Easy, Medium, Hard) before each round starts.
- **FR-003**: The system MUST generate a fill-in-the-blank exercise by replacing a subset of the words in the provided passage with empty input fields, leaving the rest of the passage visible for context.
- **FR-004**: The number of blanks the system creates MUST increase with the chosen difficulty: Easy produces the fewest blanks, Hard the most, for the same passage.
- **FR-005**: The system MUST bias blank selection toward longer words at higher difficulty levels, so that Hard rounds focus on longer, less-predictable words and Easy rounds favor shorter, more-predictable ones.
- **FR-006**: The system MUST display the exercise with all non-blanked text preserved exactly as the learner provided it, so the surrounding context can be used as a cue.
- **FR-007**: The learner MUST be able to type an answer into each blank independently and move between blanks before submitting.
- **FR-008**: The system MUST provide a way for the learner to submit all their answers and end the round.
- **FR-009**: Upon submission, the system MUST evaluate each blank by comparing the learner's typed answer to the original word that was removed from that position.
- **FR-010**: The system MUST display a score on the results screen that reflects the number (and/or proportion) of blanks answered correctly out of the total number of blanks.
- **FR-011**: The system MUST display, on the results screen, a list of every blank the learner answered incorrectly, showing both the learner's answer and the correct spelling for that blank.
- **FR-012**: The system MUST treat an empty or whitespace-only answer as incorrect and include it in the review list with the correct spelling.
- **FR-013**: The system MUST reject input that cannot produce a meaningful exercise at the chosen difficulty (e.g., no eligible words, empty input) and explain to the learner what to provide or change, without losing what they pasted.
- **FR-014**: The learner MUST be able to start a new round after viewing results, with all prior text, blanks, answers, and live score cleared from the start screen — without erasing previously saved sessions.
- **FR-015**: The system MUST persist practice sessions (both in-progress and completed) in the learner's browser on the same device, so the learner can close the tab and return later to resume or review.
- **FR-016**: The system MUST support multiple distinct practice sessions in the same browser — each with its own text, difficulty, blanks, answers, and (if finished) score and review list.
- **FR-017**: The system MUST be transparent that saved sessions are local to one browser on one device and are not synced across devices or browsers; if local storage is unavailable, the system MUST tell the learner that sessions won't be saved.
- **FR-018**: The system MUST work for text in any human language the learner provides, including languages using non-Latin scripts and diacritical marks.
- **FR-019**: When evaluating an answer against the original word, the system MUST compare them case-insensitively (so "paris" matches "Paris") but accent-sensitively (so "ecole" does NOT match "école"). This rule applies uniformly across all languages and scripts.
- **FR-020**: Before discarding text or scores from a round, the system MUST ensure the round has been saved as a session that the learner can return to later (in-progress sessions for resumption, completed sessions for review).
- **FR-021**: The system MUST identify blank candidates using standard Unicode word-break rules: letters and combining marks form a word; whitespace and punctuation are breaks; contractions (e.g., "don't") and hyphenated compounds (e.g., "well-known") are treated as a single token; for scripts without inter-word whitespace (CJK), each character is treated as one token.
- **FR-022**: The system MUST auto-label every saved session with a human-readable identifier derived from the passage (e.g., the first few words) plus the date the session was started, so the learner can distinguish sessions in the list without naming them manually.
- **FR-023**: The learner MUST be able to delete any saved session — whether in-progress or completed — from the session list, and the deletion MUST be permanent for that browser.
- **FR-024**: The system MUST enforce a hard cap on saved sessions (default: 20). When adding a new session would exceed the cap, the system MUST auto-evict the oldest _completed_ session to make room. In-progress sessions MUST NOT be auto-evicted; if the cap is reached with no completed sessions available to evict, the system MUST inform the learner and require them to finish or delete an existing session before starting a new one.
- **FR-025**: The system MUST cap the number of blanks generated per round so that the exercise and its results list remain usable on a single screen (including on a phone). The cap MAY scale with difficulty (Easy = fewer, Hard = more), and the full passage MUST remain visible as context regardless of how many words are turned into blanks.
- **FR-026**: When a passage is long enough that the cap on blanks per round (FR-025) applies, the system MUST distribute the chosen blank positions across the entire passage rather than concentrating them at the start, so the learner exercises the whole text.
- **FR-027**: The product MUST conform to WCAG 2.1 Level AA across the screens in the round flow (start, exercise, results, session list), including color-contrast minimums and non-color cues for state (e.g., correct/incorrect not signaled by color alone).
- **FR-028**: Every interactive element — pasting text, picking difficulty, every blank input, submission, navigating between blanks, opening/deleting a saved session — MUST be reachable and operable using a keyboard alone, with focus order matching the reading order of the passage.
- **FR-029**: When the results screen appears, the score and the list of incorrect-answer / correct-spelling pairs MUST be exposed to assistive technologies (e.g., via appropriate landmarks/live-region semantics) so a screen-reader user is informed of the outcome and can navigate the review list without sight.
- **FR-030**: After the initial load of the application's assets, the product MUST NOT transmit any data to any server or third party. Pasted passages, learner answers, scores, session metadata, error/crash details, and usage telemetry MUST all remain on the learner's device.
- **FR-031**: The product MUST NOT integrate third-party analytics, telemetry, crash-reporting, advertising, or tracking services in v1.
- **FR-032**: After the application's assets have been loaded once, the product MUST continue to function (start a new round, play, score, view past sessions) without a network connection.

### Key Entities _(include if feature involves data)_

- **Practice Text**: The passage the learner pasted. Holds the original text exactly as provided and the language/script context. Belongs to a single Session.
- **Difficulty Level**: The configured difficulty for a Session (Easy / Medium / Hard). Determines blank density and the bias toward longer words.
- **Blank**: A single position in the practice text where a word has been removed. Holds the original (correct) word and the position/context, paired during the round with the learner's typed answer.
- **Session (Round)**: A single play-through. Holds the practice text, the chosen difficulty, the set of blanks, the learner's answers so far, and — once submitted — the score and review list. Persisted locally in the browser; multiple sessions can coexist.
- **Result**: The outcome of a completed Session. Holds the score and the list of incorrect-answer / correct-spelling pairs to display on the results screen.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A first-time learner can paste text, pick a difficulty, and reach the fill-in-the-blank exercise in under 30 seconds, without instructions.
- **SC-002**: A learner who completes a round always receives a score and (if any answers were wrong) a review list — i.e., the round never ends in an unscored or undefined state.
- **SC-003**: For passages of up to roughly 500 words, the exercise can be generated and displayed without a perceptible wait (under ~2 seconds on a typical laptop or phone), at any difficulty level.
- **SC-004**: At least 80% of learners who finish one round start a second round in the same browser (whether in the same sitting or a later visit), indicating the loop is short and rewarding enough to repeat.
- **SC-005**: Learners can identify which letters they got wrong from the review list without external tools (i.e., the comparison between their answer and the correct spelling is legible at a glance).
- **SC-006**: The product works for at least the major writing systems learners are likely to bring (Latin with diacritics, Cyrillic, Greek, CJK, Arabic, etc.) — verified by completing a round in each.
- **SC-007**: For the same passage, Hard produces meaningfully more blanks than Easy (target: at least 2x as many), and the average length of blanked words is noticeably greater at Hard than at Easy (target: at least 2 characters longer on average).
- **SC-008**: A learner who closes the tab mid-round and reopens it in the same browser within the next 7 days finds their in-progress round restored in at least 95% of cases (failures attributable only to the browser clearing site data).
- **SC-009**: The round flow (start → exercise → results → session list) passes an accessibility audit covering both automated checks (no critical/serious violations) and a manual screen-reader and keyboard-only pass against WCAG 2.1 AA before launch.

## Assumptions

- **Bring-your-own text**: The product does not need to provide a built-in library of passages in v1. The learner is responsible for sourcing text in their target language.
- **Difficulty levels**: Three levels (Easy / Medium / Hard) are sufficient for v1. Finer-grained controls (custom blank percentage, exclude/force-include specific words) are out of scope.
- **What "longer words" means**: At Hard, the system favors words above some character-length threshold; at Easy, it favors words at or below that threshold. The exact threshold is a tuning detail to be decided during implementation, not a spec-level decision.
- **No accounts, no server-side sync**: There is no user account, no login, and no server-side history. Persistence is entirely local to the browser. Two browsers, two profiles, or two devices = two independent worlds of sessions.
- **Local persistence layer**: The product uses the browser's built-in local storage capabilities. If those are unavailable (private mode in some browsers, storage quotas exhausted, user has disabled site data), the current round still plays through in memory and the learner is informed that nothing will be saved.
- **Punctuation is not blanked**: Only words (as defined by FR-021's Unicode word-break rules) are candidates for blanking. Punctuation, numbers, and whitespace stay visible as context regardless of difficulty.
- **Matching rule is uniform**: The case-insensitive / accent-sensitive rule (FR-019) applies the same way for every language. The product does not try to special-case, e.g., German ß ↔ ss or other language-specific spelling equivalences in v1.
- **Web-first delivery**: The product is delivered as a web experience that runs in a modern browser on desktop and mobile. Native apps are out of scope for v1.
- **Fully offline after first load**: The app may need a network connection to fetch its initial assets, but no learner content, answers, or telemetry leaves the device thereafter (FR-030, FR-031), and the app keeps working without a network connection once loaded (FR-032). The specific mechanism for offline asset availability is a planning concern, not a spec one.

# Custom AI Voice & Style — Execution Plan

This plan integrates the **Custom AI Voice & Style** feature into Engagematic without breaking existing flows. Implementation order is chosen to minimize risk and allow incremental testing.

---

## 1. Current State Summary

| Area | Location | Notes |
|------|----------|------|
| **Onboarding** | `spark-linkedin-ai-main/src/components/OnboardingModal.tsx` | 3 steps: Profile (1), AI Persona (2), Preferences (3). Uses `api.updateProfile()` → `PUT /api/auth/profile`. |
| **Profile update (dashboard)** | `spark-linkedin-ai-main/src/pages/UserProfile.tsx` | Calls `api.request("/profile/update", { method: "PUT", body })` → `PUT /api/profile/update` in `backend/routes/profile.js`. Sends `profile: { jobTitle, company, bio }`. |
| **Auth profile API** | `backend/routes/auth.js` | `PUT /profile` — explicitly lists allowed `profile` fields; **no aiVoice yet**. |
| **Profile update API** | `backend/routes/profile.js` | `PUT /update` — uses `$set` on `updates`; passing `profile: { aiVoice }` would **overwrite** entire `profile`. Must merge nested `profile` (e.g. dot notation) so only `profile.aiVoice` is set. |
| **User model** | `backend/models/User.js` | `profile` has: jobTitle, company, industry, experience, linkedinUrl, onboardingCompleted, postFormatting, usageContext, workContext. **Add `profile.aiVoice`.** |
| **Post generation** | `backend/routes/content.js` | Loads user, builds `userProfile` (jobTitle, company, industry, etc.), calls `googleAIService.generatePost(topic, hook, persona, ..., userProfile, postFormatting, trainingPosts)`. **Pass `user.profile?.aiVoice` into generation.** |
| **Prompt building** | `backend/services/googleAI.js` | `buildPostPrompt(topic, hook, persona, ..., userProfile, postFormatting, trainingPosts)` and `buildCommentPrompt(postContent, persona, profileInsights, commentType)`. **Add optional aiVoice parameter and inject a “User’s preferred writing style” block when present.** |
| **Comment generation** | `backend/routes/content.js` | Calls `googleAIService.generateComment(safePostContent, persona, profileInsights, commentType)`. **Pass user’s aiVoice into comment prompt (new param or via options).** |

---

## 2. Data Model & API (Backend)

### 2.1 User model

- **File:** `backend/models/User.js`
- **Change:** Add optional `profile.aiVoice` (nested object):
  - `description` (String, max 500, default `""`)
  - `tone` (String, enum: `'formal' | 'neutral' | 'casual'`, default `'neutral'`)
  - `boldness` (String, enum: `'safe' | 'balanced' | 'bold'`, default `'balanced'`)
  - `emojiPreference` (String, enum: `'never' | 'sometimes' | 'often'`, default `'sometimes'`)
- **Backward compatibility:** All fields optional; no migration required.

### 2.2 Auth profile (onboarding)

- **File:** `backend/routes/auth.js`
- **Change:** In `PUT /profile`, when building `updateData.profile`, add handling for `profile.aiVoice`:
  - If `profile.aiVoice` is present and is an object, set `updateData.profile.aiVoice` with validated subfields (description trimmed/max 500, tone/boldness/emojiPreference from allowed enums).

### 2.3 Profile update (settings)

- **File:** `backend/routes/profile.js`
- **Change:** In `PUT /update`, stop setting `profile` as a single blob. When `updates.profile` is present, build dot-paths and `$set` only those keys (e.g. `profile.jobTitle`, `profile.company`, `profile.bio`, `profile.aiVoice`) so existing profile fields are not wiped. Validate `aiVoice` (description length, enum values) before setting.

### 2.4 GET profile / user

- Ensure `GET /api/auth/profile` (or wherever the app fetches the current user) returns `profile.aiVoice`. Usually the user document is already returned as-is; confirm and add to frontend types if needed.

---

## 3. Onboarding Wizard (Frontend)

- **File:** `spark-linkedin-ai-main/src/components/OnboardingModal.tsx`

### 3.1 Add step 4 (optional)

- **Steps array:** Add a fourth step, e.g. `{ id: 4, title: "Content voice", icon: Mic }` (or Pencil). Keep existing steps 1–3 unchanged.
- **Progress:** Progress calculation should use total step count (4) so the bar reflects the new step.
- **Navigation:** From step 3, “Next” goes to step 4 (instead of calling `handleSubmit`). On step 4, “Save & Continue” saves aiVoice and then completes onboarding; “Skip for now” only advances to completion (no save).

### 3.2 Step 4 content and state

- **Form state:** Add to existing `formData` (or a small separate state): `aiVoiceDescription`, `aiVoiceTone`, `aiVoiceBoldness`, `aiVoiceEmoji` with defaults (e.g. `""`, `"neutral"`, `"balanced"`, `"sometimes"`).
- **UI (match existing patterns):**
  - Title: “Set your content voice (optional)”
  - Short description: “Tell Engagematic how you want your AI to sound. You can change this anytime in Settings.”
  - Textarea: label “Describe your voice”, placeholder as in spec (e.g. “Direct, no fluff, slightly humorous…”), max length 500, value from `aiVoiceDescription`.
  - Three controls (same as Profile section below): Tone (Formal / Neutral / Casual), Boldness (Safe / Balanced / Bold), Emojis (Never / Sometimes / Often). Use existing Card/Input/Button components; prefer segmented controls or select/buttons consistent with step 2 (AI Persona).
  - Buttons: “Skip for now” (variant ghost/secondary), “Save & Continue” (primary). Skip → call `handleSubmit()` without setting any aiVoice (onboarding completes as today). Save & Continue → set `profile.aiVoice` from form, then call same `handleSubmit()` that also sets `onboardingCompleted: true` and persona/profile as today.

### 3.3 Submit behavior

- In `handleSubmit`:
  - If we are on step 4 and user chose “Save & Continue”, include `profile: { ...existingProfilePayload, aiVoice: { description, tone, boldness, emojiPreference } }` in the payload to `api.updateProfile(...)`. Existing logic already sends `profile` and `persona`; extend the profile object with `aiVoice` when the user saved voice.
  - If user skipped step 4, do not send `aiVoice` (backend leaves it undefined).
- **Error handling:** If the profile update fails (e.g. network), show a toast and optionally allow “Continue anyway” so onboarding is not blocked (per spec).

---

## 4. Profile / Settings — “AI Voice & Style” section (Frontend)

- **File:** `spark-linkedin-ai-main/src/pages/UserProfile.tsx`

### 4.1 Data and state

- **Initial state:** From `user?.profile?.aiVoice` (or from a dedicated GET if needed), initialize local state: `aiVoiceDescription`, `aiVoiceTone`, `aiVoiceBoldness`, `aiVoiceEmoji` with defaults when missing.
- **New tab or section:** Add a tab “AI Voice” (or a card under an existing “Profile” or “Personalization” tab) so it’s discoverable. Reuse existing Tabs + Card layout.

### 4.2 Section UI

- **Title:** “AI Voice & Style” (optional small icon, e.g. Mic/Pencil, if other sections use icons).
- **Description:** “This is how Engagematic will try to sound when it writes for you.” Plus a short line: “This affects LinkedIn posts, comments, and other AI-generated content.”
- **Fields:** Same as onboarding: one textarea (Describe your voice, max 500), three toggles (Tone, Boldness, Emojis) with same options.
- **Buttons:**
  - “Preview voice” — opens a small modal (or inline) with:
    - Input: “Post idea” (short text).
    - “Generate preview” (or “Preview”) — calls a new backend endpoint (see below) that returns a sample post using the current (saved or unsaved) aiVoice. Show the result in the modal. Use existing Button/Input/Dialog components.
  - “Save changes” — sends `profile: { aiVoice: { description, tone, boldness, emojiPreference } }` via existing `api.request("/profile/update", ...)`. Ensure backend merges so only `profile.aiVoice` is updated.

### 4.3 Preview endpoint (Backend)

- **New route:** e.g. `POST /api/content/posts/preview-voice` (auth required).
- **Body:** `{ postIdea: string }` (required, max length e.g. 200).
- **Logic:** Load user, get `user.profile?.aiVoice`. Build a minimal persona (e.g. name “Preview”, tone from aiVoice or “professional”). Call `googleAIService.generatePost(postIdea, hook, persona, null, null, null, "plain", [], { aiVoice: user.profile?.aiVoice })` or equivalent so that the prompt builder receives aiVoice and injects it. Return `{ success: true, data: { content: generatedText } }`. Do not save content to history and do not deduct from the main post quota (or use a separate “preview” quota if desired). If user has no aiVoice, still generate with defaults.

---

## 5. AI Generation Pipeline (Backend)

### 5.1 Pass aiVoice into generation

- **Files:** `backend/routes/content.js`
- **Post generation:** When building the payload for `googleAIService.generatePost(...)`, pass the user’s `aiVoice` (e.g. from `user.profile?.aiVoice`). Options:
  - Add an optional 10th parameter `aiVoice`, or
  - Add an `options` object (last param) that includes `aiVoice` and pass it through to the prompt builder.
- **Comment generation:** Similarly, pass `user.profile?.aiVoice` into `generateComment` (e.g. new optional parameter or options object). Ensure the comment route has access to the full user (it already fetches user for persona/subscription).

### 5.2 googleAI.js — buildPostPrompt

- **File:** `backend/services/googleAI.js`
- **Signature:** Add an optional parameter, e.g. `aiVoice = null`, to `buildPostPrompt` (and to `generatePost` so it’s forwarded).
- **Logic:** If `aiVoice` is present and has at least `description` or one of tone/boldness/emojiPreference, append a short block to the prompt (before or after the existing “USER PROFILE CONTEXT” / “AUTHENTICITY & VOICE RULES”):
  - “User’s preferred writing style: [description]”
  - “Tone: [formal/neutral/casual]”
  - “Boldness: [safe/balanced/bold]”
  - “Emoji usage: [never/sometimes/often]”
  - One line: “Match this style as closely as possible. If there is a conflict between generic defaults and these voice settings, prefer the user’s voice.”
- **Backward compatibility:** If `aiVoice` is undefined or empty, do not add this block; behavior stays as today.

### 5.3 googleAI.js — buildCommentPrompt

- **File:** `backend/services/googleAI.js`
- **Signature:** Add an optional parameter, e.g. `aiVoice = null`, to `buildCommentPrompt` (and to `generateComment`).
- **Logic:** Same as post: if `aiVoice` present, add a short “User’s preferred style” block (description + tone + boldness + emoji) and “prefer the user’s voice” instruction. Otherwise no change.

### 5.4 Other generators (optional)

- **Free post / ideas / hooks:** If any other route calls `generatePost` or builds prompts with user context, consider passing `aiVoice` there too when the request is authenticated and user has aiVoice. The spec focuses on “LinkedIn posts, comments, and other AI-generated content”; cover at least posts and comments first, then ideas/hooks if they use the same prompt builder.

---

## 6. Validation & Edge Cases

- **Description length:** Cap at 500 characters (backend and frontend). Reject or trim beyond that.
- **Enums:** Backend must accept only `formal|neutral|casual`, `safe|balanced|bold`, `never|sometimes|often`. Default in UI and backend when missing.
- **Onboarding save failure:** Show error toast; allow user to proceed to complete onboarding (e.g. “Continue anyway” or just “Next” again) so they are not stuck.
- **Profile fetch failure:** In UserProfile, if loading user fails, show empty defaults for AI Voice and allow saving (so they can set it once the request works).
- **Preview with no aiVoice:** Backend preview endpoint should still generate a post using default style when `aiVoice` is not set.

---

## 7. UI/UX Checklist

- Reuse existing components: `Card`, `Input`, `Textarea`, `Button`, `Label`, `Dialog`, `Tabs`.
- Match spacing, typography, and colors of existing onboarding step 2/3 and Profile tab.
- Copy: Use the exact strings from the spec for titles, descriptions, placeholders, and button labels (with minor tweaks if needed for consistency).
- No new analytics step IDs unless we explicitly need to track the new step; reuse existing step flow where possible.

---

## 8. Implementation Order (Recommended)

1. **Backend: User model + auth profile + profile update**  
   Add `profile.aiVoice`, handle it in auth `PUT /profile` and in profile `PUT /update` with merge-by-dot so other profile fields are preserved.

2. **Backend: Prompt integration**  
   Add `aiVoice` parameter to `buildPostPrompt` and `buildCommentPrompt`, inject the “User’s preferred writing style” block when present. Then add `aiVoice` to `generatePost` and `generateComment` and pass it from `content.js` for both post and comment generation.

3. **Backend: Preview endpoint**  
   Implement `POST /api/content/posts/preview-voice` that uses the same prompt builder with the user’s aiVoice.

4. **Frontend: Onboarding step 4**  
   Add the optional “Set your content voice” step with Skip and Save & Continue, and include `profile.aiVoice` in the final submit when user saved.

5. **Frontend: Profile “AI Voice & Style” section**  
   Add the section with form, Save, and Preview (calling the new preview endpoint). Ensure profile update uses the existing `/profile/update` and that backend merge is correct.

6. **Sanity checks**  
   - Onboarding: complete with Skip; complete with Save & Continue; refresh and see saved aiVoice in Profile.  
   - Profile: edit and save aiVoice; run Preview and confirm style in generated text.  
   - Generate a real post and comment as a user with aiVoice set; confirm in logs (or by tone) that the style block is in the prompt.  
   - User without aiVoice: no prompt change, no regressions.

---

## 9. Files to Touch (Summary)

| Layer | File | Changes |
|-------|------|--------|
| Backend | `backend/models/User.js` | Add `profile.aiVoice` schema. |
| Backend | `backend/routes/auth.js` | Handle `profile.aiVoice` in PUT /profile. |
| Backend | `backend/routes/profile.js` | Merge `profile` updates with dot notation; validate aiVoice. |
| Backend | `backend/services/googleAI.js` | Add aiVoice to generatePost, generateComment, buildPostPrompt, buildCommentPrompt. |
| Backend | `backend/routes/content.js` | Pass user.profile?.aiVoice into generatePost and generateComment; add POST /posts/preview-voice. |
| Frontend | `spark-linkedin-ai-main/src/components/OnboardingModal.tsx` | Step 4 UI + state + submit with aiVoice. |
| Frontend | `spark-linkedin-ai-main/src/pages/UserProfile.tsx` | AI Voice & Style section + Preview modal + save. |
| Frontend | `spark-linkedin-ai-main/src/services/api.js` | Optional: add `previewVoice(postIdea)` calling new endpoint. |

---

## 10. Acceptance Criteria (Recap)

- [ ] Onboarding: New optional step appears; Skip advances without saving; Save & Continue persists aiVoice and completes onboarding.
- [ ] Profile: User can view/edit/save AI Voice & Style; Preview shows a sample post using their voice.
- [ ] AI: For users with aiVoice set, prompts include description, tone, boldness, emojiPreference; for users without, behavior unchanged.
- [ ] No regressions: Existing onboarding and profile flows work; no TypeScript or runtime errors; layout and styling consistent.

This plan keeps the UI simple, reuses existing patterns, and integrates the new step and profile section without duplicating or overwriting existing persona/positioning fields.

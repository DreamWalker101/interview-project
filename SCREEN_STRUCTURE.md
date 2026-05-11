# Screen Structure — Sales Pipeline System
> Feed this file to Google Stitch to generate UI screens.
> Three screens, each with its own slug.

---

## Screen 1 — Customer Intake Form
**Route:** `/`  
**Audience:** Public (customers)  
**Layout:** Single centered card, max-width ~600px, multi-step wizard with a step progress bar at the top.

---

### Step 1 of 5 — Contact Info
**Header:** "Tell us about yourself"  
**Fields:**
- First Name (text input, required)
- Last Name (text input, required)
- Email (email input, required)
- Phone Number (tel input, required)
- Additional Notes (textarea, optional, placeholder: "Anything else you'd like us to know?")

**Footer:** "Next" button (primary, full width)

---

### Step 2 of 5 — Team Size
**Header:** "How many employees do you have?"  
**Subheader:** "Select the range that best describes your team."  
**Input:** Range selector / radio button group with 5 options displayed as large clickable tiles:
- 1–5 employees
- 6–15 employees
- 16–30 employees
- 31–100 employees
- 100+ employees

**Footer:** "Back" button (secondary) + "Next" button (primary)

---

### Step 3 of 5 — Company Revenue
**Header:** "What is your company's annual revenue?"  
**Subheader:** "Select the range that best fits your business."  
**Input:** Radio button group displayed as large clickable tiles:
- $0 – $200,000
- $200,000 – $500,000
- $500,000 – $1,000,000
- $1,000,000+ ← (this one should be visually distinct, e.g. different accent color or badge)

**Footer:** "Back" button (secondary) + "Next" button (primary)

---

### Step 4 of 5 — Book a Meeting
**Header:** "Pick a date and time"  
**Subheader:** "Choose from the next 5 available days, 8:00 AM – 9:00 PM."

**Layout — two columns:**
- Left: Inline date picker showing only the next 5 days (today through today+5). Dates with no available slots are greyed out.
- Right: List of time slot buttons for the selected date (30-min increments, 8:00 AM to 8:30 PM). Already-booked or admin-blocked slots are hidden.

**Below calendar:** "Skip — I'll book later" link (small, secondary text style)

**Footer:** "Back" button (secondary) + "Next" button (primary, disabled until a slot is selected or skip is clicked)

---

### Step 5 of 5 — Review & Submit
**Header:** "Review your information"  
**Layout:** Summary card listing all entered data:
- Full Name
- Email
- Phone
- Notes (if any)
- Team Size
- Annual Revenue
- Appointment (date + time, or "No appointment booked")

**Footer:** "Back" button (secondary) + "Submit" button (primary, green/success color)

---

### Success Screen (after submit)
**Icon:** Checkmark circle (large)  
**Header:** "You're all set!"  
**Body:** "We've received your information. [If booked: Your meeting is scheduled for {date} at {time}.] We'll be in touch soon."  
**No further actions.**

---

---

## Screen 2 — Admin Pipeline Dashboard
**Route:** `/pipeline`  
**Audience:** Admin only (protected by login)  
**Layout:** Full-width page, dark or neutral admin aesthetic.

---

### 2a — Login Page
**Route:** `/pipeline/login`  
**Layout:** Centered card, ~400px wide.  
**Header:** "Admin Login"  
**Fields:**
- Username (text input)
- Password (password input)

**Footer:** "Login" button (primary, full width)  
**Error state:** Inline red error message below form: "Invalid username or password"

---

### 2b — Kanban Pipeline Board
**Route:** `/pipeline` (after login)  
**Layout:** Horizontal scrolling board with 5 columns side by side.

**Top bar:**
- Page title: "Pipeline"
- Logout button (top right)

**5 Kanban Columns (left to right):**
1. Lead
2. Appointment
3. Qualified
4. Sold
5. Not Interested

Each column has:
- Column header with name + count badge (e.g. "Lead · 4")
- Scrollable list of cards
- Drop target highlight when dragging a card over it

**Lead Card:**
- Full Name (bold, large)
- Phone number
- Email
- Revenue range badge (pill/chip)
- Appointment date + time (if booked) — shown as a small calendar icon + datetime string
- [Sold column only] "Sold for:" label + editable dollar input field

**Drag behavior:** Cards are draggable. Dropping into a new column updates that lead's pipeline stage.

---

### 2c — Availability Blocker Panel
**Location:** Below the Kanban board on `/pipeline` (or in a collapsible drawer/accordion)  
**Header:** "Manage Availability"  
**Subheader:** "Click a time slot to block or unblock it. Blocked slots won't appear on the booking calendar."

**Layout:** Weekly grid
- Columns: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Rows: Time slots from 8:00 AM to 8:30 PM in 30-min increments (27 rows)
- Each cell is a small button/tile
  - Available: white/light background
  - Blocked: red/dark background with an X or strikethrough
  - Clicking toggles the state

---

---

## Screen 3 — Admin Update Tool
**Route:** `/update`  
**Audience:** Admin only (same hardcoded login as `/pipeline`)  
**Layout:** Centered card, ~500px wide.

---

### State 1 — Phone Lookup
**Header:** "Update Lead Status"  
**Field:** Phone number input  
**Button:** "Search" (primary)  
**Error state:** "No lead found with that phone number." (inline, red)

---

### State 2 — Lead Found
**Shows after search:**
- Name (large, bold)
- Email
- Current pipeline stage (badge/pill)
- Appointment (if any)

**Action section:**
- Label: "Update Status"
- Two large radio/button options:
  - "Sold" (green accent)
  - "Not Interested" (red/grey accent)
- If "Sold" is selected: reveal an input field — "Sold Amount ($)" (number input)
- "Submit" button (primary, full width)

---

### State 3 — Success
**Icon:** Checkmark  
**Message:** "Updated! {Name} has been marked as [Sold for $X / Not Interested]."  
**Button:** "Search another" (resets back to State 1)

---

---

## Component Inventory (for Stitch reference)

| Component | Used on |
|---|---|
| Multi-step progress bar | Screen 1 |
| Clickable tile radio group | Screen 1, Steps 2 & 3 |
| Inline date picker (limited range) | Screen 1, Step 4 |
| Time slot button grid | Screen 1, Step 4 |
| Summary/review card | Screen 1, Step 5 |
| Success state (icon + message) | Screen 1, Screen 3 |
| Login form card | Screen 2a |
| Kanban board (5 columns, drag-and-drop) | Screen 2b |
| Lead card with editable sold amount | Screen 2b |
| Weekly availability grid (toggle cells) | Screen 2c |
| Phone search form | Screen 3 |
| Lead detail card | Screen 3 |
| Outcome selector (Sold / Not Interested) | Screen 3 |

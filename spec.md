# Expense Tracker App – Initial Specification

## 1. Overview

This application allows users to:

* Track personal expenses
* Optionally split expenses with others
* View balances and settlements
* Gain insights into spending

The system is designed to support both **individual expense tracking** and **shared financial interactions** within a single unified model. This is a mobile first application. most of the users will be viewing the app in mobile. should be able to adapt to all screen sizes(including desktops and laptops).

---

## 2. Core Principles (Based on Architecture Decisions)

* A single **Expense model** supports both personal and shared expenses
* Backend is the **source of truth** for all financial calculations
* Split logic is implemented using **extensible strategies**
* Balances are **derived**, not stored (initially)
* Settlements are **separate from expenses**

---

## 3. User Roles

### 3.1 Primary User

* Individual tracking personal expenses
* May optionally interact with other users for shared expenses

---

## 4. Core Features (MVP Scope)

### 4.1 User Management

* User registration
* Login 
* Profile 

## 4.1 User Management

This module handles user identity, authentication, and profile management.

---

### 4.1.1 User Registration

**Purpose:** Allow a new user to create an account.

#### Fields

* **Name**

  * Type: Text
  * Required: Yes
  * Validation:

    * Minimum 2 characters
    * Only alphabets and spaces

* **Email**

  * Type: Email
  * Required: Yes
  * Validation:

    * Must be valid email format
    * Must be unique

* **Password**

  * Type: Password
  * Required: Yes
  * Validation:

    * Minimum 6–8 characters
    * Should include at least one number (optional for MVP)

* **Confirm Password**

  * Type: Password
  * Required: Yes
  * Validation:

    * Must match Password

#### Actions

* Register
* Navigate to Login

---

### 4.1.2 Login

**Purpose:** Authenticate existing users.

#### Fields

* **Email**

  * Type: Email
  * Required: Yes

* **Password**

  * Type: Password
  * Required: Yes

#### Actions

* Login
* Navigate to Registration

#### Behavior

* On success:

  * Redirect to Dashboard
* On failure:

  * Show error message (invalid credentials)

---

### 4.1.3 Profile

**Purpose:** View and update user information.

#### Fields

* **Name**

  * Editable
  * Same validation as registration

* **Email**

  * Read-only (recommended for MVP)
  * Editable in future (with verification)

* **Password**

  * Not shown directly

---

### 4.1.4 Change Password 

#### Fields

* **Current Password**
* **New Password**
* **Confirm New Password**

#### Validation

* New password must meet criteria
* Confirm password must match

---

### 4.1.5 Profile Preferences

* Default currency
* Time zone

---

### 4.1.6 API Interaction Notes

* Passwords must be securely handled (hashed in backend)
* Authentication handled via token/session (JWT recommended)
* Frontend stores only authentication token (not sensitive data)

---

### 4.1.7 UX Notes

* Keep forms minimal and fast
* Show inline validation errors
* Avoid too many mandatory fields
* Smooth navigation between Login ↔ Register

---


---

### 4.2 Expense Management

#### Create Expense

User can:

* Enter amount
* Add description
* Select category
* Select date
* Choose “Paid by” (default: self)

#### Split Expense (Optional)

* Add participants
* Select split type:

  * Equal
  * Percentage
  * Exact amount
  * Shares
* View real-time preview (frontend)
* Final calculation handled by backend

---

#### View Expenses

* List of all expenses
* Filters:

  * Date range
  * Category
  * Participant
* View expense details

---

#### Edit / Delete Expense

* Update expense details
* Recalculate splits on edit
* Delete expense

---

### 4.3 Category Management

* Default categories
* Create custom categories
* Assign category to expense

---

### 4.4 Balance & Settlement

#### View Balances

* “You owe”
* “You are owed”
* Per user summary

#### Settlement

* Record settlement:

  * From user
  * To user
  * Amount
  * Optional note
* Settlement reduces balance

---

## 5. Screens / UI Structure

### 5.1 Dashboard (Home)

**Purpose:** Overview of financial state

Components:

* Total spent (current month)
* You owe
* You are owed
* Recent expenses list

---

### 5.2 Expense List Screen

**Purpose:** View and manage expenses

Components:

* List of expenses
* Filters (date, category)
* “Add Expense” button

---

### 5.3 Add / Edit Expense Screen

**Purpose:** Create or update expense

Sections:

#### Basic Info

* Amount
* Description
* Category
* Date
* Paid by

#### Split Section (Optional)

* Add participants
* Select split type
* Dynamic split input UI
* Preview of split values

---

### 5.4 Expense Detail Screen

**Purpose:** View full expense information

Components:

* Expense details
* Participants
* Split breakdown
* Edit / Delete actions

---

### 5.5 Balance Screen

**Purpose:** View user-wise balances

Components:

* List of users
* Amount owed / to be received
* Net balances

---

### 5.6 Settlement Screen

**Purpose:** Record settlement

Components:

* From user
* To user
* Amount
* Notes
* Save action

---

## 6. Data Concepts (High-Level)

* Expense = financial event
* Participants = involved users
* Shares = calculated owed amounts
* Settlement = debt resolution
* Balance = derived from shares - settlements

---

## 7. API Interaction Principles

* Frontend sends **intent**, not calculated values
* Backend performs:

  * Validation
  * Split calculation
  * Persistence
* Frontend updates UI based on backend response

---

## 8. Non-Goals (MVP)

* Group-based expenses
* Notifications
* OCR / receipt scanning
* AI insights
* Multi-currency support
* Offline mode

---

## 9. Future Scope (High-Level)

* Group expense management
* Advanced split strategies
* Balance caching / denormalization
* Notifications and reminders
* Analytics and insights
* Mobile support

---

## 10. Development Phases

### Phase 1 (MVP)

* Expense CRUD
* Split logic
* Balance calculation
* Settlement

### Phase 2

* Groups
* Advanced analytics
* Performance optimization

---

## 11. UX Principles

* Default flow should be **simple (personal expense)**
* Split functionality should be **optional and progressive**
* Minimal friction in adding expense
* Fast feedback via preview

---

## 12. Success Criteria

* Users can track expenses easily
* Users can split expenses correctly
* Balances are always accurate
* System remains simple despite advanced capabilities

---

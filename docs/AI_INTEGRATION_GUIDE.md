# AI Integration Guide - AIcoes

A step-by-step tutorial for setting up the Python ML pipeline for stock predictions.

---

## Table of Contents

1. [Overview](#overview)
2. [Part 1: Local Setup (Dependencies)](#part-1-local-setup-dependencies)
3. [Part 2: Understanding the Code](#part-2-understanding-the-code)
4. [Part 3: Running the Scripts](#part-3-running-the-scripts)
5. [Troubleshooting](#troubleshooting)
6. [Glossary](#glossary)

---

## Overview

### What We Built

A Python ML pipeline that:
1. Fetches stock price history from Supabase (our database)
2. Trains a forecasting model using scikit-learn
3. Predicts the next 5 days of stock prices
4. Outputs JSON that Node.js can read

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXISTING SETUP                            │
│  Frontend (React) ←→ Backend (Node.js) ←→ Supabase (PostgreSQL) │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Insert predictions
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                     PYTHON ML PIPELINE (NEW)                     │
│                                                                  │
│  packages/ml/src/                                                │
│  ├── fetch_data.py  → Get stock history from Supabase           │
│  ├── model.py       → Train model & generate predictions        │
│  └── predict.py     → Main script that combines both            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User searches "AAPL"
       ↓
Node.js backend receives request
       ↓
Check Supabase: "Are predictions fresh?"
       ↓
   YES → Return cached predictions
   NO  → Run Python script:
         1. Fetch 60 days of price history from Supabase
         2. Train forecasting model
         3. Predict next 5 days
         4. Output JSON
       ↓
Node.js reads JSON output
       ↓
Insert predictions into Supabase
       ↓
Return predictions to frontend
```

### File Structure

```
packages/ml/
├── requirements.txt     # Python dependencies (like package.json)
├── venv/                # Virtual environment (like node_modules) - NOT in git
├── src/
│   ├── fetch_data.py    # Fetches price history from Supabase
│   └── model.py         # ML model for predictions
└── models/              # Saved trained models (optional cache)
```

---

## Part 1: Local Setup (Dependencies)

> **Note:** The code files are already in the repository. You only need to set up the Python virtual environment and install dependencies on your local machine.

### Step 1: Navigate to the ML Package

```bash
cd packages/ml
```

### Step 2: Create a Virtual Environment

A virtual environment is like `node_modules` for Python - it keeps dependencies isolated to this project.

```bash
python3 -m venv venv
```

This creates a `venv/` folder (already in `.gitignore`).

### Step 3: Activate the Virtual Environment

```bash
source venv/bin/activate
```

Your terminal prompt should now show `(venv)` at the beginning:
```
(venv) username@computer ml %
```

> **Important:** You need to activate the venv every time you open a new terminal to work on this project.

### Step 4: Upgrade pip (Important!)

The default pip is old and slow. Upgrade it first:

```bash
pip install --upgrade pip
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:

| Package | Version | Purpose |
|---------|---------|---------|
| scikit-learn | 1.4.0 | ML algorithms (Ridge regression) |
| pandas | 2.2.0 | Data manipulation (like spreadsheets) |
| numpy | 1.26.3 | Math operations on arrays |
| supabase | 1.2.0 | Database connection |
| python-dotenv | 1.0.0 | Read .env files |

### Step 6: Verify Installation

```bash
pip list | grep -E "(scikit-learn|pandas|numpy|supabase|python-dotenv)"
```

You should see all 5 packages listed.

### Step 7: Configure VSCode (Optional)

If VSCode shows import warnings (dotted lines under imports):

1. Press `Cmd + Shift + P`
2. Type: `Python: Select Interpreter`
3. Choose: `./packages/ml/venv/bin/python`

---

## Part 2: Understanding the Code

### fetch_data.py - Database Connection

This script connects to Supabase and retrieves stock price history.

#### Key Concept 1: Loading Environment Variables

```python
# The script reads credentials from backend's .env file
# Path: packages/ml/src → packages/ml → packages → packages/backend/.env

script_dir = os.path.dirname(os.path.realpath(__file__))  # /packages/ml/src
ml_dir = os.path.dirname(script_dir)                       # /packages/ml
packages_dir = os.path.dirname(ml_dir)                     # /packages
env_path = os.path.join(packages_dir, "backend", ".env")   # /packages/backend/.env
load_dotenv(env_path)
```

#### Key Concept 2: Creating Supabase Client

```python
# Similar to createClient() in Node.js
supabase = create_client(
    os.getenv("SUPABASE_URL"),         # https://xxxxx.supabase.co
    os.getenv("SUPABASE_SERVICE_KEY")  # Long JWT token starting with eyJ...
)
```

#### Key Concept 3: Querying the Database

```python
# This is equivalent to SQL:
# SELECT stock_id FROM stocks WHERE symbol = 'AAPL' LIMIT 1

stock_result = supabase.table("stocks") \
    .select("stock_id") \              # What columns to return
    .eq("symbol", symbol) \            # WHERE condition
    .single() \                        # Expect one result
    .execute()                         # Run the query
```

#### Key Concept 4: Output Format

The script prints JSON that looks like:
```json
[
  {"date": "2024-11-01", "open": 150.0, "high": 152.0, "low": 149.0, "close": 151.0, "volume": 1000000},
  {"date": "2024-11-02", "open": 151.0, "high": 153.0, "low": 150.0, "close": 152.0, "volume": 1100000}
]
```

---

### model.py - Machine Learning Model

This script takes price history and predicts future prices.

#### Key Concept 1: Feature Engineering

The model needs "clues" to make predictions. We create these from raw price data:

| Feature Type | What It Is | Example |
|--------------|------------|---------|
| **Lag Features** | Price X days ago | `lag_1` = yesterday's price |
| **Rolling Averages** | Average over recent days | `rolling_mean_5` = avg of last 5 days |
| **Volatility** | How much price jumps around | `rolling_std_5` = standard deviation |
| **Momentum** | Price trend direction | `momentum_5` = price change over 5 days |

```python
# Example: Creating lag features
df['lag_1'] = df['close'].shift(1)    # Yesterday's price
df['lag_5'] = df['close'].shift(5)    # 5 days ago

# Example: Rolling average
df['rolling_mean_5'] = df['close'].rolling(window=5).mean()
```

#### Key Concept 2: The Model (Ridge Regression)

Ridge Regression is a simple ML algorithm that:
- Finds patterns in the features
- Draws a "line of best fit" through the data
- Uses that line to predict future values

```python
from sklearn.linear_model import Ridge

model = Ridge(alpha=1.0)  # alpha controls regularization
model.fit(X, y)           # Train on our data
prediction = model.predict(new_features)  # Make prediction
```

#### Key Concept 3: Recursive Prediction

To predict 5 days ahead, we:
1. Predict day 1
2. Add that prediction to our data
3. Predict day 2 using day 1's prediction
4. Repeat...

```python
for i in range(days_to_predict):
    # Create features from current data
    features = create_features(current_data)

    # Predict next day
    predicted_price = model.predict(features)

    # Add prediction to data for next iteration
    current_data.append(predicted_price)
```

#### Key Concept 4: Confidence Score

We use R² score (0-1) to measure how well the model fits:
- 1.0 = perfect fit
- 0.0 = no better than guessing
- We report this as "confidence"

---

## Part 3: Running the Scripts

### Test 1: Fetch Data from Supabase

```bash
cd packages/ml
source venv/bin/activate
python src/fetch_data.py AAPL
```

**Expected output:** JSON array of price records for Apple stock.

**What this tests:**
- Virtual environment is set up correctly
- Supabase credentials are loading from backend/.env
- Database connection works
- Query returns data

### Test 2: Run the Model (with fake data)

```bash
python src/model.py
```

**Expected output:**
```
Testing model with fake data...
Input: 60 days of price history

Predictions:
[
  {"target_date": "2025-01-13", "predicted_close": 155.50, "confidence": 0.85},
  {"target_date": "2025-01-14", "predicted_close": 156.20, "confidence": 0.85},
  ...
]
```

**What this tests:**
- scikit-learn is installed correctly
- Feature engineering works
- Model training works
- Prediction generation works

---

## Troubleshooting

### "command not found: pip"

Your virtual environment isn't activated. Run:
```bash
source venv/bin/activate
```

### "Invalid API key" error

The Supabase service key in `packages/backend/.env` might be incomplete.

**How to fix:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the full **service_role** key (starts with `eyJ...`, ~180 characters)
5. Paste into `packages/backend/.env`

### "column stocks.id does not exist"

The database uses `stock_id` not `id`. This is already fixed in the code.

### "ModuleNotFoundError: No module named 'supabase'"

Dependencies aren't installed. Run:
```bash
pip install -r requirements.txt
```

### VSCode shows import warnings (dotted lines)

Select the correct Python interpreter:
1. `Cmd + Shift + P`
2. `Python: Select Interpreter`
3. Choose the one with `venv` in the path

### pip install is very slow

Upgrade pip first:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Virtual Environment (venv)** | Isolated Python environment for this project, like `node_modules` for Node.js |
| **pip** | Python package manager, like `npm` |
| **requirements.txt** | List of dependencies, like `package.json` |
| **DataFrame** | pandas data structure, like a spreadsheet with rows and columns |
| **Feature Engineering** | Creating input variables (clues) for the ML model from raw data |
| **Ridge Regression** | Simple ML algorithm that finds linear patterns in data |
| **Regularization** | Technique to prevent the model from memorizing instead of learning |
| **R² Score** | Measure of how well the model fits the data (0-1, higher is better) |
| **Lag Feature** | A value from X days ago used as input for prediction |
| **Rolling Average** | Average of the last X values, smooths out noise |

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Navigate to ML package | `cd packages/ml` |
| Activate venv | `source venv/bin/activate` |
| Deactivate venv | `deactivate` |
| Upgrade pip | `pip install --upgrade pip` |
| Install dependencies | `pip install -r requirements.txt` |
| Check installed packages | `pip list` |
| Fetch stock data | `python src/fetch_data.py AAPL` |
| Test model | `python src/model.py` |

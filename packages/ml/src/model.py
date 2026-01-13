# model.py - Time series forecasting model for stock prices
# This script takes historical price data and predicts future prices.

# ============================================================================
# IMPORTS
# ============================================================================

import numpy as np                          # Math operations on arrays
import pandas as pd                         # Data manipulation (like spreadsheets)
from sklearn.linear_model import Ridge      # Our ML model (improved linear regression)
from datetime import datetime, timedelta    # Date calculations


# ============================================================================
# FEATURE ENGINEERING - Creating "clues" for the model
# ============================================================================

def create_features(prices_df):
    """
    Transform raw price data into features the model can learn from.
    
    Raw data: Just closing prices
    Features: Patterns and trends derived from those prices
    
    Args:
        prices_df: DataFrame with 'date' and 'close' columns
    
    Returns:
        DataFrame with additional feature columns
    """
    df = prices_df.copy()
    
    # -------------------------------------------------------------------------
    # LAG FEATURES - "What was the price X days ago?"
    # -------------------------------------------------------------------------
    # These help the model see recent history.
    # shift(1) moves the data down by 1 row, so each row now has yesterday's price.
    #
    # Example:
    #   date       | close | lag_1 | lag_5
    #   Jan 5      | 100   | NaN   | NaN    ← Not enough history yet
    #   Jan 6      | 101   | 100   | NaN
    #   Jan 7      | 102   | 101   | NaN
    #   ...
    #   Jan 10     | 105   | 104   | 100    ← Now we have 5 days of history
    
    df['lag_1'] = df['close'].shift(1)    # Yesterday's price
    df['lag_2'] = df['close'].shift(2)    # 2 days ago
    df['lag_3'] = df['close'].shift(3)    # 3 days ago
    df['lag_5'] = df['close'].shift(5)    # 5 days ago
    df['lag_10'] = df['close'].shift(10)  # 10 days ago
    
    # -------------------------------------------------------------------------
    # ROLLING AVERAGES - "What's the average over recent days?"
    # -------------------------------------------------------------------------
    # These smooth out daily noise and show trends.
    # rolling(5).mean() = average of the last 5 values
    #
    # If prices are: [100, 102, 104, 103, 105]
    # Rolling 5-day average = (100+102+104+103+105)/5 = 102.8
    
    df['rolling_mean_5'] = df['close'].rolling(window=5).mean()   # 5-day average
    df['rolling_mean_10'] = df['close'].rolling(window=10).mean() # 10-day average
    
    # -------------------------------------------------------------------------
    # VOLATILITY - "How much is the price jumping around?"
    # -------------------------------------------------------------------------
    # Standard deviation measures how spread out the values are.
    # High volatility = big price swings
    # Low volatility = stable prices
    
    df['rolling_std_5'] = df['close'].rolling(window=5).std()  # 5-day volatility
    
    # -------------------------------------------------------------------------
    # MOMENTUM - "Is the price going up or down?"
    # -------------------------------------------------------------------------
    # Price change from X days ago to today
    # Positive = price went up, Negative = price went down
    
    df['momentum_5'] = df['close'] - df['close'].shift(5)   # Change over 5 days
    df['momentum_10'] = df['close'] - df['close'].shift(10) # Change over 10 days
    
    # -------------------------------------------------------------------------
    # DAILY CHANGE - "How much did price change today?"
    # -------------------------------------------------------------------------
    # Percentage change from yesterday
    # pct_change() calculates: (today - yesterday) / yesterday
    
    df['daily_return'] = df['close'].pct_change()  # % change from yesterday
    
    return df


# ============================================================================
# MAIN PREDICTION FUNCTION
# ============================================================================

def predict_prices(historical_data, days_to_predict=5):
    """
    Train a model on historical data and predict future prices.
    
    Args:
        historical_data: List of dicts with 'date' and 'close' keys
                        [{"date": "2025-01-01", "close": 150.0}, ...]
        days_to_predict: How many days into the future to predict (default: 5)
    
    Returns:
        List of predictions: [{"date": "2025-01-09", "predicted_close": 155.0, "confidence": 0.75}, ...]
    """
    
    # -------------------------------------------------------------------------
    # STEP 1: Convert to DataFrame
    # -------------------------------------------------------------------------
    # pandas DataFrame is like a spreadsheet - rows and columns
    # This makes it easier to manipulate the data
    
    df = pd.DataFrame(historical_data)
    df['date'] = pd.to_datetime(df['date'])  # Convert string dates to date objects
    df = df.sort_values('date')               # Ensure oldest first
    
    # -------------------------------------------------------------------------
    # STEP 2: Create features
    # -------------------------------------------------------------------------
    # Add all our "clues" (lag features, rolling averages, etc.)
    
    df = create_features(df)
    
    # -------------------------------------------------------------------------
    # STEP 3: Remove rows with NaN values
    # -------------------------------------------------------------------------
    # The first ~10 rows won't have all features (not enough history)
    # We drop these because the model can't learn from incomplete data
    
    df_clean = df.dropna()
    
    # Check if we have enough data
    if len(df_clean) < 20:
        return {"error": "Not enough historical data to make predictions"}
    
    # -------------------------------------------------------------------------
    # STEP 4: Prepare training data
    # -------------------------------------------------------------------------
    # X = features (the inputs/clues)
    # y = target (what we're trying to predict - the closing price)
    #
    # We're predicting: "Given these features, what will the price be?"
    
    feature_columns = [
        'lag_1', 'lag_2', 'lag_3', 'lag_5', 'lag_10',
        'rolling_mean_5', 'rolling_mean_10',
        'rolling_std_5',
        'momentum_5', 'momentum_10',
        'daily_return'
    ]
    
    X = df_clean[feature_columns]  # Features (11 columns)
    y = df_clean['close']          # Target (1 column - the price)
    
    # -------------------------------------------------------------------------
    # STEP 5: Train the model
    # -------------------------------------------------------------------------
    # Ridge regression is linear regression with "regularization"
    # Regularization prevents the model from overfitting (memorizing instead of learning)
    # alpha=1.0 controls how much regularization to apply
    
    model = Ridge(alpha=1.0)
    model.fit(X, y)  # "fit" = "train" = "learn from this data"
    
    # -------------------------------------------------------------------------
    # STEP 6: Calculate confidence score
    # -------------------------------------------------------------------------
    # R² score measures how well the model fits the data
    # 1.0 = perfect fit, 0.0 = no better than guessing the average
    # We use this as our "confidence" metric
    
    r2_score = model.score(X, y)
    confidence = max(0.0, min(1.0, r2_score))  # Clamp between 0 and 1
    
    # -------------------------------------------------------------------------
    # STEP 7: Generate predictions for future days
    # -------------------------------------------------------------------------
    # We predict one day at a time, then use that prediction
    # to help predict the next day (recursive prediction)
    
    predictions = []
    last_date = df['date'].iloc[-1]          # Most recent date in our data
    current_data = df.copy()                  # Working copy of our data
    
    for i in range(days_to_predict):
        # Calculate the next business day (skip weekends)
        next_date = last_date + timedelta(days=1)
        while next_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
            next_date += timedelta(days=1)
        
        # Create features for prediction
        # We need to recalculate features because we added a new row
        current_features = create_features(current_data)
        latest_features = current_features[feature_columns].iloc[-1:]
        
        # Make prediction
        predicted_price = model.predict(latest_features)[0]
        
        # Store the prediction
        predictions.append({
            "target_date": next_date.strftime("%Y-%m-%d"),
            "predicted_close": round(float(predicted_price), 2),
            "confidence": round(confidence, 4)
        })
        
        # Add this prediction to our data for the next iteration
        new_row = pd.DataFrame([{
            'date': next_date,
            'close': predicted_price,
            'open': predicted_price,
            'high': predicted_price,
            'low': predicted_price,
            'volume': 0
        }])
        current_data = pd.concat([current_data, new_row], ignore_index=True)
        last_date = next_date
    
    return predictions


# ============================================================================
# TEST - Run this file directly to test the model
# ============================================================================

if __name__ == "__main__":
    # Create some fake data to test
    import json
    
    test_data = []
    base_price = 150.0
    for i in range(60):
        # Simulate a stock with slight upward trend and randomness
        date = datetime(2024, 11, 1) + timedelta(days=i)
        if date.weekday() < 5:  # Skip weekends
            price = base_price + (i * 0.5) + np.random.randn() * 2
            test_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(price, 2)
            })
    
    print("Testing model with fake data...")
    print(f"Input: {len(test_data)} days of price history")
    print()
    
    result = predict_prices(test_data, days_to_predict=5)
    print("Predictions:")
    print(json.dumps(result, indent=2))

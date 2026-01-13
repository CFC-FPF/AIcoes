# model.py - Time series forecasting model for stock prices
# This script takes historical price data and predicts future prices.
#
# KEY INSIGHT: We predict PRICE CHANGES (returns), not absolute prices.
# This prevents the model from just saying "tomorrow = today".
#
# MODEL: Random Forest - captures non-linear patterns better than Ridge.

# ============================================================================
# IMPORTS
# ============================================================================

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta


# ============================================================================
# FEATURE ENGINEERING
# ============================================================================

def create_features(prices_df):
    """
    Create features for predicting NEXT DAY'S RETURN (% change).

    Random Forest can handle more features without overfitting,
    so we include a richer feature set.
    """
    df = prices_df.copy()

    # Target: Next day's return (what we're trying to predict)
    # shift(-1) looks at TOMORROW's value
    df['target_return'] = df['close'].pct_change().shift(-1)

    # === PRICE-BASED FEATURES ===

    # Recent returns (momentum signals)
    df['return_1d'] = df['close'].pct_change()          # Today's return
    df['return_2d'] = df['close'].pct_change(2)         # 2-day return
    df['return_3d'] = df['close'].pct_change(3)         # 3-day return
    df['return_5d'] = df['close'].pct_change(5)         # 5-day return (weekly)
    df['return_10d'] = df['close'].pct_change(10)       # 10-day return

    # Moving average crossovers (trend signals)
    df['sma_5'] = df['close'].rolling(5).mean()
    df['sma_10'] = df['close'].rolling(10).mean()
    df['sma_20'] = df['close'].rolling(20).mean()

    # Price relative to moving averages (mean reversion signals)
    df['price_vs_sma5'] = (df['close'] - df['sma_5']) / df['sma_5']
    df['price_vs_sma10'] = (df['close'] - df['sma_10']) / df['sma_10']
    df['price_vs_sma20'] = (df['close'] - df['sma_20']) / df['sma_20']

    # SMA crossover signals
    df['sma5_vs_sma10'] = (df['sma_5'] - df['sma_10']) / df['sma_10']
    df['sma5_vs_sma20'] = (df['sma_5'] - df['sma_20']) / df['sma_20']
    df['sma10_vs_sma20'] = (df['sma_10'] - df['sma_20']) / df['sma_20']

    # === VOLATILITY FEATURES ===

    df['volatility_5d'] = df['return_1d'].rolling(5).std()
    df['volatility_10d'] = df['return_1d'].rolling(10).std()
    df['volatility_20d'] = df['return_1d'].rolling(20).std()

    # Volatility ratio (recent vs longer-term)
    df['vol_ratio_5_20'] = df['volatility_5d'] / df['volatility_20d']

    # === VOLUME FEATURES (if available) ===

    if 'volume' in df.columns:
        df['volume_sma5'] = df['volume'].rolling(5).mean()
        df['volume_sma10'] = df['volume'].rolling(10).mean()
        df['volume_ratio_5'] = df['volume'] / df['volume_sma5']
        df['volume_ratio_10'] = df['volume'] / df['volume_sma10']
        # Volume trend
        df['volume_change'] = df['volume'].pct_change()

    # === HIGH/LOW FEATURES (if available) ===

    if 'high' in df.columns and 'low' in df.columns:
        df['daily_range'] = (df['high'] - df['low']) / df['close']
        df['avg_range_5d'] = df['daily_range'].rolling(5).mean()
        df['avg_range_10d'] = df['daily_range'].rolling(10).mean()

        # Where did price close within the day's range?
        df['close_position'] = (df['close'] - df['low']) / (df['high'] - df['low'])
        df['close_position'] = df['close_position'].fillna(0.5)

    # === LAGGED RETURNS (patterns from recent days) ===

    for lag in [1, 2, 3, 5]:
        df[f'return_lag_{lag}'] = df['return_1d'].shift(lag)

    return df


# ============================================================================
# MAIN PREDICTION FUNCTION
# ============================================================================

def predict_prices(historical_data, days_to_predict=5):
    """
    Train a Random Forest model on historical data and predict future prices.

    This model predicts DAILY RETURNS (% changes), then converts to prices.
    Random Forest captures non-linear patterns and provides realistic uncertainty.
    """

    # -------------------------------------------------------------------------
    # STEP 1: Prepare DataFrame
    # -------------------------------------------------------------------------

    df = pd.DataFrame(historical_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    # -------------------------------------------------------------------------
    # STEP 2: Create features
    # -------------------------------------------------------------------------

    df = create_features(df)

    # -------------------------------------------------------------------------
    # STEP 3: Define feature columns (only use features that exist)
    # -------------------------------------------------------------------------

    feature_columns = [
        'return_1d', 'return_2d', 'return_3d', 'return_5d', 'return_10d',
        'price_vs_sma5', 'price_vs_sma10', 'price_vs_sma20',
        'sma5_vs_sma10', 'sma5_vs_sma20', 'sma10_vs_sma20',
        'volatility_5d', 'volatility_10d', 'volatility_20d',
        'return_lag_1', 'return_lag_2', 'return_lag_3', 'return_lag_5'
    ]

    # Add optional features if they exist
    if 'volume_ratio_5' in df.columns:
        feature_columns.extend(['volume_ratio_5', 'volume_ratio_10', 'volume_change'])
    if 'daily_range' in df.columns:
        feature_columns.extend(['daily_range', 'avg_range_5d', 'avg_range_10d', 'close_position'])
    if 'vol_ratio_5_20' in df.columns:
        feature_columns.append('vol_ratio_5_20')

    # -------------------------------------------------------------------------
    # STEP 4: Clean data and prepare training set
    # -------------------------------------------------------------------------

    # Remove rows with NaN (need ~20 days of history for all features)
    df_clean = df.dropna(subset=feature_columns + ['target_return'])

    if len(df_clean) < 30:
        return {"error": f"Not enough data. Need 30+ rows, got {len(df_clean)}"}

    X = df_clean[feature_columns]
    y = df_clean['target_return']

    # -------------------------------------------------------------------------
    # STEP 5: Train Random Forest model
    # -------------------------------------------------------------------------

    # Random Forest parameters tuned for stock prediction:
    # - n_estimators=100: Good balance of accuracy vs speed
    # - max_depth=10: Prevent overfitting on small datasets
    # - min_samples_leaf=5: Require at least 5 samples per leaf
    # - oob_score=True: Out-of-bag score for realistic confidence
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_leaf=5,
        min_samples_split=10,
        oob_score=True,
        random_state=42,
        n_jobs=-1  # Use all CPU cores
    )

    model.fit(X, y)

    # Out-of-bag R² score (realistic measure of predictive power)
    # This tests predictions on samples not used in each tree
    oob_r2 = model.oob_score_

    # Stock prediction R² is typically 0.01-0.15, rarely above 0.20
    # Scale to a user-friendly confidence display (40%-85%)
    # oob_r2 of 0.05 → ~55% confidence, 0.15 → ~70% confidence
    display_confidence = min(0.85, max(0.40, 0.50 + oob_r2 * 2.5))

    # -------------------------------------------------------------------------
    # STEP 6: Generate predictions with uncertainty
    # -------------------------------------------------------------------------

    predictions = []
    last_price = df['close'].iloc[-1]

    # Start from TODAY, not from last historical date
    # This ensures predictions are always in the future
    today = datetime.now().date()

    # Get the most recent features for prediction
    current_df = df.copy()

    # Historical volatility for adding realistic noise
    hist_volatility = df['return_1d'].std()

    # Track the last prediction date for sequential business days
    last_pred_date = today

    for i in range(days_to_predict):
        # Find the next business day after the last prediction date
        next_date = last_pred_date + timedelta(days=1)
        while next_date.weekday() >= 5:  # Skip weekends (5=Sat, 6=Sun)
            next_date += timedelta(days=1)

        # Get latest features
        current_df = create_features(current_df)
        latest_row = current_df.iloc[-1:]

        # Check if we have all features
        if latest_row[feature_columns].isna().any().any():
            # Use average historical return if features are missing
            predicted_return = df['return_1d'].mean()
        else:
            # Get predictions from all trees in the forest
            # This gives us a distribution of predictions
            tree_predictions = np.array([
                tree.predict(latest_row[feature_columns].values)[0]
                for tree in model.estimators_
            ])

            # Use median (more robust than mean for financial data)
            predicted_return = np.median(tree_predictions)

            # Add noise based on tree disagreement (uncertainty)
            tree_std = np.std(tree_predictions)
            noise = np.random.normal(0, tree_std * 0.5)
            predicted_return = predicted_return + noise

        # Clamp return to realistic range (-5% to +5% daily)
        predicted_return = max(-0.05, min(0.05, predicted_return))

        # Convert return to price
        predicted_price = last_price * (1 + predicted_return)

        # Confidence decreases for predictions further in the future
        day_confidence = display_confidence * (1 - i * 0.03)  # ~3% decrease per day

        predictions.append({
            "target_date": next_date.strftime("%Y-%m-%d"),
            "predicted_close": round(float(predicted_price), 2),
            "confidence": round(day_confidence, 2)
        })

        # Update for next iteration
        new_row = pd.DataFrame([{
            'date': next_date,
            'close': predicted_price,
            'open': predicted_price,
            'high': predicted_price * (1 + abs(predicted_return) * 0.5),
            'low': predicted_price * (1 - abs(predicted_return) * 0.5),
            'volume': current_df['volume'].iloc[-1] if 'volume' in current_df.columns else 0
        }])
        current_df = pd.concat([current_df, new_row], ignore_index=True)
        last_pred_date = next_date
        last_price = predicted_price

    return predictions


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    import json

    # Create realistic test data with trend and noise
    np.random.seed(42)
    test_data = []
    price = 150.0

    for i in range(90):
        date = datetime(2024, 10, 1) + timedelta(days=i)
        if date.weekday() < 5:  # Skip weekends
            # Random walk with slight upward drift
            daily_return = np.random.normal(0.001, 0.015)  # 0.1% drift, 1.5% volatility
            price = price * (1 + daily_return)
            test_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(price * 0.998, 2),
                "high": round(price * 1.01, 2),
                "low": round(price * 0.99, 2),
                "close": round(price, 2),
                "volume": int(np.random.uniform(1000000, 5000000))
            })

    print("Testing Random Forest model with fake data...")
    print(f"Input: {len(test_data)} days of price history")
    print(f"Price range: ${min(d['close'] for d in test_data):.2f} - ${max(d['close'] for d in test_data):.2f}")
    print(f"Latest price: ${test_data[-1]['close']:.2f}")
    print()

    result = predict_prices(test_data, days_to_predict=5)
    print("Predictions:")
    print(json.dumps(result, indent=2))

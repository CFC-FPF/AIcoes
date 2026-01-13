# predict.py - Main prediction script
# Combines data fetching and model prediction into one script.
# This is what Node.js will call.

# ============================================================================
# IMPORTS
# ============================================================================

import sys
import json

# Import our other modules
from fetch_data import fetch_stock_history
from model import predict_prices


# ============================================================================
# MAIN FUNCTION
# ============================================================================

def generate_predictions(symbol: str, days_to_predict: int = 5):
    """
    Generate stock price predictions for a given symbol.
    
    Args:
        symbol: Stock ticker (e.g., "AAPL")
        days_to_predict: How many days ahead to predict
    
    Returns:
        Dictionary with predictions and metadata
    """
    
    # Step 1: Fetch historical data from Supabase
    historical_data = fetch_stock_history(symbol, days=60)
    
    # Check for errors
    if isinstance(historical_data, dict) and "error" in historical_data:
        return historical_data
    
    if len(historical_data) < 20:
        return {"error": f"Not enough data for {symbol}. Need at least 20 days, got {len(historical_data)}"}
    
    # Step 2: Generate predictions using the model
    predictions = predict_prices(historical_data, days_to_predict)
    
    # Check for errors
    if isinstance(predictions, dict) and "error" in predictions:
        return predictions
    
    # Step 3: Return results with metadata
    return {
        "symbol": symbol,
        "model_version": "ridge_v1",
        "historical_days_used": len(historical_data),
        "predictions": predictions
    }


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # Get symbol from command line
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a stock symbol"}))
        sys.exit(1)
    
    symbol = sys.argv[1].upper()
    
    # Optional: days to predict (default 5)
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # Generate predictions
    result = generate_predictions(symbol, days)
    
    # Output as JSON
    print(json.dumps(result, indent=2))
